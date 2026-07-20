-- PUBLIC ORDER INTEGRITY
-- Run after supabase_security_hardening.sql.
-- Requires the inventory and wholesale price columns used by the storefront.
-- Safe to run more than once.

BEGIN;

CREATE OR REPLACE FUNCTION public.canonicalize_public_pedido()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  item JSONB;
  product_row public.productos%ROWTYPE;
  product_id UUID;
  quantity INTEGER;
  tiers JSONB;
  unit_price NUMERIC;
  canonical_items JSONB := '[]'::JSONB;
  canonical_total NUMERIC := 0;
  seen_ids UUID[] := ARRAY[]::UUID[];
BEGIN
  -- Panel staff may create administrative records without storefront rules.
  IF auth.uid() IS NOT NULL
     AND public.has_role(ARRAY['admin', 'manager', 'empleado']) THEN
    RETURN NEW;
  END IF;

  IF jsonb_typeof(NEW.detalles_json) <> 'array'
     OR jsonb_array_length(NEW.detalles_json) NOT BETWEEN 1 AND 50 THEN
    RAISE EXCEPTION 'Order must contain between 1 and 50 products'
      USING ERRCODE = '22023';
  END IF;

  FOR item IN SELECT value FROM jsonb_array_elements(NEW.detalles_json)
  LOOP
    IF jsonb_typeof(item) <> 'object'
       OR COALESCE(item->>'id', '') = ''
       OR COALESCE(item->>'cantidad', '') !~ '^[1-9][0-9]{0,3}$' THEN
      RAISE EXCEPTION 'Invalid product or quantity in order'
        USING ERRCODE = '22023';
    END IF;

    BEGIN
      product_id := (item->>'id')::UUID;
      quantity := (item->>'cantidad')::INTEGER;
    EXCEPTION
      WHEN invalid_text_representation OR numeric_value_out_of_range THEN
        RAISE EXCEPTION 'Invalid product or quantity in order'
          USING ERRCODE = '22023';
    END;

    IF product_id = ANY(seen_ids) THEN
      RAISE EXCEPTION 'Duplicate product in order'
        USING ERRCODE = '22023';
    END IF;
    seen_ids := array_append(seen_ids, product_id);

    SELECT *
      INTO product_row
      FROM public.productos
      WHERE id = product_id
        AND activo = true;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product is unavailable'
        USING ERRCODE = '22023';
    END IF;

    IF product_row.stock_ilimitado = false
       AND quantity > GREATEST(product_row.stock_actual, 0) THEN
      RAISE EXCEPTION 'Requested quantity exceeds available stock'
        USING ERRCODE = '22023';
    END IF;

    -- to_jsonb(record) keeps this function compatible if wholesale columns
    -- were added as JSONB or TEXT in an older installation.
    tiers := to_jsonb(product_row)->'precios_mayoreo';
    IF jsonb_typeof(tiers) = 'string' THEN
      BEGIN
        tiers := (tiers #>> '{}')::JSONB;
      EXCEPTION
        WHEN invalid_text_representation THEN
          tiers := '[]'::JSONB;
      END;
    END IF;

    unit_price := NULL;
    IF jsonb_typeof(tiers) = 'array' THEN
      SELECT (level->>'precio')::NUMERIC
        INTO unit_price
        FROM jsonb_array_elements(tiers) AS level
        WHERE jsonb_typeof(level) = 'object'
          AND COALESCE(level->>'cantidad_minima', '') ~ '^[1-9][0-9]*$'
          AND COALESCE(level->>'precio', '') ~ '^[0-9]+([.][0-9]+)?$'
          AND quantity >= (level->>'cantidad_minima')::INTEGER
          AND (level->>'precio')::NUMERIC >= 0
        ORDER BY (level->>'cantidad_minima')::INTEGER DESC
        LIMIT 1;
    END IF;

    unit_price := COALESCE(unit_price, product_row.precio);
    canonical_total := canonical_total + (unit_price * quantity);
    canonical_items := canonical_items || jsonb_build_array(
      jsonb_build_object(
        'id', product_row.id,
        'nombre', product_row.nombre,
        'precio', unit_price,
        'precio_base', product_row.precio,
        'cantidad', quantity,
        'imagen_url', product_row.imagen_url,
        'tamano', product_row.tamano,
        'precios_mayoreo', tiers,
        'familia_mayoreo', to_jsonb(product_row)->'familia_mayoreo'
      )
    );
  END LOOP;

  NEW.detalles_json := canonical_items;
  NEW.total := round(canonical_total, 2);
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.canonicalize_public_pedido() FROM PUBLIC;

DROP TRIGGER IF EXISTS zzz_canonicalize_public_pedido_before_insert ON public.pedidos;
CREATE TRIGGER zzz_canonicalize_public_pedido_before_insert
  BEFORE INSERT ON public.pedidos
  FOR EACH ROW
  EXECUTE FUNCTION public.canonicalize_public_pedido();

-- Trigger names control PostgreSQL execution order. Pricing is canonicalized
-- before duplicate and rate-limit checks inspect the final order values.
DROP TRIGGER IF EXISTS trg_pedido_duplicate ON public.pedidos;
DROP TRIGGER IF EXISTS trg_pedido_rate_limit ON public.pedidos;
DROP TRIGGER IF EXISTS zzzz_check_pedido_duplicate ON public.pedidos;
DROP TRIGGER IF EXISTS zzzz_check_pedido_rate_limit ON public.pedidos;

CREATE TRIGGER zzzz_check_pedido_duplicate
  BEFORE INSERT ON public.pedidos
  FOR EACH ROW
  EXECUTE FUNCTION public.check_pedido_duplicate();

CREATE TRIGGER zzzz_check_pedido_rate_limit
  BEFORE INSERT ON public.pedidos
  FOR EACH ROW
  EXECUTE FUNCTION public.check_pedido_rate_limit();

COMMIT;

-- Verification (run separately):
-- SELECT trigger_name, action_timing, event_manipulation
-- FROM information_schema.triggers
-- WHERE event_object_schema = 'public'
--   AND event_object_table = 'pedidos'
-- ORDER BY trigger_name;
