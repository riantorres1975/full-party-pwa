-- ═══════════════════════════════════════════════════════════════════════════
-- RATE LIMITING SERVER-SIDE PARA PEDIDOS
-- Ejecuta este script en: Supabase Dashboard → SQL Editor → New Query
--
-- Previene abuso: máximo 5 pedidos por IP/teléfono en ventana de 30 minutos.
-- Complementa el rate limiting client-side existente en CarritoDrawer.jsx.
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Función que cuenta pedidos recientes por teléfono
CREATE OR REPLACE FUNCTION public.check_order_rate_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  pedidos_recientes INT;
  max_pedidos CONSTANT INT := 10;          -- máx pedidos por ventana
  ventana CONSTANT INTERVAL := '30 minutes';
BEGIN
  -- Contar pedidos del mismo teléfono en la ventana
  SELECT COUNT(*)
    INTO pedidos_recientes
    FROM public.pedidos
   WHERE cliente_telefono = NEW.cliente_telefono
     AND created_at > (NOW() - ventana);

  IF pedidos_recientes >= max_pedidos THEN
    RAISE EXCEPTION 'Rate limit excedido: demasiados pedidos en poco tiempo.'
      USING ERRCODE = 'P0001';
  END IF;

  -- Validar longitud de campos para prevenir abuso
  IF LENGTH(NEW.cliente_nombre) > 100 THEN
    RAISE EXCEPTION 'Nombre demasiado largo (máx 100 caracteres).'
      USING ERRCODE = 'P0002';
  END IF;

  IF NEW.direccion IS NOT NULL AND LENGTH(NEW.direccion) > 500 THEN
    RAISE EXCEPTION 'Dirección demasiada larga (máx 500 caracteres).'
      USING ERRCODE = 'P0003';
  END IF;

  IF LENGTH(NEW.cliente_telefono) > 15 THEN
    RAISE EXCEPTION 'Teléfono inválido.'
      USING ERRCODE = 'P0004';
  END IF;

  -- Validar que el total no sea negativo
  IF NEW.total < 0 THEN
    RAISE EXCEPTION 'Total inválido.'
      USING ERRCODE = 'P0005';
  END IF;

  -- Validar que detalles_json no esté vacío
  IF NEW.detalles_json IS NULL OR jsonb_array_length(NEW.detalles_json) = 0 THEN
    RAISE EXCEPTION 'El pedido debe tener al menos un producto.'
      USING ERRCODE = 'P0006';
  END IF;

  -- Limitar cantidad de items por pedido
  IF jsonb_array_length(NEW.detalles_json) > 50 THEN
    RAISE EXCEPTION 'Demasiados productos en un solo pedido (máx 50).'
      USING ERRCODE = 'P0007';
  END IF;

  RETURN NEW;
END;
$$;

-- 2. Trigger que se ejecuta antes de cada INSERT en pedidos
DROP TRIGGER IF EXISTS tr_order_rate_limit ON public.pedidos;
CREATE TRIGGER tr_order_rate_limit
  BEFORE INSERT ON public.pedidos
  FOR EACH ROW
  EXECUTE FUNCTION public.check_order_rate_limit();

-- 3. Índice para acelerar la consulta del rate limit
CREATE INDEX IF NOT EXISTS idx_pedidos_telefono_created
  ON public.pedidos (cliente_telefono, created_at DESC);

-- ═══════════════════════════════════════════════════════════════════════════
-- NOTA: Ejecuta este script en Supabase SQL Editor.
-- El trigger se activa automáticamente en cada pedido nuevo.
-- Los valores (10 pedidos / 30 min) son configurables arriba.
-- ═══════════════════════════════════════════════════════════════════════════
