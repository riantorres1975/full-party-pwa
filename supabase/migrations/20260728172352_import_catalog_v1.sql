-- Importacion controlada del respaldo V1 al catalogo normalizado V2.
-- Esta migracion es de una sola ejecucion. El historial de migraciones de
-- Supabase evita que se vuelva a aplicar y sobreescriba inventario posterior.

BEGIN;

DO $$
BEGIN
  IF to_regclass('public.productos_backup_v1') IS NULL THEN
    RAISE EXCEPTION 'Falta public.productos_backup_v1';
  END IF;

  IF (SELECT count(*) FROM public.productos_backup_v1) <> 105 THEN
    RAISE EXCEPTION 'El respaldo V1 debe contener exactamente 105 filas';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.catalog_inventory
    WHERE reserved_quantity <> 0
  ) THEN
    RAISE EXCEPTION 'No se puede importar con inventario reservado';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.catalog_products
    WHERE slug IN ('letras-led-decorativas', 'globos-orbz-economicos')
  ) THEN
    RAISE EXCEPTION 'La importacion V1 ya fue aplicada';
  END IF;
END;
$$;

INSERT INTO public.catalog_brands (name, slug, sort_order, active)
VALUES
  ('Económico', 'economico', 70, true),
  ('El Bueno', 'el-bueno', 80, true)
ON CONFLICT (slug) DO NOTHING;

CREATE TEMP TABLE catalog_v1_category_map (
  legacy_category text PRIMARY KEY,
  category_slug text NOT NULL
) ON COMMIT DROP;

INSERT INTO catalog_v1_category_map (legacy_category, category_slug)
VALUES
  ('Batucada', 'efectos-de-fiesta'),
  ('Bengala', 'efectos-de-fiesta'),
  ('Brillo Para Globo', 'inflado-y-helio'),
  ('Carreras', 'globos-figuras'),
  ('Confeti', 'efectos-de-fiesta'),
  ('Espuma', 'efectos-de-fiesta'),
  ('Frutas', 'globos-figuras'),
  ('Globo Latex', 'globos-latex'),
  ('Globo Número-16', 'globos-numero'),
  ('Infladora De Globos', 'inflado-y-helio'),
  ('Letras Led', 'decoracion'),
  ('Letrero Mdf', 'decoracion'),
  ('Oasis', 'bases-y-montaje'),
  ('Orbz', 'globos-orbz'),
  ('Pegamento', 'inflado-y-helio'),
  ('Portaglobo', 'bases-y-montaje'),
  ('Primera Comunión', 'decoracion');

DO $$
BEGIN
  IF EXISTS (
    SELECT DISTINCT b.categoria
    FROM public.productos_backup_v1 b
    LEFT JOIN catalog_v1_category_map m
      ON m.legacy_category = b.categoria
    WHERE b.nombre <> 'Prueba'
      AND m.legacy_category IS NULL
  ) THEN
    RAISE EXCEPTION 'Hay categorias V1 sin mapeo explicito';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM catalog_v1_category_map m
    LEFT JOIN public.catalog_categories c ON c.slug = m.category_slug
    WHERE c.id IS NULL
  ) THEN
    RAISE EXCEPTION 'Hay categorias V2 requeridas que no existen';
  END IF;
END;
$$;

-- Los nombres se mapean explicitamente: no se usa similitud automatica.
CREATE TEMP TABLE catalog_v1_glomex_map (
  legacy_name text PRIMARY KEY,
  line_slug text NOT NULL,
  color_name text NOT NULL,
  color_slug text NOT NULL,
  family_slug text NOT NULL
) ON COMMIT DROP;

INSERT INTO catalog_v1_glomex_map
  (legacy_name, line_slug, color_name, color_slug, family_slug)
VALUES
  ('Glomex Amarillo Estándar 12 Pulg', 'glomex-estandar', 'Amarillo', 'amarillo', 'amarillo'),
  ('Glomex Amarillo Limon Estándar 12 Pulg', 'glomex-estandar', 'Amarillo limón', 'amarillo-limon', 'amarillo'),
  ('Glomex Azul Bebé Estándar 12 Pulg', 'glomex-estandar', 'Azul bebé', 'azul-bebe', 'azul'),
  ('Glomex Azul Estándar 12 Pulg', 'glomex-estandar', 'Azul rey', 'azul-rey', 'azul'),
  ('Glomex Azul Pastel 12 Pulg 3.2G', 'glomex-pastel', 'Azul pastel', 'azul-pastel', 'azul'),
  ('Glomex Azul Turquesa Estándar 12 Pulg', 'glomex-estandar', 'Azul turquesa', 'azul-turquesa', 'azul'),
  ('Glomex Blanco Estándar 12 Pulg', 'glomex-estandar', 'Blanco', 'blanco', 'blanco'),
  ('Glomex Fucsia Estándar 12 Pulg', 'glomex-estandar', 'Fucsia', 'fucsia', 'rosa'),
  ('Glomex Lila Pastel 12 Pulg 3.2G', 'glomex-pastel', 'Lila pastel', 'lila-pastel', 'morado'),
  ('Glomex Morado Estándar 12 Pulg', 'glomex-estandar', 'Morado', 'morado', 'morado'),
  ('Glomex Naranja Estándar 12 Pulg', 'glomex-estandar', 'Naranja', 'naranja', 'naranja'),
  ('Glomex Naranja Pastel 12 Pulg 3.2G', 'glomex-pastel', 'Naranja pastel', 'naranja-pastel', 'naranja'),
  ('Glomex Negro Estándar 12 Pulg', 'glomex-estandar', 'Negro', 'negro', 'negro'),
  ('Glomex Retro Arena 12 Pulg 3.2G', 'glomex-retro', 'Arena', 'arena', 'amarillo'),
  ('Glomex Retro Azul Hielo 12 Pulg 3.2G', 'glomex-retro', 'Azul hielo', 'azul-hielo', 'azul'),
  ('Glomex Retro Azul Noche 12 Pulg 3.2G', 'glomex-retro', 'Azul noche', 'azul-noche', 'azul'),
  ('Glomex Retro Azul Royal 12 Pulg 3.2G', 'glomex-retro', 'Azul royal', 'azul-royal', 'azul'),
  ('Glomex Retro Café 2 Pulg 3.2G', 'glomex-retro', 'Café', 'cafe', 'naranja'),
  ('Glomex Retro Caqui 12 Pulg 3.2G', 'glomex-retro', 'Caqui', 'caqui', 'amarillo'),
  ('Glomex Retro Durazno 12 Pulg 3.2G', 'glomex-retro', 'Durazno', 'durazno', 'naranja'),
  ('Glomex Retro Fucsia 12 Pulg 3.2G', 'glomex-retro', 'Fucsia retro', 'fucsia-retro', 'rosa'),
  ('Glomex Retro Gris Audaz 12 Pulg 3.2G', 'glomex-retro', 'Gris audaz', 'gris-audaz', 'plata'),
  ('Glomex Retro Gris Neblina 12 Pulg 3.2G', 'glomex-retro', 'Gris neblina', 'gris-neblina', 'plata'),
  ('Glomex Retro Malva 12 Pulg 3.2G', 'glomex-retro', 'Malva', 'malva', 'morado'),
  ('Glomex Retro Marfil 12 Pulg 3.2G', 'glomex-retro', 'Marfil retro', 'marfil-retro', 'blanco'),
  ('Glomex Retro Naranja Hermes 12 Pulg 3.2G', 'glomex-retro', 'Naranja Hermes', 'naranja-hermes', 'naranja'),
  ('Glomex Retro Piel 12 Pulg 3.2G', 'glomex-retro', 'Piel', 'piel', 'naranja'),
  ('Glomex Retro Rojo Oscuro 12 Pulg 3.2G', 'glomex-retro', 'Rojo oscuro', 'rojo-oscuro', 'rojo'),
  ('Glomex Retro Rosa 12 Pulg 3.2G', 'glomex-retro', 'Rosa retro', 'rosa-retro', 'rosa'),
  ('Glomex Retro Rosa Hot 12 Pulg 3.2G', 'glomex-retro', 'Rosa hot', 'rosa-hot', 'rosa'),
  ('Glomex Retro Verde Oliva 12 Pulg 3.2G', 'glomex-retro', 'Verde oliva', 'verde-oliva', 'verde'),
  ('Glomex Retro Vino 12 Pulg 3.2G', 'glomex-retro', 'Vino retro', 'vino-retro', 'vino'),
  ('Glomex Retro Vrede Manzana 12 Pulg 3.2G', 'glomex-retro', 'Verde manzana retro', 'verde-manzana-retro', 'verde'),
  ('Glomex Rojo Estándar 12 Pulg', 'glomex-estandar', 'Rojo', 'rojo', 'rojo'),
  ('Glomex Rosa Bebé Estándar 12 Pulg', 'glomex-estandar', 'Rosa bebé', 'rosa-bebe', 'rosa'),
  ('Glomex Rosa Pastel 12 Pulg 3.2G', 'glomex-pastel', 'Rosa pastel', 'rosa-pastel', 'rosa'),
  ('Glomex Rosa Pink Estándar 12 Pulg', 'glomex-estandar', 'Rosa pink', 'rosa-pink', 'rosa'),
  ('Glomex Surtido Estándar 12 Pulg', 'glomex-estandar', 'Surtido', 'surtido', 'multicolor'),
  ('Glomex Trendy Azul Indigo 12 Pulg 3.2G', 'glomex-trendy', 'Azul índigo', 'azul-indigo', 'azul'),
  ('Glomex Trendy Morado Orquidea 12 Pulg 3.2G', 'glomex-trendy', 'Morado orquídea', 'morado-orquidea', 'morado'),
  ('Glomex Trendy Rosa Palo 12 Pulg 3.2G', 'glomex-trendy', 'Rosa palo', 'rosa-palo', 'rosa'),
  ('Glomex Verde Estándar 12 Pulg', 'glomex-estandar', 'Verde', 'verde', 'verde'),
  ('Glomex Verde Lima Estándar 12 Pulg', 'glomex-estandar', 'Verde lima', 'verde-lima', 'verde'),
  ('Glomex Verde Oscuro Estándar 12 Pulg', 'glomex-estandar', 'Verde oscuro', 'verde-oscuro', 'verde');

DO $$
BEGIN
  IF (SELECT count(*) FROM catalog_v1_glomex_map) <> 44 THEN
    RAISE EXCEPTION 'El mapa Glomex debe contener 44 filas';
  END IF;

  IF EXISTS (
    SELECT b.nombre
    FROM public.productos_backup_v1 b
    LEFT JOIN catalog_v1_glomex_map m ON m.legacy_name = b.nombre
    WHERE b.categoria = 'Globo Latex'
      AND m.legacy_name IS NULL
  ) OR EXISTS (
    SELECT m.legacy_name
    FROM catalog_v1_glomex_map m
    LEFT JOIN public.productos_backup_v1 b ON b.nombre = m.legacy_name
    WHERE b.id IS NULL
  ) THEN
    RAISE EXCEPTION 'El mapa Glomex no coincide exactamente con el respaldo';
  END IF;
END;
$$;

INSERT INTO public.catalog_colors
  (color_family_id, exact_name, slug, active)
SELECT f.id, m.color_name, m.color_slug, true
FROM catalog_v1_glomex_map m
JOIN public.catalog_color_families f ON f.slug = m.family_slug
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.catalog_line_colors
  (line_id, color_id, commercial_name, image_url, sort_order, active)
SELECT
  l.id,
  c.id,
  m.color_name,
  b.imagen_url,
  row_number() OVER (PARTITION BY l.id ORDER BY m.color_name),
  true
FROM catalog_v1_glomex_map m
JOIN public.productos_backup_v1 b ON b.nombre = m.legacy_name
JOIN public.catalog_product_lines l ON l.slug = m.line_slug
JOIN public.catalog_colors c ON c.slug = m.color_slug
ON CONFLICT (line_id, color_id) DO UPDATE
SET commercial_name = EXCLUDED.commercial_name,
    image_url = EXCLUDED.image_url,
    active = true;

CREATE TEMP TABLE catalog_v1_glomex_pricing (
  line_slug text PRIMARY KEY,
  bag_pieces numeric NOT NULL,
  bag_price numeric NOT NULL,
  wholesale_price numeric NOT NULL,
  box_price numeric NOT NULL
) ON COMMIT DROP;

INSERT INTO catalog_v1_glomex_pricing
  (line_slug, bag_pieces, bag_price, wholesale_price, box_price)
VALUES
  ('glomex-estandar', 100, 85, 78, 900),
  ('glomex-pastel', 100, 85, 78, 900),
  ('glomex-retro', 100, 85, 78, 900),
  ('glomex-trendy', 100, 95, 88, 1000);

UPDATE public.catalog_products p
SET main_image_url = b.imagen_url
FROM public.productos_backup_v1 b
WHERE p.slug = 'globo-latex-glomex'
  AND b.nombre = 'Glomex Rojo Estándar 12 Pulg';

WITH first_image AS (
  SELECT DISTINCT ON (m.line_slug)
    m.line_slug,
    b.imagen_url
  FROM catalog_v1_glomex_map m
  JOIN public.productos_backup_v1 b ON b.nombre = m.legacy_name
  ORDER BY m.line_slug, m.color_name
)
UPDATE public.catalog_product_lines l
SET image_url = f.imagen_url
FROM first_image f
WHERE l.slug = f.line_slug;

INSERT INTO public.catalog_variants
  (product_id, line_id, color_id, size_id, sku, image_url, inventory_policy, active)
SELECT
  p.id,
  l.id,
  c.id,
  s.id,
  'GLOMEX-' ||
    upper(replace(m.line_slug, 'glomex-', '')) || '-' ||
    upper(replace(m.color_slug, '-', '_')) || '-12',
  b.imagen_url,
  'shared_base_units',
  true
FROM catalog_v1_glomex_map m
JOIN public.productos_backup_v1 b ON b.nombre = m.legacy_name
JOIN public.catalog_products p ON p.slug = 'globo-latex-glomex'
JOIN public.catalog_product_lines l ON l.slug = m.line_slug
JOIN public.catalog_colors c ON c.slug = m.color_slug
JOIN public.catalog_sizes s
  ON s.numeric_value = 12 AND s.unit = 'pulgada'
ON CONFLICT ON CONSTRAINT catalog_variants_unique_combination DO UPDATE
SET image_url = EXCLUDED.image_url,
    active = true;

INSERT INTO public.catalog_sale_presentations (
  variant_id, name, presentation_type, base_unit,
  contained_quantity, contained_unit, base_units_total, base_price,
  minimum_order_quantity, quantity_step, sort_order, active
)
SELECT
  v.id,
  format('Bolsa de %s piezas', price.bag_pieces::integer),
  'bolsa',
  'pieza',
  price.bag_pieces,
  'pieza',
  price.bag_pieces,
  price.bag_price,
  1,
  1,
  1,
  true
FROM catalog_v1_glomex_map m
JOIN catalog_v1_glomex_pricing price ON price.line_slug = m.line_slug
JOIN public.catalog_products p ON p.slug = 'globo-latex-glomex'
JOIN public.catalog_product_lines l ON l.slug = m.line_slug
JOIN public.catalog_colors c ON c.slug = m.color_slug
JOIN public.catalog_sizes s ON s.numeric_value = 12 AND s.unit = 'pulgada'
JOIN public.catalog_variants v
  ON v.product_id = p.id
 AND v.line_id = l.id
 AND v.color_id = c.id
 AND v.size_id = s.id
WHERE NOT EXISTS (
  SELECT 1
  FROM public.catalog_sale_presentations sp
  WHERE sp.variant_id = v.id
    AND sp.presentation_type = 'bolsa'
);

INSERT INTO public.catalog_price_tiers (
  sale_presentation_id, minimum_quantity, maximum_quantity,
  price_per_presentation, label, active
)
SELECT sp.id, 12, NULL, price.wholesale_price, 'Mayoreo', true
FROM catalog_v1_glomex_map m
JOIN catalog_v1_glomex_pricing price ON price.line_slug = m.line_slug
JOIN public.catalog_products p ON p.slug = 'globo-latex-glomex'
JOIN public.catalog_product_lines l ON l.slug = m.line_slug
JOIN public.catalog_colors c ON c.slug = m.color_slug
JOIN public.catalog_sizes s ON s.numeric_value = 12 AND s.unit = 'pulgada'
JOIN public.catalog_variants v
  ON v.product_id = p.id
 AND v.line_id = l.id
 AND v.color_id = c.id
 AND v.size_id = s.id
JOIN public.catalog_sale_presentations sp
  ON sp.variant_id = v.id
 AND sp.presentation_type = 'bolsa'
WHERE NOT EXISTS (
  SELECT 1
  FROM public.catalog_price_tiers pt
  WHERE pt.sale_presentation_id = sp.id
);

INSERT INTO public.catalog_sale_presentations (
  variant_id, name, presentation_type, base_unit,
  contains_presentation_id, contains_quantity,
  base_units_total, base_price,
  minimum_order_quantity, quantity_step, sort_order, active
)
SELECT
  bag.variant_id,
  'Caja de 100 bolsas',
  'caja',
  'pieza',
  bag.id,
  100,
  bag.base_units_total * 100,
  price.box_price,
  1,
  1,
  2,
  true
FROM catalog_v1_glomex_map m
JOIN catalog_v1_glomex_pricing price ON price.line_slug = m.line_slug
JOIN public.catalog_products p ON p.slug = 'globo-latex-glomex'
JOIN public.catalog_product_lines l ON l.slug = m.line_slug
JOIN public.catalog_colors c ON c.slug = m.color_slug
JOIN public.catalog_sizes s ON s.numeric_value = 12 AND s.unit = 'pulgada'
JOIN public.catalog_variants v
  ON v.product_id = p.id
 AND v.line_id = l.id
 AND v.color_id = c.id
 AND v.size_id = s.id
JOIN public.catalog_sale_presentations bag
  ON bag.variant_id = v.id
 AND bag.presentation_type = 'bolsa'
WHERE NOT EXISTS (
  SELECT 1
  FROM public.catalog_sale_presentations box
  WHERE box.variant_id = v.id
    AND box.presentation_type = 'caja'
);

-- El seed tenia existencias ficticias. Las variantes sin respaldo quedan en 0.
UPDATE public.catalog_inventory i
SET quantity = 0,
    reserved_quantity = 0
FROM public.catalog_variants v
JOIN public.catalog_products p ON p.id = v.product_id
WHERE i.variant_id = v.id
  AND p.slug = 'globo-latex-glomex';

INSERT INTO public.catalog_inventory
  (variant_id, sale_presentation_id, location_id, quantity, reserved_quantity)
SELECT
  v.id,
  NULL,
  location.id,
  b.stock_actual * bag.base_units_total,
  0
FROM catalog_v1_glomex_map m
JOIN public.productos_backup_v1 b ON b.nombre = m.legacy_name
JOIN public.catalog_products p ON p.slug = 'globo-latex-glomex'
JOIN public.catalog_product_lines l ON l.slug = m.line_slug
JOIN public.catalog_colors c ON c.slug = m.color_slug
JOIN public.catalog_sizes s ON s.numeric_value = 12 AND s.unit = 'pulgada'
JOIN public.catalog_variants v
  ON v.product_id = p.id
 AND v.line_id = l.id
 AND v.color_id = c.id
 AND v.size_id = s.id
JOIN public.catalog_sale_presentations bag
  ON bag.variant_id = v.id
 AND bag.presentation_type = 'bolsa'
JOIN public.catalog_locations location ON location.slug = 'sol-naciente'
ON CONFLICT (variant_id, sale_presentation_id, location_id)
DO UPDATE SET quantity = EXCLUDED.quantity,
              reserved_quantity = 0;

INSERT INTO public.catalog_product_images (
  product_id, variant_id, line_id, color_id,
  image_url, image_type, alt_text, sort_order, active
)
SELECT
  p.id,
  v.id,
  l.id,
  c.id,
  b.imagen_url,
  'muestra_color',
  b.nombre,
  row_number() OVER (ORDER BY m.line_slug, m.color_name),
  true
FROM catalog_v1_glomex_map m
JOIN public.productos_backup_v1 b ON b.nombre = m.legacy_name
JOIN public.catalog_products p ON p.slug = 'globo-latex-glomex'
JOIN public.catalog_product_lines l ON l.slug = m.line_slug
JOIN public.catalog_colors c ON c.slug = m.color_slug
JOIN public.catalog_sizes s ON s.numeric_value = 12 AND s.unit = 'pulgada'
JOIN public.catalog_variants v
  ON v.product_id = p.id
 AND v.line_id = l.id
 AND v.color_id = c.id
 AND v.size_id = s.id
WHERE NOT EXISTS (
  SELECT 1
  FROM public.catalog_product_images image
  WHERE image.image_url = b.imagen_url
);

-- Orbz: una familia con ocho variantes de color.
CREATE TEMP TABLE catalog_v1_orbz_map (
  legacy_name text PRIMARY KEY,
  color_name text NOT NULL,
  color_slug text NOT NULL,
  family_slug text NOT NULL
) ON COMMIT DROP;

INSERT INTO catalog_v1_orbz_map
  (legacy_name, color_name, color_slug, family_slug)
VALUES
  ('Orbz Azul 22 Pulg', 'Azul', 'azul', 'azul'),
  ('Orbz Azul Pastel 22 Pulg', 'Azul pastel', 'azul-pastel', 'azul'),
  ('Orbz Dorado 22 Pulg', 'Dorado', 'dorado', 'dorado'),
  ('Orbz Plata 22 Pulg', 'Plata', 'plata', 'plata'),
  ('Orbz Rojo 22 Pulg', 'Rojo', 'rojo', 'rojo'),
  ('Orbz Rosa Gold 22 Pulg', 'Rosa gold', 'rosa-gold', 'rosa'),
  ('Orbz Verde 22 Pulg', 'Verde', 'verde', 'verde'),
  ('Orbz Verde Manzana 22 Pulg', 'Verde manzana', 'verde-manzana', 'verde');

INSERT INTO public.catalog_colors
  (color_family_id, exact_name, slug, active)
SELECT f.id, m.color_name, m.color_slug, true
FROM catalog_v1_orbz_map m
JOIN public.catalog_color_families f ON f.slug = m.family_slug
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.catalog_products (
  category_id, brand_id, name, slug, short_description, description,
  main_image_url, listing_group_mode, active
)
SELECT
  category.id,
  brand.id,
  'Globos Orbz económicos',
  'globos-orbz-economicos',
  'Globos Orbz de 22 pulgadas. Elige el color.',
  'Globo esférico Orbz de 22 pulgadas, disponible por pieza.',
  backup.imagen_url,
  'product',
  true
FROM public.catalog_categories category
JOIN public.catalog_brands brand ON brand.slug = 'economico'
JOIN public.productos_backup_v1 backup ON backup.nombre = 'Orbz Azul 22 Pulg'
WHERE category.slug = 'globos-orbz';

INSERT INTO public.catalog_variants (
  product_id, color_id, size_id, sku, image_url, inventory_policy, active
)
SELECT
  product.id,
  color.id,
  size.id,
  'ORBZ-' || upper(replace(m.color_slug, '-', '_')) || '-22',
  backup.imagen_url,
  'shared_base_units',
  true
FROM catalog_v1_orbz_map m
JOIN public.productos_backup_v1 backup ON backup.nombre = m.legacy_name
JOIN public.catalog_products product ON product.slug = 'globos-orbz-economicos'
JOIN public.catalog_colors color ON color.slug = m.color_slug
JOIN public.catalog_sizes size
  ON size.numeric_value = 22 AND size.unit = 'pulgada'
ON CONFLICT ON CONSTRAINT catalog_variants_unique_combination DO NOTHING;

INSERT INTO public.catalog_sale_presentations (
  variant_id, name, presentation_type, base_unit,
  contained_quantity, contained_unit, base_units_total, base_price,
  sort_order, active
)
SELECT
  variant.id, 'Pieza', 'pieza', 'pieza',
  1, 'pieza', 1, backup.precio, 1, true
FROM catalog_v1_orbz_map m
JOIN public.productos_backup_v1 backup ON backup.nombre = m.legacy_name
JOIN public.catalog_products product ON product.slug = 'globos-orbz-economicos'
JOIN public.catalog_colors color ON color.slug = m.color_slug
JOIN public.catalog_sizes size
  ON size.numeric_value = 22 AND size.unit = 'pulgada'
JOIN public.catalog_variants variant
  ON variant.product_id = product.id
 AND variant.color_id = color.id
 AND variant.size_id = size.id;

INSERT INTO public.catalog_inventory
  (variant_id, sale_presentation_id, location_id, quantity)
SELECT variant.id, NULL, location.id, backup.stock_actual
FROM catalog_v1_orbz_map m
JOIN public.productos_backup_v1 backup ON backup.nombre = m.legacy_name
JOIN public.catalog_products product ON product.slug = 'globos-orbz-economicos'
JOIN public.catalog_colors color ON color.slug = m.color_slug
JOIN public.catalog_sizes size
  ON size.numeric_value = 22 AND size.unit = 'pulgada'
JOIN public.catalog_variants variant
  ON variant.product_id = product.id
 AND variant.color_id = color.id
 AND variant.size_id = size.id
JOIN public.catalog_locations location ON location.slug = 'sol-naciente';

INSERT INTO public.catalog_product_images (
  product_id, variant_id, color_id, image_url,
  image_type, alt_text, sort_order, active
)
SELECT
  product.id,
  variant.id,
  color.id,
  backup.imagen_url,
  'muestra_color',
  backup.nombre,
  row_number() OVER (ORDER BY m.color_name),
  true
FROM catalog_v1_orbz_map m
JOIN public.productos_backup_v1 backup ON backup.nombre = m.legacy_name
JOIN public.catalog_products product ON product.slug = 'globos-orbz-economicos'
JOIN public.catalog_colors color ON color.slug = m.color_slug
JOIN public.catalog_sizes size
  ON size.numeric_value = 22 AND size.unit = 'pulgada'
JOIN public.catalog_variants variant
  ON variant.product_id = product.id
 AND variant.color_id = color.id
 AND variant.size_id = size.id;

-- Letras LED: una familia y una variante por letra o simbolo.
INSERT INTO public.catalog_products (
  category_id, brand_id, name, slug, short_description, description,
  main_image_url, listing_group_mode, active
)
SELECT
  category.id,
  brand.id,
  'Letras LED decorativas',
  'letras-led-decorativas',
  'Letras LED decorativas. Elige una letra o símbolo.',
  'Letras luminosas para decoración de eventos y espacios.',
  backup.imagen_url,
  'product',
  true
FROM public.catalog_categories category
JOIN public.catalog_brands brand ON brand.slug = 'economico'
JOIN public.productos_backup_v1 backup ON backup.nombre = 'Letra A Led'
WHERE category.slug = 'decoracion';

INSERT INTO public.catalog_attributes
  (name, slug, data_type, filterable, variant_level, active, sort_order)
VALUES ('Letra o símbolo', 'letra-simbolo', 'text', true, true, true, 90)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.catalog_attribute_values
  (attribute_id, value, sort_order, active)
SELECT
  attribute.id,
  regexp_replace(backup.nombre, '^Letra (.*) Led$', '\1'),
  row_number() OVER (ORDER BY backup.nombre),
  true
FROM public.productos_backup_v1 backup
JOIN public.catalog_attributes attribute ON attribute.slug = 'letra-simbolo'
WHERE backup.categoria = 'Letras Led'
ON CONFLICT (attribute_id, value) DO NOTHING;

INSERT INTO public.catalog_variants (
  product_id, finish, sku, image_url, inventory_policy, active
)
SELECT
  product.id,
  regexp_replace(backup.nombre, '^Letra (.*) Led$', '\1'),
  'LED-' || upper(
    trim(both '_' from regexp_replace(
      extensions.unaccent(regexp_replace(backup.nombre, '^Letra (.*) Led$', '\1')),
      '[^a-zA-Z0-9]+',
      '_',
      'g'
    ))
  ) || '-' || upper(substr(backup.id::text, 1, 4)),
  backup.imagen_url,
  'shared_base_units',
  true
FROM public.productos_backup_v1 backup
JOIN public.catalog_products product ON product.slug = 'letras-led-decorativas'
WHERE backup.categoria = 'Letras Led'
ON CONFLICT ON CONSTRAINT catalog_variants_unique_combination DO NOTHING;

INSERT INTO public.catalog_variant_attribute_values
  (variant_id, attribute_value_id)
SELECT variant.id, value.id
FROM public.productos_backup_v1 backup
JOIN public.catalog_products product ON product.slug = 'letras-led-decorativas'
JOIN public.catalog_variants variant
  ON variant.product_id = product.id
 AND variant.finish = regexp_replace(backup.nombre, '^Letra (.*) Led$', '\1')
JOIN public.catalog_attributes attribute ON attribute.slug = 'letra-simbolo'
JOIN public.catalog_attribute_values value
  ON value.attribute_id = attribute.id
 AND value.value = variant.finish
WHERE backup.categoria = 'Letras Led'
ON CONFLICT DO NOTHING;

INSERT INTO public.catalog_sale_presentations (
  variant_id, name, presentation_type, base_unit,
  contained_quantity, contained_unit, base_units_total, base_price,
  sort_order, active
)
SELECT
  variant.id, 'Pieza', 'pieza', 'pieza',
  1, 'pieza', 1, backup.precio, 1, true
FROM public.productos_backup_v1 backup
JOIN public.catalog_products product ON product.slug = 'letras-led-decorativas'
JOIN public.catalog_variants variant
  ON variant.product_id = product.id
 AND variant.finish = regexp_replace(backup.nombre, '^Letra (.*) Led$', '\1')
WHERE backup.categoria = 'Letras Led';

INSERT INTO public.catalog_inventory
  (variant_id, sale_presentation_id, location_id, quantity)
SELECT variant.id, NULL, location.id, backup.stock_actual
FROM public.productos_backup_v1 backup
JOIN public.catalog_products product ON product.slug = 'letras-led-decorativas'
JOIN public.catalog_variants variant
  ON variant.product_id = product.id
 AND variant.finish = regexp_replace(backup.nombre, '^Letra (.*) Led$', '\1')
JOIN public.catalog_locations location ON location.slug = 'sol-naciente'
WHERE backup.categoria = 'Letras Led';

INSERT INTO public.catalog_product_images (
  product_id, variant_id, image_url,
  image_type, alt_text, sort_order, active
)
SELECT
  product.id,
  variant.id,
  backup.imagen_url,
  'galeria',
  backup.nombre,
  row_number() OVER (ORDER BY backup.nombre),
  true
FROM public.productos_backup_v1 backup
JOIN public.catalog_products product ON product.slug = 'letras-led-decorativas'
JOIN public.catalog_variants variant
  ON variant.product_id = product.id
 AND variant.finish = regexp_replace(backup.nombre, '^Letra (.*) Led$', '\1')
WHERE backup.categoria = 'Letras Led';

-- Los tres productos demo equivalentes se enriquecen con los datos reales.
UPDATE public.catalog_products product
SET
  category_id = category.id,
  brand_id = brand.id,
  name = backup.nombre,
  short_description = backup.descripcion,
  description = backup.descripcion,
  main_image_url = backup.imagen_url,
  new_until = CASE WHEN backup.es_nuevo THEN CURRENT_DATE + 30 END,
  active = backup.activo
FROM public.productos_backup_v1 backup
JOIN public.catalog_categories category ON category.slug = 'bases-y-montaje'
JOIN public.catalog_brands brand ON brand.slug = 'oasis'
WHERE product.slug = 'oasis-espuma-floral'
  AND backup.categoria = 'Oasis';

DELETE FROM public.catalog_inventory inventory
USING public.catalog_variants variant, public.catalog_products product
WHERE inventory.variant_id = variant.id
  AND variant.product_id = product.id
  AND product.slug = 'oasis-espuma-floral';

UPDATE public.catalog_variants variant
SET
  inventory_policy = 'shared_base_units',
  image_url = backup.imagen_url
FROM public.catalog_products product, public.productos_backup_v1 backup
WHERE variant.product_id = product.id
  AND product.slug = 'oasis-espuma-floral'
  AND backup.categoria = 'Oasis';

INSERT INTO public.catalog_inventory
  (variant_id, sale_presentation_id, location_id, quantity)
SELECT variant.id, NULL, location.id, backup.stock_actual
FROM public.catalog_products product
JOIN public.catalog_variants variant ON variant.product_id = product.id
JOIN public.productos_backup_v1 backup ON backup.categoria = 'Oasis'
JOIN public.catalog_locations location ON location.slug = 'sol-naciente'
WHERE product.slug = 'oasis-espuma-floral';

INSERT INTO public.catalog_price_tiers (
  sale_presentation_id, minimum_quantity, price_per_presentation, label
)
SELECT presentation.id, 48, 10.63, 'Mayoreo'
FROM public.catalog_products product
JOIN public.catalog_variants variant ON variant.product_id = product.id
JOIN public.catalog_sale_presentations presentation
  ON presentation.variant_id = variant.id
 AND presentation.presentation_type = 'pieza'
WHERE product.slug = 'oasis-espuma-floral'
  AND NOT EXISTS (
    SELECT 1 FROM public.catalog_price_tiers tier
    WHERE tier.sale_presentation_id = presentation.id
  );

UPDATE public.catalog_products product
SET
  category_id = category.id,
  brand_id = brand.id,
  name = backup.nombre,
  short_description = backup.descripcion,
  description = backup.descripcion,
  main_image_url = backup.imagen_url,
  new_until = CASE WHEN backup.es_nuevo THEN CURRENT_DATE + 30 END,
  active = backup.activo
FROM public.productos_backup_v1 backup
JOIN public.catalog_categories category ON category.slug = 'efectos-de-fiesta'
JOIN public.catalog_brands brand ON brand.slug = 'generico'
WHERE product.slug = 'espuma-nieve'
  AND backup.categoria = 'Espuma';

UPDATE public.catalog_variants variant
SET image_url = backup.imagen_url
FROM public.catalog_products product, public.productos_backup_v1 backup
WHERE variant.product_id = product.id
  AND product.slug = 'espuma-nieve'
  AND backup.categoria = 'Espuma';

UPDATE public.catalog_inventory inventory
SET quantity = backup.stock_actual,
    reserved_quantity = 0
FROM public.catalog_variants variant
JOIN public.catalog_products product ON product.id = variant.product_id
JOIN public.productos_backup_v1 backup ON backup.categoria = 'Espuma'
WHERE inventory.variant_id = variant.id
  AND inventory.sale_presentation_id IS NULL
  AND product.slug = 'espuma-nieve';

WITH source(minimum_quantity, maximum_quantity, price, label) AS (
  VALUES
    (12, 23, 30::numeric, 'Mayoreo 12'),
    (24, NULL::integer, 25::numeric, 'Mayoreo 24')
)
INSERT INTO public.catalog_price_tiers (
  sale_presentation_id, minimum_quantity, maximum_quantity,
  price_per_presentation, label
)
SELECT
  presentation.id,
  source.minimum_quantity,
  source.maximum_quantity,
  source.price,
  source.label
FROM source
JOIN public.catalog_products product ON product.slug = 'espuma-nieve'
JOIN public.catalog_variants variant ON variant.product_id = product.id
JOIN public.catalog_sale_presentations presentation
  ON presentation.variant_id = variant.id
 AND presentation.presentation_type = 'lata'
WHERE NOT EXISTS (
  SELECT 1 FROM public.catalog_price_tiers tier
  WHERE tier.sale_presentation_id = presentation.id
);

UPDATE public.catalog_products product
SET
  category_id = category.id,
  brand_id = brand.id,
  name = backup.nombre,
  short_description = backup.descripcion,
  description = backup.descripcion,
  main_image_url = backup.imagen_url,
  new_until = CASE WHEN backup.es_nuevo THEN CURRENT_DATE + 30 END,
  active = backup.activo
FROM public.productos_backup_v1 backup
JOIN public.catalog_categories category ON category.slug = 'inflado-y-helio'
JOIN public.catalog_brands brand ON brand.slug = 'glomex'
WHERE product.slug = 'bomba-manual-globos'
  AND backup.nombre = 'Bomba Para Inflar Globos Manual';

UPDATE public.catalog_variants variant
SET image_url = backup.imagen_url
FROM public.catalog_products product, public.productos_backup_v1 backup
WHERE variant.product_id = product.id
  AND product.slug = 'bomba-manual-globos'
  AND backup.nombre = 'Bomba Para Inflar Globos Manual';

UPDATE public.catalog_sale_presentations presentation
SET base_price = backup.precio
FROM public.catalog_variants variant
JOIN public.catalog_products product ON product.id = variant.product_id
JOIN public.productos_backup_v1 backup
  ON backup.nombre = 'Bomba Para Inflar Globos Manual'
WHERE presentation.variant_id = variant.id
  AND product.slug = 'bomba-manual-globos'
  AND presentation.presentation_type = 'pieza';

UPDATE public.catalog_inventory inventory
SET quantity = backup.stock_actual,
    reserved_quantity = 0
FROM public.catalog_variants variant
JOIN public.catalog_products product ON product.id = variant.product_id
JOIN public.productos_backup_v1 backup
  ON backup.nombre = 'Bomba Para Inflar Globos Manual'
WHERE inventory.variant_id = variant.id
  AND inventory.sale_presentation_id IS NULL
  AND product.slug = 'bomba-manual-globos';

INSERT INTO public.catalog_price_tiers (
  sale_presentation_id, minimum_quantity, price_per_presentation, label
)
SELECT presentation.id, 12, 40, 'Mayoreo'
FROM public.catalog_products product
JOIN public.catalog_variants variant ON variant.product_id = product.id
JOIN public.catalog_sale_presentations presentation
  ON presentation.variant_id = variant.id
 AND presentation.presentation_type = 'pieza'
WHERE product.slug = 'bomba-manual-globos'
  AND NOT EXISTS (
    SELECT 1 FROM public.catalog_price_tiers tier
    WHERE tier.sale_presentation_id = presentation.id
  );

INSERT INTO public.catalog_product_images (
  product_id, variant_id, image_url,
  image_type, alt_text, sort_order, active
)
SELECT
  product.id,
  variant.id,
  backup.imagen_url,
  'principal',
  backup.nombre,
  1,
  true
FROM public.productos_backup_v1 backup
JOIN public.catalog_products product
  ON product.slug = CASE backup.categoria
    WHEN 'Oasis' THEN 'oasis-espuma-floral'
    WHEN 'Espuma' THEN 'espuma-nieve'
    WHEN 'Infladora De Globos' THEN 'bomba-manual-globos'
  END
JOIN public.catalog_variants variant ON variant.product_id = product.id
WHERE backup.categoria IN ('Oasis', 'Espuma')
   OR backup.nombre = 'Bomba Para Inflar Globos Manual';

-- Articulos restantes: una familia simple por SKU legado.
CREATE TEMP TABLE catalog_v1_simple_source ON COMMIT DROP AS
SELECT
  backup.*,
  trim(both '-' from regexp_replace(
    extensions.unaccent(lower(backup.nombre)),
    '[^a-z0-9]+',
    '-',
    'g'
  )) AS product_slug,
  category_map.category_slug,
  CASE backup.marca
    WHEN 'Económico' THEN 'economico'
    WHEN 'El Bueno' THEN 'el-bueno'
    WHEN 'Genérico' THEN 'generico'
    WHEN 'Glomex' THEN 'glomex'
    WHEN 'Oasis' THEN 'oasis'
    WHEN 'Peyma' THEN 'peyma'
  END AS brand_slug,
  CASE backup.tamano
    WHEN '13Cm' THEN '13 cm'
    WHEN '396 Ml' THEN '396 ml'
    WHEN '400Ml' THEN '400 ml'
    WHEN '570Ml' THEN '570 ml'
    WHEN '18 Pulg' THEN '18 pulgadas'
    WHEN 'Número 16 Pulg' THEN '16 pulgadas'
    WHEN '22 Pulg' THEN '22 pulgadas'
    WHEN '250Ml' THEN '250 ml'
    WHEN '70Cm' THEN '70 cm'
  END AS size_name,
  CASE
    WHEN backup.nombre ~* '12 (pz|piezas)' THEN 12
    WHEN backup.nombre ~* '100 pzas' THEN 100
    WHEN backup.categoria = 'Carreras' THEN 2
    ELSE 1
  END::numeric AS contained_quantity,
  CASE
    WHEN backup.nombre ~* '(12 (pz|piezas)|100 pzas)'
      OR backup.categoria = 'Carreras'
      THEN 'paquete'
    WHEN backup.categoria IN ('Brillo Para Globo', 'Pegamento') THEN 'botella'
    ELSE 'pieza'
  END AS presentation_type
FROM public.productos_backup_v1 backup
JOIN catalog_v1_category_map category_map
  ON category_map.legacy_category = backup.categoria
WHERE backup.categoria NOT IN ('Globo Latex', 'Letras Led', 'Orbz', 'Oasis', 'Espuma')
  AND backup.nombre NOT IN ('Prueba', 'Bomba Para Inflar Globos Manual');

DO $$
BEGIN
  IF (SELECT count(*) FROM catalog_v1_simple_source) <> 21 THEN
    RAISE EXCEPTION 'Se esperaban 21 articulos simples';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM catalog_v1_simple_source source
    LEFT JOIN public.catalog_brands brand ON brand.slug = source.brand_slug
    WHERE brand.id IS NULL
  ) THEN
    RAISE EXCEPTION 'Hay marcas V1 sin mapeo explicito';
  END IF;
END;
$$;

INSERT INTO public.catalog_products (
  category_id, brand_id, name, slug, short_description, description,
  main_image_url, listing_group_mode, active, new_until
)
SELECT
  category.id,
  brand.id,
  source.nombre,
  source.product_slug,
  source.descripcion,
  source.descripcion,
  source.imagen_url,
  'product',
  source.activo,
  CASE WHEN source.es_nuevo THEN CURRENT_DATE + 30 END
FROM catalog_v1_simple_source source
JOIN public.catalog_categories category ON category.slug = source.category_slug
JOIN public.catalog_brands brand ON brand.slug = source.brand_slug;

INSERT INTO public.catalog_variants (
  product_id, size_id, sku, image_url, inventory_policy, active
)
SELECT
  product.id,
  size.id,
  'V1-' || upper(substr(replace(source.product_slug, '-', ''), 1, 24)) ||
    '-' || substr(source.id::text, 1, 8),
  source.imagen_url,
  'shared_base_units',
  source.activo
FROM catalog_v1_simple_source source
JOIN public.catalog_products product ON product.slug = source.product_slug
LEFT JOIN public.catalog_sizes size ON size.name = source.size_name;

INSERT INTO public.catalog_sale_presentations (
  variant_id, name, presentation_type, base_unit,
  contained_quantity, contained_unit, base_units_total, base_price,
  sort_order, active
)
SELECT
  variant.id,
  CASE
    WHEN source.contained_quantity = 1 THEN
      CASE source.presentation_type
        WHEN 'botella' THEN 'Botella'
        ELSE 'Pieza'
      END
    ELSE format('Paquete de %s piezas', source.contained_quantity::integer)
  END,
  source.presentation_type,
  'pieza',
  source.contained_quantity,
  'pieza',
  source.contained_quantity,
  source.precio,
  1,
  source.activo
FROM catalog_v1_simple_source source
JOIN public.catalog_products product ON product.slug = source.product_slug
JOIN public.catalog_variants variant ON variant.product_id = product.id;

WITH tier_source AS (
  SELECT
    source.id AS legacy_id,
    source.product_slug,
    (tier->>'cantidad_minima')::integer AS minimum_quantity,
    (tier->>'precio')::numeric AS price,
    NULLIF(tier->>'etiqueta', '') AS label
  FROM catalog_v1_simple_source source
  CROSS JOIN LATERAL jsonb_array_elements(
    COALESCE(source.precios_mayoreo, '[]'::jsonb)
  ) tier
  WHERE (tier->>'cantidad_minima')::integer > 1
),
ranked_tiers AS (
  SELECT
    tier_source.*,
    lead(minimum_quantity) OVER (
      PARTITION BY legacy_id ORDER BY minimum_quantity
    ) - 1 AS maximum_quantity
  FROM tier_source
)
INSERT INTO public.catalog_price_tiers (
  sale_presentation_id, minimum_quantity, maximum_quantity,
  price_per_presentation, label, active
)
SELECT
  presentation.id,
  tier.minimum_quantity,
  tier.maximum_quantity,
  tier.price,
  COALESCE(tier.label, 'Mayoreo'),
  true
FROM ranked_tiers tier
JOIN public.catalog_products product ON product.slug = tier.product_slug
JOIN public.catalog_variants variant ON variant.product_id = product.id
JOIN public.catalog_sale_presentations presentation
  ON presentation.variant_id = variant.id;

INSERT INTO public.catalog_inventory (
  variant_id, sale_presentation_id, location_id, quantity
)
SELECT
  variant.id,
  NULL,
  location.id,
  CASE
    -- V2 no tiene bandera de stock ilimitado. Esta reserva operativa conserva
    -- la disponibilidad del unico producto V1 marcado como ilimitado.
    WHEN source.stock_ilimitado THEN 999999 * source.contained_quantity
    ELSE source.stock_actual * source.contained_quantity
  END
FROM catalog_v1_simple_source source
JOIN public.catalog_products product ON product.slug = source.product_slug
JOIN public.catalog_variants variant ON variant.product_id = product.id
JOIN public.catalog_locations location ON location.slug = 'sol-naciente';

INSERT INTO public.catalog_product_images (
  product_id, variant_id, image_url,
  image_type, alt_text, sort_order, active
)
SELECT
  product.id,
  variant.id,
  source.imagen_url,
  'principal',
  source.nombre,
  1,
  source.activo
FROM catalog_v1_simple_source source
JOIN public.catalog_products product ON product.slug = source.product_slug
JOIN public.catalog_variants variant ON variant.product_id = product.id;

INSERT INTO public.catalog_collection_products
  (collection_id, product_id, sort_order)
SELECT collection.id, product.id, 50
FROM catalog_v1_simple_source source
JOIN public.catalog_products product ON product.slug = source.product_slug
JOIN public.catalog_collections collection ON collection.slug = 'nuevos'
WHERE source.es_nuevo
ON CONFLICT DO NOTHING;

INSERT INTO public.catalog_collection_products
  (collection_id, product_id, sort_order)
SELECT collection.id, product.id, 10
FROM public.catalog_collections collection
JOIN public.catalog_products product ON product.slug = 'primera-comunion'
WHERE collection.slug = 'primera-comunion'
ON CONFLICT DO NOTHING;

DO $$
DECLARE
  imported_images integer;
  glomex_mapped integer;
  led_variants integer;
  orbz_variants integer;
  imported_products integer;
  total_variants integer;
  total_inventory_rows integer;
  glomex_quantity numeric;
BEGIN
  SELECT count(DISTINCT image.image_url)
  INTO imported_images
  FROM public.catalog_product_images image
  JOIN public.productos_backup_v1 backup
    ON backup.imagen_url = image.image_url
  WHERE backup.nombre <> 'Prueba';

  SELECT count(*)
  INTO glomex_mapped
  FROM catalog_v1_glomex_map map
  JOIN public.catalog_product_lines line ON line.slug = map.line_slug
  JOIN public.catalog_colors color ON color.slug = map.color_slug
  JOIN public.catalog_sizes size
    ON size.numeric_value = 12 AND size.unit = 'pulgada'
  JOIN public.catalog_products product ON product.slug = 'globo-latex-glomex'
  JOIN public.catalog_variants variant
    ON variant.product_id = product.id
   AND variant.line_id = line.id
   AND variant.color_id = color.id
   AND variant.size_id = size.id;

  SELECT count(*)
  INTO led_variants
  FROM public.catalog_variants variant
  JOIN public.catalog_products product ON product.id = variant.product_id
  WHERE product.slug = 'letras-led-decorativas';

  SELECT count(*)
  INTO orbz_variants
  FROM public.catalog_variants variant
  JOIN public.catalog_products product ON product.id = variant.product_id
  WHERE product.slug = 'globos-orbz-economicos';

  SELECT count(*)
  INTO imported_products
  FROM public.catalog_products;

  SELECT count(*)
  INTO total_variants
  FROM public.catalog_variants;

  SELECT count(*)
  INTO total_inventory_rows
  FROM public.catalog_inventory;

  SELECT sum(inventory.quantity)
  INTO glomex_quantity
  FROM public.catalog_inventory inventory
  JOIN public.catalog_variants variant ON variant.id = inventory.variant_id
  JOIN public.catalog_products product ON product.id = variant.product_id
  WHERE product.slug = 'globo-latex-glomex';

  IF imported_images <> 104
     OR glomex_mapped <> 44
     OR led_variants <> 28
     OR orbz_variants <> 8
     OR imported_products <> 27
     OR total_variants <> 121
     OR total_inventory_rows <> 121
     OR glomex_quantity <> 98800 THEN
    RAISE EXCEPTION
      'Importacion incompleta: imagenes %, Glomex %, LED %, Orbz %, productos %, variantes %, inventarios %, existencia Glomex %',
      imported_images, glomex_mapped, led_variants, orbz_variants,
      imported_products, total_variants, total_inventory_rows, glomex_quantity;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.catalog_products product
    JOIN public.catalog_variants variant ON variant.product_id = product.id
    JOIN public.catalog_sale_presentations presentation
      ON presentation.variant_id = variant.id
    JOIN public.catalog_inventory inventory ON inventory.variant_id = variant.id
    WHERE product.slug = 'bomba-manual-globos'
      AND presentation.presentation_type = 'pieza'
      AND presentation.base_price = 45
      AND inventory.quantity = 2
  ) OR NOT EXISTS (
    SELECT 1
    FROM public.catalog_products product
    JOIN public.catalog_variants variant ON variant.product_id = product.id
    JOIN public.catalog_inventory inventory ON inventory.variant_id = variant.id
    WHERE product.slug = 'oasis-espuma-floral'
      AND variant.inventory_policy = 'shared_base_units'
      AND inventory.sale_presentation_id IS NULL
      AND inventory.quantity = 480
  ) OR NOT EXISTS (
    SELECT 1
    FROM public.catalog_products product
    JOIN public.catalog_variants variant ON variant.product_id = product.id
    JOIN public.catalog_inventory inventory ON inventory.variant_id = variant.id
    WHERE product.slug = 'espuma-nieve'
      AND inventory.sale_presentation_id IS NULL
      AND inventory.quantity = 200
  ) THEN
    RAISE EXCEPTION 'Fallaron las verificaciones de productos demo enriquecidos';
  END IF;
END;
$$;

COMMIT;
