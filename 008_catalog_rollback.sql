-- ═══════════════════════════════════════════════════════════════════════════
-- 008 — ROLLBACK DE EMERGENCIA DEL CATÁLOGO V2
-- ═══════════════════════════════════════════════════════════════════════════
-- ⚠️  NO forma parte de la secuencia de migración. Ejecutar SOLO si hay que
-- revertir la V2 durante la refactorización.
--
-- Hace dos cosas:
--   1. Restaura public.productos desde public.productos_backup_v1
--      (solo la tabla y sus datos; para recuperar índices, políticas y
--      funciones V1 vuelve a ejecutar los scripts originales:
--      supabase_setup.sql, supabase_inventario_migration.sql,
--      supabase_catalog_scalability.sql, supabase_security_hardening.sql,
--      supabase_order_integrity.sql).
--   2. Elimina TODO el esquema catalog_* (tablas y funciones).
--
-- No toca: pedidos, auth, profiles, configuracion, push_subscriptions,
-- productos_backup_v1, catalog_v1_object_backup.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Restaurar la tabla V1 desde el respaldo ──────────────────────────────
DO $$
BEGIN
  IF to_regclass('public.productos_backup_v1') IS NULL THEN
    RAISE EXCEPTION 'No existe public.productos_backup_v1; rollback imposible';
  END IF;
END;
$$;

DROP TABLE IF EXISTS public.productos;
CREATE TABLE public.productos AS SELECT * FROM public.productos_backup_v1;

-- Realtime de la tabla restaurada
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'productos'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.productos;
  END IF;
END;
$$;

-- ── 2. Eliminar funciones del catálogo V2 ───────────────────────────────────
DROP FUNCTION IF EXISTS public.catalog_create_order(TEXT, TEXT, TEXT, TEXT, JSONB, UUID, TEXT);
DROP FUNCTION IF EXISTS public.catalog_validate_cart(JSONB);
DROP FUNCTION IF EXISTS public.catalog_search(TEXT, INTEGER);
DROP FUNCTION IF EXISTS public.catalog_get_facets(TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.catalog_get_product_detail(TEXT);
DROP FUNCTION IF EXISTS public.catalog_list_cards(TEXT, TEXT, TEXT[], TEXT[], TEXT[], TEXT[], UUID[], TEXT, NUMERIC, NUMERIC, BOOLEAN, TEXT, TEXT, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS public.catalog_resolve_price(UUID, INTEGER);
DROP FUNCTION IF EXISTS public.catalog_normalize_text(TEXT);
DROP FUNCTION IF EXISTS public.catalog_set_updated_at();
DROP FUNCTION IF EXISTS public.catalog_prevent_category_cycle();
DROP FUNCTION IF EXISTS public.catalog_prevent_presentation_cycle();
DROP FUNCTION IF EXISTS public.catalog_check_nested_same_variant();
DROP FUNCTION IF EXISTS public.catalog_check_inventory_policy();

-- ── 3. Eliminar tablas del catálogo V2 (orden por dependencias) ─────────────
DROP TABLE IF EXISTS public.catalog_product_relations          CASCADE;
DROP TABLE IF EXISTS public.catalog_search_aliases             CASCADE;
DROP TABLE IF EXISTS public.catalog_variant_attribute_values   CASCADE;
DROP TABLE IF EXISTS public.catalog_attribute_values           CASCADE;
DROP TABLE IF EXISTS public.catalog_attributes                 CASCADE;
DROP TABLE IF EXISTS public.catalog_product_images             CASCADE;
DROP TABLE IF EXISTS public.catalog_inventory                  CASCADE;
DROP TABLE IF EXISTS public.catalog_locations                  CASCADE;
DROP TABLE IF EXISTS public.catalog_price_tiers                CASCADE;
DROP TABLE IF EXISTS public.catalog_sale_presentations         CASCADE;
DROP TABLE IF EXISTS public.catalog_variants                   CASCADE;
DROP TABLE IF EXISTS public.catalog_collection_products        CASCADE;
DROP TABLE IF EXISTS public.catalog_products                   CASCADE;
DROP TABLE IF EXISTS public.catalog_sizes                      CASCADE;
DROP TABLE IF EXISTS public.catalog_line_colors                CASCADE;
DROP TABLE IF EXISTS public.catalog_colors                     CASCADE;
DROP TABLE IF EXISTS public.catalog_color_families             CASCADE;
DROP TABLE IF EXISTS public.catalog_product_lines              CASCADE;
DROP TABLE IF EXISTS public.catalog_brands                     CASCADE;
DROP TABLE IF EXISTS public.catalog_collections                CASCADE;
DROP TABLE IF EXISTS public.catalog_categories                 CASCADE;

COMMIT;

NOTIFY pgrst, 'reload schema';

-- Verificación (ejecutar aparte):
-- SELECT to_regclass('public.productos') AS v1_restaurada;  -- debe existir
-- SELECT count(*) FROM public.productos;                    -- = filas del respaldo
-- SELECT tablename FROM pg_tables WHERE schemaname='public'
--   AND tablename LIKE 'catalog\_%';                        -- solo los backups
