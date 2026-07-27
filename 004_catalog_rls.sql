-- ═══════════════════════════════════════════════════════════════════════════
-- 004 — CATÁLOGO V2: ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════════════════
-- Ejecutar DESPUÉS de 003_catalog_constraints_indexes.sql. Idempotente.
--
-- Modelo (espejo de la matriz de permisos del panel):
--   Público (anon): SELECT solo de filas activas en tablas
--     de dominio. catalog_inventory NO es legible públicamente: la
--     disponibilidad se expone mediante RPCs SECURITY DEFINER (005).
--   Panel autenticado (viewer/empleado/manager/admin): SELECT de todo el
--     catálogo. Se separa de anon para evitar políticas permisivas duplicadas.
--   Escritura (INSERT/UPDATE): admin y manager.
--   Eliminación (DELETE): solo admin.
--
-- Jamás se otorga escritura anónima a ninguna tabla del catálogo.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ───────────────────────────────────────────────────────────────────────────
-- 1. TABLAS DE DOMINIO CON BANDERA active (público lee solo activas)
-- ───────────────────────────────────────────────────────────────────────────
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
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);

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

    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_manager_insert', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (public.has_role(ARRAY[''admin'',''manager'']))',
      t || '_manager_insert', t
    );

    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_manager_update', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (public.has_role(ARRAY[''admin'',''manager''])) WITH CHECK (public.has_role(ARRAY[''admin'',''manager'']))',
      t || '_manager_update', t
    );

    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_admin_delete', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (public.has_role(ARRAY[''admin'']))',
      t || '_admin_delete', t
    );

    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon, authenticated', t);
    EXECUTE format('GRANT SELECT ON TABLE public.%I TO anon', t);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.%I TO authenticated', t);
  END LOOP;
END;
$$;

-- ───────────────────────────────────────────────────────────────────────────
-- 2. TABLAS PUENTE SIN BANDERA active (lectura pública completa)
-- ───────────────────────────────────────────────────────────────────────────
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
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);

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

    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_manager_insert', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (public.has_role(ARRAY[''admin'',''manager'']))',
      t || '_manager_insert', t
    );

    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_manager_update', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (public.has_role(ARRAY[''admin'',''manager''])) WITH CHECK (public.has_role(ARRAY[''admin'',''manager'']))',
      t || '_manager_update', t
    );

    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_admin_delete', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (public.has_role(ARRAY[''admin'']))',
      t || '_admin_delete', t
    );

    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon, authenticated', t);
    EXECUTE format('GRANT SELECT ON TABLE public.%I TO anon', t);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.%I TO authenticated', t);
  END LOOP;
END;
$$;

-- ───────────────────────────────────────────────────────────────────────────
-- 3. INVENTARIO — SOLO PANEL (nunca lectura pública directa)
-- ───────────────────────────────────────────────────────────────────────────
ALTER TABLE public.catalog_inventory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS catalog_inventory_panel_select ON public.catalog_inventory;
CREATE POLICY catalog_inventory_panel_select
  ON public.catalog_inventory FOR SELECT
  TO authenticated
  USING (public.has_role(ARRAY['admin','manager','empleado','viewer']));

DROP POLICY IF EXISTS catalog_inventory_manager_insert ON public.catalog_inventory;
CREATE POLICY catalog_inventory_manager_insert
  ON public.catalog_inventory FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(ARRAY['admin','manager']));

DROP POLICY IF EXISTS catalog_inventory_manager_update ON public.catalog_inventory;
CREATE POLICY catalog_inventory_manager_update
  ON public.catalog_inventory FOR UPDATE
  TO authenticated
  USING (public.has_role(ARRAY['admin','manager']))
  WITH CHECK (public.has_role(ARRAY['admin','manager']));

DROP POLICY IF EXISTS catalog_inventory_admin_delete ON public.catalog_inventory;
CREATE POLICY catalog_inventory_admin_delete
  ON public.catalog_inventory FOR DELETE
  TO authenticated
  USING (public.has_role(ARRAY['admin']));

REVOKE ALL ON TABLE public.catalog_inventory FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.catalog_inventory TO authenticated;

-- ───────────────────────────────────────────────────────────────────────────
-- 4. UBICACIONES — legibles por el panel; público no las necesita
--    (las tarjetas públicas solo exponen disponibilidad agregada).
-- ───────────────────────────────────────────────────────────────────────────
ALTER TABLE public.catalog_locations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS catalog_locations_panel_select ON public.catalog_locations;
CREATE POLICY catalog_locations_panel_select
  ON public.catalog_locations FOR SELECT
  TO authenticated
  USING (public.has_role(ARRAY['admin','manager','empleado','viewer']));

DROP POLICY IF EXISTS catalog_locations_manager_insert ON public.catalog_locations;
CREATE POLICY catalog_locations_manager_insert
  ON public.catalog_locations FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(ARRAY['admin','manager']));

DROP POLICY IF EXISTS catalog_locations_manager_update ON public.catalog_locations;
CREATE POLICY catalog_locations_manager_update
  ON public.catalog_locations FOR UPDATE
  TO authenticated
  USING (public.has_role(ARRAY['admin','manager']))
  WITH CHECK (public.has_role(ARRAY['admin','manager']));

DROP POLICY IF EXISTS catalog_locations_admin_delete ON public.catalog_locations;
CREATE POLICY catalog_locations_admin_delete
  ON public.catalog_locations FOR DELETE
  TO authenticated
  USING (public.has_role(ARRAY['admin']));

REVOKE ALL ON TABLE public.catalog_locations FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.catalog_locations TO authenticated;

COMMIT;

-- Verificación (ejecutar aparte):
-- SELECT tablename, policyname, roles, cmd
-- FROM pg_policies
-- WHERE schemaname = 'public' AND tablename LIKE 'catalog\_%'
-- ORDER BY tablename, cmd, policyname;
