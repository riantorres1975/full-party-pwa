-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRACIÓN HISTÓRICA RECONSTRUIDA (drift repo ↔ base real)
-- ═══════════════════════════════════════════════════════════════════════════
-- Detectada durante la auditoría del catálogo V2 (Fase 1, 2026-07-27):
-- la base de datos real tiene las columnas es_nuevo, precios_mayoreo y
-- familia_mayoreo en public.productos, pero ningún archivo SQL del
-- repositorio las creaba (se agregaron manualmente desde el dashboard).
--
-- supabase_catalog_scalability.sql crea índices sobre es_nuevo, así que en
-- una base nueva falla si esta migración no se ejecuta antes.
--
-- Este archivo documenta el estado real. Es seguro re-ejecutarlo.
-- NOTA: pertenece al catálogo V1; quedará obsoleto al aplicar 007.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE public.productos
  ADD COLUMN IF NOT EXISTS es_nuevo        BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS precios_mayoreo JSONB,
  ADD COLUMN IF NOT EXISTS familia_mayoreo TEXT;

COMMENT ON COLUMN public.productos.precios_mayoreo IS
  'Escalones de mayoreo V1: [{ etiqueta, cantidad_minima, precio }]. Migrado a catalog_price_tiers en V2.';

COMMIT;
