-- ═══════════════════════════════════════════════════════════════════════════
-- 99 — CASOS DE PRUEBA OBLIGATORIOS (§33), PARTE 2: secciones I–L
-- ═══════════════════════════════════════════════════════════════════════════

\set ON_ERROR_STOP on

-- ─── I. Validación de carrito (§33 caso carrito) ────────────────────────────
DO $$
DECLARE
  v_variant UUID;
  v_bolsa UUID;
  v_result JSONB;
  v_line JSONB;
BEGIN
  SELECT v.id, sp.id INTO v_variant, v_bolsa
  FROM public.catalog_variants v
  JOIN public.catalog_sale_presentations sp ON sp.variant_id = v.id
  WHERE v.sku = 'GLOMEX-ESTANDAR-ROJO-12' AND sp.presentation_type = 'bolsa';

  SELECT public.catalog_validate_cart(jsonb_build_array(
    jsonb_build_object('variant_id', v_variant, 'sale_presentation_id', v_bolsa, 'quantity', 12)
  )) INTO v_result;

  IF (v_result->>'valid')::BOOLEAN IS NOT TRUE THEN
    RAISE EXCEPTION 'FAIL I1: carrito de 12 bolsas debería ser válido: %', v_result->'issues';
  END IF;
  v_line := v_result->'lines'->0;
  IF (v_line->>'precio')::NUMERIC <> 78 OR (v_line->>'subtotal')::NUMERIC <> 936 THEN
    RAISE EXCEPTION 'FAIL I2: 12 bolsas deben ser $78 c/u, subtotal $936: %', v_line;
  END IF;
  IF v_line->>'nivel_precio' <> 'Mayoreo' THEN
    RAISE EXCEPTION 'FAIL I3: el carrito debe indicar el nivel de precio Mayoreo';
  END IF;
  IF (v_line->>'contenido_total')::NUMERIC <> 1200 THEN
    RAISE EXCEPTION 'FAIL I4: contenido total debe ser 1200 globos';
  END IF;

  SELECT public.catalog_validate_cart(jsonb_build_array(
    jsonb_build_object('variant_id', v_variant, 'sale_presentation_id', v_bolsa, 'quantity', 99999)
  )) INTO v_result;
  IF (v_result->>'valid')::BOOLEAN IS TRUE THEN
    RAISE EXCEPTION 'FAIL I5: carrito con 99999 bolsas no debería ser válido';
  END IF;

  RAISE NOTICE 'PASS I: validación canónica del carrito con nivel de precio y contenido total';
END $$;

-- ─── J. Pedido: snapshot, inventario compartido/separado, idempotencia ─────
DO $$
DECLARE
  v_variant_globo UUID;
  v_caja_globo UUID;
  v_variant_oasis UUID;
  v_caja_oasis UUID;
  v_variant_espuma UUID;
  v_lata_espuma UUID;
  v_caja_espuma UUID;
  v_res_before NUMERIC;
  v_res_after NUMERIC;
  v_order JSONB;
  v_order2 JSONB;
  v_line JSONB;
  v_key UUID := gen_random_uuid();
  v_detalles JSONB;
BEGIN
  SELECT v.id, sp.id INTO v_variant_globo, v_caja_globo
  FROM public.catalog_variants v
  JOIN public.catalog_sale_presentations sp ON sp.variant_id = v.id
  WHERE v.sku = 'GLOMEX-ESTANDAR-ROJO-12' AND sp.presentation_type = 'caja';

  -- J1: pedido de 1 caja (inventario COMPARTIDO: reserva 1200 unidades base)
  SELECT reserved_quantity INTO v_res_before
  FROM public.catalog_inventory
  WHERE variant_id = v_variant_globo AND sale_presentation_id IS NULL;

  SELECT public.catalog_create_order(
    'Cliente Prueba', '4521234567', 'tienda', NULL,
    jsonb_build_array(jsonb_build_object(
      'variant_id', v_variant_globo, 'sale_presentation_id', v_caja_globo, 'quantity', 1)),
    v_key
  ) INTO v_order;

  IF (v_order->>'total')::NUMERIC <> 900 THEN
    RAISE EXCEPTION 'FAIL J1: total de 1 caja debe ser $900, es %', v_order->>'total';
  END IF;

  SELECT reserved_quantity INTO v_res_after
  FROM public.catalog_inventory
  WHERE variant_id = v_variant_globo AND sale_presentation_id IS NULL;
  IF v_res_after - v_res_before <> 1200 THEN
    RAISE EXCEPTION 'FAIL J2: la reserva compartida debió subir 1200, subió %', v_res_after - v_res_before;
  END IF;

  -- Snapshot completo en detalles_json
  SELECT detalles_json INTO v_detalles FROM public.pedidos WHERE folio = v_order->>'folio';
  v_line := v_detalles->0;
  IF v_line->>'presentacion' IS NULL OR (v_line->>'contenido_total')::NUMERIC <> 1200
     OR (v_line->>'precio')::NUMERIC <> 900 OR v_line->>'gama' <> 'Estándar'
     OR v_line->>'color' <> 'Rojo' OR v_line->>'medida' <> '12 pulgadas' THEN
    RAISE EXCEPTION 'FAIL J3: snapshot V2 incompleto: %', v_line;
  END IF;
  RAISE NOTICE 'PASS J1-J3: pedido por caja $900, reserva compartida +1200, snapshot completo';

  -- J2: idempotencia (mismo key, mismo folio, sin duplicar)
  SELECT public.catalog_create_order(
    'Cliente Prueba', '4521234567', 'tienda', NULL,
    jsonb_build_array(jsonb_build_object(
      'variant_id', v_variant_globo, 'sale_presentation_id', v_caja_globo, 'quantity', 1)),
    v_key
  ) INTO v_order2;
  IF v_order2->>'folio' <> v_order->>'folio' OR (v_order2->>'replay')::BOOLEAN IS NOT TRUE THEN
    RAISE EXCEPTION 'FAIL J4: replay idempotente no devolvió el mismo folio';
  END IF;
  SELECT reserved_quantity INTO v_res_after
  FROM public.catalog_inventory
  WHERE variant_id = v_variant_globo AND sale_presentation_id IS NULL;
  IF v_res_after - v_res_before <> 1200 THEN
    RAISE EXCEPTION 'FAIL J5: el replay duplicó la reserva de inventario';
  END IF;
  RAISE NOTICE 'PASS J4-J5: idempotencia sin duplicar pedido ni reserva';

  -- J3: inventario SEPARADO (oasis): reservar cajas no toca unidades base
  SELECT v.id, sp.id INTO v_variant_oasis, v_caja_oasis
  FROM public.catalog_variants v
  JOIN public.catalog_sale_presentations sp ON sp.variant_id = v.id
  JOIN public.catalog_products p ON p.id = v.product_id
  WHERE p.slug = 'oasis-espuma-floral' AND sp.presentation_type = 'caja';

  SELECT reserved_quantity INTO v_res_before
  FROM public.catalog_inventory
  WHERE variant_id = v_variant_oasis AND sale_presentation_id = v_caja_oasis;

  SELECT public.catalog_create_order(
    'Cliente Oasis', '4529876543', 'tienda', NULL,
    jsonb_build_array(jsonb_build_object(
      'variant_id', v_variant_oasis, 'sale_presentation_id', v_caja_oasis, 'quantity', 2))
  ) INTO v_order;

  IF (v_order->>'total')::NUMERIC <> 960 THEN
    RAISE EXCEPTION 'FAIL J6: 2 cajas de oasis deben ser $960';
  END IF;
  SELECT reserved_quantity INTO v_res_after
  FROM public.catalog_inventory
  WHERE variant_id = v_variant_oasis AND sale_presentation_id = v_caja_oasis;
  IF v_res_after - v_res_before <> 2 THEN
    RAISE EXCEPTION 'FAIL J7: la reserva separada debió subir 2 cajas, subió %', v_res_after - v_res_before;
  END IF;
  RAISE NOTICE 'PASS J6-J7: inventario separado reserva por presentación';

  -- J4: espuma por lata y por caja comparten unidades base
  SELECT v.id INTO v_variant_espuma
  FROM public.catalog_variants v
  JOIN public.catalog_products p ON p.id = v.product_id
  WHERE p.slug = 'espuma-nieve';
  SELECT id INTO v_lata_espuma FROM public.catalog_sale_presentations
  WHERE variant_id = v_variant_espuma AND presentation_type = 'lata';
  SELECT id INTO v_caja_espuma FROM public.catalog_sale_presentations
  WHERE variant_id = v_variant_espuma AND presentation_type = 'caja';

  SELECT reserved_quantity INTO v_res_before
  FROM public.catalog_inventory
  WHERE variant_id = v_variant_espuma AND sale_presentation_id IS NULL;

  SELECT public.catalog_create_order(
    'Cliente Espuma', '4525550000', 'tienda', NULL,
    jsonb_build_array(
      jsonb_build_object('variant_id', v_variant_espuma, 'sale_presentation_id', v_lata_espuma, 'quantity', 1),
      jsonb_build_object('variant_id', v_variant_espuma, 'sale_presentation_id', v_caja_espuma, 'quantity', 1))
  ) INTO v_order;

  IF (v_order->>'total')::NUMERIC <> 431 THEN
    RAISE EXCEPTION 'FAIL J8: 1 lata + 1 caja deben ser $431, es %', v_order->>'total';
  END IF;
  SELECT reserved_quantity INTO v_res_after
  FROM public.catalog_inventory
  WHERE variant_id = v_variant_espuma AND sale_presentation_id IS NULL;
  IF v_res_after - v_res_before <> 13 THEN
    RAISE EXCEPTION 'FAIL J9: la reserva debió subir 13 latas, subió %', v_res_after - v_res_before;
  END IF;
  RAISE NOTICE 'PASS J8-J9: lata y caja comparten unidades base correctamente';

  -- J5: sobreventa bloqueada
  BEGIN
    PERFORM public.catalog_create_order(
      'Cliente Exceso', '4521112222', 'tienda', NULL,
      jsonb_build_array(jsonb_build_object(
        'variant_id', v_variant_globo, 'sale_presentation_id', v_caja_globo, 'quantity', 999)));
    RAISE EXCEPTION 'FAIL J10: se permitió sobreventa';
  EXCEPTION WHEN invalid_parameter_value THEN
    IF SQLERRM NOT LIKE 'OUT_OF_STOCK%' THEN RAISE; END IF;
    RAISE NOTICE 'PASS J10: sobreventa bloqueada con OUT_OF_STOCK';
  END;
END $$;

-- ─── K. Compatibilidad V1 mientras convive ──────────────────────────────────
DO $$
DECLARE
  v_producto UUID;
  v_folio TEXT;
  v_pedido RECORD;
BEGIN
  SELECT id INTO v_producto FROM public.productos WHERE activo = true LIMIT 1;
  IF v_producto IS NULL THEN
    RAISE NOTICE 'SKIP K: no hay productos V1 en esta base de prueba';
    RETURN;
  END IF;

  INSERT INTO public.pedidos (cliente_nombre, cliente_telefono, tipo_entrega, total, detalles_json)
  VALUES (
    'Cliente Legacy', '4523334444', 'tienda', 1,
    jsonb_build_array(jsonb_build_object('id', v_producto, 'cantidad', 2))
  )
  RETURNING folio INTO v_folio;

  SELECT * INTO v_pedido FROM public.pedidos WHERE folio = v_folio;
  IF v_pedido.total = 1 THEN
    RAISE EXCEPTION 'FAIL K2: el trigger V1 no recalculó el total legacy';
  END IF;
  IF (v_pedido.detalles_json->0->>'id')::UUID <> v_producto THEN
    RAISE EXCEPTION 'FAIL K3: el snapshot V1 fue alterado';
  END IF;
  RAISE NOTICE 'PASS K: el flujo V1 sigue canonicalizando mientras convive';
END $$;

-- ─── L. RLS: público vs panel ───────────────────────────────────────────────
UPDATE public.catalog_products SET active = false WHERE slug = 'bomba-manual-globos';
INSERT INTO auth.users (id, email) VALUES
  ('11111111-1111-1111-1111-111111111111', 'admin@test.local'),
  ('22222222-2222-2222-2222-222222222222', 'viewer@test.local');
-- handle_new_user auto-crea ambos perfiles como viewer; se promueve al primero.
UPDATE public.profiles SET role = 'admin' WHERE id = '11111111-1111-1111-1111-111111111111';

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname IN ('productos_backup_v1', 'catalog_v1_object_backup')
      AND NOT c.relrowsecurity
  ) THEN
    RAISE EXCEPTION 'FAIL L0: una tabla de respaldo no tiene RLS';
  END IF;
  RAISE NOTICE 'PASS L0: respaldos internos protegidos con RLS';
END $$;

SET ROLE anon;

DO $$
DECLARE n INT;
BEGIN
  -- L0b: anon no puede leer los respaldos internos.
  BEGIN
    PERFORM count(*) FROM public.productos_backup_v1;
    RAISE EXCEPTION 'FAIL L0b: anon leyó productos_backup_v1';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'PASS L0b: anon no lee respaldos internos';
  END;

  -- L1: anon no puede leer inventario
  BEGIN
    PERFORM count(*) FROM public.catalog_inventory;
    RAISE EXCEPTION 'FAIL L1: anon leyó catalog_inventory';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'PASS L1: anon no lee catalog_inventory';
  END;

  -- L2: anon solo lee productos activos
  SELECT count(*) INTO n FROM public.catalog_products;
  IF n <> 3 THEN RAISE EXCEPTION 'FAIL L2: anon ve % productos, esperaba 3 (1 inactivo oculto)', n; END IF;
  RAISE NOTICE 'PASS L2: anon solo lee productos activos';

  -- L3: anon no puede escribir en el catálogo
  BEGIN
    INSERT INTO public.catalog_products (category_id, name, slug)
    SELECT id, 'hack', 'hack' FROM public.catalog_categories LIMIT 1;
    RAISE EXCEPTION 'FAIL L3: anon insertó en catalog_products';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'PASS L3: anon no puede insertar en el catálogo';
  END;

  -- L4: anon SÍ puede ejecutar las RPCs públicas (solo exponen activos)
  PERFORM public.catalog_list_cards(p_category_slug := 'globos-latex');
  PERFORM public.catalog_get_product_detail('globo-latex-glomex');
  PERFORM public.catalog_get_facets('globos-latex');
  PERFORM public.catalog_search('globo');
  RAISE NOTICE 'PASS L4: RPCs públicas ejecutables por anon';

  -- L5: el producto inactivo no aparece en tarjetas
  IF (SELECT (public.catalog_list_cards(p_category_slug := 'inflado-y-helio'))->>'total')::INT <> 0 THEN
    RAISE EXCEPTION 'FAIL L5: producto inactivo visible en tarjetas';
  END IF;
  RAISE NOTICE 'PASS L5: productos inactivos excluidos de tarjetas';

  -- L6: anon puede crear pedido solo por RPC controlada
  PERFORM public.catalog_create_order(
    'Cliente RLS', '4527778888', 'tienda', NULL,
    (SELECT jsonb_build_array(jsonb_build_object(
      'variant_id', v.id, 'sale_presentation_id', sp.id, 'quantity', 1))
     FROM public.catalog_variants v
     JOIN public.catalog_sale_presentations sp ON sp.variant_id = v.id
     WHERE v.sku = 'GLOMEX-ESTANDAR-AZUL_REY-12' AND sp.presentation_type = 'bolsa'));
  RAISE NOTICE 'PASS L6: anon crea pedido solo vía RPC controlada';
END $$;

RESET ROLE;

-- L7: panel admin puede escribir y borrar
SET test.uid = '11111111-1111-1111-1111-111111111111';
SET ROLE authenticated;

DO $$
BEGIN
  INSERT INTO public.catalog_products (category_id, name, slug)
  SELECT id, 'Producto RLS admin', 'producto-rls-admin' FROM public.catalog_categories LIMIT 1;
  DELETE FROM public.catalog_products WHERE slug = 'producto-rls-admin';
  RAISE NOTICE 'PASS L7: admin escribe y borra en el catálogo';
END $$;

RESET ROLE;

-- L8/L9: viewer lee inventario pero no puede escribir
SET test.uid = '22222222-2222-2222-2222-222222222222';
SET ROLE authenticated;

DO $$
BEGIN
  PERFORM count(*) FROM public.catalog_inventory;
  PERFORM count(*) FROM public.catalog_collection_products;
  RAISE NOTICE 'PASS L8: viewer lee inventario y tablas puente (panel)';
  BEGIN
    INSERT INTO public.catalog_products (category_id, name, slug)
    SELECT id, 'hack', 'hack-2' FROM public.catalog_categories LIMIT 1;
    RAISE EXCEPTION 'FAIL L9: viewer insertó en el catálogo';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'PASS L9: viewer no puede escribir en el catálogo';
  END;
END $$;

RESET ROLE;
RESET test.uid;
UPDATE public.catalog_products SET active = true WHERE slug = 'bomba-manual-globos';

SELECT '══ TODOS LOS CASOS DE PRUEBA + RLS PASARON ══' AS resultado;
