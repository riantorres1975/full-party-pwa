-- ═══════════════════════════════════════════════════════════════════════════
-- 005 — CATÁLOGO V2: FUNCIONES Y RPCs
-- ═══════════════════════════════════════════════════════════════════════════
-- Ejecutar DESPUÉS de 004_catalog_rls.sql. Idempotente (CREATE OR REPLACE).
--
-- RPCs públicas (SECURITY DEFINER, solo exponen filas activas):
--   catalog_list_cards          — tarjetas agrupadas por producto o gama.
--   catalog_get_product_detail  — ficha completa del producto.
--   catalog_get_facets          — filtros dinámicos con conteos.
--   catalog_search              — búsqueda normalizada (delegada a list_cards).
--   catalog_resolve_price       — precio unitario + escalón + siguiente nivel.
--   catalog_validate_cart       — validación canónica del carrito (precios y
--                                 existencia recalculados en el servidor).
--   catalog_create_order        — creación transaccional del pedido V2:
--                                 valida, reserva inventario y guarda snapshot.
--
-- Convención de inventario: al crear el pedido se RESERVA
-- (reserved_quantity += necesario). El descuento definitivo ocurre en el
-- picking y la liberación al cancelar (RPCs de la Fase 6).
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ───────────────────────────────────────────────────────────────────────────
-- 0. NORMALIZACIÓN DE TEXTO (acentos + minúsculas) — uso interno
-- ───────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.catalog_normalize_text(input TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = public, pg_temp
AS $$
  SELECT lower(unaccent(coalesce(input, '')));
$$;

REVOKE ALL ON FUNCTION public.catalog_normalize_text(TEXT) FROM PUBLIC;

-- ───────────────────────────────────────────────────────────────────────────
-- 1. RESOLUCIÓN DE PRECIO POR PRESENTACIÓN
--    Recibe presentación + cantidad; devuelve precio unitario, escalón
--    aplicado, subtotal y el siguiente nivel alcanzable.
-- ───────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.catalog_resolve_price(
  p_sale_presentation_id UUID,
  p_quantity INTEGER
)
RETURNS TABLE (
  unit_price NUMERIC,
  tier_label TEXT,
  tier_minimum INTEGER,
  subtotal NUMERIC,
  next_tier_minimum INTEGER,
  next_tier_quantity_missing INTEGER,
  next_tier_price NUMERIC
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_base_price NUMERIC;
  v_active     BOOLEAN;
BEGIN
  IF p_quantity IS NULL OR p_quantity < 1 THEN
    RAISE EXCEPTION 'Quantity must be at least 1' USING ERRCODE = '22023';
  END IF;

  SELECT sp.base_price, sp.active INTO v_base_price, v_active
    FROM public.catalog_sale_presentations sp
    WHERE sp.id = p_sale_presentation_id;

  IF NOT FOUND OR NOT v_active THEN
    RAISE EXCEPTION 'Sale presentation is unavailable' USING ERRCODE = '22023';
  END IF;

  SELECT t.price_per_presentation, t.label, t.minimum_quantity
    INTO unit_price, tier_label, tier_minimum
    FROM public.catalog_price_tiers t
    WHERE t.sale_presentation_id = p_sale_presentation_id
      AND t.active = true
      AND t.minimum_quantity <= p_quantity
    ORDER BY t.minimum_quantity DESC
    LIMIT 1;

  unit_price := COALESCE(unit_price, v_base_price);

  SELECT t.minimum_quantity, t.price_per_presentation
    INTO next_tier_minimum, next_tier_price
    FROM public.catalog_price_tiers t
    WHERE t.sale_presentation_id = p_sale_presentation_id
      AND t.active = true
      AND t.minimum_quantity > p_quantity
      AND t.price_per_presentation < unit_price
    ORDER BY t.minimum_quantity ASC
    LIMIT 1;

  subtotal := round(unit_price * p_quantity, 2);
  next_tier_quantity_missing :=
    CASE WHEN next_tier_minimum IS NOT NULL
      THEN next_tier_minimum - p_quantity
      ELSE NULL
    END;

  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.catalog_resolve_price(UUID, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.catalog_resolve_price(UUID, INTEGER) TO anon, authenticated;

-- ───────────────────────────────────────────────────────────────────────────
-- 2. TARJETAS DEL CATÁLOGO (agrupadas por producto o por gama)
--    Devuelve { cards: [...], total: N }. No expone variantes completas.
-- ───────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.catalog_list_cards(
  p_category_slug      TEXT    DEFAULT NULL,
  p_collection_slug    TEXT    DEFAULT NULL,
  p_brand_slugs        TEXT[]  DEFAULT NULL,
  p_line_slugs         TEXT[]  DEFAULT NULL,
  p_color_family_slugs TEXT[]  DEFAULT NULL,
  p_color_slugs        TEXT[]  DEFAULT NULL,
  p_size_ids           UUID[]  DEFAULT NULL,
  p_finish             TEXT    DEFAULT NULL,
  p_min_price          NUMERIC DEFAULT NULL,
  p_max_price          NUMERIC DEFAULT NULL,
  p_in_stock           BOOLEAN DEFAULT NULL,
  p_search             TEXT    DEFAULT NULL,
  p_sort               TEXT    DEFAULT 'featured',
  p_limit              INTEGER DEFAULT 24,
  p_offset             INTEGER DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_result JSONB;
  v_limit  INTEGER := LEAST(GREATEST(COALESCE(p_limit, 24), 1), 100);
  v_offset INTEGER := GREATEST(COALESCE(p_offset, 0), 0);
  v_search TEXT    := NULLIF(btrim(COALESCE(p_search, '')), '');
BEGIN
  WITH RECURSIVE category_scope AS (
    SELECT c.id
    FROM public.catalog_categories c
    WHERE p_category_slug IS NOT NULL
      AND c.slug = p_category_slug
      AND c.active = true
    UNION ALL
    SELECT c.id
    FROM public.catalog_categories c
    JOIN category_scope s ON c.parent_id = s.id
    WHERE p_category_slug IS NOT NULL
      AND c.active = true
  ),
  base AS (
    SELECT
      p.id            AS product_id,
      p.name          AS product_name,
      p.slug          AS product_slug,
      p.short_description,
      p.main_image_url AS product_image_url,
      p.listing_group_mode,
      p.featured,
      (p.new_until IS NOT NULL AND p.new_until >= CURRENT_DATE) AS is_new,
      b.name          AS brand_name,
      b.slug          AS brand_slug,
      l.id            AS line_id,
      l.name          AS line_name,
      l.slug          AS line_slug,
      l.image_url     AS line_image_url,
      v.id            AS variant_id,
      v.color_id,
      v.size_id,
      c.slug          AS color_slug,
      c.exact_name    AS color_name,
      c.hex_value     AS color_hex,
      cf.slug         AS color_family_slug,
      s.name          AS size_name,
      s.sort_order    AS size_sort,
      sp.id           AS sale_presentation_id,
      sp.presentation_type,
      sp.base_price,
      sp.base_units_total,
      CASE
        WHEN v.inventory_policy = 'shared_base_units' THEN
          COALESCE((
            SELECT sum(i.quantity - i.reserved_quantity)
            FROM public.catalog_inventory i
            WHERE i.variant_id = v.id AND i.sale_presentation_id IS NULL
          ), 0) >= sp.base_units_total
        ELSE
          COALESCE((
            SELECT sum(i.quantity - i.reserved_quantity)
            FROM public.catalog_inventory i
            WHERE i.variant_id = v.id AND i.sale_presentation_id = sp.id
          ), 0) >= 1
      END AS sp_in_stock
    FROM public.catalog_products p
    JOIN public.catalog_variants v
      ON v.product_id = p.id AND v.active = true
    JOIN public.catalog_sale_presentations sp
      ON sp.variant_id = v.id AND sp.active = true
    LEFT JOIN public.catalog_brands b          ON b.id = p.brand_id
    LEFT JOIN public.catalog_product_lines l   ON l.id = v.line_id
    LEFT JOIN public.catalog_colors c          ON c.id = v.color_id
    LEFT JOIN public.catalog_color_families cf ON cf.id = c.color_family_id
    LEFT JOIN public.catalog_sizes s           ON s.id = v.size_id
    WHERE p.active = true
      AND (p_category_slug IS NULL OR p.category_id IN (SELECT id FROM category_scope))
      AND (p_brand_slugs IS NULL OR b.slug = ANY(p_brand_slugs))
      AND (p_line_slugs IS NULL OR l.slug = ANY(p_line_slugs))
      AND (p_color_family_slugs IS NULL OR cf.slug = ANY(p_color_family_slugs))
      AND (p_color_slugs IS NULL OR c.slug = ANY(p_color_slugs))
      AND (p_size_ids IS NULL OR v.size_id = ANY(p_size_ids))
      AND (p_finish IS NULL OR v.finish = p_finish)
      AND (p_collection_slug IS NULL OR p.id IN (
        SELECT cp.product_id
        FROM public.catalog_collection_products cp
        JOIN public.catalog_collections col ON col.id = cp.collection_id
        WHERE col.slug = p_collection_slug
          AND col.active = true
          AND (col.start_date IS NULL OR col.start_date <= NOW())
          AND (col.end_date IS NULL OR col.end_date >= NOW())
      ))
      AND (
        v_search IS NULL
        OR (SELECT bool_and(
              public.catalog_normalize_text(
                p.name || ' ' || coalesce(b.name,'') || ' ' || coalesce(l.name,'') || ' ' ||
                coalesce(c.exact_name,'') || ' ' || coalesce(cf.name,'') || ' ' ||
                coalesce(s.name,'') || ' ' || coalesce(sp.name,'') || ' ' ||
                coalesce(v.sku,'') || ' ' || coalesce(v.barcode,'') || ' ' ||
                coalesce(sp.sku,'') || ' ' || coalesce(sp.barcode,'')
              ) LIKE '%' || token || '%')
            FROM unnest(string_to_array(public.catalog_normalize_text(v_search), ' ')) AS token)
        OR EXISTS (
          SELECT 1
          FROM public.catalog_search_aliases a
          WHERE a.active = true
            AND position(a.normalized_term in public.catalog_normalize_text(v_search)) > 0
            AND (
              (a.target_type = 'category' AND p.category_id = a.target_id)
              OR (a.target_type = 'brand'   AND p.brand_id = a.target_id)
              OR (a.target_type = 'line'    AND v.line_id = a.target_id)
              OR (a.target_type = 'color'   AND v.color_id = a.target_id)
              OR (a.target_type = 'size'    AND v.size_id = a.target_id)
              OR (a.target_type = 'product' AND p.id = a.target_id)
            )
        )
      )
  ),
  keyed AS (
    SELECT
      CASE
        WHEN listing_group_mode = 'line' AND line_id IS NOT NULL
          THEN product_id::text || ':' || line_id::text
        ELSE product_id::text
      END AS group_key,
      *
    FROM base
  ),
  group_sizes AS (
    SELECT group_key,
           jsonb_agg(jsonb_build_object('id', size_id, 'name', size_name) ORDER BY size_sort, size_name) AS sizes
    FROM (
      SELECT DISTINCT group_key, size_id, size_name, size_sort
      FROM keyed WHERE size_id IS NOT NULL
    ) d
    GROUP BY group_key
  ),
  group_colors AS (
    SELECT group_key,
           jsonb_agg(jsonb_build_object('slug', color_slug, 'name', color_name, 'hex', color_hex) ORDER BY color_name) AS colors
    FROM (
      SELECT DISTINCT group_key, color_slug, color_name, color_hex
      FROM keyed WHERE color_id IS NOT NULL
    ) d
    GROUP BY group_key
  ),
  group_presentations AS (
    SELECT group_key,
           jsonb_agg(presentation_type ORDER BY presentation_type) AS presentation_types
    FROM (SELECT DISTINCT group_key, presentation_type FROM keyed) d
    GROUP BY group_key
  ),
  grouped AS (
    SELECT
      group_key,
      product_id,
      product_name,
      product_slug,
      short_description,
      product_image_url,
      listing_group_mode,
      featured,
      is_new,
      brand_name,
      brand_slug,
      (array_agg(CASE WHEN listing_group_mode = 'line' THEN line_id END))[1] AS card_line_id,
      min(CASE WHEN listing_group_mode = 'line' THEN line_name END)      AS card_line_name,
      min(CASE WHEN listing_group_mode = 'line' THEN line_slug END)      AS card_line_slug,
      min(CASE WHEN listing_group_mode = 'line' THEN line_image_url END) AS card_line_image_url,
      min(base_price)                                AS min_price,
      count(DISTINCT color_id) FILTER (WHERE color_id IS NOT NULL) AS color_count,
      count(DISTINCT line_id)   FILTER (WHERE line_id IS NOT NULL)  AS line_count,
      count(DISTINCT variant_id)                     AS variant_count,
      count(DISTINCT sale_presentation_id)           AS presentation_count,
      bool_or(sp_in_stock)                           AS in_stock
    FROM keyed
    GROUP BY
      group_key, product_id, product_name, product_slug, short_description,
      product_image_url, listing_group_mode, featured, is_new, brand_name, brand_slug
  ),
  final AS (
    SELECT
      g.*,
      COALESCE(gs.sizes, '[]'::jsonb)               AS sizes,
      COALESCE(gc.colors, '[]'::jsonb)              AS colors,
      COALESCE(gp.presentation_types, '[]'::jsonb)  AS presentation_types
    FROM grouped g
    LEFT JOIN group_sizes gs         USING (group_key)
    LEFT JOIN group_colors gc        USING (group_key)
    LEFT JOIN group_presentations gp USING (group_key)
    WHERE (p_min_price IS NULL OR g.min_price >= p_min_price)
      AND (p_max_price IS NULL OR g.min_price <= p_max_price)
      AND (p_in_stock IS NULL OR g.in_stock = p_in_stock)
  ),
  counted AS (SELECT count(*) AS total FROM final)
  SELECT jsonb_build_object(
    'cards', COALESCE((
      SELECT jsonb_agg(card)
      FROM (
        SELECT jsonb_build_object(
          'group_key',          group_key,
          'product_id',         product_id,
          'product_name',       product_name,
          'product_slug',       product_slug,
          'short_description',  short_description,
          'brand_name',         brand_name,
          'brand_slug',         brand_slug,
          'line_id',            card_line_id,
          'line_name',          card_line_name,
          'line_slug',          card_line_slug,
          'image_url',          COALESCE(card_line_image_url, product_image_url),
          'min_price',          min_price,
          'color_count',        color_count,
          'line_count',         line_count,
          'variant_count',      variant_count,
          'presentation_count', presentation_count,
          'sizes',              sizes,
          'colors',             colors,
          'presentation_types', presentation_types,
          'in_stock',           in_stock,
          'featured',           featured,
          'is_new',             is_new
        ) AS card
        FROM final
        ORDER BY
          CASE WHEN p_sort = 'featured'   THEN featured END DESC NULLS LAST,
          CASE WHEN p_sort = 'featured'   THEN is_new END DESC NULLS LAST,
          CASE WHEN p_sort = 'price_asc'  THEN min_price END ASC NULLS LAST,
          CASE WHEN p_sort = 'price_desc' THEN min_price END DESC NULLS LAST,
          product_name ASC,
          group_key ASC
        LIMIT v_limit OFFSET v_offset
      ) cards_sub
    ), '[]'::jsonb),
    'total', (SELECT total FROM counted),
    'limit', v_limit,
    'offset', v_offset
  ) INTO v_result;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.catalog_list_cards(TEXT, TEXT, TEXT[], TEXT[], TEXT[], TEXT[], UUID[], TEXT, NUMERIC, NUMERIC, BOOLEAN, TEXT, TEXT, INTEGER, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.catalog_list_cards(TEXT, TEXT, TEXT[], TEXT[], TEXT[], TEXT[], UUID[], TEXT, NUMERIC, NUMERIC, BOOLEAN, TEXT, TEXT, INTEGER, INTEGER) TO anon, authenticated;

-- ───────────────────────────────────────────────────────────────────────────
-- 3. DETALLE DEL PRODUCTO (variantes válidas + presentaciones + precios
--    escalonados + disponibilidad + imágenes + atributos + relacionados)
-- ───────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.catalog_get_product_detail(p_slug TEXT)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_product_id UUID;
  v_result     JSONB;
BEGIN
  SELECT id INTO v_product_id
    FROM public.catalog_products
    WHERE slug = p_slug AND active = true;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  WITH
  product_info AS (
    SELECT jsonb_build_object(
      'id',                 p.id,
      'name',               p.name,
      'slug',               p.slug,
      'short_description',  p.short_description,
      'description',        p.description,
      'main_image_url',     p.main_image_url,
      'listing_group_mode', p.listing_group_mode,
      'featured',           p.featured,
      'is_new',             (p.new_until IS NOT NULL AND p.new_until >= CURRENT_DATE),
      'seo_title',          p.seo_title,
      'seo_description',    p.seo_description,
      'brand',              CASE WHEN b.id IS NOT NULL THEN jsonb_build_object('id', b.id, 'name', b.name, 'slug', b.slug, 'logo_url', b.logo_url) END,
      'category',           jsonb_build_object('id', cat.id, 'name', cat.name, 'slug', cat.slug, 'parent_id', cat.parent_id)
    ) AS data
    FROM public.catalog_products p
    LEFT JOIN public.catalog_brands b ON b.id = p.brand_id
    JOIN public.catalog_categories cat ON cat.id = p.category_id
    WHERE p.id = v_product_id
  ),
  breadcrumb AS (
    WITH RECURSIVE up AS (
      SELECT c.id, c.name, c.slug, c.parent_id, 0 AS depth
      FROM public.catalog_categories c
      WHERE c.id = (SELECT category_id FROM public.catalog_products WHERE id = v_product_id)
      UNION ALL
      SELECT c.id, c.name, c.slug, c.parent_id, up.depth + 1
      FROM public.catalog_categories c
      JOIN up ON c.id = up.parent_id
    )
    SELECT jsonb_agg(jsonb_build_object('id', id, 'name', name, 'slug', slug) ORDER BY depth DESC) AS data
    FROM up
  ),
  variants_full AS (
    SELECT
      v.id            AS variant_id,
      v.line_id,
      l.name          AS line_name,
      l.slug          AS line_slug,
      l.finish_type,
      l.sort_order    AS line_sort,
      v.color_id,
      c.exact_name    AS color_name,
      c.slug          AS color_slug,
      c.hex_value     AS color_hex,
      c.internal_code AS color_code,
      v.size_id,
      s.name          AS size_name,
      s.numeric_value AS size_numeric,
      s.unit          AS size_unit,
      s.sort_order    AS size_sort,
      v.finish,
      v.sku,
      v.barcode,
      v.image_url,
      v.inventory_policy
    FROM public.catalog_variants v
    LEFT JOIN public.catalog_product_lines l ON l.id = v.line_id
    LEFT JOIN public.catalog_colors c        ON c.id = v.color_id
    LEFT JOIN public.catalog_sizes s         ON s.id = v.size_id
    WHERE v.product_id = v_product_id
      AND v.active = true
  ),
  presentations_full AS (
    SELECT
      sp.id,
      sp.variant_id,
      sp.name,
      sp.presentation_type,
      sp.base_unit,
      sp.contained_quantity,
      sp.contained_unit,
      sp.contains_presentation_id,
      sp.contains_quantity,
      sp.base_units_total,
      sp.base_price,
      sp.compare_at_price,
      sp.sku,
      sp.barcode,
      sp.minimum_order_quantity,
      sp.quantity_step,
      sp.maximum_order_quantity,
      COALESCE(sp.inventory_policy, vf.inventory_policy) AS inventory_policy,
      sp.sort_order,
      CASE
        WHEN COALESCE(sp.inventory_policy, vf.inventory_policy) = 'shared_base_units' THEN
          floor(COALESCE((
            SELECT sum(i.quantity - i.reserved_quantity)
            FROM public.catalog_inventory i
            WHERE i.variant_id = sp.variant_id AND i.sale_presentation_id IS NULL
          ), 0) / sp.base_units_total)::INTEGER
        ELSE
          COALESCE((
            SELECT sum(i.quantity - i.reserved_quantity)
            FROM public.catalog_inventory i
            WHERE i.variant_id = sp.variant_id AND i.sale_presentation_id = sp.id
          ), 0)::INTEGER
      END AS available_quantity,
      (
        SELECT jsonb_agg(jsonb_build_object(
          'minimum_quantity', t.minimum_quantity,
          'maximum_quantity', t.maximum_quantity,
          'price_per_presentation', t.price_per_presentation,
          'label', t.label
        ) ORDER BY t.minimum_quantity)
        FROM public.catalog_price_tiers t
        WHERE t.sale_presentation_id = sp.id AND t.active = true
      ) AS tiers
    FROM public.catalog_sale_presentations sp
    JOIN variants_full vf ON vf.variant_id = sp.variant_id
    WHERE sp.active = true
  )
  SELECT jsonb_build_object(
    'product',    (SELECT data FROM product_info),
    'breadcrumb', COALESCE((SELECT data FROM breadcrumb), '[]'::jsonb),
    'lines', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', l.id, 'name', l.name, 'slug', l.slug,
        'finish_type', l.finish_type, 'image_url', l.image_url,
        'colors', COALESCE((
          SELECT jsonb_agg(jsonb_build_object(
            'color_id', col.id,
            'exact_name', col.exact_name,
            'slug', col.slug,
            'hex', col.hex_value,
            'commercial_name', lc.commercial_name,
            'image_url', lc.image_url
          ) ORDER BY lc.sort_order, col.exact_name)
          FROM public.catalog_line_colors lc
          JOIN public.catalog_colors col ON col.id = lc.color_id
          WHERE lc.line_id = l.id AND lc.active = true AND col.active = true
        ), '[]'::jsonb)
      ) ORDER BY l.sort_order, l.name)
      FROM public.catalog_product_lines l
      WHERE l.active = true
        AND l.id IN (SELECT DISTINCT line_id FROM variants_full WHERE line_id IS NOT NULL)
    ), '[]'::jsonb),
    'sizes', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', size_id, 'name', size_name,
        'numeric_value', size_numeric, 'unit', size_unit
      ) ORDER BY size_sort)
      FROM (
        SELECT DISTINCT size_id, size_name, size_numeric, size_unit, size_sort
        FROM variants_full WHERE size_id IS NOT NULL
      ) ds
    ), '[]'::jsonb),
    'variants', COALESCE((
      SELECT jsonb_agg(variant_obj ORDER BY line_sort NULLS LAST, color_name NULLS LAST, size_sort NULLS LAST)
      FROM (
        SELECT
          jsonb_build_object(
            'id', vf.variant_id,
            'line_id', vf.line_id,
            'line_name', vf.line_name,
            'line_slug', vf.line_slug,
            'finish_type', vf.finish_type,
            'color_id', vf.color_id,
            'color_name', vf.color_name,
            'color_slug', vf.color_slug,
            'color_hex', vf.color_hex,
            'color_code', vf.color_code,
            'size_id', vf.size_id,
            'size_name', vf.size_name,
            'size_numeric', vf.size_numeric,
            'size_unit', vf.size_unit,
            'finish', vf.finish,
            'sku', vf.sku,
            'barcode', vf.barcode,
            'image_url', vf.image_url,
            'inventory_policy', vf.inventory_policy,
            'presentations', COALESCE((
              SELECT jsonb_agg(jsonb_build_object(
                'id', pf.id,
                'name', pf.name,
                'presentation_type', pf.presentation_type,
                'base_unit', pf.base_unit,
                'contained_quantity', pf.contained_quantity,
                'contained_unit', pf.contained_unit,
                'contains_presentation_id', pf.contains_presentation_id,
                'contains_quantity', pf.contains_quantity,
                'base_units_total', pf.base_units_total,
                'base_price', pf.base_price,
                'compare_at_price', pf.compare_at_price,
                'sku', pf.sku,
                'barcode', pf.barcode,
                'minimum_order_quantity', pf.minimum_order_quantity,
                'quantity_step', pf.quantity_step,
                'maximum_order_quantity', pf.maximum_order_quantity,
                'inventory_policy', pf.inventory_policy,
                'available_quantity', pf.available_quantity,
                'in_stock', pf.available_quantity >= pf.minimum_order_quantity,
                'tiers', COALESCE(pf.tiers, '[]'::jsonb)
              ) ORDER BY pf.sort_order, pf.base_units_total)
              FROM presentations_full pf
              WHERE pf.variant_id = vf.variant_id
            ), '[]'::jsonb)
          ) AS variant_obj,
          vf.line_sort, vf.color_name, vf.size_sort
        FROM variants_full vf
      ) v
    ), '[]'::jsonb),
    'images', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', img.id, 'image_url', img.image_url, 'image_type', img.image_type,
        'alt_text', img.alt_text, 'variant_id', img.variant_id,
        'line_id', img.line_id, 'color_id', img.color_id, 'sort_order', img.sort_order
      ) ORDER BY img.sort_order, img.created_at)
      FROM public.catalog_product_images img
      WHERE img.product_id = v_product_id AND img.active = true
    ), '[]'::jsonb),
    'attributes', COALESCE((
      SELECT jsonb_agg(DISTINCT jsonb_build_object(
        'name', a.name, 'value', av.value, 'unit', av.unit
      ))
      FROM public.catalog_variant_attribute_values vav
      JOIN public.catalog_attribute_values av ON av.id = vav.attribute_value_id
      JOIN public.catalog_attributes a       ON a.id = av.attribute_id
      WHERE vav.variant_id IN (SELECT variant_id FROM variants_full)
        AND a.active = true AND av.active = true
    ), '[]'::jsonb),
    'related', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'relation_type', r.relation_type,
        'product_id',    rp.id,
        'name',          rp.name,
        'slug',          rp.slug,
        'image_url',     rp.main_image_url,
        'min_price',     (
          SELECT min(sp.base_price)
          FROM public.catalog_variants rv
          JOIN public.catalog_sale_presentations sp ON sp.variant_id = rv.id
          WHERE rv.product_id = rp.id AND rv.active = true AND sp.active = true
        )
      ) ORDER BY r.sort_order)
      FROM public.catalog_product_relations r
      JOIN public.catalog_products rp ON rp.id = r.related_product_id
      WHERE r.product_id = v_product_id AND rp.active = true
    ), '[]'::jsonb)
  ) INTO v_result;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.catalog_get_product_detail(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.catalog_get_product_detail(TEXT) TO anon, authenticated;

-- ───────────────────────────────────────────────────────────────────────────
-- 4. FACETAS DINÁMICAS POR CATEGORÍA (con conteo de grupos por valor)
-- ───────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.catalog_get_facets(
  p_category_slug   TEXT DEFAULT NULL,
  p_collection_slug TEXT DEFAULT NULL,
  p_search          TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_result JSONB;
  v_search TEXT := NULLIF(btrim(COALESCE(p_search, '')), '');
BEGIN
  WITH RECURSIVE category_scope AS (
    SELECT c.id
    FROM public.catalog_categories c
    WHERE p_category_slug IS NOT NULL
      AND c.slug = p_category_slug
      AND c.active = true
    UNION ALL
    SELECT c.id
    FROM public.catalog_categories c
    JOIN category_scope s ON c.parent_id = s.id
    WHERE p_category_slug IS NOT NULL
      AND c.active = true
  ),
  base AS (
    SELECT
      p.id AS product_id,
      p.listing_group_mode,
      v.id AS variant_id,
      v.line_id,
      v.color_id,
      v.size_id,
      v.finish,
      b.name AS brand_name,          b.slug AS brand_slug,
      l.name AS line_name,           l.slug AS line_slug,
      c.exact_name AS color_name,    c.slug AS color_slug,  c.hex_value AS color_hex,
      cf.name AS color_family_name,  cf.slug AS color_family_slug,
      s.name AS size_name,
      sp.id AS sale_presentation_id,
      sp.base_price,
      sp.base_units_total,
      CASE
        WHEN v.inventory_policy = 'shared_base_units' THEN
          COALESCE((
            SELECT sum(i.quantity - i.reserved_quantity)
            FROM public.catalog_inventory i
            WHERE i.variant_id = v.id AND i.sale_presentation_id IS NULL
          ), 0) >= sp.base_units_total
        ELSE
          COALESCE((
            SELECT sum(i.quantity - i.reserved_quantity)
            FROM public.catalog_inventory i
            WHERE i.variant_id = v.id AND i.sale_presentation_id = sp.id
          ), 0) >= 1
      END AS sp_in_stock
    FROM public.catalog_products p
    JOIN public.catalog_variants v
      ON v.product_id = p.id AND v.active = true
    JOIN public.catalog_sale_presentations sp
      ON sp.variant_id = v.id AND sp.active = true
    LEFT JOIN public.catalog_brands b          ON b.id = p.brand_id
    LEFT JOIN public.catalog_product_lines l   ON l.id = v.line_id
    LEFT JOIN public.catalog_colors c          ON c.id = v.color_id
    LEFT JOIN public.catalog_color_families cf ON cf.id = c.color_family_id
    LEFT JOIN public.catalog_sizes s           ON s.id = v.size_id
    WHERE p.active = true
      AND (p_category_slug IS NULL OR p.category_id IN (SELECT id FROM category_scope))
      AND (p_collection_slug IS NULL OR p.id IN (
        SELECT cp.product_id
        FROM public.catalog_collection_products cp
        JOIN public.catalog_collections col ON col.id = cp.collection_id
        WHERE col.slug = p_collection_slug
          AND col.active = true
          AND (col.start_date IS NULL OR col.start_date <= NOW())
          AND (col.end_date IS NULL OR col.end_date >= NOW())
      ))
      AND (
        v_search IS NULL
        OR (SELECT bool_and(
              public.catalog_normalize_text(
                p.name || ' ' || coalesce(b.name,'') || ' ' || coalesce(l.name,'') || ' ' ||
                coalesce(c.exact_name,'') || ' ' || coalesce(cf.name,'') || ' ' ||
                coalesce(s.name,'') || ' ' || coalesce(sp.name,'')
              ) LIKE '%' || token || '%')
            FROM unnest(string_to_array(public.catalog_normalize_text(v_search), ' ')) AS token)
      )
  ),
  keyed AS (
    SELECT
      CASE
        WHEN listing_group_mode = 'line' AND line_id IS NOT NULL
          THEN product_id::text || ':' || line_id::text
        ELSE product_id::text
      END AS group_key,
      *
    FROM base
  ),
  group_prices AS (
    SELECT group_key,
           min(base_price)      AS min_price,
           bool_or(sp_in_stock) AS in_stock
    FROM keyed
    GROUP BY group_key
  )
  SELECT jsonb_build_object(
    'brands', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('slug', brand_slug, 'name', brand_name, 'count', n) ORDER BY n DESC, brand_name)
      FROM (SELECT brand_slug, brand_name, count(DISTINCT group_key) AS n FROM keyed WHERE brand_slug IS NOT NULL GROUP BY 1, 2) x
    ), '[]'::jsonb),
    'lines', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('slug', line_slug, 'name', line_name, 'count', n) ORDER BY n DESC, line_name)
      FROM (SELECT line_slug, line_name, count(DISTINCT group_key) AS n FROM keyed WHERE line_slug IS NOT NULL GROUP BY 1, 2) x
    ), '[]'::jsonb),
    'color_families', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('slug', color_family_slug, 'name', color_family_name, 'count', n) ORDER BY n DESC, color_family_name)
      FROM (SELECT color_family_slug, color_family_name, count(DISTINCT group_key) AS n FROM keyed WHERE color_family_slug IS NOT NULL GROUP BY 1, 2) x
    ), '[]'::jsonb),
    'colors', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('slug', color_slug, 'name', color_name, 'hex', color_hex, 'count', n) ORDER BY n DESC, color_name)
      FROM (SELECT color_slug, color_name, color_hex, count(DISTINCT group_key) AS n FROM keyed WHERE color_slug IS NOT NULL GROUP BY 1, 2, 3) x
    ), '[]'::jsonb),
    'sizes', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('id', size_id, 'name', size_name, 'count', n) ORDER BY n DESC, size_name)
      FROM (SELECT size_id, size_name, count(DISTINCT group_key) AS n FROM keyed WHERE size_id IS NOT NULL GROUP BY 1, 2) x
    ), '[]'::jsonb),
    'finishes', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('value', finish, 'count', n) ORDER BY n DESC, finish)
      FROM (SELECT finish, count(DISTINCT group_key) AS n FROM keyed WHERE finish IS NOT NULL GROUP BY 1) x
    ), '[]'::jsonb),
    'price', (
      SELECT jsonb_build_object('min', min(min_price), 'max', max(min_price))
      FROM group_prices
    ),
    'availability', (
      SELECT jsonb_build_object(
        'in_stock',     count(*) FILTER (WHERE in_stock),
        'out_of_stock', count(*) FILTER (WHERE NOT in_stock)
      )
      FROM group_prices
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.catalog_get_facets(TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.catalog_get_facets(TEXT, TEXT, TEXT) TO anon, authenticated;

-- ───────────────────────────────────────────────────────────────────────────
-- 5. BÚSQUEDA (normalizada, con alias y SKU; delega en catalog_list_cards)
-- ───────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.catalog_search(p_query TEXT, p_limit INTEGER DEFAULT 20)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT public.catalog_list_cards(
    p_search := p_query,
    p_limit  := p_limit,
    p_offset := 0
  );
$$;

REVOKE ALL ON FUNCTION public.catalog_search(TEXT, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.catalog_search(TEXT, INTEGER) TO anon, authenticated;

-- ───────────────────────────────────────────────────────────────────────────
-- 6. VALIDACIÓN CANÓNICA DEL CARRITO
--    Entrada: [{ variant_id, sale_presentation_id, quantity }]
--    Salida: líneas canónicas con precio recalculado en servidor + issues.
--    Nunca confía en precios enviados por el cliente.
-- ───────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.catalog_validate_cart(p_items JSONB)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  item         JSONB;
  v_index      INTEGER := 0;
  v_variant_id UUID;
  v_pres_id    UUID;
  v_qty        INTEGER;
  v_variant    RECORD;
  v_pres       RECORD;
  v_unit_price NUMERIC;
  v_tier_label TEXT;
  v_available  NUMERIC;
  v_in_stock   BOOLEAN;
  v_lines      JSONB := '[]'::JSONB;
  v_issues     JSONB := '[]'::JSONB;
  v_total      NUMERIC := 0;
BEGIN
  IF p_items IS NULL
     OR jsonb_typeof(p_items) <> 'array'
     OR jsonb_array_length(p_items) NOT BETWEEN 1 AND 50 THEN
    RAISE EXCEPTION 'Invalid cart items' USING ERRCODE = '22023';
  END IF;

  FOR item IN SELECT value FROM jsonb_array_elements(p_items)
  LOOP
    v_index := v_index + 1;

    IF jsonb_typeof(item) <> 'object'
       OR COALESCE(item->>'variant_id', '') !~ '^[0-9a-fA-F-]{36}$'
       OR COALESCE(item->>'sale_presentation_id', '') !~ '^[0-9a-fA-F-]{36}$'
       OR COALESCE(item->>'quantity', '') !~ '^[1-9][0-9]{0,4}$' THEN
      v_issues := v_issues || jsonb_build_array(jsonb_build_object(
        'line', v_index, 'code', 'invalid_line',
        'message', 'Línea de carrito inválida'));
      CONTINUE;
    END IF;

    v_variant_id := (item->>'variant_id')::UUID;
    v_pres_id    := (item->>'sale_presentation_id')::UUID;
    v_qty        := (item->>'quantity')::INTEGER;

    SELECT
      v.id, v.inventory_policy AS variant_policy, v.image_url AS variant_image, v.sku AS variant_sku,
      p.id AS product_id, p.name AS product_name, p.main_image_url AS product_image,
      b.name AS brand_name,
      l.name AS line_name,
      c.exact_name AS color_name,
      s.name AS size_name
    INTO v_variant
    FROM public.catalog_variants v
    JOIN public.catalog_products p ON p.id = v.product_id
    LEFT JOIN public.catalog_brands b        ON b.id = p.brand_id
    LEFT JOIN public.catalog_product_lines l ON l.id = v.line_id
    LEFT JOIN public.catalog_colors c        ON c.id = v.color_id
    LEFT JOIN public.catalog_sizes s         ON s.id = v.size_id
    WHERE v.id = v_variant_id AND v.active = true AND p.active = true;

    IF NOT FOUND THEN
      v_issues := v_issues || jsonb_build_array(jsonb_build_object(
        'line', v_index, 'code', 'unavailable',
        'message', 'La variante ya no está disponible'));
      CONTINUE;
    END IF;

    SELECT sp.* INTO v_pres
    FROM public.catalog_sale_presentations sp
    WHERE sp.id = v_pres_id
      AND sp.variant_id = v_variant_id
      AND sp.active = true;

    IF NOT FOUND THEN
      v_issues := v_issues || jsonb_build_array(jsonb_build_object(
        'line', v_index, 'code', 'unavailable',
        'message', 'La presentación ya no está disponible'));
      CONTINUE;
    END IF;

    IF v_qty < v_pres.minimum_order_quantity THEN
      v_issues := v_issues || jsonb_build_array(jsonb_build_object(
        'line', v_index, 'code', 'min_quantity',
        'message', format('La cantidad mínima es %s', v_pres.minimum_order_quantity)));
      CONTINUE;
    END IF;

    IF v_pres.maximum_order_quantity IS NOT NULL AND v_qty > v_pres.maximum_order_quantity THEN
      v_issues := v_issues || jsonb_build_array(jsonb_build_object(
        'line', v_index, 'code', 'max_quantity',
        'message', format('La cantidad máxima es %s', v_pres.maximum_order_quantity)));
      CONTINUE;
    END IF;

    IF v_pres.quantity_step > 1
       AND (v_qty - v_pres.minimum_order_quantity) % v_pres.quantity_step <> 0 THEN
      v_issues := v_issues || jsonb_build_array(jsonb_build_object(
        'line', v_index, 'code', 'quantity_step',
        'message', format('La cantidad debe avanzar de %s en %s desde el mínimo', v_pres.quantity_step, v_pres.quantity_step)));
      CONTINUE;
    END IF;

    -- Precio canónico (mismo algoritmo que catalog_resolve_price)
    SELECT t.price_per_presentation, t.label
      INTO v_unit_price, v_tier_label
    FROM public.catalog_price_tiers t
    WHERE t.sale_presentation_id = v_pres.id
      AND t.active = true
      AND t.minimum_quantity <= v_qty
    ORDER BY t.minimum_quantity DESC
    LIMIT 1;
    v_unit_price := COALESCE(v_unit_price, v_pres.base_price);

    -- Disponibilidad según política efectiva
    IF COALESCE(v_pres.inventory_policy, v_variant.variant_policy) = 'shared_base_units' THEN
      SELECT COALESCE(sum(i.quantity - i.reserved_quantity), 0)
        INTO v_available
      FROM public.catalog_inventory i
      WHERE i.variant_id = v_variant_id AND i.sale_presentation_id IS NULL;
      v_in_stock := v_available >= (v_qty * v_pres.base_units_total);
    ELSE
      SELECT COALESCE(sum(i.quantity - i.reserved_quantity), 0)
        INTO v_available
      FROM public.catalog_inventory i
      WHERE i.variant_id = v_variant_id AND i.sale_presentation_id = v_pres.id;
      v_in_stock := v_available >= v_qty;
    END IF;

    IF NOT v_in_stock THEN
      v_issues := v_issues || jsonb_build_array(jsonb_build_object(
        'line', v_index, 'code', 'out_of_stock',
        'message', format('Existencia insuficiente para "%s %s"', v_variant.product_name, v_pres.name)));
      CONTINUE;
    END IF;

    v_total := v_total + round(v_unit_price * v_qty, 2);
    v_lines := v_lines || jsonb_build_array(jsonb_build_object(
      'schema', 2,
      'variant_id', v_variant_id,
      'sale_presentation_id', v_pres.id,
      'product_id', v_variant.product_id,
      'nombre', v_variant.product_name,
      'marca', v_variant.brand_name,
      'gama', v_variant.line_name,
      'color', v_variant.color_name,
      'medida', v_variant.size_name,
      'presentacion', v_pres.name,
      'presentation_type', v_pres.presentation_type,
      'contenido_presentacion', v_pres.base_units_total,
      'unidad_base', v_pres.base_unit,
      'cantidad', v_qty,
      'precio', v_unit_price,
      'precio_base', v_pres.base_price,
      'nivel_precio', v_tier_label,
      'contenido_total', v_pres.base_units_total * v_qty,
      'sku', COALESCE(v_pres.sku, v_variant.variant_sku),
      'imagen_url', COALESCE(v_variant.variant_image, v_variant.product_image),
      'subtotal', round(v_unit_price * v_qty, 2)
    ));
  END LOOP;

  RETURN jsonb_build_object(
    'valid', jsonb_array_length(v_issues) = 0,
    'issues', v_issues,
    'lines', v_lines,
    'total', round(v_total, 2)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.catalog_validate_cart(JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.catalog_validate_cart(JSONB) TO anon, authenticated;

-- ───────────────────────────────────────────────────────────────────────────
-- 7. CREACIÓN TRANSACCIONAL DEL PEDIDO V2
--    - Valida cliente/entrega igual que crear_pedido_publico.
--    - Recalcula precios y subtotales en el servidor.
--    - RESERVA inventario con bloqueo de fila (sin sobreventa concurrente).
--    - Guarda snapshot V2 completo en detalles_json.
--    - Soporta idempotency_key (replay devuelve el pedido original).
-- ───────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.catalog_create_order(
  p_cliente_nombre   TEXT,
  p_cliente_telefono TEXT,
  p_tipo_entrega     TEXT,
  p_direccion        TEXT,
  p_items            JSONB,
  p_idempotency_key  UUID DEFAULT NULL,
  p_location_slug    TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  normalized_name     TEXT := btrim(COALESCE(p_cliente_nombre, ''));
  normalized_phone    TEXT := btrim(COALESCE(p_cliente_telefono, ''));
  normalized_delivery TEXT := lower(btrim(COALESCE(p_tipo_entrega, '')));
  normalized_address  TEXT := NULLIF(btrim(COALESCE(p_direccion, '')), '');
  orders_switch       JSONB;
  v_location_id       UUID;
  item                JSONB;
  v_index             INTEGER := 0;
  v_variant_id        UUID;
  v_pres_id           UUID;
  v_qty               INTEGER;
  v_variant           RECORD;
  v_pres              RECORD;
  v_unit_price        NUMERIC;
  v_tier_label        TEXT;
  v_needed            NUMERIC;
  v_available         NUMERIC;
  v_inv_id            UUID;
  v_lines             JSONB := '[]'::JSONB;
  v_total             NUMERIC := 0;
  created_folio       TEXT;
  canonical_total     NUMERIC;
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

  -- Replay idempotente.
  IF p_idempotency_key IS NOT NULL THEN
    SELECT folio, total INTO created_folio, canonical_total
    FROM public.pedidos
    WHERE idempotency_key = p_idempotency_key
    LIMIT 1;

    IF FOUND THEN
      RETURN jsonb_build_object('folio', created_folio, 'total', canonical_total, 'replay', TRUE);
    END IF;
  END IF;

  -- Validaciones de cliente/entrega (idénticas a crear_pedido_publico).
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
  IF p_items IS NULL
     OR jsonb_typeof(p_items) <> 'array'
     OR jsonb_array_length(p_items) NOT BETWEEN 1 AND 50
     OR octet_length(p_items::TEXT) > 100000 THEN
    RAISE EXCEPTION 'Invalid order items' USING ERRCODE = '22023';
  END IF;

  -- Ubicación de surtido: la indicada o la primera activa (por orden de alta).
  SELECT id INTO v_location_id
  FROM public.catalog_locations
  WHERE active = true
    AND (p_location_slug IS NULL OR slug = p_location_slug)
  ORDER BY created_at ASC
  LIMIT 1;

  IF v_location_id IS NULL THEN
    RAISE EXCEPTION 'No active inventory location configured' USING ERRCODE = '22023';
  END IF;

  FOR item IN SELECT value FROM jsonb_array_elements(p_items)
  LOOP
    v_index := v_index + 1;

    IF jsonb_typeof(item) <> 'object'
       OR COALESCE(item->>'variant_id', '') !~ '^[0-9a-fA-F-]{36}$'
       OR COALESCE(item->>'sale_presentation_id', '') !~ '^[0-9a-fA-F-]{36}$'
       OR COALESCE(item->>'quantity', '') !~ '^[1-9][0-9]{0,4}$' THEN
      RAISE EXCEPTION 'Invalid item in order' USING ERRCODE = '22023';
    END IF;

    v_variant_id := (item->>'variant_id')::UUID;
    v_pres_id    := (item->>'sale_presentation_id')::UUID;
    v_qty        := (item->>'quantity')::INTEGER;

    SELECT
      v.id, v.inventory_policy AS variant_policy, v.image_url AS variant_image, v.sku AS variant_sku,
      p.id AS product_id, p.name AS product_name, p.main_image_url AS product_image,
      b.name AS brand_name,
      l.name AS line_name,
      c.exact_name AS color_name,
      s.name AS size_name
    INTO v_variant
    FROM public.catalog_variants v
    JOIN public.catalog_products p ON p.id = v.product_id
    LEFT JOIN public.catalog_brands b        ON b.id = p.brand_id
    LEFT JOIN public.catalog_product_lines l ON l.id = v.line_id
    LEFT JOIN public.catalog_colors c        ON c.id = v.color_id
    LEFT JOIN public.catalog_sizes s         ON s.id = v.size_id
    WHERE v.id = v_variant_id AND v.active = true AND p.active = true;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'UNAVAILABLE: la variante de la línea % ya no está disponible', v_index
        USING ERRCODE = '22023';
    END IF;

    SELECT sp.* INTO v_pres
    FROM public.catalog_sale_presentations sp
    WHERE sp.id = v_pres_id
      AND sp.variant_id = v_variant_id
      AND sp.active = true;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'UNAVAILABLE: la presentación de la línea % ya no está disponible', v_index
        USING ERRCODE = '22023';
    END IF;

    IF v_qty < v_pres.minimum_order_quantity
       OR (v_pres.maximum_order_quantity IS NOT NULL AND v_qty > v_pres.maximum_order_quantity)
       OR (v_pres.quantity_step > 1 AND (v_qty - v_pres.minimum_order_quantity) % v_pres.quantity_step <> 0) THEN
      RAISE EXCEPTION 'INVALID_QUANTITY: cantidad inválida en la línea %', v_index
        USING ERRCODE = '22023';
    END IF;

    -- Precio canónico del servidor.
    SELECT t.price_per_presentation, t.label
      INTO v_unit_price, v_tier_label
    FROM public.catalog_price_tiers t
    WHERE t.sale_presentation_id = v_pres.id
      AND t.active = true
      AND t.minimum_quantity <= v_qty
    ORDER BY t.minimum_quantity DESC
    LIMIT 1;
    v_unit_price := COALESCE(v_unit_price, v_pres.base_price);

    -- Reserva de inventario con bloqueo de fila (evita sobreventa concurrente).
    IF COALESCE(v_pres.inventory_policy, v_variant.variant_policy) = 'shared_base_units' THEN
      v_needed := v_qty * v_pres.base_units_total;

      SELECT i.id, (i.quantity - i.reserved_quantity)
        INTO v_inv_id, v_available
      FROM public.catalog_inventory i
      WHERE i.variant_id = v_variant_id
        AND i.sale_presentation_id IS NULL
        AND i.location_id = v_location_id
      FOR UPDATE;

      IF NOT FOUND OR v_available < v_needed THEN
        RAISE EXCEPTION 'OUT_OF_STOCK: existencia insuficiente para "% %"', v_variant.product_name, v_pres.name
          USING ERRCODE = '22023';
      END IF;

      UPDATE public.catalog_inventory
      SET reserved_quantity = reserved_quantity + v_needed
      WHERE id = v_inv_id;
    ELSE
      SELECT i.id, (i.quantity - i.reserved_quantity)
        INTO v_inv_id, v_available
      FROM public.catalog_inventory i
      WHERE i.variant_id = v_variant_id
        AND i.sale_presentation_id = v_pres.id
        AND i.location_id = v_location_id
      FOR UPDATE;

      IF NOT FOUND OR v_available < v_qty THEN
        RAISE EXCEPTION 'OUT_OF_STOCK: existencia insuficiente para "% %"', v_variant.product_name, v_pres.name
          USING ERRCODE = '22023';
      END IF;

      UPDATE public.catalog_inventory
      SET reserved_quantity = reserved_quantity + v_qty
      WHERE id = v_inv_id;
    END IF;

    v_total := v_total + round(v_unit_price * v_qty, 2);
    v_lines := v_lines || jsonb_build_array(jsonb_build_object(
      'schema', 2,
      'variant_id', v_variant_id,
      'sale_presentation_id', v_pres.id,
      'product_id', v_variant.product_id,
      'nombre', v_variant.product_name,
      'marca', v_variant.brand_name,
      'gama', v_variant.line_name,
      'color', v_variant.color_name,
      'medida', v_variant.size_name,
      'tamano', v_variant.size_name,
      'presentacion', v_pres.name,
      'presentation_type', v_pres.presentation_type,
      'contenido_presentacion', v_pres.base_units_total,
      'unidad_base', v_pres.base_unit,
      'cantidad', v_qty,
      'precio', v_unit_price,
      'precio_base', v_pres.base_price,
      'nivel_precio', v_tier_label,
      'contenido_total', v_pres.base_units_total * v_qty,
      'sku', COALESCE(v_pres.sku, v_variant.variant_sku),
      'imagen_url', COALESCE(v_variant.variant_image, v_variant.product_image),
      'subtotal', round(v_unit_price * v_qty, 2)
    ));
  END LOOP;

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
    round(v_total, 2),
    'Por Surtir',
    v_lines,
    p_idempotency_key
  )
  RETURNING folio, total INTO created_folio, canonical_total;

  RETURN jsonb_build_object('folio', created_folio, 'total', canonical_total);

EXCEPTION
  WHEN unique_violation THEN
    IF p_idempotency_key IS NOT NULL THEN
      SELECT folio, total INTO created_folio, canonical_total
      FROM public.pedidos
      WHERE idempotency_key = p_idempotency_key
      LIMIT 1;

      IF FOUND THEN
        RETURN jsonb_build_object('folio', created_folio, 'total', canonical_total, 'replay', TRUE);
      END IF;
    END IF;
    RAISE;
END;
$$;

REVOKE ALL ON FUNCTION public.catalog_create_order(TEXT, TEXT, TEXT, TEXT, JSONB, UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.catalog_create_order(TEXT, TEXT, TEXT, TEXT, JSONB, UUID, TEXT) TO anon, authenticated;

-- ───────────────────────────────────────────────────────────────────────────
-- 8. COMPATIBILIDAD TEMPORAL: el canonicalizador V1 ignora pedidos V2
--    Los pedidos V2 ya vienen canonizados por catalog_create_order
--    (variant_id presente en cada línea). El flujo V1 sigue intacto hasta
--    la Fase 6/7, cuando este trigger se elimine junto al catálogo viejo.
-- ───────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.canonicalize_public_pedido()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  item JSONB;
  product_row public.productos%ROWTYPE;
  product_id UUID;
  quantity INTEGER;
  tiers JSONB;
  unit_price NUMERIC;
  canonical_items JSONB := '[]'::JSONB;
  canonical_total NUMERIC := 0;
  seen_ids UUID[] := ARRAY[]::UUID[];
BEGIN
  IF auth.uid() IS NOT NULL
     AND public.has_role(ARRAY['admin', 'manager', 'empleado']) THEN
    RETURN NEW;
  END IF;

  -- Pedidos del catálogo V2: ya canonizados por catalog_create_order.
  IF jsonb_typeof(NEW.detalles_json) = 'array'
     AND jsonb_array_length(NEW.detalles_json) > 0
     AND (NEW.detalles_json->0) ? 'variant_id' THEN
    RETURN NEW;
  END IF;

  IF jsonb_typeof(NEW.detalles_json) <> 'array'
     OR jsonb_array_length(NEW.detalles_json) NOT BETWEEN 1 AND 50 THEN
    RAISE EXCEPTION 'Order must contain between 1 and 50 products'
      USING ERRCODE = '22023';
  END IF;

  FOR item IN SELECT value FROM jsonb_array_elements(NEW.detalles_json)
  LOOP
    IF jsonb_typeof(item) <> 'object'
       OR COALESCE(item->>'id', '') = ''
       OR COALESCE(item->>'cantidad', '') !~ '^[1-9][0-9]{0,3}$' THEN
      RAISE EXCEPTION 'Invalid product or quantity in order'
        USING ERRCODE = '22023';
    END IF;

    BEGIN
      product_id := (item->>'id')::UUID;
      quantity := (item->>'cantidad')::INTEGER;
    EXCEPTION
      WHEN invalid_text_representation OR numeric_value_out_of_range THEN
        RAISE EXCEPTION 'Invalid product or quantity in order'
          USING ERRCODE = '22023';
    END;

    IF product_id = ANY(seen_ids) THEN
      RAISE EXCEPTION 'Duplicate product in order'
        USING ERRCODE = '22023';
    END IF;
    seen_ids := array_append(seen_ids, product_id);

    SELECT *
      INTO product_row
      FROM public.productos
      WHERE id = product_id
        AND activo = true;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product is unavailable'
        USING ERRCODE = '22023';
    END IF;

    IF product_row.stock_ilimitado = false
       AND quantity > GREATEST(product_row.stock_actual, 0) THEN
      RAISE EXCEPTION 'Requested quantity exceeds available stock'
        USING ERRCODE = '22023';
    END IF;

    tiers := to_jsonb(product_row)->'precios_mayoreo';
    IF jsonb_typeof(tiers) = 'string' THEN
      BEGIN
        tiers := (tiers #>> '{}')::JSONB;
      EXCEPTION
        WHEN invalid_text_representation THEN
          tiers := '[]'::JSONB;
      END;
    END IF;

    unit_price := NULL;
    IF jsonb_typeof(tiers) = 'array' THEN
      SELECT (level->>'precio')::NUMERIC
        INTO unit_price
        FROM jsonb_array_elements(tiers) AS level
        WHERE jsonb_typeof(level) = 'object'
          AND COALESCE(level->>'cantidad_minima', '') ~ '^[1-9][0-9]*$'
          AND COALESCE(level->>'precio', '') ~ '^[0-9]+([.][0-9]+)?$'
          AND quantity >= (level->>'cantidad_minima')::INTEGER
          AND (level->>'precio')::NUMERIC >= 0
        ORDER BY (level->>'cantidad_minima')::INTEGER DESC
        LIMIT 1;
    END IF;

    unit_price := COALESCE(unit_price, product_row.precio);
    canonical_total := canonical_total + (unit_price * quantity);
    canonical_items := canonical_items || jsonb_build_array(
      jsonb_build_object(
        'id', product_row.id,
        'nombre', product_row.nombre,
        'precio', unit_price,
        'precio_base', product_row.precio,
        'cantidad', quantity,
        'imagen_url', product_row.imagen_url,
        'tamano', product_row.tamano,
        'precios_mayoreo', tiers,
        'familia_mayoreo', to_jsonb(product_row)->'familia_mayoreo'
      )
    );
  END LOOP;

  NEW.detalles_json := canonical_items;
  NEW.total := round(canonical_total, 2);
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.canonicalize_public_pedido() FROM PUBLIC;

COMMIT;

NOTIFY pgrst, 'reload schema';

-- Verificación (ejecutar aparte):
-- SELECT proname FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
-- WHERE n.nspname = 'public' AND proname LIKE 'catalog\_%' ORDER BY proname;
