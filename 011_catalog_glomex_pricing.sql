-- 011_catalog_glomex_pricing.sql
-- Corrige el tarifario confirmado de Globos Glomex y el contenido real
-- de las cajas existentes. No crea variantes sin colores comerciales.

BEGIN;

UPDATE public.catalog_products
SET
  description = 'Globo de látex Glomex para decoración profesional. El contenido y el precio dependen de la gama y la medida. Hay venta por bolsa, precio de mayoreo desde 12 bolsas y cajas de 100 bolsas.',
  seo_description = 'Globos de látex Glomex por gama y medida. Precios normales, mayoreo desde 12 bolsas y cajas de 100 bolsas. Envíos a todo México.'
WHERE slug = 'globo-latex-glomex';

-- Conserva la misma disponibilidad expresada en bolsas cuando cambia el
-- contenido de una bolsa ya sembrada (10 pulgadas: 100 -> 50 piezas).
WITH pricing_matrix(line_slug, size_value, bag_pieces, base_price, wholesale_price) AS (
  VALUES
    ('glomex-estandar', 12::numeric, 100::numeric, 85::numeric, 78::numeric),
    ('glomex-estandar', 10::numeric,  50::numeric, 37::numeric, 34::numeric),
    ('glomex-estandar',  5::numeric, 100::numeric, 50::numeric, 42::numeric),
    ('glomex-macarron', 12::numeric, 100::numeric, 85::numeric, 78::numeric),
    ('glomex-chrome',   12::numeric,  50::numeric, 80::numeric, 70::numeric)
),
changed_variants AS (
  SELECT DISTINCT
    v.id AS variant_id,
    sp.contained_quantity AS old_bag_pieces,
    m.bag_pieces AS new_bag_pieces
  FROM public.catalog_products p
  JOIN public.catalog_variants v ON v.product_id = p.id
  JOIN public.catalog_product_lines l ON l.id = v.line_id
  JOIN public.catalog_sizes s ON s.id = v.size_id
  JOIN public.catalog_sale_presentations sp
    ON sp.variant_id = v.id
   AND sp.presentation_type = 'bolsa'
   AND sp.contains_presentation_id IS NULL
  JOIN pricing_matrix m
    ON m.line_slug = l.slug
   AND m.size_value = s.numeric_value
  WHERE p.slug = 'globo-latex-glomex'
    AND sp.contained_quantity IS DISTINCT FROM m.bag_pieces
)
UPDATE public.catalog_inventory i
SET
  quantity = i.quantity * c.new_bag_pieces / c.old_bag_pieces,
  reserved_quantity = i.reserved_quantity * c.new_bag_pieces / c.old_bag_pieces
FROM changed_variants c
WHERE i.variant_id = c.variant_id
  AND i.sale_presentation_id IS NULL
  AND c.old_bag_pieces > 0;

WITH pricing_matrix(line_slug, size_value, bag_pieces, base_price, wholesale_price) AS (
  VALUES
    ('glomex-estandar', 12::numeric, 100::numeric, 85::numeric, 78::numeric),
    ('glomex-estandar', 10::numeric,  50::numeric, 37::numeric, 34::numeric),
    ('glomex-estandar',  5::numeric, 100::numeric, 50::numeric, 42::numeric),
    ('glomex-macarron', 12::numeric, 100::numeric, 85::numeric, 78::numeric),
    ('glomex-chrome',   12::numeric,  50::numeric, 80::numeric, 70::numeric)
)
UPDATE public.catalog_sale_presentations sp
SET
  name = format('Bolsa de %s piezas', m.bag_pieces::integer),
  contained_quantity = m.bag_pieces,
  contained_unit = 'pieza',
  base_units_total = m.bag_pieces,
  base_price = m.base_price
FROM public.catalog_variants v
JOIN public.catalog_products p ON p.id = v.product_id
JOIN public.catalog_product_lines l ON l.id = v.line_id
JOIN public.catalog_sizes s ON s.id = v.size_id
JOIN pricing_matrix m
  ON m.line_slug = l.slug
 AND m.size_value = s.numeric_value
WHERE sp.variant_id = v.id
  AND p.slug = 'globo-latex-glomex'
  AND sp.presentation_type = 'bolsa'
  AND sp.contains_presentation_id IS NULL;

WITH pricing_matrix(line_slug, size_value, wholesale_price) AS (
  VALUES
    ('glomex-estandar', 12::numeric, 78::numeric),
    ('glomex-estandar', 10::numeric, 34::numeric),
    ('glomex-estandar',  5::numeric, 42::numeric),
    ('glomex-macarron', 12::numeric, 78::numeric),
    ('glomex-chrome',   12::numeric, 70::numeric)
)
UPDATE public.catalog_price_tiers pt
SET
  minimum_quantity = 12,
  maximum_quantity = NULL,
  price_per_presentation = m.wholesale_price,
  label = 'Mayoreo',
  active = true
FROM public.catalog_sale_presentations sp
JOIN public.catalog_variants v ON v.id = sp.variant_id
JOIN public.catalog_products p ON p.id = v.product_id
JOIN public.catalog_product_lines l ON l.id = v.line_id
JOIN public.catalog_sizes s ON s.id = v.size_id
JOIN pricing_matrix m
  ON m.line_slug = l.slug
 AND m.size_value = s.numeric_value
WHERE pt.sale_presentation_id = sp.id
  AND p.slug = 'globo-latex-glomex'
  AND sp.presentation_type = 'bolsa';

-- El precio independiente de caja se conserva; sólo cambia su contenido real.
UPDATE public.catalog_sale_presentations box
SET
  name = 'Caja de 100 bolsas',
  contains_quantity = 100,
  base_units_total = bag.base_units_total * 100
FROM public.catalog_sale_presentations bag
JOIN public.catalog_variants v ON v.id = bag.variant_id
JOIN public.catalog_products p ON p.id = v.product_id
WHERE box.contains_presentation_id = bag.id
  AND box.variant_id = bag.variant_id
  AND p.slug = 'globo-latex-glomex'
  AND box.presentation_type = 'caja';

COMMIT;
