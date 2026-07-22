-- PUBLIC ORDER CREATION AND TRACKING RPCS
-- Run after supabase_security_hardening.sql and supabase_order_integrity.sql.
-- Safe to run more than once.

BEGIN;

-- Every insert is normalized, including orders placed from a browser that
-- currently has an administrative session.
CREATE OR REPLACE FUNCTION public.normalize_public_pedido()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.folio := 'FP-' || upper(substr(replace(gen_random_uuid()::TEXT, '-', ''), 1, 10));
  NEW.estado := 'Por Surtir';
  NEW.notificado_estado := NULL;
  NEW.fecha_envio := NULL;
  NEW.fecha_cancelado := NULL;
  NEW.pago_estado := 'pendiente';
  NEW.metodo_pago := NULL;
  NEW.pago_fecha := NULL;
  NEW.pago_notas := NULL;
  NEW.created_at := NOW();
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.normalize_public_pedido() FROM PUBLIC;

-- Return only the newly generated folio. This avoids granting anonymous users
-- SELECT access to the orders table just to support INSERT ... RETURNING.
CREATE OR REPLACE FUNCTION public.crear_pedido_publico(
  p_cliente_nombre TEXT,
  p_cliente_telefono TEXT,
  p_tipo_entrega TEXT,
  p_direccion TEXT,
  p_total NUMERIC,
  p_detalles_json JSONB
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  normalized_name TEXT := btrim(COALESCE(p_cliente_nombre, ''));
  normalized_phone TEXT := btrim(COALESCE(p_cliente_telefono, ''));
  normalized_delivery TEXT := lower(btrim(COALESCE(p_tipo_entrega, '')));
  normalized_address TEXT := NULLIF(btrim(COALESCE(p_direccion, '')), '');
  created_folio TEXT;
BEGIN
  IF char_length(normalized_name) NOT BETWEEN 2 AND 120 THEN
    RAISE EXCEPTION 'Invalid customer name' USING ERRCODE = '22023';
  END IF;

  IF normalized_phone !~ '^[0-9]{10}$' THEN
    RAISE EXCEPTION 'Invalid customer phone' USING ERRCODE = '22023';
  END IF;

  IF normalized_delivery NOT IN ('tienda', 'envio') THEN
    RAISE EXCEPTION 'Invalid delivery type' USING ERRCODE = '22023';
  END IF;

  IF normalized_delivery = 'envio'
     AND char_length(COALESCE(normalized_address, '')) NOT BETWEEN 5 AND 500 THEN
    RAISE EXCEPTION 'Invalid delivery address' USING ERRCODE = '22023';
  END IF;

  IF normalized_delivery = 'tienda'
     AND char_length(COALESCE(normalized_address, '')) > 500 THEN
    RAISE EXCEPTION 'Invalid delivery address' USING ERRCODE = '22023';
  END IF;

  IF p_total IS NULL OR p_total <= 0 OR p_total > 1000000 THEN
    RAISE EXCEPTION 'Invalid order total' USING ERRCODE = '22023';
  END IF;

  IF p_detalles_json IS NULL
     OR jsonb_typeof(p_detalles_json) <> 'array'
     OR jsonb_array_length(p_detalles_json) NOT BETWEEN 1 AND 50
     OR octet_length(p_detalles_json::TEXT) > 200000 THEN
    RAISE EXCEPTION 'Invalid order details' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.pedidos (
    cliente_nombre,
    cliente_telefono,
    tipo_entrega,
    direccion,
    total,
    estado,
    detalles_json
  ) VALUES (
    normalized_name,
    normalized_phone,
    normalized_delivery,
    CASE WHEN normalized_delivery = 'envio' THEN normalized_address ELSE NULL END,
    p_total,
    'Por Surtir',
    p_detalles_json
  )
  RETURNING folio INTO created_folio;

  RETURN created_folio;
END;
$$;

REVOKE ALL ON FUNCTION public.crear_pedido_publico(TEXT, TEXT, TEXT, TEXT, NUMERIC, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.crear_pedido_publico(TEXT, TEXT, TEXT, TEXT, NUMERIC, JSONB)
  TO anon, authenticated;

-- Exact lookup for the public tracking page. Only the fields required by the
-- customer view are returned; the orders table remains private.
CREATE OR REPLACE FUNCTION public.buscar_pedido_por_folio(p_folio TEXT)
RETURNS TABLE (
  folio TEXT,
  cliente_nombre TEXT,
  estado TEXT,
  total NUMERIC,
  tipo_entrega TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  detalles_json JSONB
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT
    pedido.folio,
    pedido.cliente_nombre,
    pedido.estado,
    pedido.total,
    pedido.tipo_entrega,
    pedido.created_at,
    pedido.updated_at,
    pedido.detalles_json
  FROM public.pedidos AS pedido
  WHERE upper(btrim(p_folio)) ~ '^FP-[A-Z0-9-]{4,32}$'
    AND pedido.folio = upper(btrim(p_folio))
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.buscar_pedido_por_folio(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.buscar_pedido_por_folio(TEXT) TO anon, authenticated;

DROP POLICY IF EXISTS pedidos_insert_returning_select ON public.pedidos;
REVOKE SELECT (folio) ON TABLE public.pedidos FROM anon;
REVOKE INSERT ON TABLE public.pedidos FROM anon;

COMMIT;

-- Make newly created RPCs visible to the REST API without waiting for its
-- schema cache refresh interval.
NOTIFY pgrst, 'reload schema';

-- Verification (run separately):
-- SELECT public.crear_pedido_publico(
--   'Cliente prueba', '4521234567', 'tienda', NULL, 1,
--   '[{"id":"PRODUCT-UUID","cantidad":1}]'::JSONB
-- );
-- SELECT * FROM public.buscar_pedido_por_folio('FP-REPLACE-WITH-A-REAL-FOLIO');
