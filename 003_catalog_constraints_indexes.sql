-- ═══════════════════════════════════════════════════════════════════════════
-- 003 — CATÁLOGO V2: CONSTRAINTS AVANZADOS, ÍNDICES Y TRIGGERS DE INTEGRIDAD
-- ═══════════════════════════════════════════════════════════════════════════
-- Ejecutar DESPUÉS de 002_catalog_schema.sql. Idempotente.
--
-- Contenido:
--   1. EXCLUDE constraint: escalones de precio sin traslapes por presentación.
--   2. Índices en todas las FK, slugs, active y columnas de filtrado.
--   3. SKU único cuando existe (índice parcial).
--   4. Índices trigram + tsvector para búsqueda.
--   5. Triggers anti-ciclos (categorías y presentaciones anidadas).
--   6. Trigger de consistencia inventario ↔ política de la variante.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA extensions;
SET LOCAL search_path = public, extensions, pg_catalog;

-- ───────────────────────────────────────────────────────────────────────────
-- 1. ESCALONES DE PRECIO SIN TRASLAPES
--    quantity_range es una columna generada ([min, max+1) o [min, ∞)).
--    El EXCLUDE usa solo filas activas: desactivar un escalón permite
--    reemplazarlo sin borrar historial.
-- ───────────────────────────────────────────────────────────────────────────
ALTER TABLE public.catalog_price_tiers
  DROP CONSTRAINT IF EXISTS catalog_price_tiers_no_overlap;

ALTER TABLE public.catalog_price_tiers
  ADD CONSTRAINT catalog_price_tiers_no_overlap
  EXCLUDE USING gist (
    sale_presentation_id WITH =,
    quantity_range WITH &&
  ) WHERE (active = true);

-- ───────────────────────────────────────────────────────────────────────────
-- 2. ÍNDICES EN FOREIGN KEYS Y COLUMNAS DE FILTRADO
-- ───────────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS catalog_categories_parent_idx    ON public.catalog_categories (parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS catalog_categories_active_idx    ON public.catalog_categories (active, sort_order);

CREATE INDEX IF NOT EXISTS catalog_collections_active_idx   ON public.catalog_collections (active, sort_order);

CREATE INDEX IF NOT EXISTS catalog_collection_products_product_idx ON public.catalog_collection_products (product_id);

CREATE INDEX IF NOT EXISTS catalog_brands_active_idx        ON public.catalog_brands (active, sort_order);

CREATE INDEX IF NOT EXISTS catalog_product_lines_brand_idx  ON public.catalog_product_lines (brand_id);
CREATE INDEX IF NOT EXISTS catalog_product_lines_active_idx ON public.catalog_product_lines (active, sort_order);

CREATE INDEX IF NOT EXISTS catalog_colors_family_idx        ON public.catalog_colors (color_family_id);
CREATE INDEX IF NOT EXISTS catalog_colors_active_idx        ON public.catalog_colors (active);

CREATE INDEX IF NOT EXISTS catalog_line_colors_color_idx    ON public.catalog_line_colors (color_id);
CREATE INDEX IF NOT EXISTS catalog_line_colors_line_idx     ON public.catalog_line_colors (line_id) WHERE active = true;

CREATE INDEX IF NOT EXISTS catalog_sizes_active_idx         ON public.catalog_sizes (active, sort_order);

CREATE INDEX IF NOT EXISTS catalog_products_category_idx    ON public.catalog_products (category_id);
CREATE INDEX IF NOT EXISTS catalog_products_brand_idx       ON public.catalog_products (brand_id) WHERE brand_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS catalog_products_active_idx      ON public.catalog_products (active, featured, name);
CREATE INDEX IF NOT EXISTS catalog_products_new_idx         ON public.catalog_products (new_until) WHERE new_until IS NOT NULL;

CREATE INDEX IF NOT EXISTS catalog_variants_product_idx     ON public.catalog_variants (product_id);
CREATE INDEX IF NOT EXISTS catalog_variants_line_idx        ON public.catalog_variants (line_id) WHERE line_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS catalog_variants_color_idx       ON public.catalog_variants (color_id) WHERE color_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS catalog_variants_size_idx        ON public.catalog_variants (size_id) WHERE size_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS catalog_variants_active_idx      ON public.catalog_variants (active);
CREATE INDEX IF NOT EXISTS catalog_variants_barcode_idx     ON public.catalog_variants (barcode) WHERE barcode IS NOT NULL;

CREATE INDEX IF NOT EXISTS catalog_sale_presentations_variant_idx   ON public.catalog_sale_presentations (variant_id);
CREATE INDEX IF NOT EXISTS catalog_sale_presentations_contains_idx  ON public.catalog_sale_presentations (contains_presentation_id) WHERE contains_presentation_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS catalog_sale_presentations_active_idx    ON public.catalog_sale_presentations (active, sort_order);
CREATE INDEX IF NOT EXISTS catalog_sale_presentations_barcode_idx   ON public.catalog_sale_presentations (barcode) WHERE barcode IS NOT NULL;

CREATE INDEX IF NOT EXISTS catalog_price_tiers_presentation_idx     ON public.catalog_price_tiers (sale_presentation_id) WHERE active = true;

CREATE INDEX IF NOT EXISTS catalog_inventory_variant_idx    ON public.catalog_inventory (variant_id);
CREATE INDEX IF NOT EXISTS catalog_inventory_presentation_idx ON public.catalog_inventory (sale_presentation_id) WHERE sale_presentation_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS catalog_inventory_location_idx   ON public.catalog_inventory (location_id);

CREATE INDEX IF NOT EXISTS catalog_product_images_product_idx ON public.catalog_product_images (product_id);
CREATE INDEX IF NOT EXISTS catalog_product_images_variant_idx ON public.catalog_product_images (variant_id) WHERE variant_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS catalog_product_images_line_idx    ON public.catalog_product_images (line_id) WHERE line_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS catalog_product_images_color_idx   ON public.catalog_product_images (color_id) WHERE color_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS catalog_attribute_values_attribute_idx ON public.catalog_attribute_values (attribute_id);
CREATE INDEX IF NOT EXISTS catalog_variant_attr_values_value_idx  ON public.catalog_variant_attribute_values (attribute_value_id);

CREATE INDEX IF NOT EXISTS catalog_search_aliases_target_idx ON public.catalog_search_aliases (target_type, target_id);

CREATE INDEX IF NOT EXISTS catalog_product_relations_related_idx ON public.catalog_product_relations (related_product_id);

-- ───────────────────────────────────────────────────────────────────────────
-- 3. SKU ÚNICO CUANDO EXISTE (índices parciales)
-- ───────────────────────────────────────────────────────────────────────────
CREATE UNIQUE INDEX IF NOT EXISTS catalog_variants_sku_key
  ON public.catalog_variants (sku) WHERE sku IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS catalog_sale_presentations_sku_key
  ON public.catalog_sale_presentations (sku) WHERE sku IS NOT NULL;

-- ───────────────────────────────────────────────────────────────────────────
-- 4. BÚSQUEDA: tsvector en productos + trigram en nombres del dominio
-- ───────────────────────────────────────────────────────────────────────────
ALTER TABLE public.catalog_products
  DROP COLUMN IF EXISTS search_tsv;

ALTER TABLE public.catalog_products
  ADD COLUMN search_tsv TSVECTOR
  GENERATED ALWAYS AS (
    to_tsvector('spanish',
      coalesce(name, '') || ' ' ||
      coalesce(short_description, '') || ' ' ||
      coalesce(description, '')
    )
  ) STORED;

CREATE INDEX IF NOT EXISTS catalog_products_search_tsv_idx
  ON public.catalog_products USING gin (search_tsv);

CREATE INDEX IF NOT EXISTS catalog_products_name_trgm     ON public.catalog_products USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS catalog_brands_name_trgm       ON public.catalog_brands USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS catalog_product_lines_name_trgm ON public.catalog_product_lines USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS catalog_colors_name_trgm       ON public.catalog_colors USING gin (exact_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS catalog_categories_name_trgm   ON public.catalog_categories USING gin (name gin_trgm_ops);

-- ───────────────────────────────────────────────────────────────────────────
-- 5. TRIGGERS ANTI-CICLOS
-- ───────────────────────────────────────────────────────────────────────────
-- 5a. Categorías: parent_id no puede crear un ciclo.
CREATE OR REPLACE FUNCTION public.catalog_prevent_category_cycle()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  cursor_id UUID := NEW.parent_id;
  depth     INTEGER := 0;
BEGIN
  WHILE cursor_id IS NOT NULL LOOP
    IF cursor_id = NEW.id THEN
      RAISE EXCEPTION 'Category parent_id creates a cycle'
        USING ERRCODE = '22023';
    END IF;
    depth := depth + 1;
    IF depth > 10 THEN
      RAISE EXCEPTION 'Category hierarchy exceeds 10 levels'
        USING ERRCODE = '22023';
    END IF;
    SELECT parent_id INTO cursor_id
      FROM public.catalog_categories
      WHERE id = cursor_id;
  END LOOP;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.catalog_prevent_category_cycle() FROM PUBLIC;

DROP TRIGGER IF EXISTS catalog_categories_no_cycle ON public.catalog_categories;
CREATE TRIGGER catalog_categories_no_cycle
  BEFORE INSERT OR UPDATE OF parent_id ON public.catalog_categories
  FOR EACH ROW
  WHEN (NEW.parent_id IS NOT NULL)
  EXECUTE FUNCTION public.catalog_prevent_category_cycle();

-- 5b. Presentaciones anidadas: contains_presentation_id no puede crear ciclo.
CREATE OR REPLACE FUNCTION public.catalog_prevent_presentation_cycle()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  cursor_id UUID := NEW.contains_presentation_id;
  depth     INTEGER := 0;
BEGIN
  WHILE cursor_id IS NOT NULL LOOP
    IF cursor_id = NEW.id THEN
      RAISE EXCEPTION 'Presentation cannot contain itself (cycle detected)'
        USING ERRCODE = '22023';
    END IF;
    depth := depth + 1;
    IF depth > 5 THEN
      RAISE EXCEPTION 'Presentation nesting exceeds 5 levels'
        USING ERRCODE = '22023';
    END IF;
    SELECT contains_presentation_id INTO cursor_id
      FROM public.catalog_sale_presentations
      WHERE id = cursor_id;
  END LOOP;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.catalog_prevent_presentation_cycle() FROM PUBLIC;

DROP TRIGGER IF EXISTS catalog_sale_presentations_no_cycle ON public.catalog_sale_presentations;
CREATE TRIGGER catalog_sale_presentations_no_cycle
  BEFORE INSERT OR UPDATE OF contains_presentation_id ON public.catalog_sale_presentations
  FOR EACH ROW
  WHEN (NEW.contains_presentation_id IS NOT NULL)
  EXECUTE FUNCTION public.catalog_prevent_presentation_cycle();

-- 5c. La presentación contenida debe pertenecer a la MISMA variante.
CREATE OR REPLACE FUNCTION public.catalog_check_nested_same_variant()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  container_variant UUID;
BEGIN
  SELECT variant_id INTO container_variant
    FROM public.catalog_sale_presentations
    WHERE id = NEW.contains_presentation_id;

  IF container_variant IS NULL THEN
    RAISE EXCEPTION 'Contained presentation % does not exist', NEW.contains_presentation_id
      USING ERRCODE = '23503';
  END IF;

  IF container_variant <> NEW.variant_id THEN
    RAISE EXCEPTION 'Nested presentation must belong to the same variant'
      USING ERRCODE = '22023';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.catalog_check_nested_same_variant() FROM PUBLIC;

DROP TRIGGER IF EXISTS catalog_sale_presentations_same_variant ON public.catalog_sale_presentations;
CREATE TRIGGER catalog_sale_presentations_same_variant
  BEFORE INSERT OR UPDATE OF contains_presentation_id, variant_id ON public.catalog_sale_presentations
  FOR EACH ROW
  WHEN (NEW.contains_presentation_id IS NOT NULL)
  EXECUTE FUNCTION public.catalog_check_nested_same_variant();

-- ───────────────────────────────────────────────────────────────────────────
-- 6. CONSISTENCIA INVENTARIO ↔ POLÍTICA DE LA VARIANTE
--    shared_base_units        → sale_presentation_id debe ser NULL.
--    separate_by_presentation → sale_presentation_id es obligatorio.
--    La política efectiva es la de la presentación si la define, si no la de
--    la variante.
-- ───────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.catalog_check_inventory_policy()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  effective_policy TEXT;
BEGIN
  SELECT COALESCE(sp.inventory_policy, v.inventory_policy)
    INTO effective_policy
    FROM public.catalog_variants v
    LEFT JOIN public.catalog_sale_presentations sp
      ON sp.id = NEW.sale_presentation_id
    WHERE v.id = NEW.variant_id;

  IF effective_policy IS NULL THEN
    RAISE EXCEPTION 'Variant % does not exist', NEW.variant_id
      USING ERRCODE = '23503';
  END IF;

  IF effective_policy = 'shared_base_units' AND NEW.sale_presentation_id IS NOT NULL THEN
    RAISE EXCEPTION 'Inventory for shared_base_units variants must be tracked at base-unit level (sale_presentation_id NULL)'
      USING ERRCODE = '22023';
  END IF;

  IF effective_policy = 'separate_by_presentation' AND NEW.sale_presentation_id IS NULL THEN
    RAISE EXCEPTION 'Inventory for separate_by_presentation variants requires sale_presentation_id'
      USING ERRCODE = '22023';
  END IF;

  IF NEW.sale_presentation_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.catalog_sale_presentations sp
    WHERE sp.id = NEW.sale_presentation_id
      AND sp.variant_id = NEW.variant_id
  ) THEN
    RAISE EXCEPTION 'Presentation % does not belong to variant %', NEW.sale_presentation_id, NEW.variant_id
      USING ERRCODE = '22023';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.catalog_check_inventory_policy() FROM PUBLIC;

DROP TRIGGER IF EXISTS catalog_inventory_policy_check ON public.catalog_inventory;
CREATE TRIGGER catalog_inventory_policy_check
  BEFORE INSERT OR UPDATE OF variant_id, sale_presentation_id ON public.catalog_inventory
  FOR EACH ROW
  EXECUTE FUNCTION public.catalog_check_inventory_policy();

COMMIT;

-- Verificación (ejecutar aparte):
-- SELECT indexname FROM pg_indexes
-- WHERE schemaname = 'public' AND indexname LIKE 'catalog\_%' ORDER BY indexname;
-- SELECT conname FROM pg_constraint
-- WHERE connamespace = 'public'::regnamespace AND conname LIKE 'catalog\_%' ORDER BY conname;
