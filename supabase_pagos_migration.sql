-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRACIÓN: Módulo de Pagos
-- Ejecutar UNA SOLA VEZ en Supabase Dashboard → SQL Editor
-- Agrega campos de pago a la tabla `pedidos` existente
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Agregar columnas de pago a pedidos
ALTER TABLE public.pedidos
  ADD COLUMN IF NOT EXISTS pago_estado  TEXT NOT NULL DEFAULT 'pendiente'
    CHECK (pago_estado IN ('pendiente', 'confirmado', 'rechazado')),
  ADD COLUMN IF NOT EXISTS metodo_pago  TEXT
    CHECK (metodo_pago IN ('transferencia', 'efectivo', 'tarjeta', 'otro')),
  ADD COLUMN IF NOT EXISTS pago_fecha   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pago_notas   TEXT;

-- 2. Índices para consultas frecuentes del módulo de pagos
CREATE INDEX IF NOT EXISTS idx_pedidos_pago_estado ON public.pedidos (pago_estado);
CREATE INDEX IF NOT EXISTS idx_pedidos_metodo_pago ON public.pedidos (metodo_pago);

-- 3. Confirmar automáticamente pedidos que ya están en estado Enviado
--    (migración de datos históricos: si ya se envió, se asume que fue pagado)
UPDATE public.pedidos
SET pago_estado = 'confirmado',
    pago_fecha  = COALESCE(fecha_envio, updated_at)
WHERE estado = 'Enviado'
  AND pago_estado = 'pendiente';

-- NOTA: Los pedidos Cancelados se quedan como 'pendiente' por defecto.
-- El admin puede marcarlos manualmente si hubo cobro parcial.
