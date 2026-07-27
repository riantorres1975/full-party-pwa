-- ORDER IDEMPOTENCY + CANONICAL TOTAL + SERVER-SIDE ORDERS SWITCH
-- Run after supabase_public_order_rpc.sql. Safe to run more than once.
--
-- Qué agrega esta migración:
-- 1. pedidos.idempotency_key (UUID, único cuando existe): un reintento del
--    cliente tras perder la respuesta devuelve el MISMO folio en lugar de
--    insertar un pedido duplicado o chocar con el trigger anti-duplicado.
-- 2. crear_pedido_publico ahora devuelve JSONB {folio, total}, donde total es
--    el monto canónico del servidor (tras el recálculo de precios del trigger
--    de integridad). Los clientes viejos que solo leen el folio siguen
--    funcionando: la forma {folio, ...} es compatible con extraerFolioCreado.
-- 3. El RPC rechaza pedidos cuando configuracion.pedidos_habilitados es false
--    (el interruptor deja de ser solo cliente).

BEGIN;

-- ── 1. Columna de idempotencia ─────────────────────────────────────────────
ALTER TABLE public.pedidos
  ADD COLUMN IF NOT EXISTS idempotency_key UUID;

-- Único solo cuando existe (los pedidos creados desde el admin no la traen).
CREATE UNIQUE INDEX IF NOT EXISTS pedidos_idempotency_key_unique
  ON public.pedidos (idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- ── 2. RPC recreado (cambia firma y tipo de retorno: requiere DROP) ────────
DROP FUNCTION IF EXISTS public.crear_pedido_publico(TEXT, TEXT, TEXT, TEXT, NUMERIC, JSONB);

CREATE FUNCTION public.crear_pedido_publico(
  p_cliente_nombre TEXT,
  p_cliente_telefono TEXT,
  p_tipo_entrega TEXT,
  p_direccion TEXT,
  p_total NUMERIC,
  p_detalles_json JSONB,
  p_idempotency_key UUID DEFAULT NULL
)
RETURNS JSONB
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
  canonical_total NUMERIC;
  orders_switch JSONB;
BEGIN
  -- Interruptor de pedidos validado del lado del servidor.
  SELECT valor INTO orders_switch
  FROM public.configuracion
  WHERE clave = 'pedidos_habilitados'
  LIMIT 1;

  IF orders_switch IS NOT NULL AND (
    (jsonb_typeof(orders_switch) = 'boolean' AND orders_switch = 'false'::jsonb)
    OR (jsonb_typeof(orders_switch) = 'object'
        AND COALESCE((orders_switch ->> 'activo')::boolean, TRUE) = FALSE)
  ) THEN
    RAISE EXCEPTION 'Orders are temporarily disabled' USING ERRCODE = 'check_violation';
  END IF;

  -- Replay idempotente: un reintento con la misma llave devuelve el pedido
  -- original (mismo folio y total canónico) sin insertar nada.
  IF p_idempotency_key IS NOT NULL THEN
    SELECT folio, total INTO created_folio, canonical_total
    FROM public.pedidos
    WHERE idempotency_key = p_idempotency_key
    LIMIT 1;

    IF FOUND THEN
      RETURN jsonb_build_object(
        'folio', created_folio,
        'total', canonical_total,
        'replay', TRUE
      );
    END IF;
  END IF;

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
    detalles_json,
    idempotency_key
  ) VALUES (
    normalized_name,
    normalized_phone,
    normalized_delivery,
    CASE WHEN normalized_delivery = 'envio' THEN normalized_address ELSE NULL END,
    p_total,
    'Por Surtir',
    p_detalles_json,
    p_idempotency_key
  )
  RETURNING folio, total INTO created_folio, canonical_total;

  RETURN jsonb_build_object('folio', created_folio, 'total', canonical_total);

EXCEPTION
  WHEN unique_violation THEN
    -- Dos reintentos concurrentes con la misma llave: gana el primero y el
    -- segundo recibe el pedido ya creado en lugar de un error.
    IF p_idempotency_key IS NOT NULL THEN
      SELECT folio, total INTO created_folio, canonical_total
      FROM public.pedidos
      WHERE idempotency_key = p_idempotency_key
      LIMIT 1;

      IF FOUND THEN
        RETURN jsonb_build_object(
          'folio', created_folio,
          'total', canonical_total,
          'replay', TRUE
        );
      END IF;
    END IF;
    RAISE;
END;
$$;

REVOKE ALL ON FUNCTION public.crear_pedido_publico(TEXT, TEXT, TEXT, TEXT, NUMERIC, JSONB, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.crear_pedido_publico(TEXT, TEXT, TEXT, TEXT, NUMERIC, JSONB, UUID)
  TO anon, authenticated;

COMMIT;

-- Hacer visible el nuevo RPC al REST API sin esperar el refresh de caché.
NOTIFY pgrst, 'reload schema';

-- Verificación (ejecutar aparte):
-- SELECT public.crear_pedido_publico(
--   'Cliente prueba', '4521234567', 'tienda', NULL, 1,
--   '[{"id":"PRODUCT-UUID","cantidad":1}]'::JSONB,
--   '11111111-2222-3333-4444-555555555555'::UUID
-- );
-- -- Repetir la misma llamada: debe devolver el MISMO folio sin duplicar.
-- UPDATE public.configuracion SET valor = 'false'::jsonb WHERE clave = 'pedidos_habilitados';
-- -- Cualquier llamada debe fallar con 'Orders are temporarily disabled'.
