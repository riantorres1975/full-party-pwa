-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRACIÓN: Columnas de stock en productos
-- Ejecutar UNA SOLA VEZ en Supabase Dashboard → SQL Editor
-- Seguro de re-ejecutar (IF NOT EXISTS).
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.productos
  ADD COLUMN IF NOT EXISTS stock_ilimitado BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS stock_actual    INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS stock_minimo    INTEGER NOT NULL DEFAULT 5;

CREATE INDEX IF NOT EXISTS idx_productos_stock_actual
  ON public.productos (stock_actual)
  WHERE stock_ilimitado = false;

-- VERIFICACIÓN
-- SELECT id, nombre, stock_ilimitado, stock_actual, stock_minimo
-- FROM public.productos LIMIT 10;
