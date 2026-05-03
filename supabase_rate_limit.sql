-- ═══════════════════════════════════════════════════════════════════════════
-- RATE LIMITING para inserción de pedidos
-- Ejecuta este script en: Supabase Dashboard → SQL Editor → New Query
-- ═══════════════════════════════════════════════════════════════════════════

-- Función que verifica rate limiting antes de insertar pedidos
-- Máximo 10 pedidos por teléfono en ventana de 30 minutos
CREATE OR REPLACE FUNCTION check_pedido_rate_limit()
RETURNS TRIGGER AS $$
DECLARE
  recent_count INTEGER;
  window_start TIMESTAMPTZ;
BEGIN
  window_start := NOW() - INTERVAL '30 minutes';
  
  SELECT COUNT(*) INTO recent_count
  FROM public.pedidos
  WHERE cliente_telefono = NEW.cliente_telefono
    AND created_at > window_start;
  
  IF recent_count >= 10 THEN
    RAISE EXCEPTION 'Demasiados pedidos recientes desde este número. Intenta más tarde.'
      USING ERRCODE = 'check_violation';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear el trigger
DROP TRIGGER IF EXISTS trg_pedido_rate_limit ON public.pedidos;
CREATE TRIGGER trg_pedido_rate_limit
  BEFORE INSERT ON public.pedidos
  FOR EACH ROW
  EXECUTE FUNCTION check_pedido_rate_limit();

-- Función anti-spam: bloquea pedidos con datos idénticos recientes
CREATE OR REPLACE FUNCTION check_pedido_duplicate()
RETURNS TRIGGER AS $$
DECLARE
  duplicate_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO duplicate_count
  FROM public.pedidos
  WHERE cliente_telefono = NEW.cliente_telefono
    AND cliente_nombre = NEW.cliente_nombre
    AND total = NEW.total
    AND created_at > NOW() - INTERVAL '5 minutes';
  
  IF duplicate_count > 0 THEN
    RAISE EXCEPTION 'Pedido duplicado detectado. Espera unos minutos antes de enviar otro.'
      USING ERRCODE = 'check_violation';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_pedido_duplicate ON public.pedidos;
CREATE TRIGGER trg_pedido_duplicate
  BEFORE INSERT ON public.pedidos
  FOR EACH ROW
  EXECUTE FUNCTION check_pedido_duplicate();
