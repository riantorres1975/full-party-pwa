-- ============================================================================
-- 010 - CATALOGO V2: OPERACIONES COMERCIALES POR LOTES
-- ============================================================================
-- Aplica cada fila en una subtransaccion: una fila fallida no deja variantes
-- incompletas ni impide procesar las demas. SECURITY INVOKER conserva RLS.
-- ============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.catalog_admin_apply_commercial_rows(
  p_product_id UUID,
  p_rows JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_row JSONB;
  v_variant JSONB;
  v_presentation JSONB;
  v_tier JSONB;
  v_inventory JSONB;
  v_box JSONB;
  v_variant_id UUID;
  v_presentation_id UUID;
  v_contains_id UUID;
  v_box_id UUID;
  v_tier_id UUID;
  v_inventory_id UUID;
  v_action TEXT;
  v_results JSONB := '[]'::JSONB;
BEGIN
  IF NOT public.has_role(ARRAY['admin', 'manager']) THEN
    RAISE EXCEPTION 'catalog bulk write requires admin or manager'
      USING ERRCODE = '42501';
  END IF;

  IF p_product_id IS NULL
     OR NOT EXISTS (SELECT 1 FROM public.catalog_products WHERE id = p_product_id) THEN
    RAISE EXCEPTION 'catalog product not found' USING ERRCODE = 'P0002';
  END IF;

  IF jsonb_typeof(p_rows) IS DISTINCT FROM 'array'
     OR jsonb_array_length(p_rows) = 0
     OR jsonb_array_length(p_rows) > 50 THEN
    RAISE EXCEPTION 'catalog bulk batch must contain between 1 and 50 rows'
      USING ERRCODE = '22023';
  END IF;

  FOR v_row IN SELECT value FROM jsonb_array_elements(p_rows)
  LOOP
    BEGIN
      v_contains_id := NULL;
      v_box_id := NULL;
      v_tier_id := NULL;
      v_inventory_id := NULL;
      v_variant := COALESCE(v_row -> 'variant', '{}'::JSONB);
      v_presentation := COALESCE(v_row -> 'presentation', '{}'::JSONB);
      v_tier := NULLIF(v_row -> 'tier', 'null'::JSONB);
      v_inventory := NULLIF(v_row -> 'inventory', 'null'::JSONB);
      v_box := NULLIF(v_row -> 'box', 'null'::JSONB);
      v_variant_id := NULLIF(v_variant ->> 'id', '')::UUID;
      v_presentation_id := NULLIF(v_presentation ->> 'id', '')::UUID;
      v_action := 'updated';

      IF v_variant_id IS NOT NULL THEN
        UPDATE public.catalog_variants
        SET
          line_id = NULLIF(v_variant ->> 'line_id', '')::UUID,
          color_id = NULLIF(v_variant ->> 'color_id', '')::UUID,
          size_id = NULLIF(v_variant ->> 'size_id', '')::UUID,
          finish = NULLIF(BTRIM(v_variant ->> 'finish'), ''),
          sku = NULLIF(BTRIM(v_variant ->> 'sku'), ''),
          barcode = NULLIF(BTRIM(v_variant ->> 'barcode'), ''),
          image_url = NULLIF(BTRIM(v_variant ->> 'image_url'), ''),
          inventory_policy = COALESCE(NULLIF(v_variant ->> 'inventory_policy', ''), 'shared_base_units'),
          active = COALESCE((v_variant ->> 'active')::BOOLEAN, TRUE),
          updated_at = NOW()
        WHERE id = v_variant_id AND product_id = p_product_id
        RETURNING id INTO v_variant_id;
        IF v_variant_id IS NULL THEN
          RAISE EXCEPTION 'variant does not belong to selected product';
        END IF;
      ELSE
        SELECT id INTO v_variant_id
        FROM public.catalog_variants
        WHERE product_id = p_product_id
          AND line_id IS NOT DISTINCT FROM NULLIF(v_variant ->> 'line_id', '')::UUID
          AND color_id IS NOT DISTINCT FROM NULLIF(v_variant ->> 'color_id', '')::UUID
          AND size_id IS NOT DISTINCT FROM NULLIF(v_variant ->> 'size_id', '')::UUID
          AND finish IS NOT DISTINCT FROM NULLIF(BTRIM(v_variant ->> 'finish'), '')
        LIMIT 1;

        IF v_variant_id IS NULL THEN
          INSERT INTO public.catalog_variants (
            product_id, line_id, color_id, size_id, finish, sku, barcode,
            image_url, inventory_policy, active
          ) VALUES (
            p_product_id,
            NULLIF(v_variant ->> 'line_id', '')::UUID,
            NULLIF(v_variant ->> 'color_id', '')::UUID,
            NULLIF(v_variant ->> 'size_id', '')::UUID,
            NULLIF(BTRIM(v_variant ->> 'finish'), ''),
            NULLIF(BTRIM(v_variant ->> 'sku'), ''),
            NULLIF(BTRIM(v_variant ->> 'barcode'), ''),
            NULLIF(BTRIM(v_variant ->> 'image_url'), ''),
            COALESCE(NULLIF(v_variant ->> 'inventory_policy', ''), 'shared_base_units'),
            COALESCE((v_variant ->> 'active')::BOOLEAN, TRUE)
          )
          RETURNING id INTO v_variant_id;
          v_action := 'created';
        ELSE
          UPDATE public.catalog_variants
          SET
            sku = NULLIF(BTRIM(v_variant ->> 'sku'), ''),
            barcode = NULLIF(BTRIM(v_variant ->> 'barcode'), ''),
            image_url = NULLIF(BTRIM(v_variant ->> 'image_url'), ''),
            inventory_policy = COALESCE(NULLIF(v_variant ->> 'inventory_policy', ''), inventory_policy),
            active = COALESCE((v_variant ->> 'active')::BOOLEAN, active),
            updated_at = NOW()
          WHERE id = v_variant_id;
        END IF;
      END IF;

      IF NULLIF(BTRIM(v_presentation ->> 'contains_presentation_name'), '') IS NOT NULL THEN
        SELECT id INTO v_contains_id
        FROM public.catalog_sale_presentations
        WHERE variant_id = v_variant_id
          AND LOWER(name) = LOWER(BTRIM(v_presentation ->> 'contains_presentation_name'))
        LIMIT 1;
        IF v_contains_id IS NULL THEN
          RAISE EXCEPTION 'contained presentation not found: %',
            v_presentation ->> 'contains_presentation_name';
        END IF;
      ELSE
        v_contains_id := NULL;
      END IF;

      IF v_presentation_id IS NULL THEN
        SELECT id INTO v_presentation_id
        FROM public.catalog_sale_presentations
        WHERE variant_id = v_variant_id
          AND LOWER(name) = LOWER(BTRIM(v_presentation ->> 'name'))
        LIMIT 1;
      END IF;

      IF v_presentation_id IS NULL THEN
        INSERT INTO public.catalog_sale_presentations (
          variant_id, name, presentation_type, base_unit, contained_quantity,
          contained_unit, contains_presentation_id, contains_quantity,
          base_units_total, base_price, minimum_order_quantity, quantity_step,
          inventory_policy, active
        ) VALUES (
          v_variant_id,
          BTRIM(v_presentation ->> 'name'),
          COALESCE(NULLIF(v_presentation ->> 'presentation_type', ''), 'otro'),
          COALESCE(NULLIF(v_presentation ->> 'base_unit', ''), 'pieza'),
          CASE WHEN v_contains_id IS NULL THEN (v_presentation ->> 'contained_quantity')::NUMERIC ELSE NULL END,
          CASE WHEN v_contains_id IS NULL THEN NULLIF(v_presentation ->> 'contained_unit', '') ELSE NULL END,
          v_contains_id,
          CASE WHEN v_contains_id IS NOT NULL THEN (v_presentation ->> 'contains_quantity')::NUMERIC ELSE NULL END,
          (v_presentation ->> 'base_units_total')::NUMERIC,
          (v_presentation ->> 'base_price')::NUMERIC,
          COALESCE((v_presentation ->> 'minimum_order_quantity')::INTEGER, 1),
          COALESCE((v_presentation ->> 'quantity_step')::INTEGER, 1),
          NULLIF(v_presentation ->> 'inventory_policy', ''),
          COALESCE((v_presentation ->> 'active')::BOOLEAN, TRUE)
        )
        RETURNING id INTO v_presentation_id;
      ELSE
        UPDATE public.catalog_sale_presentations
        SET
          name = BTRIM(v_presentation ->> 'name'),
          presentation_type = COALESCE(NULLIF(v_presentation ->> 'presentation_type', ''), presentation_type),
          base_unit = COALESCE(NULLIF(v_presentation ->> 'base_unit', ''), base_unit),
          contained_quantity = CASE WHEN v_contains_id IS NULL THEN (v_presentation ->> 'contained_quantity')::NUMERIC ELSE NULL END,
          contained_unit = CASE WHEN v_contains_id IS NULL THEN NULLIF(v_presentation ->> 'contained_unit', '') ELSE NULL END,
          contains_presentation_id = v_contains_id,
          contains_quantity = CASE WHEN v_contains_id IS NOT NULL THEN (v_presentation ->> 'contains_quantity')::NUMERIC ELSE NULL END,
          base_units_total = (v_presentation ->> 'base_units_total')::NUMERIC,
          base_price = (v_presentation ->> 'base_price')::NUMERIC,
          minimum_order_quantity = COALESCE((v_presentation ->> 'minimum_order_quantity')::INTEGER, 1),
          quantity_step = COALESCE((v_presentation ->> 'quantity_step')::INTEGER, 1),
          inventory_policy = NULLIF(v_presentation ->> 'inventory_policy', ''),
          active = COALESCE((v_presentation ->> 'active')::BOOLEAN, TRUE),
          updated_at = NOW()
        WHERE id = v_presentation_id AND variant_id = v_variant_id
        RETURNING id INTO v_presentation_id;
        IF v_presentation_id IS NULL THEN
          RAISE EXCEPTION 'presentation does not belong to selected variant';
        END IF;
      END IF;

      IF v_tier IS NOT NULL AND NULLIF(v_tier ->> 'minimum_quantity', '') IS NOT NULL THEN
        SELECT id INTO v_tier_id
        FROM public.catalog_price_tiers
        WHERE sale_presentation_id = v_presentation_id
          AND minimum_quantity = (v_tier ->> 'minimum_quantity')::INTEGER
        LIMIT 1;

        IF v_tier_id IS NULL THEN
          INSERT INTO public.catalog_price_tiers (
            sale_presentation_id, minimum_quantity, maximum_quantity,
            price_per_presentation, label, active
          ) VALUES (
            v_presentation_id,
            (v_tier ->> 'minimum_quantity')::INTEGER,
            NULLIF(v_tier ->> 'maximum_quantity', '')::INTEGER,
            (v_tier ->> 'price_per_presentation')::NUMERIC,
            NULLIF(BTRIM(v_tier ->> 'label'), ''),
            COALESCE((v_tier ->> 'active')::BOOLEAN, TRUE)
          )
          RETURNING id INTO v_tier_id;
        ELSE
          UPDATE public.catalog_price_tiers
          SET
            maximum_quantity = NULLIF(v_tier ->> 'maximum_quantity', '')::INTEGER,
            price_per_presentation = (v_tier ->> 'price_per_presentation')::NUMERIC,
            label = NULLIF(BTRIM(v_tier ->> 'label'), ''),
            active = COALESCE((v_tier ->> 'active')::BOOLEAN, TRUE),
            updated_at = NOW()
          WHERE id = v_tier_id;
        END IF;
      END IF;

      IF v_box IS NOT NULL THEN
        SELECT id INTO v_box_id
        FROM public.catalog_sale_presentations
        WHERE variant_id = v_variant_id
          AND LOWER(name) = LOWER(BTRIM(v_box ->> 'name'))
        LIMIT 1;

        IF v_box_id IS NULL THEN
          INSERT INTO public.catalog_sale_presentations (
            variant_id, name, presentation_type, base_unit,
            contains_presentation_id, contains_quantity, base_units_total,
            base_price, minimum_order_quantity, quantity_step, active
          ) VALUES (
            v_variant_id,
            BTRIM(v_box ->> 'name'),
            'caja',
            COALESCE(NULLIF(v_box ->> 'base_unit', ''), 'pieza'),
            v_presentation_id,
            (v_box ->> 'contains_quantity')::NUMERIC,
            (v_box ->> 'base_units_total')::NUMERIC,
            (v_box ->> 'base_price')::NUMERIC,
            COALESCE((v_box ->> 'minimum_order_quantity')::INTEGER, 1),
            COALESCE((v_box ->> 'quantity_step')::INTEGER, 1),
            COALESCE((v_box ->> 'active')::BOOLEAN, TRUE)
          )
          RETURNING id INTO v_box_id;
        ELSE
          UPDATE public.catalog_sale_presentations
          SET
            contains_presentation_id = v_presentation_id,
            contained_quantity = NULL,
            contained_unit = NULL,
            contains_quantity = (v_box ->> 'contains_quantity')::NUMERIC,
            base_units_total = (v_box ->> 'base_units_total')::NUMERIC,
            base_price = (v_box ->> 'base_price')::NUMERIC,
            active = COALESCE((v_box ->> 'active')::BOOLEAN, TRUE),
            updated_at = NOW()
          WHERE id = v_box_id;
        END IF;
      END IF;

      IF v_inventory IS NOT NULL AND NULLIF(v_inventory ->> 'location_id', '') IS NOT NULL THEN
        INSERT INTO public.catalog_inventory (
          variant_id, sale_presentation_id, location_id, quantity, reserved_quantity
        ) VALUES (
          v_variant_id,
          CASE
            WHEN COALESCE(NULLIF(v_variant ->> 'inventory_policy', ''), 'shared_base_units')
              = 'separate_by_presentation'
            THEN v_presentation_id
            ELSE NULL
          END,
          (v_inventory ->> 'location_id')::UUID,
          COALESCE((v_inventory ->> 'quantity')::NUMERIC, 0),
          COALESCE((v_inventory ->> 'reserved_quantity')::NUMERIC, 0)
        )
        ON CONFLICT (variant_id, sale_presentation_id, location_id)
        DO UPDATE SET
          quantity = EXCLUDED.quantity,
          reserved_quantity = EXCLUDED.reserved_quantity,
          updated_at = NOW()
        RETURNING id INTO v_inventory_id;
      END IF;

      v_results := v_results || jsonb_build_array(jsonb_build_object(
        'row_key', v_row ->> 'row_key',
        'status', v_action,
        'variant_id', v_variant_id,
        'presentation_id', v_presentation_id,
        'box_id', v_box_id,
        'tier_id', v_tier_id,
        'inventory_id', v_inventory_id
      ));
    EXCEPTION WHEN OTHERS THEN
      v_results := v_results || jsonb_build_array(jsonb_build_object(
        'row_key', v_row ->> 'row_key',
        'status', 'rejected',
        'code', SQLSTATE,
        'error', SQLERRM
      ));
    END;
  END LOOP;

  RETURN jsonb_build_object('results', v_results);
END;
$$;

REVOKE ALL ON FUNCTION public.catalog_admin_apply_commercial_rows(UUID, JSONB)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.catalog_admin_apply_commercial_rows(UUID, JSONB)
  TO authenticated;

COMMIT;
