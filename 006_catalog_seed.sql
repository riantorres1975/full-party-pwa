-- ═══════════════════════════════════════════════════════════════════════════
-- 006 — CATÁLOGO V2: SEEDS INICIALES
-- ═══════════════════════════════════════════════════════════════════════════
-- Ejecutar DESPUÉS de 005_catalog_functions.sql. Idempotente (ON CONFLICT /
-- guardas de existencia).
--
-- Contenido:
--   1. Sucursales (Sol Naciente, Francisco Villa, Bodega).
--   2. Categorías jerárquicas (7 raíces + subcategorías de globos).
--   3. Colecciones (eventos, colores, editoriales) con soporte temporal.
--   4. Marcas y gamas Glomex.
--   5. Familias de color y colores exactos con hex.
--   6. Colores por gama (catalog_line_colors).
--   7. Medidas (pulgadas, cm, ml, comercial).
--   8. Atributos genéricos.
--   9. Alias de búsqueda (sinónimos).
--  10. Productos demo que implementan los CASOS DE PRUEBA OBLIGATORIOS
--      (§33 del plan maestro): globo con mayoreo, globo por caja, caja de
--      piezas (oasis), caja de latas (espuma), producto simple (bomba).
--      Son datos de DESARROLLO: el sistema aún no está en producción.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ───────────────────────────────────────────────────────────────────────────
-- 1. SUCURSALES
-- ───────────────────────────────────────────────────────────────────────────
INSERT INTO public.catalog_locations (name, slug) VALUES
  ('Sol Naciente',   'sol-naciente'),
  ('Francisco Villa','francisco-villa'),
  ('Bodega',         'bodega')
ON CONFLICT (slug) DO NOTHING;

-- ───────────────────────────────────────────────────────────────────────────
-- 2. CATEGORÍAS JERÁRQUICAS
-- ───────────────────────────────────────────────────────────────────────────
INSERT INTO public.catalog_categories (name, slug, parent_id, sort_order) VALUES
  ('Globos',                    'globos',                    NULL, 1),
  ('Inflado y helio',           'inflado-y-helio',           NULL, 2),
  ('Bases y montaje',           'bases-y-montaje',           NULL, 3),
  ('Decoración',                'decoracion',                NULL, 4),
  ('Efectos de fiesta',         'efectos-de-fiesta',         NULL, 5),
  ('Dulcería y desechables',    'dulceria-y-desechables',    NULL, 6),
  ('Temporadas y eventos',      'temporadas-y-eventos',      NULL, 7)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.catalog_categories (name, slug, parent_id, sort_order)
SELECT sub.name, sub.slug, padre.id, sub.sort_order
FROM (VALUES
  ('Globos de látex',    'globos-latex',        1),
  ('Globos foil',        'globos-foil',         2),
  ('Globos burbuja',     'globos-burbuja',      3),
  ('Globos Orbz',        'globos-orbz',         4),
  ('Globos para modelar','globos-para-modelar', 5),
  ('Números',            'globos-numero',       6),
  ('Letras',             'letras-foil',         7),
  ('Figuras',            'globos-figuras',      8)
) AS sub(name, slug, sort_order)
JOIN public.catalog_categories padre ON padre.slug = 'globos'
ON CONFLICT (slug) DO NOTHING;

-- ───────────────────────────────────────────────────────────────────────────
-- 3. COLECCIONES
-- ───────────────────────────────────────────────────────────────────────────
INSERT INTO public.catalog_collections (name, slug, collection_type, sort_order, start_date, end_date) VALUES
  ('Graduación',             'graduacion',             'evento',    1, NULL, NULL),
  ('Primera Comunión',       'primera-comunion',       'evento',    2, NULL, NULL),
  ('Cumpleaños',             'cumpleanos',             'evento',    3, NULL, NULL),
  ('Revelación de género',   'revelacion-de-genero',   'evento',    4, NULL, NULL),
  ('Boda',                   'boda',                   'evento',    5, NULL, NULL),
  ('Navidad',                'navidad',                'evento',    6, '2026-11-01 00:00:00+00', '2026-12-26 23:59:59+00'),
  ('Halloween',              'halloween',              'evento',    7, '2026-10-01 00:00:00+00', '2026-11-01 23:59:59+00'),
  ('Día del Padre',          'dia-del-padre',          'evento',    8, NULL, NULL),
  ('Mundial',                'mundial',                'evento',    9, NULL, NULL),
  ('Todo dorado',            'todo-dorado',            'color',     10, NULL, NULL),
  ('Todo color vino',        'todo-color-vino',        'color',     11, NULL, NULL),
  ('Nuevos',                 'nuevos',                 'editorial', 12, NULL, NULL),
  ('Más vendidos',           'mas-vendidos',           'editorial', 13, NULL, NULL),
  ('Exclusivos Full Party',  'exclusivos-full-party',  'editorial', 14, NULL, NULL)
ON CONFLICT (slug) DO NOTHING;

-- ───────────────────────────────────────────────────────────────────────────
-- 4. MARCAS
-- ───────────────────────────────────────────────────────────────────────────
INSERT INTO public.catalog_brands (name, slug, sort_order) VALUES
  ('Glomex',    'glomex',    1),
  ('Decoratex', 'decoratex', 2),
  ('Sempertex', 'sempertex', 3),
  ('Anagram',   'anagram',   4),
  ('Oasis',     'oasis',     5),
  ('Peyma',     'peyma',     6),
  ('Genérico',  'generico',  7),
  ('Económico', 'economico', 8)
ON CONFLICT (slug) DO NOTHING;

-- ───────────────────────────────────────────────────────────────────────────
-- 5. GAMAS / LÍNEAS GLOMEX
-- ───────────────────────────────────────────────────────────────────────────
INSERT INTO public.catalog_product_lines (brand_id, name, slug, finish_type, sort_order)
SELECT b.id, l.name, l.slug, l.finish_type, l.sort_order
FROM (VALUES
  ('Estándar',     'glomex-estandar',     'mate',         1),
  ('Pastel',       'glomex-pastel',       'mate',         2),
  ('Macarrón',     'glomex-macarron',     'mate',         3),
  ('Retro',        'glomex-retro',        'mate',         4),
  ('Chrome',       'glomex-chrome',       'metalico',     5),
  ('Hazy',         'glomex-hazy',         'satinado',     6),
  ('Trendy',       'glomex-trendy',       'mate',         7),
  ('Neón',         'glomex-neon',         'neon',         8),
  ('Perlado',      'glomex-perlado',      'perlado',      9),
  ('Transparente', 'glomex-transparente', 'transparente', 10),
  ('Metálico',     'glomex-metalico',     'metalico',     11)
) AS l(name, slug, finish_type, sort_order)
JOIN public.catalog_brands b ON b.slug = 'glomex'
ON CONFLICT (slug) DO NOTHING;

-- ───────────────────────────────────────────────────────────────────────────
-- 6. FAMILIAS DE COLOR
-- ───────────────────────────────────────────────────────────────────────────
INSERT INTO public.catalog_color_families (name, slug, sort_order) VALUES
  ('Rosa',       'rosa',       1),
  ('Azul',       'azul',       2),
  ('Verde',      'verde',      3),
  ('Morado',     'morado',     4),
  ('Amarillo',   'amarillo',   5),
  ('Rojo',       'rojo',       6),
  ('Blanco',     'blanco',     7),
  ('Negro',      'negro',      8),
  ('Dorado',     'dorado',     9),
  ('Plata',      'plata',      10),
  ('Vino',       'vino',       11),
  ('Naranja',    'naranja',    12),
  ('Multicolor', 'multicolor', 13)
ON CONFLICT (slug) DO NOTHING;

-- ───────────────────────────────────────────────────────────────────────────
-- 7. COLORES EXACTOS (independientes de la gama; la gama los enlaza con
--    nombres comerciales vía catalog_line_colors)
-- ───────────────────────────────────────────────────────────────────────────
INSERT INTO public.catalog_colors (color_family_id, exact_name, slug, hex_value)
SELECT f.id, c.exact_name, c.slug, c.hex_value
FROM (VALUES
  -- Rosa
  ('rosa',     'Rosa bebé',        'rosa-bebe',        '#F9C5D5'),
  ('rosa',     'Rosa pink',        'rosa-pink',        '#FF5DA2'),
  ('rosa',     'Fucsia',           'fucsia',           '#E0218A'),
  ('rosa',     'Rosa pastel',      'rosa-pastel',      '#F4A7B9'),
  ('rosa',     'Rosa macarrón',    'rosa-macarron',    '#F7B5CD'),
  ('rosa',     'Rosa gold',        'rosa-gold',        '#B76E79'),
  -- Azul
  ('azul',     'Azul rey',         'azul-rey',         '#1E4FA3'),
  ('azul',     'Azul bebé',        'azul-bebe',        '#A8D8F0'),
  ('azul',     'Azul turquesa',    'azul-turquesa',    '#30BFC4'),
  ('azul',     'Azul pastel',      'azul-pastel',      '#AEC6E8'),
  ('azul',     'Azul macarrón',    'azul-macarron',    '#9FD8E8'),
  ('azul',     'Azul marino',      'azul-marino',      '#12284B'),
  -- Verde
  ('verde',    'Verde',            'verde',            '#1F9D55'),
  ('verde',    'Verde lima',       'verde-lima',       '#A6D608'),
  ('verde',    'Verde manzana',    'verde-manzana',    '#7BC043'),
  ('verde',    'Verde esmeralda',  'verde-esmeralda',  '#0F7B6C'),
  ('verde',    'Verde menta',      'verde-menta',      '#98E4C1'),
  ('verde',    'Verde macarrón',   'verde-macarron',   '#BFE3C6'),
  -- Morado
  ('morado',   'Morado',           'morado',           '#7B2D8B'),
  ('morado',   'Lila',             'lila',             '#C8A2C8'),
  ('morado',   'Lila pastel',      'lila-pastel',      '#D8BFD8'),
  -- Amarillo
  ('amarillo', 'Amarillo',         'amarillo',         '#FFD400'),
  ('amarillo', 'Amarillo pastel',  'amarillo-pastel',  '#FDF1A8'),
  ('amarillo', 'Amarillo macarrón','amarillo-macarron','#F9E79F'),
  ('amarillo', 'Mostaza',          'mostaza',          '#D4A017'),
  -- Rojo
  ('rojo',     'Rojo',             'rojo',             '#D50000'),
  ('rojo',     'Coral',            'coral',            '#FF6F61'),
  -- Blanco
  ('blanco',   'Blanco',           'blanco',           '#FFFFFF'),
  ('blanco',   'Marfil',           'marfil',           '#FFFFF0'),
  ('blanco',   'Transparente',     'transparente',     '#F8F8F8'),
  -- Negro
  ('negro',    'Negro',            'negro',            '#1A1A1A'),
  -- Dorado
  ('dorado',   'Dorado',           'dorado',           '#D4AF37'),
  ('dorado',   'Dorado rosa',      'dorado-rosa',      '#E0BFB8'),
  ('dorado',   'Champagne',        'champagne',        '#E8D8B0'),
  -- Plata
  ('plata',    'Plata',            'plata',            '#C0C0C0'),
  ('plata',    'Gris',             'gris',             '#808080'),
  -- Vino
  ('vino',     'Vino',             'vino',             '#722F37'),
  -- Naranja
  ('naranja',  'Naranja',          'naranja',          '#FF7A00'),
  ('naranja',  'Naranja pastel',   'naranja-pastel',   '#FFD8A8'),
  -- Multicolor
  ('multicolor','Multicolor',      'multicolor',       '#999999'),
  ('multicolor','Surtido',         'surtido',          '#AAAAAA')
) AS c(family_slug, exact_name, slug, hex_value)
JOIN public.catalog_color_families f ON f.slug = c.family_slug
ON CONFLICT (slug) DO NOTHING;

-- ───────────────────────────────────────────────────────────────────────────
-- 8. COLORES POR GAMA GLOMEX (qué colores ofrece cada línea)
-- ───────────────────────────────────────────────────────────────────────────
INSERT INTO public.catalog_line_colors (line_id, color_id, commercial_name, sort_order)
SELECT l.id, c.id, lc.commercial_name, lc.sort_order
FROM (VALUES
  ('glomex-estandar', 'rojo',              'Rojo',           1),
  ('glomex-estandar', 'azul-rey',          'Azul',           2),
  ('glomex-estandar', 'blanco',            'Blanco',         3),
  ('glomex-estandar', 'negro',             'Negro',          4),
  ('glomex-estandar', 'amarillo',          'Amarillo',       5),
  ('glomex-pastel',   'rosa-pastel',       'Rosa pastel',    1),
  ('glomex-pastel',   'azul-pastel',       'Azul pastel',    2),
  ('glomex-pastel',   'lila-pastel',       'Lila pastel',    3),
  ('glomex-pastel',   'amarillo-pastel',   'Amarillo pastel',4),
  ('glomex-macarron', 'rosa-macarron',     'Rosa macarrón',  1),
  ('glomex-macarron', 'azul-macarron',     'Azul macarrón',  2),
  ('glomex-macarron', 'verde-macarron',    'Verde macarrón', 3),
  ('glomex-chrome',   'dorado',            'Dorado chrome',  1),
  ('glomex-chrome',   'plata',             'Plata chrome',   2),
  ('glomex-chrome',   'azul-rey',          'Azul chrome',    3)
) AS lc(line_slug, color_slug, commercial_name, sort_order)
JOIN public.catalog_product_lines l ON l.slug = lc.line_slug
JOIN public.catalog_colors c        ON c.slug = lc.color_slug
ON CONFLICT (line_id, color_id) DO NOTHING;

-- ───────────────────────────────────────────────────────────────────────────
-- 9. MEDIDAS
-- ───────────────────────────────────────────────────────────────────────────
INSERT INTO public.catalog_sizes (name, numeric_value, unit, sort_order) VALUES
  ('5 pulgadas',  5,   'pulgada', 1),
  ('9 pulgadas',  9,   'pulgada', 2),
  ('10 pulgadas', 10,  'pulgada', 3),
  ('11 pulgadas', 11,  'pulgada', 4),
  ('12 pulgadas', 12,  'pulgada', 5),
  ('14 pulgadas', 14,  'pulgada', 6),
  ('16 pulgadas', 16,  'pulgada', 7),
  ('18 pulgadas', 18,  'pulgada', 8),
  ('22 pulgadas', 22,  'pulgada', 9),
  ('24 pulgadas', 24,  'pulgada', 10),
  ('36 pulgadas', 36,  'pulgada', 11),
  ('13 cm',       13,  'cm',      20),
  ('70 cm',       70,  'cm',      21),
  ('250 ml',      250, 'ml',      30),
  ('396 ml',      396, 'ml',      31),
  ('400 ml',      400, 'ml',      32),
  ('570 ml',      570, 'ml',      33),
  ('Unitalla',    NULL,'comercial',40)
ON CONFLICT DO NOTHING;

-- ───────────────────────────────────────────────────────────────────────────
-- 10. ATRIBUTOS GENÉRICOS
-- ───────────────────────────────────────────────────────────────────────────
INSERT INTO public.catalog_attributes (name, slug, data_type, filterable, variant_level, sort_order) VALUES
  ('Material',              'material',          'text',    true,  true,  1),
  ('Capacidad',             'capacidad',         'number',  true,  true,  2),
  ('Altura',                'altura',            'number',  true,  true,  3),
  ('Diámetro',              'diametro',          'number',  true,  true,  4),
  ('Personaje',             'personaje',         'text',    true,  true,  5),
  ('Tema',                  'tema',              'text',    true,  true,  6),
  ('Forma',                 'forma',             'text',    true,  true,  7),
  ('Compatible con helio',  'compatible-helio',  'boolean', true,  true,  8)
ON CONFLICT (slug) DO NOTHING;

-- ───────────────────────────────────────────────────────────────────────────
-- 11. ALIAS DE BÚSQUEDA (sinónimos iniciales del plan maestro)
-- ───────────────────────────────────────────────────────────────────────────
INSERT INTO public.catalog_search_aliases (term, normalized_term, target_type, target_id)
SELECT a.term, a.normalized_term, a.target_type,
  CASE a.target_type
    WHEN 'category' THEN (SELECT id FROM public.catalog_categories      WHERE slug = a.target_slug)
    WHEN 'line'     THEN (SELECT id FROM public.catalog_product_lines   WHERE slug = a.target_slug)
    WHEN 'brand'    THEN (SELECT id FROM public.catalog_brands          WHERE slug = a.target_slug)
  END
FROM (VALUES
  ('porta globo',         'porta globo',        'category', 'bases-y-montaje'),
  ('varilla para globo',  'varilla para globo', 'category', 'bases-y-montaje'),
  ('palito para globo',   'palito para globo',  'category', 'bases-y-montaje'),
  ('bubble',              'bubble',             'category', 'globos-burbuja'),
  ('globo transparente',  'globo transparente', 'category', 'globos-burbuja'),
  ('metálico',            'metalico',           'category', 'globos-foil'),
  ('metalizado',          'metalizado',         'category', 'globos-foil'),
  ('cromado',             'cromado',            'line',     'glomex-chrome'),
  ('cromo',               'cromo',              'line',     'glomex-chrome'),
  ('bomba eléctrica',     'bomba electrica',    'category', 'inflado-y-helio'),
  ('inflador',            'inflador',           'category', 'inflado-y-helio'),
  ('vela chispa',         'vela chispa',        'category', 'efectos-de-fiesta'),
  ('chispero',            'chispero',           'category', 'efectos-de-fiesta'),
  ('espuma floral',       'espuma floral',      'brand',    'oasis'),
  ('globo 260',           'globo 260',          'category', 'globos-para-modelar'),
  ('globo largo',         'globo largo',        'category', 'globos-para-modelar'),
  ('globo para figuras',  'globo para figuras', 'category', 'globos-para-modelar')
) AS a(term, normalized_term, target_type, target_slug)
ON CONFLICT (normalized_term, target_type, target_id) DO NOTHING;

-- ───────────────────────────────────────────────────────────────────────────
-- 12. PRODUCTOS DEMO — CASOS DE PRUEBA OBLIGATORIOS (§33)
--     a) Globo Glomex Estándar Rojo 12": bolsa 100 pzas $85, mayoreo desde
--        12 bolsas a $78, caja de 12 bolsas $900 (precio independiente).
--     b) La caja equivale a 1,200 globos y NO usa el precio de mayoreo.
--     c) Oasis: caja de 48 piezas, sin bolsa.
--     d) Espuma: caja de 12 latas (unidad contenida = lata).
--     e) Bomba manual: producto simple, una presentación, botón agregar.
--     f) Chrome Dorado existe SOLO en 12" (la combinación 5" no existe).
-- ───────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_cat_latex   UUID;
  v_glomex      UUID;
  v_location    UUID;
  v_product     UUID;
  v_line_id     UUID;
  v_variant_id  UUID;
  v_bolsa_id    UUID;
  v_caja_id     UUID;
  v_size_id     UUID;
  line_cfg      RECORD;
  color_cfg     RECORD;
  size_label    TEXT;
BEGIN
  -- Guard: si el producto demo ya existe, no hacer nada (idempotente).
  PERFORM id FROM public.catalog_products WHERE slug = 'globo-latex-glomex';
  IF FOUND THEN
    RAISE NOTICE 'Productos demo ya sembrados; se omite la sección 12.';
    RETURN;
  END IF;

  SELECT id INTO v_cat_latex FROM public.catalog_categories WHERE slug = 'globos-latex';
  SELECT id INTO v_glomex    FROM public.catalog_brands     WHERE slug = 'glomex';
  SELECT id INTO v_location  FROM public.catalog_locations  WHERE slug = 'sol-naciente';

  INSERT INTO public.catalog_products (
    category_id, brand_id, name, slug,
    short_description, description,
    listing_group_mode, featured, new_until,
    seo_title, seo_description
  ) VALUES (
    v_cat_latex, v_glomex, 'Globo látex Glomex', 'globo-latex-glomex',
    'Globos de látex Glomex al mayoreo. Elige gama, color y medida. Venta por bolsa, mayoreo y caja.',
    'Globo de látex Glomex de alta calidad para decoración profesional. Disponible en gamas Estándar, Pastel, Macarrón y Chrome. Cada bolsa contiene 100 globos (50 en Chrome). Precio especial por mayoreo y precio independiente por caja.',
    'line', true, CURRENT_DATE + 30,
    'Globo látex Glomex al mayoreo | Full Party Uruapan',
    'Globos de látex Glomex en gamas Estándar, Pastel, Macarrón y Chrome. Bolsa, mayoreo y caja. Envíos a todo México.'
  )
  RETURNING id INTO v_product;

  -- Config por gama: (slug, piezas/bolsa, precio bolsa, mayoreo_min, mayoreo_precio, bolsas/caja, precio caja, medidas disponibles)
  FOR line_cfg IN
    SELECT *
    FROM (VALUES
      ('glomex-estandar', 100::numeric, 85::numeric, 12, 78::numeric, 12,  900::numeric, ARRAY['5','10','12']),
      ('glomex-pastel',   100::numeric, 85::numeric, 12, 78::numeric, 12,  900::numeric, ARRAY['12']),
      ('glomex-macarron', 100::numeric, 85::numeric, 12, 78::numeric, 12,  900::numeric, ARRAY['12']),
      ('glomex-chrome',    50::numeric, 95::numeric,  6, 88::numeric, 12, 1000::numeric, ARRAY['12'])
    ) AS t(line_slug, bolsa_piezas, bolsa_precio, mayoreo_min, mayoreo_precio, caja_bolsas, caja_precio, medidas)
  LOOP
    SELECT id INTO v_line_id FROM public.catalog_product_lines WHERE slug = line_cfg.line_slug;

    FOR color_cfg IN
      SELECT lc.color_id, c.slug AS color_slug, c.exact_name
      FROM public.catalog_line_colors lc
      JOIN public.catalog_colors c ON c.id = lc.color_id
      WHERE lc.line_id = v_line_id
      ORDER BY lc.sort_order
    LOOP
      FOREACH size_label IN ARRAY line_cfg.medidas
      LOOP
        SELECT id INTO v_size_id
        FROM public.catalog_sizes
        WHERE name = size_label || ' pulgadas';

        -- Variante (SKU legible; la combinación Chrome Dorado 5" jamás se crea)
        INSERT INTO public.catalog_variants (
          product_id, line_id, color_id, size_id, sku, inventory_policy
        ) VALUES (
          v_product, v_line_id, color_cfg.color_id, v_size_id,
          'GLOMEX-' || upper(replace(line_cfg.line_slug, 'glomex-', ''))
            || '-' || upper(replace(color_cfg.color_slug, '-', '_'))
            || '-' || size_label,
          'shared_base_units'
        )
        RETURNING id INTO v_variant_id;

        -- Bolsa (presentación directa en unidades base)
        INSERT INTO public.catalog_sale_presentations (
          variant_id, name, presentation_type, base_unit,
          contained_quantity, contained_unit,
          base_units_total, base_price,
          minimum_order_quantity, quantity_step, sort_order
        ) VALUES (
          v_variant_id,
          'Bolsa de ' || line_cfg.bolsa_piezas || ' piezas',
          'bolsa', 'pieza',
          line_cfg.bolsa_piezas, 'pieza',
          line_cfg.bolsa_piezas, line_cfg.bolsa_precio,
          1, 1, 1
        )
        RETURNING id INTO v_bolsa_id;

        -- Mayoreo de la bolsa (escalón desde N bolsas)
        INSERT INTO public.catalog_price_tiers (
          sale_presentation_id, minimum_quantity, price_per_presentation, label
        ) VALUES (
          v_bolsa_id, line_cfg.mayoreo_min, line_cfg.mayoreo_precio, 'Mayoreo'
        );

        -- Caja (presentación anidada; precio INDEPENDIENTE del mayoreo)
        INSERT INTO public.catalog_sale_presentations (
          variant_id, name, presentation_type, base_unit,
          contains_presentation_id, contains_quantity,
          base_units_total, base_price,
          minimum_order_quantity, quantity_step, sort_order
        ) VALUES (
          v_variant_id,
          'Caja de ' || line_cfg.caja_bolsas || ' bolsas',
          'caja', 'pieza',
          v_bolsa_id, line_cfg.caja_bolsas,
          line_cfg.bolsa_piezas * line_cfg.caja_bolsas, line_cfg.caja_precio,
          1, 1, 2
        )
        RETURNING id INTO v_caja_id;

        -- Inventario en unidades base compartidas (la caja puede abrirse):
        -- 240 bolsas por variante en Sol Naciente.
        INSERT INTO public.catalog_inventory (variant_id, sale_presentation_id, location_id, quantity)
        VALUES (v_variant_id, NULL, v_location, line_cfg.bolsa_piezas * 240);
      END LOOP;
    END LOOP;
  END LOOP;

  -- El producto demo entra a colecciones editoriales y de color.
  INSERT INTO public.catalog_collection_products (collection_id, product_id, sort_order)
  SELECT col.id, v_product, 1
  FROM public.catalog_collections col
  WHERE col.slug IN ('mas-vendidos', 'nuevos', 'todo-dorado')
  ON CONFLICT DO NOTHING;
END;
$$;

-- ── Caso c) Oasis: caja de 48 piezas, sin bolsa ─────────────────────────────
DO $$
DECLARE
  v_product  UUID;
  v_variant  UUID;
  v_caja     UUID;
  v_location UUID;
BEGIN
  PERFORM id FROM public.catalog_products WHERE slug = 'oasis-espuma-floral';
  IF FOUND THEN RETURN; END IF;

  SELECT id INTO v_location FROM public.catalog_locations WHERE slug = 'sol-naciente';

  INSERT INTO public.catalog_products (category_id, brand_id, name, slug, short_description, listing_group_mode)
  SELECT cat.id, b.id, 'Oasis espuma floral', 'oasis-espuma-floral',
         'Espuma floral Oasis para arreglos. Caja de 48 piezas.', 'product'
  FROM public.catalog_categories cat, public.catalog_brands b
  WHERE cat.slug = 'decoracion' AND b.slug = 'oasis'
  RETURNING id INTO v_product;

  INSERT INTO public.catalog_variants (product_id, sku, inventory_policy)
  VALUES (v_product, 'OASIS-ESTANDAR', 'separate_by_presentation')
  RETURNING id INTO v_variant;

  -- Caja directa en piezas (sin bolsa): el modelo no obliga a crear una bolsa.
  INSERT INTO public.catalog_sale_presentations (
    variant_id, name, presentation_type, base_unit,
    contained_quantity, contained_unit, base_units_total, base_price, sort_order
  ) VALUES (
    v_variant, 'Caja de 48 piezas', 'caja', 'pieza', 48, 'pieza', 48, 480, 1
  )
  RETURNING id INTO v_caja;

  -- 10 cajas cerradas (política separate_by_presentation).
  INSERT INTO public.catalog_inventory (variant_id, sale_presentation_id, location_id, quantity)
  VALUES (v_variant, v_caja, v_location, 10);
END;
$$;

-- ── Caso d) Espuma: caja de 12 latas (unidad contenida = lata) ──────────────
DO $$
DECLARE
  v_product  UUID;
  v_variant  UUID;
  v_lata     UUID;
  v_location UUID;
BEGIN
  PERFORM id FROM public.catalog_products WHERE slug = 'espuma-nieve';
  IF FOUND THEN RETURN; END IF;

  SELECT id INTO v_location FROM public.catalog_locations WHERE slug = 'sol-naciente';

  INSERT INTO public.catalog_products (category_id, brand_id, name, slug, short_description, listing_group_mode)
  SELECT cat.id, b.id, 'Espuma nieve en lata', 'espuma-nieve',
         'Espuma decorativa nieve en lata de 400 ml. Caja de 12 latas.', 'product'
  FROM public.catalog_categories cat, public.catalog_brands b
  WHERE cat.slug = 'efectos-de-fiesta' AND b.slug = 'generico'
  RETURNING id INTO v_product;

  INSERT INTO public.catalog_variants (product_id, sku, inventory_policy)
  VALUES (v_product, 'ESP-NIEVE-400', 'shared_base_units')
  RETURNING id INTO v_variant;

  -- Lata (presentación directa) y caja ANIDADA que contiene 12 latas.
  INSERT INTO public.catalog_sale_presentations (
    variant_id, name, presentation_type, base_unit,
    contained_quantity, contained_unit, base_units_total, base_price, sort_order
  ) VALUES (v_variant, 'Lata de 400 ml', 'lata', 'lata', 1, 'lata', 1, 35, 1)
  RETURNING id INTO v_lata;

  INSERT INTO public.catalog_sale_presentations (
    variant_id, name, presentation_type, base_unit,
    contains_presentation_id, contains_quantity,
    base_units_total, base_price, sort_order
  ) VALUES (
    v_variant, 'Caja de 12 latas', 'caja', 'lata',
    v_lata, 12,
    12, 396, 2
  );

  -- 120 latas (10 cajas) en unidades base compartidas.
  INSERT INTO public.catalog_inventory (variant_id, sale_presentation_id, location_id, quantity)
  VALUES (v_variant, NULL, v_location, 120);
END;
$$;

-- ── Caso e) Bomba manual: producto simple, una presentación ─────────────────
DO $$
DECLARE
  v_product  UUID;
  v_variant  UUID;
  v_location UUID;
BEGIN
  PERFORM id FROM public.catalog_products WHERE slug = 'bomba-manual-globos';
  IF FOUND THEN RETURN; END IF;

  SELECT id INTO v_location FROM public.catalog_locations WHERE slug = 'sol-naciente';

  INSERT INTO public.catalog_products (category_id, brand_id, name, slug, short_description, listing_group_mode)
  SELECT cat.id, b.id, 'Bomba manual para globos', 'bomba-manual-globos',
         'Bomba manual de doble acción para inflar globos.', 'product'
  FROM public.catalog_categories cat, public.catalog_brands b
  WHERE cat.slug = 'inflado-y-helio' AND b.slug = 'generico'
  RETURNING id INTO v_product;

  INSERT INTO public.catalog_variants (product_id, sku, inventory_policy)
  VALUES (v_product, 'BOMBA-MANUAL-01', 'shared_base_units')
  RETURNING id INTO v_variant;

  INSERT INTO public.catalog_sale_presentations (
    variant_id, name, presentation_type, base_unit,
    contained_quantity, contained_unit, base_units_total, base_price, sort_order
  ) VALUES (v_variant, 'Pieza', 'pieza', 'pieza', 1, 'pieza', 1, 120, 1);

  INSERT INTO public.catalog_inventory (variant_id, sale_presentation_id, location_id, quantity)
  VALUES (v_variant, NULL, v_location, 25);
END;
$$;

COMMIT;

-- Verificación (ejecutar aparte):
-- SELECT 'categorias' t, count(*) FROM catalog_categories
-- UNION ALL SELECT 'colecciones', count(*) FROM catalog_collections
-- UNION ALL SELECT 'marcas', count(*) FROM catalog_brands
-- UNION ALL SELECT 'gamas', count(*) FROM catalog_product_lines
-- UNION ALL SELECT 'colores', count(*) FROM catalog_colors
-- UNION ALL SELECT 'medidas', count(*) FROM catalog_sizes
-- UNION ALL SELECT 'productos', count(*) FROM catalog_products
-- UNION ALL SELECT 'variantes', count(*) FROM catalog_variants
-- UNION ALL SELECT 'presentaciones', count(*) FROM catalog_sale_presentations
-- UNION ALL SELECT 'escalones', count(*) FROM catalog_price_tiers
-- UNION ALL SELECT 'inventario', count(*) FROM catalog_inventory;
