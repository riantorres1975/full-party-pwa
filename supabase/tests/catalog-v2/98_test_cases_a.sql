-- ═══════════════════════════════════════════════════════════════════════════
-- 98 — CASOS DE PRUEBA OBLIGATORIOS (§33), PARTE 1: secciones A–H
-- Harness local (no forma parte del repo). Cada bloque levanta excepción
-- si falla; en éxito emite NOTICE 'PASS'.
-- ═══════════════════════════════════════════════════════════════════════════

\set ON_ERROR_STOP on

-- ─── A. Seeds básicos ───────────────────────────────────────────────────────
DO $$
BEGIN
  IF (SELECT count(*) FROM public.catalog_categories) < 15 THEN
    RAISE EXCEPTION 'FAIL A1: categorías insuficientes';
  END IF;
  IF (SELECT count(*) FROM public.catalog_colors) < 35 THEN
    RAISE EXCEPTION 'FAIL A2: colores insuficientes';
  END IF;
  IF (SELECT count(*) FROM public.catalog_locations) <> 3 THEN
    RAISE EXCEPTION 'FAIL A3: sucursales esperadas = 3';
  END IF;
  RAISE NOTICE 'PASS A: seeds de catálogos base';
END $$;

-- ─── B. Globo con mayoreo (§33 caso 1) ──────────────────────────────────────
DO $$
DECLARE
  v_bolsa UUID;
  v_price NUMERIC;
  r RECORD;
BEGIN
  SELECT sp.id INTO v_bolsa
  FROM public.catalog_sale_presentations sp
  JOIN public.catalog_variants v ON v.id = sp.variant_id
  WHERE v.sku = 'GLOMEX-ESTANDAR-ROJO-12' AND sp.presentation_type = 'bolsa';

  IF v_bolsa IS NULL THEN RAISE EXCEPTION 'FAIL B0: no existe bolsa Estándar Rojo 12'; END IF;

  SELECT unit_price INTO v_price FROM public.catalog_resolve_price(v_bolsa, 11);
  IF v_price <> 85 THEN RAISE EXCEPTION 'FAIL B1: 11 bolsas deberían costar 85, dio %', v_price; END IF;

  SELECT unit_price INTO v_price FROM public.catalog_resolve_price(v_bolsa, 12);
  IF v_price <> 78 THEN RAISE EXCEPTION 'FAIL B2: 12 bolsas deberían costar 78, dio %', v_price; END IF;

  SELECT unit_price INTO v_price FROM public.catalog_resolve_price(v_bolsa, 20);
  IF v_price <> 78 THEN RAISE EXCEPTION 'FAIL B3: 20 bolsas deberían costar 78, dio %', v_price; END IF;

  SELECT * INTO r FROM public.catalog_resolve_price(v_bolsa, 5);
  IF r.next_tier_minimum <> 12 OR r.next_tier_quantity_missing <> 7 OR r.next_tier_price <> 78 THEN
    RAISE EXCEPTION 'FAIL B4: siguiente nivel incorrecto: %', r;
  END IF;
  IF r.subtotal <> 425 THEN RAISE EXCEPTION 'FAIL B5: subtotal 5x85 debería ser 425, dio %', r.subtotal; END IF;

  RAISE NOTICE 'PASS B: precios de mayoreo (11 a 85, 12 a 78, 20 a 78, siguiente nivel)';
END $$;

-- ─── C. Globo por caja (§33 caso 2) ─────────────────────────────────────────
DO $$
DECLARE
  v_caja RECORD;
BEGIN
  SELECT sp.* INTO v_caja
  FROM public.catalog_sale_presentations sp
  JOIN public.catalog_variants v ON v.id = sp.variant_id
  WHERE v.sku = 'GLOMEX-ESTANDAR-ROJO-12' AND sp.presentation_type = 'caja';

  IF v_caja.base_units_total <> 1200 THEN
    RAISE EXCEPTION 'FAIL C1: la caja debería equivaler a 1200 globos, equivale a %', v_caja.base_units_total;
  END IF;
  IF v_caja.base_price <> 900 THEN
    RAISE EXCEPTION 'FAIL C2: el precio de caja debería ser 900 (independiente), es %', v_caja.base_price;
  END IF;
  IF v_caja.contains_presentation_id IS NULL OR v_caja.contains_quantity <> 12 THEN
    RAISE EXCEPTION 'FAIL C3: la caja debe contener 12 bolsas (presentación anidada)';
  END IF;
  RAISE NOTICE 'PASS C: caja = 12 bolsas = 1200 globos, precio independiente $900';
END $$;

-- ─── D. Oasis sin bolsa (§33 caso 3) y Espuma con latas (§33 caso 4) ───────
DO $$
DECLARE
  v_n INT;
  v_base_unit TEXT;
  v_contained NUMERIC;
  v_nested BOOLEAN;
BEGIN
  SELECT count(*) INTO v_n
  FROM public.catalog_sale_presentations sp
  JOIN public.catalog_variants v ON v.id = sp.variant_id
  JOIN public.catalog_products p ON p.id = v.product_id
  WHERE p.slug = 'oasis-espuma-floral';
  IF v_n <> 1 THEN RAISE EXCEPTION 'FAIL D1: oasis debe tener exactamente 1 presentación, tiene %', v_n; END IF;

  SELECT sp.base_unit, sp.contained_quantity
    INTO v_base_unit, v_contained
  FROM public.catalog_sale_presentations sp
  JOIN public.catalog_variants v ON v.id = sp.variant_id
  JOIN public.catalog_products p ON p.id = v.product_id
  WHERE p.slug = 'oasis-espuma-floral' AND sp.presentation_type = 'caja';
  IF v_base_unit <> 'pieza' OR v_contained <> 48 THEN
    RAISE EXCEPTION 'FAIL D2: oasis debe ser caja de 48 piezas';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.catalog_sale_presentations sp
    JOIN public.catalog_variants v ON v.id = sp.variant_id
    JOIN public.catalog_products p ON p.id = v.product_id
    WHERE p.slug = 'espuma-nieve' AND sp.presentation_type = 'caja'
      AND sp.contained_unit IS NULL AND sp.contains_presentation_id IS NOT NULL
  ) INTO v_nested;
  IF NOT v_nested THEN
    RAISE EXCEPTION 'FAIL D3: la caja de espuma debe anidar 12 latas (contains_presentation_id)';
  END IF;

  RAISE NOTICE 'PASS D: oasis (caja 48 piezas, sin bolsa) y espuma (caja anida 12 latas)';
END $$;

-- ─── E. Bomba manual simple (§33 caso 5) ────────────────────────────────────
DO $$
DECLARE
  v_n INT;
  v_nulls INT;
BEGIN
  SELECT count(*) INTO v_n
  FROM public.catalog_variants v
  JOIN public.catalog_products p ON p.id = v.product_id
  WHERE p.slug = 'bomba-manual-globos';
  IF v_n <> 1 THEN RAISE EXCEPTION 'FAIL E1: bomba debe tener 1 variante'; END IF;

  SELECT count(*) INTO v_nulls
  FROM public.catalog_variants v
  JOIN public.catalog_products p ON p.id = v.product_id
  WHERE p.slug = 'bomba-manual-globos'
    AND v.line_id IS NULL AND v.color_id IS NULL AND v.size_id IS NULL;
  IF v_nulls <> 1 THEN RAISE EXCEPTION 'FAIL E2: la variante de bomba no debe tener gama/color/medida'; END IF;

  RAISE NOTICE 'PASS E: producto simple sin gama/color/medida';
END $$;

-- ─── F. Combinación inexistente (§33 caso 6) ────────────────────────────────
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.catalog_variants v
    JOIN public.catalog_product_lines l ON l.id = v.line_id
    JOIN public.catalog_colors c ON c.id = v.color_id
    JOIN public.catalog_sizes s ON s.id = v.size_id
    WHERE l.slug = 'glomex-chrome' AND c.slug = 'dorado' AND s.numeric_value = 5
  ) THEN
    RAISE EXCEPTION 'FAIL F: se creó Chrome Dorado 5 pulgadas (combinación inexistente)';
  END IF;
  RAISE NOTICE 'PASS F: Chrome Dorado 5 pulgadas no existe ni puede seleccionarse';
END $$;

-- ─── G. Constraints: variante duplicada, traslape de escalones, ciclo ──────
DO $$
DECLARE
  v_variant RECORD;
  v_bolsa UUID;
  v_a UUID;
  v_b UUID;
BEGIN
  SELECT * INTO v_variant FROM public.catalog_variants WHERE sku = 'GLOMEX-ESTANDAR-ROJO-12';

  -- G1: variante duplicada
  BEGIN
    INSERT INTO public.catalog_variants (product_id, line_id, color_id, size_id)
    VALUES (v_variant.product_id, v_variant.line_id, v_variant.color_id, v_variant.size_id);
    RAISE EXCEPTION 'FAIL G1: se permitió variante duplicada';
  EXCEPTION WHEN unique_violation THEN
    RAISE NOTICE 'PASS G1: variante duplicada rechazada';
  END;

  -- G2: escalón traslapado
  SELECT sp.id INTO v_bolsa
  FROM public.catalog_sale_presentations sp
  WHERE sp.variant_id = v_variant.id AND sp.presentation_type = 'bolsa';
  BEGIN
    INSERT INTO public.catalog_price_tiers (sale_presentation_id, minimum_quantity, price_per_presentation)
    VALUES (v_bolsa, 10, 80);
    RAISE EXCEPTION 'FAIL G2: se permitió escalón traslapado';
  EXCEPTION WHEN exclusion_violation THEN
    RAISE NOTICE 'PASS G2: escalón traslapado rechazado';
  END;

  -- G3: ciclo de presentaciones
  INSERT INTO public.catalog_sale_presentations (
    variant_id, name, presentation_type, contained_quantity, contained_unit,
    base_units_total, base_price
  ) VALUES (v_variant.id, 'Bolsa test ciclo A', 'bolsa', 10, 'pieza', 10, 10)
  RETURNING id INTO v_a;
  INSERT INTO public.catalog_sale_presentations (
    variant_id, name, presentation_type, contains_presentation_id, contains_quantity,
    base_units_total, base_price
  ) VALUES (v_variant.id, 'Caja test ciclo B', 'caja', v_a, 2, 20, 18)
  RETURNING id INTO v_b;
  BEGIN
    UPDATE public.catalog_sale_presentations
    SET contains_presentation_id = v_b, contained_quantity = NULL
    WHERE id = v_a;
    RAISE EXCEPTION 'FAIL G3: se permitió ciclo de presentaciones';
  EXCEPTION WHEN invalid_parameter_value THEN
    RAISE NOTICE 'PASS G3: ciclo de presentaciones rechazado';
  END;
  DELETE FROM public.catalog_sale_presentations WHERE id IN (v_a, v_b);

  -- G4: reservado mayor que existente
  BEGIN
    INSERT INTO public.catalog_inventory (variant_id, sale_presentation_id, location_id, quantity, reserved_quantity)
    SELECT v_variant.id, NULL, id, 10, 11 FROM public.catalog_locations LIMIT 1;
    RAISE EXCEPTION 'FAIL G4: se permitió reserved > quantity';
  EXCEPTION WHEN check_violation THEN
    RAISE NOTICE 'PASS G4: reserved_quantity <= quantity enforced';
  END;
END $$;

-- ─── H. RPC tarjetas / detalle / facetas / búsqueda ─────────────────────────
DO $$
DECLARE
  v_cards JSONB;
  v_detail JSONB;
  v_facets JSONB;
  v_n INT;
  v_card JSONB;
  v_variant JSONB;
  v_pres JSONB;
BEGIN
  -- H1: tarjetas agrupadas por gama (4 gamas, no una tarjeta por color)
  SELECT public.catalog_list_cards(p_category_slug := 'globos-latex') INTO v_cards;
  IF (v_cards->>'total')::INT <> 4 THEN
    RAISE EXCEPTION 'FAIL H1: se esperaban 4 tarjetas (gamas), hay %', v_cards->>'total';
  END IF;

  SELECT c INTO v_card FROM jsonb_array_elements(v_cards->'cards') c
  WHERE c->>'line_slug' = 'glomex-estandar';
  IF (v_card->>'color_count')::INT <> 5 THEN
    RAISE EXCEPTION 'FAIL H2: Estándar debe mostrar 5 colores, muestra %', v_card->>'color_count';
  END IF;
  IF jsonb_array_length(v_card->'sizes') <> 3 THEN
    RAISE EXCEPTION 'FAIL H3: Estándar debe mostrar 3 medidas (5/10/12)';
  END IF;
  IF (v_card->>'min_price')::NUMERIC <> 85 THEN
    RAISE EXCEPTION 'FAIL H4: precio desde debería ser 85';
  END IF;
  IF (v_card->>'in_stock')::BOOLEAN IS NOT TRUE THEN
    RAISE EXCEPTION 'FAIL H5: la tarjeta debería estar en existencia';
  END IF;
  RAISE NOTICE 'PASS H: tarjetas agrupadas por gama con colores, medidas y precio desde';

  -- H2: detalle completo
  SELECT public.catalog_get_product_detail('globo-latex-glomex') INTO v_detail;
  SELECT count(*) INTO v_n FROM jsonb_array_elements(v_detail->'variants');
  IF v_n <> 25 THEN RAISE EXCEPTION 'FAIL H6: se esperaban 25 variantes, hay %', v_n; END IF;

  SELECT v INTO v_variant FROM jsonb_array_elements(v_detail->'variants') v
  WHERE v->>'sku' = 'GLOMEX-ESTANDAR-ROJO-12';
  IF jsonb_array_length(v_variant->'presentations') <> 2 THEN
    RAISE EXCEPTION 'FAIL H7: Estándar Rojo 12 debe tener 2 presentaciones';
  END IF;

  SELECT p INTO v_pres FROM jsonb_array_elements(v_variant->'presentations') p
  WHERE p->>'presentation_type' = 'bolsa';
  IF (v_pres->>'base_price')::NUMERIC <> 85 OR jsonb_array_length(v_pres->'tiers') <> 1 THEN
    RAISE EXCEPTION 'FAIL H8: bolsa debe ser $85 con 1 escalón';
  END IF;
  IF (v_pres->>'available_quantity')::INT <> 240 THEN
    RAISE EXCEPTION 'FAIL H9: disponibilidad de bolsa debería ser 240, es %', v_pres->>'available_quantity';
  END IF;

  SELECT p INTO v_pres FROM jsonb_array_elements(v_variant->'presentations') p
  WHERE p->>'presentation_type' = 'caja';
  IF (v_pres->>'available_quantity')::INT <> 20 THEN
    RAISE EXCEPTION 'FAIL H10: disponibilidad de caja debería ser 20, es %', v_pres->>'available_quantity';
  END IF;
  RAISE NOTICE 'PASS H2: detalle con variantes, presentaciones, escalones y disponibilidad';

  -- H3: facetas
  SELECT public.catalog_get_facets('globos-latex') INTO v_facets;
  IF jsonb_array_length(v_facets->'lines') <> 4 THEN
    RAISE EXCEPTION 'FAIL H11: facetas deben incluir 4 gamas';
  END IF;
  IF jsonb_array_length(v_facets->'colors') = 0 OR jsonb_array_length(v_facets->'sizes') <> 3 THEN
    RAISE EXCEPTION 'FAIL H12: facetas de colores/medidas incorrectas';
  END IF;
  RAISE NOTICE 'PASS H3: facetas dinámicas con conteos';

  -- H4: búsqueda con gama+color+medida y con alias
  SELECT public.catalog_search('glomex pastel rosa 12') INTO v_cards;
  IF (v_cards->>'total')::INT < 1 THEN
    RAISE EXCEPTION 'FAIL H13: búsqueda "glomex pastel rosa 12" sin resultados';
  END IF;
  SELECT public.catalog_search('cromado') INTO v_cards;
  IF NOT EXISTS (
    SELECT 1 FROM jsonb_array_elements(v_cards->'cards') c
    WHERE c->>'line_slug' = 'glomex-chrome'
  ) THEN
    RAISE EXCEPTION 'FAIL H14: el alias "cromado" no devolvió la gama Chrome';
  END IF;
  RAISE NOTICE 'PASS H4: búsqueda por gama/color/medida y por alias';
END $$;
