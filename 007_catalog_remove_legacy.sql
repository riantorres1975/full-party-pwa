-- ═══════════════════════════════════════════════════════════════════════════
-- 007 — CATÁLOGO V2: ELIMINACIÓN DEL CATÁLOGO V1 (LEGACY)
-- ═══════════════════════════════════════════════════════════════════════════
-- ⚠️  EJECUTAR SOLO CUANDO SE CUMPLAN TODAS ESTAS CONDICIONES:
--   1. La aplicación ya no consulta public.productos (Fases 3–6 desplegadas).
--   2. El checkout V2 (catalog_create_order) está en producción.
--   3. Los productos útiles del V1 ya fueron importados al modelo V2.
--   4. Existe respaldo: public.productos_backup_v1 (creado por 001).
--
-- Esta migración:
--   - Elimina el trigger + función canonicalizadora V1 de pedidos
--     (los pedidos V2 se canonizan en catalog_create_order).
--   - Elimina la vista catalogo_facetas_publicas.
--   - Saca public.productos de la publicación Realtime.
--   - Elimina la tabla public.productos (con sus índices y políticas).
--
-- NO elimina: productos_backup_v1, catalog_v1_object_backup, pedidos,
-- ni ningún objeto fuera del dominio del catálogo.
-- Para revertir, usar 008_catalog_rollback.sql.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ── Guardas de seguridad ────────────────────────────────────────────────────
DO $$
BEGIN
  IF to_regclass('public.productos_backup_v1') IS NULL THEN
    RAISE EXCEPTION 'No existe public.productos_backup_v1. Ejecuta primero 001_catalog_backup_and_cleanup.sql';
  END IF;

  IF (SELECT count(*) FROM public.productos_backup_v1) = 0 THEN
    RAISE EXCEPTION 'public.productos_backup_v1 está vacío; se aborta la eliminación del V1';
  END IF;

  IF to_regclass('public.catalog_products') IS NULL THEN
    RAISE EXCEPTION 'No existe el esquema V2 (catalog_products). Ejecuta primero 002-006';
  END IF;
END;
$$;

-- ── 1. Trigger y función canonicalizadora V1 ────────────────────────────────
DROP TRIGGER IF EXISTS zzz_canonicalize_public_pedido_before_insert ON public.pedidos;
DROP FUNCTION IF EXISTS public.canonicalize_public_pedido();

-- ── 2. Vista de facetas V1 ──────────────────────────────────────────────────
DROP VIEW IF EXISTS public.catalogo_facetas_publicas;

-- ── 3. Realtime ─────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'productos'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.productos;
  END IF;
END;
$$;

-- ── 4. Tabla V1 (cae con sus índices, políticas y triggers propios) ─────────
REVOKE ALL ON TABLE public.productos FROM anon, authenticated;
DROP TABLE IF EXISTS public.productos;

COMMIT;

NOTIFY pgrst, 'reload schema';

-- Verificación (ejecutar aparte):
-- SELECT to_regclass('public.productos')            AS v1_table;   -- debe ser NULL
-- SELECT to_regclass('public.productos_backup_v1')  AS backup;     -- debe existir
-- SELECT count(*) FROM public.catalog_products;                   -- catálogo V2 vivo
