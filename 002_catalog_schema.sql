-- ═══════════════════════════════════════════════════════════════════════════
-- 002 — CATÁLOGO V2: ESQUEMA NORMALIZADO
-- ═══════════════════════════════════════════════════════════════════════════
-- Ejecutar DESPUÉS de 001_catalog_backup_and_cleanup.sql.
-- Idempotente: usa IF NOT EXISTS en todas las tablas.
--
-- Modelo conceptual:
--   Categoría → Familia (producto) → Marca → Gama/Línea → Color exacto
--   → (Familia de color) → Medida → Variante → Presentación de venta
--   → Escalón de precio → Inventario por sucursal.
--
-- No modifica ni elimina ningún objeto del catálogo V1 (public.productos).
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA extensions;

-- ───────────────────────────────────────────────────────────────────────────
-- 0. FUNCIÓN GENÉRICA updated_at
-- ───────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.catalog_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.catalog_set_updated_at() FROM PUBLIC;

-- ───────────────────────────────────────────────────────────────────────────
-- 1. CATEGORÍAS JERÁRQUICAS
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.catalog_categories (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  slug        TEXT        NOT NULL,
  parent_id   UUID        REFERENCES public.catalog_categories(id) ON DELETE SET NULL,
  description TEXT,
  image_url   TEXT,
  icon        TEXT,
  sort_order  INTEGER     NOT NULL DEFAULT 0,
  active      BOOLEAN     NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT catalog_categories_slug_key UNIQUE (slug),
  CONSTRAINT catalog_categories_slug_format CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  CONSTRAINT catalog_categories_no_self_parent CHECK (parent_id IS DISTINCT FROM id)
);

-- ───────────────────────────────────────────────────────────────────────────
-- 2. COLECCIONES (independientes de las categorías; soportan temporalidad)
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.catalog_collections (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT        NOT NULL,
  slug            TEXT        NOT NULL,
  description     TEXT,
  collection_type TEXT        NOT NULL DEFAULT 'editorial',
  image_url       TEXT,
  start_date      TIMESTAMPTZ,
  end_date        TIMESTAMPTZ,
  sort_order      INTEGER     NOT NULL DEFAULT 0,
  active          BOOLEAN     NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT catalog_collections_slug_key UNIQUE (slug),
  CONSTRAINT catalog_collections_slug_format CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  CONSTRAINT catalog_collections_dates CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date)
);

-- ───────────────────────────────────────────────────────────────────────────
-- 3. MARCAS
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.catalog_brands (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  slug        TEXT        NOT NULL,
  logo_url    TEXT,
  description TEXT,
  sort_order  INTEGER     NOT NULL DEFAULT 0,
  active      BOOLEAN     NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT catalog_brands_slug_key UNIQUE (slug),
  CONSTRAINT catalog_brands_slug_format CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

-- ───────────────────────────────────────────────────────────────────────────
-- 4. GAMAS / LÍNEAS DE PRODUCTO (pertenecen a una marca)
--    "Pastel" es una gama. "Rosa pastel" es un color exacto. No se mezclan.
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.catalog_product_lines (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id    UUID        NOT NULL REFERENCES public.catalog_brands(id) ON DELETE RESTRICT,
  name        TEXT        NOT NULL,
  slug        TEXT        NOT NULL,
  description TEXT,
  image_url   TEXT,
  finish_type TEXT,
  sort_order  INTEGER     NOT NULL DEFAULT 0,
  active      BOOLEAN     NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT catalog_product_lines_slug_key UNIQUE (slug),
  CONSTRAINT catalog_product_lines_slug_format CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

-- ───────────────────────────────────────────────────────────────────────────
-- 5. FAMILIAS DE COLOR ("Rosa", "Azul", "Dorado"…)
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.catalog_color_families (
  id         UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT    NOT NULL,
  slug       TEXT    NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active     BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT catalog_color_families_slug_key UNIQUE (slug),
  CONSTRAINT catalog_color_families_slug_format CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

-- ───────────────────────────────────────────────────────────────────────────
-- 6. COLORES EXACTOS ("Rosa pastel", "Azul rey"…)
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.catalog_colors (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  color_family_id  UUID        NOT NULL REFERENCES public.catalog_color_families(id) ON DELETE RESTRICT,
  exact_name       TEXT        NOT NULL,
  slug             TEXT        NOT NULL,
  hex_value        TEXT,
  swatch_image_url TEXT,
  internal_code    TEXT,
  active           BOOLEAN     NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT catalog_colors_slug_key UNIQUE (slug),
  CONSTRAINT catalog_colors_slug_format CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  CONSTRAINT catalog_colors_hex_format CHECK (hex_value IS NULL OR hex_value ~ '^#[0-9A-Fa-f]{6}$')
);

-- ───────────────────────────────────────────────────────────────────────────
-- 7. COLORES DISPONIBLES POR GAMA (qué colores ofrece cada línea)
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.catalog_line_colors (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  line_id           UUID        NOT NULL REFERENCES public.catalog_product_lines(id) ON DELETE CASCADE,
  color_id          UUID        NOT NULL REFERENCES public.catalog_colors(id) ON DELETE RESTRICT,
  commercial_name   TEXT,
  manufacturer_code TEXT,
  image_url         TEXT,
  sort_order        INTEGER     NOT NULL DEFAULT 0,
  active            BOOLEAN     NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT catalog_line_colors_unique UNIQUE (line_id, color_id)
);

-- ───────────────────────────────────────────────────────────────────────────
-- 8. MEDIDAS (numéricas y comerciales no numéricas)
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.catalog_sizes (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT        NOT NULL,
  numeric_value NUMERIC(12,3),
  unit          TEXT        NOT NULL DEFAULT 'otro',
  sort_order    INTEGER     NOT NULL DEFAULT 0,
  active        BOOLEAN     NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT catalog_sizes_unit_check CHECK (unit IN ('pulgada','cm','m','ml','l','g','kg','comercial','otro')),
  CONSTRAINT catalog_sizes_numeric_check CHECK (
    (unit IN ('pulgada','cm','m','ml','l','g','kg') AND numeric_value IS NOT NULL AND numeric_value > 0)
    OR (unit IN ('comercial','otro'))
  )
);

-- ───────────────────────────────────────────────────────────────────────────
-- 9. PRODUCTOS (familia principal; NO es la variante)
--    listing_group_mode:
--      'product' → una tarjeta por familia completa
--      'line'    → una tarjeta por gama (recomendado para globos)
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.catalog_products (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id        UUID        NOT NULL REFERENCES public.catalog_categories(id) ON DELETE RESTRICT,
  brand_id           UUID        REFERENCES public.catalog_brands(id) ON DELETE SET NULL,
  name               TEXT        NOT NULL,
  slug               TEXT        NOT NULL,
  short_description  TEXT,
  description        TEXT,
  main_image_url     TEXT,
  listing_group_mode TEXT        NOT NULL DEFAULT 'product',
  active             BOOLEAN     NOT NULL DEFAULT true,
  featured           BOOLEAN     NOT NULL DEFAULT false,
  new_until          DATE,
  seo_title          TEXT,
  seo_description    TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT catalog_products_slug_key UNIQUE (slug),
  CONSTRAINT catalog_products_slug_format CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  CONSTRAINT catalog_products_group_mode CHECK (listing_group_mode IN ('product','line'))
);

-- ───────────────────────────────────────────────────────────────────────────
-- 10. PRODUCTO ↔ COLECCIONES (un producto, muchas colecciones)
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.catalog_collection_products (
  collection_id UUID    NOT NULL REFERENCES public.catalog_collections(id) ON DELETE CASCADE,
  product_id    UUID    NOT NULL REFERENCES public.catalog_products(id) ON DELETE CASCADE,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT catalog_collection_products_pk PRIMARY KEY (collection_id, product_id)
);

-- ───────────────────────────────────────────────────────────────────────────
-- 11. VARIANTES (combinación válida producto × gama × color × medida)
--     Las columnas gama/color/medida son opcionales: un producto que no sea
--     globo puede no tener ninguna. El UNIQUE con NULLS NOT DISTINCT impide
--     duplicados incluso con nulos (PostgreSQL 15+).
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.catalog_variants (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id       UUID        NOT NULL REFERENCES public.catalog_products(id) ON DELETE CASCADE,
  line_id          UUID        REFERENCES public.catalog_product_lines(id) ON DELETE RESTRICT,
  color_id         UUID        REFERENCES public.catalog_colors(id) ON DELETE RESTRICT,
  size_id          UUID        REFERENCES public.catalog_sizes(id) ON DELETE RESTRICT,
  finish           TEXT,
  sku              TEXT,
  barcode          TEXT,
  image_url        TEXT,
  inventory_policy TEXT        NOT NULL DEFAULT 'shared_base_units',
  active           BOOLEAN     NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT catalog_variants_unique_combination
    UNIQUE NULLS NOT DISTINCT (product_id, line_id, color_id, size_id, finish),
  CONSTRAINT catalog_variants_inventory_policy CHECK (inventory_policy IN ('shared_base_units','separate_by_presentation'))
);

-- ───────────────────────────────────────────────────────────────────────────
-- 12. PRESENTACIONES DE VENTA (pieza, bolsa, paquete, caja, lata, rollo…)
--     Una presentación o bien contiene unidades base directamente
--     (contained_quantity + contained_unit), o bien contiene otra
--     presentación (contains_presentation_id + contains_quantity).
--     base_units_total siempre expresa el total en unidades base.
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.catalog_sale_presentations (
  id                       UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id               UUID        NOT NULL REFERENCES public.catalog_variants(id) ON DELETE CASCADE,
  name                     TEXT        NOT NULL,
  presentation_type        TEXT        NOT NULL,
  base_unit                TEXT        NOT NULL DEFAULT 'pieza',
  contained_quantity       NUMERIC(14,3),
  contained_unit           TEXT,
  contains_presentation_id UUID        REFERENCES public.catalog_sale_presentations(id) ON DELETE RESTRICT,
  contains_quantity        NUMERIC(14,3),
  base_units_total         NUMERIC(14,3) NOT NULL,
  base_price               NUMERIC(12,2) NOT NULL,
  compare_at_price         NUMERIC(12,2),
  sku                      TEXT,
  barcode                  TEXT,
  minimum_order_quantity   INTEGER     NOT NULL DEFAULT 1,
  quantity_step            INTEGER     NOT NULL DEFAULT 1,
  maximum_order_quantity   INTEGER,
  inventory_policy         TEXT,
  sort_order               INTEGER     NOT NULL DEFAULT 0,
  active                   BOOLEAN     NOT NULL DEFAULT true,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT catalog_sale_presentations_unique_name UNIQUE (variant_id, name),
  CONSTRAINT catalog_sale_presentations_content_shape CHECK (
    (contains_presentation_id IS NULL AND contained_quantity IS NOT NULL AND contained_quantity > 0)
    OR
    (contains_presentation_id IS NOT NULL AND contained_quantity IS NULL AND contains_quantity IS NOT NULL AND contains_quantity > 0)
  ),
  CONSTRAINT catalog_sale_presentations_no_self_contain CHECK (contains_presentation_id IS DISTINCT FROM id),
  CONSTRAINT catalog_sale_presentations_base_units CHECK (base_units_total > 0),
  CONSTRAINT catalog_sale_presentations_base_price CHECK (base_price >= 0),
  CONSTRAINT catalog_sale_presentations_compare_price CHECK (compare_at_price IS NULL OR compare_at_price >= 0),
  CONSTRAINT catalog_sale_presentations_min_order CHECK (minimum_order_quantity >= 1),
  CONSTRAINT catalog_sale_presentations_step CHECK (quantity_step >= 1),
  CONSTRAINT catalog_sale_presentations_max_order CHECK (maximum_order_quantity IS NULL OR maximum_order_quantity >= minimum_order_quantity),
  CONSTRAINT catalog_sale_presentations_inventory_policy CHECK (inventory_policy IS NULL OR inventory_policy IN ('shared_base_units','separate_by_presentation'))
);

-- ───────────────────────────────────────────────────────────────────────────
-- 13. ESCALONES DE PRECIO (mayoreo) POR PRESENTACIÓN
--     quantity_range (columna generada) alimenta el EXCLUDE constraint de
--     003 que impide escalones superpuestos por presentación.
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.catalog_price_tiers (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_presentation_id  UUID        NOT NULL REFERENCES public.catalog_sale_presentations(id) ON DELETE CASCADE,
  minimum_quantity      INTEGER     NOT NULL,
  maximum_quantity      INTEGER,
  price_per_presentation NUMERIC(12,2) NOT NULL,
  label                 TEXT,
  active                BOOLEAN     NOT NULL DEFAULT true,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  quantity_range        INT4RANGE   GENERATED ALWAYS AS (
    int4range(minimum_quantity, COALESCE(maximum_quantity + 1, 2147483647), '[)')
  ) STORED,
  CONSTRAINT catalog_price_tiers_min CHECK (minimum_quantity >= 1),
  CONSTRAINT catalog_price_tiers_max CHECK (maximum_quantity IS NULL OR maximum_quantity >= minimum_quantity),
  CONSTRAINT catalog_price_tiers_price CHECK (price_per_presentation >= 0)
);

-- ───────────────────────────────────────────────────────────────────────────
-- 14. SUCURSALES / UBICACIONES DE INVENTARIO
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.catalog_locations (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT        NOT NULL,
  slug       TEXT        NOT NULL,
  active     BOOLEAN     NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT catalog_locations_slug_key UNIQUE (slug),
  CONSTRAINT catalog_locations_slug_format CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

-- ───────────────────────────────────────────────────────────────────────────
-- 15. INVENTARIO
--     Política shared_base_units    → filas con sale_presentation_id NULL,
--                                     quantity expresada en UNIDADES BASE.
--     Política separate_by_presentation → filas por presentación, quantity en
--                                     número de presentaciones.
--     Disponible = quantity - reserved_quantity.
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.catalog_inventory (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id           UUID        NOT NULL REFERENCES public.catalog_variants(id) ON DELETE CASCADE,
  sale_presentation_id UUID        REFERENCES public.catalog_sale_presentations(id) ON DELETE CASCADE,
  location_id          UUID        NOT NULL REFERENCES public.catalog_locations(id) ON DELETE RESTRICT,
  quantity             NUMERIC(14,3) NOT NULL DEFAULT 0,
  reserved_quantity    NUMERIC(14,3) NOT NULL DEFAULT 0,
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT catalog_inventory_unique
    UNIQUE NULLS NOT DISTINCT (variant_id, sale_presentation_id, location_id),
  CONSTRAINT catalog_inventory_quantity CHECK (quantity >= 0),
  CONSTRAINT catalog_inventory_reserved CHECK (reserved_quantity >= 0),
  CONSTRAINT catalog_inventory_reserved_lte CHECK (reserved_quantity <= quantity)
);

-- ───────────────────────────────────────────────────────────────────────────
-- 16. IMÁGENES (por producto, variante, gama o color)
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.catalog_product_images (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID        NOT NULL REFERENCES public.catalog_products(id) ON DELETE CASCADE,
  variant_id UUID        REFERENCES public.catalog_variants(id) ON DELETE CASCADE,
  line_id    UUID        REFERENCES public.catalog_product_lines(id) ON DELETE SET NULL,
  color_id   UUID        REFERENCES public.catalog_colors(id) ON DELETE SET NULL,
  image_url  TEXT        NOT NULL,
  image_type TEXT        NOT NULL DEFAULT 'galeria',
  alt_text   TEXT,
  sort_order INTEGER     NOT NULL DEFAULT 0,
  active     BOOLEAN     NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT catalog_product_images_type CHECK (image_type IN ('principal','galeria','medidas','uso','muestra_color','empaque'))
);

-- ───────────────────────────────────────────────────────────────────────────
-- 17. ATRIBUTOS GENÉRICOS (para productos que no son globos)
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.catalog_attributes (
  id            UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT    NOT NULL,
  slug          TEXT    NOT NULL,
  data_type     TEXT    NOT NULL DEFAULT 'text',
  filterable    BOOLEAN NOT NULL DEFAULT true,
  variant_level BOOLEAN NOT NULL DEFAULT true,
  active        BOOLEAN NOT NULL DEFAULT true,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT catalog_attributes_slug_key UNIQUE (slug),
  CONSTRAINT catalog_attributes_slug_format CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  CONSTRAINT catalog_attributes_data_type CHECK (data_type IN ('text','number','boolean'))
);

CREATE TABLE IF NOT EXISTS public.catalog_attribute_values (
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  attribute_id  UUID          NOT NULL REFERENCES public.catalog_attributes(id) ON DELETE CASCADE,
  value         TEXT          NOT NULL,
  numeric_value NUMERIC(14,3),
  unit          TEXT,
  sort_order    INTEGER       NOT NULL DEFAULT 0,
  active        BOOLEAN       NOT NULL DEFAULT true,
  CONSTRAINT catalog_attribute_values_unique UNIQUE (attribute_id, value)
);

CREATE TABLE IF NOT EXISTS public.catalog_variant_attribute_values (
  variant_id         UUID NOT NULL REFERENCES public.catalog_variants(id) ON DELETE CASCADE,
  attribute_value_id UUID NOT NULL REFERENCES public.catalog_attribute_values(id) ON DELETE CASCADE,
  CONSTRAINT catalog_variant_attribute_values_pk PRIMARY KEY (variant_id, attribute_value_id)
);

-- ───────────────────────────────────────────────────────────────────────────
-- 18. ALIAS DE BÚSQUEDA (sinónimos → categoría, marca, gama, color, etc.)
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.catalog_search_aliases (
  id              UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  term            TEXT    NOT NULL,
  normalized_term TEXT    NOT NULL,
  target_type     TEXT    NOT NULL,
  target_id       UUID,
  active          BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT catalog_search_aliases_term_unique UNIQUE (normalized_term, target_type, target_id),
  CONSTRAINT catalog_search_aliases_target_type CHECK (target_type IN ('category','collection','brand','line','color','color_family','size','product'))
);

-- ───────────────────────────────────────────────────────────────────────────
-- 19. RELACIONES ENTRE PRODUCTOS (complemento, alternativa, accesorio…)
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.catalog_product_relations (
  product_id         UUID    NOT NULL REFERENCES public.catalog_products(id) ON DELETE CASCADE,
  related_product_id UUID    NOT NULL REFERENCES public.catalog_products(id) ON DELETE CASCADE,
  relation_type      TEXT    NOT NULL,
  sort_order         INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT catalog_product_relations_pk PRIMARY KEY (product_id, related_product_id, relation_type),
  CONSTRAINT catalog_product_relations_type CHECK (relation_type IN ('complement','alternative','accessory','similar')),
  CONSTRAINT catalog_product_relations_no_self CHECK (product_id <> related_product_id)
);

-- ───────────────────────────────────────────────────────────────────────────
-- 20. TRIGGERS updated_at
-- ───────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'catalog_categories',
    'catalog_collections',
    'catalog_brands',
    'catalog_product_lines',
    'catalog_colors',
    'catalog_line_colors',
    'catalog_sizes',
    'catalog_products',
    'catalog_variants',
    'catalog_sale_presentations',
    'catalog_price_tiers',
    'catalog_locations',
    'catalog_inventory'
  ]
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS catalog_set_updated_at ON public.%I;
       CREATE TRIGGER catalog_set_updated_at
         BEFORE UPDATE ON public.%I
         FOR EACH ROW EXECUTE FUNCTION public.catalog_set_updated_at();',
      t, t
    );
  END LOOP;
END;
$$;

-- ───────────────────────────────────────────────────────────────────────────
-- 21. REALTIME — el catálogo público y el admin reaccionan a cambios
-- ───────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'catalog_products',
    'catalog_variants',
    'catalog_sale_presentations',
    'catalog_inventory'
  ]
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    END IF;
  END LOOP;
END;
$$;

COMMIT;

-- Verificación (ejecutar aparte):
-- SELECT tablename FROM pg_tables
-- WHERE schemaname = 'public' AND tablename LIKE 'catalog\_%'
-- ORDER BY tablename;
