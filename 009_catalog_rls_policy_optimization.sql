-- 009 - CATALOGO V2: OPTIMIZACION DE POLITICAS SELECT
--
-- Evita dos politicas permisivas SELECT para authenticated. El catalogo
-- publico queda en anon y el panel autenticado conserva lectura completa
-- segun el rol del perfil.

BEGIN;

DO $$
DECLARE
  t TEXT;
  domain_tables TEXT[] := ARRAY[
    'catalog_categories',
    'catalog_collections',
    'catalog_brands',
    'catalog_product_lines',
    'catalog_color_families',
    'catalog_colors',
    'catalog_line_colors',
    'catalog_sizes',
    'catalog_products',
    'catalog_variants',
    'catalog_sale_presentations',
    'catalog_price_tiers',
    'catalog_product_images',
    'catalog_attributes',
    'catalog_attribute_values',
    'catalog_search_aliases'
  ];
BEGIN
  FOREACH t IN ARRAY domain_tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_public_select', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT TO anon USING (active = true)',
      t || '_public_select', t
    );

    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_panel_select', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (public.has_role(ARRAY[''admin'',''manager'',''empleado'',''viewer'']))',
      t || '_panel_select', t
    );
  END LOOP;
END;
$$;

DO $$
DECLARE
  t TEXT;
  junction_tables TEXT[] := ARRAY[
    'catalog_collection_products',
    'catalog_variant_attribute_values',
    'catalog_product_relations'
  ];
BEGIN
  FOREACH t IN ARRAY junction_tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_public_select', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT TO anon USING (true)',
      t || '_public_select', t
    );

    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_panel_select', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (public.has_role(ARRAY[''admin'',''manager'',''empleado'',''viewer'']))',
      t || '_panel_select', t
    );
  END LOOP;
END;
$$;

COMMIT;

NOTIFY pgrst, 'reload schema';
