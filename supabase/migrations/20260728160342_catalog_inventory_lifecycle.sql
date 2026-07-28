-- Catalog V2 inventory lifecycle.
-- Keeps reservations, fulfillment, cancellation and order snapshots atomic.

BEGIN;

ALTER TABLE public.catalog_inventory
  ADD COLUMN IF NOT EXISTS low_stock_threshold NUMERIC(14,3) NOT NULL DEFAULT 5;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'catalog_inventory_low_stock_threshold_check'
      AND conrelid = 'public.catalog_inventory'::regclass
  ) THEN
    ALTER TABLE public.catalog_inventory
      ADD CONSTRAINT catalog_inventory_low_stock_threshold_check
      CHECK (low_stock_threshold >= 0);
  END IF;
END;
$$;

-- Preserve the validated reservation implementation as a private core and
-- wrap it so every order line records its inventory location and state.
DO $$
BEGIN
  IF to_regprocedure(
    'public.catalog_create_order_core(text,text,text,text,jsonb,uuid,text)'
  ) IS NULL THEN
    IF to_regprocedure(
      'public.catalog_create_order(text,text,text,text,jsonb,uuid,text)'
    ) IS NULL THEN
      RAISE EXCEPTION 'catalog_create_order must exist before this migration';
    END IF;

    ALTER FUNCTION public.catalog_create_order(
      TEXT, TEXT, TEXT, TEXT, JSONB, UUID, TEXT
    ) RENAME TO catalog_create_order_core;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.catalog_create_order_core(
  TEXT, TEXT, TEXT, TEXT, JSONB, UUID, TEXT
) FROM PUBLIC, anon, authenticated;

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
  v_result      JSONB;
  v_location_id UUID;
  v_folio       TEXT;
BEGIN
  SELECT id INTO v_location_id
  FROM public.catalog_locations
  WHERE active = true
    AND (p_location_slug IS NULL OR slug = p_location_slug)
  ORDER BY created_at ASC
  LIMIT 1;

  IF v_location_id IS NULL THEN
    RAISE EXCEPTION 'No active inventory location configured'
      USING ERRCODE = '22023';
  END IF;

  v_result := public.catalog_create_order_core(
    p_cliente_nombre,
    p_cliente_telefono,
    p_tipo_entrega,
    p_direccion,
    p_items,
    p_idempotency_key,
    p_location_slug
  );
  v_folio := v_result ->> 'folio';

  IF v_folio IS NULL THEN
    RAISE EXCEPTION 'Order core did not return a folio';
  END IF;

  UPDATE public.pedidos p
  SET detalles_json = (
    SELECT jsonb_agg(
      CASE
        WHEN item.value ? 'variant_id' THEN
          item.value || jsonb_build_object(
            'inventory_location_id',
              COALESCE(
                NULLIF(item.value ->> 'inventory_location_id', '')::UUID,
                v_location_id
              ),
            'inventory_state',
              COALESCE(NULLIF(item.value ->> 'inventory_state', ''), 'reserved')
          )
        ELSE item.value
      END
      ORDER BY item.ordinality
    )
    FROM jsonb_array_elements(p.detalles_json) WITH ORDINALITY AS item(value, ordinality)
  )
  WHERE p.folio = v_folio;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.catalog_create_order(
  TEXT, TEXT, TEXT, TEXT, JSONB, UUID, TEXT
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.catalog_create_order(
  TEXT, TEXT, TEXT, TEXT, JSONB, UUID, TEXT
) TO anon, authenticated;

-- Add lifecycle metadata to V2 orders created before this migration. The
-- current storefront used the first active location, matching the core RPC.
UPDATE public.pedidos p
SET detalles_json = (
  SELECT jsonb_agg(
    CASE
      WHEN item.value ? 'variant_id' THEN
        item.value || jsonb_build_object(
          'inventory_location_id',
            COALESCE(
              NULLIF(item.value ->> 'inventory_location_id', '')::UUID,
              (
                SELECT inventory.location_id
                FROM public.catalog_inventory inventory
                WHERE inventory.variant_id = (item.value ->> 'variant_id')::UUID
                  AND (
                    inventory.sale_presentation_id =
                      (item.value ->> 'sale_presentation_id')::UUID
                    OR inventory.sale_presentation_id IS NULL
                  )
                  AND inventory.reserved_quantity > 0
                ORDER BY inventory.reserved_quantity DESC, inventory.updated_at DESC
                LIMIT 1
              ),
              (
                SELECT location.id
                FROM public.catalog_locations location
                WHERE location.active = true
                ORDER BY location.created_at ASC
                LIMIT 1
              )
            ),
          'inventory_state',
            COALESCE(
              NULLIF(item.value ->> 'inventory_state', ''),
              CASE
                WHEN p.estado IN ('Por Surtir', 'Armando Pedido') THEN 'reserved'
                WHEN p.estado = 'Cancelado' THEN 'released'
                ELSE 'committed'
              END
            )
        )
      ELSE item.value
    END
    ORDER BY item.ordinality
  )
  FROM jsonb_array_elements(p.detalles_json) WITH ORDINALITY AS item(value, ordinality)
)
WHERE EXISTS (
  SELECT 1
  FROM jsonb_array_elements(p.detalles_json) item
  WHERE item ? 'variant_id'
);

CREATE OR REPLACE FUNCTION public.catalog_fulfill_order(
  p_order_id UUID,
  p_items JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_order              RECORD;
  v_line               JSONB;
  v_request            JSONB;
  v_lines              JSONB := '[]'::JSONB;
  v_variant_id         UUID;
  v_presentation_id    UUID;
  v_location_id        UUID;
  v_inventory_id       UUID;
  v_policy             TEXT;
  v_base_units         NUMERIC;
  v_ordered_quantity   INTEGER;
  v_fulfilled_quantity INTEGER;
  v_reserved_needed    NUMERIC;
  v_fulfilled_needed   NUMERIC;
  v_unit_price         NUMERIC;
  v_tier_label         TEXT;
  v_total              NUMERIC := 0;
BEGIN
  IF NOT public.has_role(ARRAY['admin', 'manager', 'empleado']) THEN
    RAISE EXCEPTION 'Order fulfillment requires catalog picking permission'
      USING ERRCODE = '42501';
  END IF;

  IF p_order_id IS NULL
     OR p_items IS NULL
     OR jsonb_typeof(p_items) <> 'array'
     OR jsonb_array_length(p_items) NOT BETWEEN 1 AND 50 THEN
    RAISE EXCEPTION 'Invalid fulfillment payload' USING ERRCODE = '22023';
  END IF;

  SELECT id, folio, estado, total, detalles_json
  INTO v_order
  FROM public.pedidos
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found' USING ERRCODE = 'P0002';
  END IF;

  IF v_order.estado = 'Listo para Entrega'
     AND NOT EXISTS (
       SELECT 1
       FROM jsonb_array_elements(v_order.detalles_json) item
       WHERE item ? 'variant_id'
         AND COALESCE(item ->> 'inventory_state', '') <> 'committed'
     ) THEN
    RETURN jsonb_build_object(
      'folio', v_order.folio,
      'total', v_order.total,
      'details', v_order.detalles_json,
      'replay', TRUE
    );
  END IF;

  IF v_order.estado NOT IN ('Por Surtir', 'Armando Pedido') THEN
    RAISE EXCEPTION 'Order cannot be fulfilled from its current state'
      USING ERRCODE = '23514';
  END IF;

  FOR v_line IN SELECT value FROM jsonb_array_elements(v_order.detalles_json)
  LOOP
    IF COALESCE(v_line ->> 'schema', '') <> '2'
       OR COALESCE(v_line ->> 'variant_id', '') !~ '^[0-9a-fA-F-]{36}$'
       OR COALESCE(v_line ->> 'sale_presentation_id', '') !~ '^[0-9a-fA-F-]{36}$'
       OR COALESCE(v_line ->> 'inventory_location_id', '') !~ '^[0-9a-fA-F-]{36}$'
       OR COALESCE(v_line ->> 'inventory_state', '') <> 'reserved' THEN
      RAISE EXCEPTION 'Order contains a non-reserved V2 line'
        USING ERRCODE = '22023';
    END IF;

    v_variant_id := (v_line ->> 'variant_id')::UUID;
    v_presentation_id := (v_line ->> 'sale_presentation_id')::UUID;
    v_location_id := (v_line ->> 'inventory_location_id')::UUID;
    v_ordered_quantity := (v_line ->> 'cantidad')::INTEGER;

    SELECT request.value INTO v_request
    FROM jsonb_array_elements(p_items) request(value)
    WHERE request.value ->> 'variant_id' = v_line ->> 'variant_id'
      AND request.value ->> 'sale_presentation_id' =
        v_line ->> 'sale_presentation_id'
    LIMIT 1;

    IF v_request IS NULL
       OR COALESCE(v_request ->> 'quantity', '') !~ '^(0|[1-9][0-9]{0,4})$' THEN
      RAISE EXCEPTION 'Missing or invalid fulfillment line'
        USING ERRCODE = '22023';
    END IF;

    v_fulfilled_quantity := (v_request ->> 'quantity')::INTEGER;
    IF v_fulfilled_quantity > v_ordered_quantity THEN
      RAISE EXCEPTION 'Fulfilled quantity exceeds ordered quantity'
        USING ERRCODE = '22023';
    END IF;

    SELECT
      COALESCE(presentation.inventory_policy, variant.inventory_policy),
      presentation.base_units_total
    INTO v_policy, v_base_units
    FROM public.catalog_sale_presentations presentation
    JOIN public.catalog_variants variant
      ON variant.id = presentation.variant_id
    WHERE presentation.id = v_presentation_id
      AND variant.id = v_variant_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Catalog presentation no longer exists'
        USING ERRCODE = 'P0002';
    END IF;

    IF v_policy = 'shared_base_units' THEN
      v_reserved_needed := v_ordered_quantity * v_base_units;
      v_fulfilled_needed := v_fulfilled_quantity * v_base_units;
    ELSE
      v_reserved_needed := v_ordered_quantity;
      v_fulfilled_needed := v_fulfilled_quantity;
    END IF;

    SELECT inventory.id INTO v_inventory_id
    FROM public.catalog_inventory inventory
    WHERE inventory.variant_id = v_variant_id
      AND inventory.location_id = v_location_id
      AND (
        (v_policy = 'shared_base_units' AND inventory.sale_presentation_id IS NULL)
        OR
        (v_policy <> 'shared_base_units'
          AND inventory.sale_presentation_id = v_presentation_id)
      )
      AND inventory.reserved_quantity >= v_reserved_needed
      AND inventory.quantity >= v_fulfilled_needed
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Reserved inventory is no longer consistent'
        USING ERRCODE = '23514';
    END IF;

    UPDATE public.catalog_inventory
    SET
      quantity = quantity - v_fulfilled_needed,
      reserved_quantity = reserved_quantity - v_reserved_needed,
      updated_at = NOW()
    WHERE id = v_inventory_id;

    IF v_fulfilled_quantity > 0 THEN
      SELECT tier.price_per_presentation, tier.label
      INTO v_unit_price, v_tier_label
      FROM public.catalog_price_tiers tier
      WHERE tier.sale_presentation_id = v_presentation_id
        AND tier.active = true
        AND tier.minimum_quantity <= v_fulfilled_quantity
      ORDER BY tier.minimum_quantity DESC
      LIMIT 1;

      IF v_unit_price IS NULL THEN
        SELECT base_price INTO v_unit_price
        FROM public.catalog_sale_presentations
        WHERE id = v_presentation_id;
      END IF;
    ELSE
      v_unit_price := 0;
      v_tier_label := NULL;
    END IF;

    v_total := v_total + round(v_unit_price * v_fulfilled_quantity, 2);
    v_lines := v_lines || jsonb_build_array(
      v_line || jsonb_build_object(
        'cantidad_surtida', v_fulfilled_quantity,
        'encontrado', v_fulfilled_quantity > 0,
        'precio_original', v_line -> 'precio',
        'precio', v_unit_price,
        'precio_surtido', v_unit_price,
        'nivel_precio_surtido', v_tier_label,
        'subtotal', round(v_unit_price * v_fulfilled_quantity, 2),
        'contenido_surtido', v_fulfilled_quantity * v_base_units,
        'inventory_state', 'committed'
      )
    );

    v_request := NULL;
    v_unit_price := NULL;
    v_tier_label := NULL;
  END LOOP;

  UPDATE public.pedidos
  SET
    estado = 'Listo para Entrega',
    total = round(v_total, 2),
    detalles_json = v_lines,
    notificado_estado = NULL,
    updated_at = NOW()
  WHERE id = p_order_id;

  RETURN jsonb_build_object(
    'folio', v_order.folio,
    'total', round(v_total, 2),
    'details', v_lines,
    'replay', FALSE
  );
END;
$$;

REVOKE ALL ON FUNCTION public.catalog_fulfill_order(UUID, JSONB)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.catalog_fulfill_order(UUID, JSONB)
  TO authenticated;

CREATE OR REPLACE FUNCTION public.catalog_cancel_order_inventory(
  p_order_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_order              RECORD;
  v_line               JSONB;
  v_lines              JSONB := '[]'::JSONB;
  v_variant_id         UUID;
  v_presentation_id    UUID;
  v_location_id        UUID;
  v_inventory_id       UUID;
  v_policy             TEXT;
  v_state              TEXT;
  v_base_units         NUMERIC;
  v_ordered_quantity   INTEGER;
  v_fulfilled_quantity INTEGER;
  v_reserved_needed    NUMERIC;
  v_committed_needed   NUMERIC;
  v_cancelled_at       TIMESTAMPTZ := NOW();
BEGIN
  IF NOT public.has_role(ARRAY['admin', 'manager']) THEN
    RAISE EXCEPTION 'Order cancellation requires manager permission'
      USING ERRCODE = '42501';
  END IF;

  SELECT id, folio, estado, detalles_json
  INTO v_order
  FROM public.pedidos
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found' USING ERRCODE = 'P0002';
  END IF;

  IF v_order.estado = 'Cancelado'
     AND NOT EXISTS (
       SELECT 1
       FROM jsonb_array_elements(v_order.detalles_json) item
       WHERE item ? 'variant_id'
         AND COALESCE(item ->> 'inventory_state', '') <> 'released'
     ) THEN
    RETURN jsonb_build_object(
      'folio', v_order.folio,
      'details', v_order.detalles_json,
      'replay', TRUE
    );
  END IF;

  FOR v_line IN SELECT value FROM jsonb_array_elements(v_order.detalles_json)
  LOOP
    IF COALESCE(v_line ->> 'schema', '') <> '2'
       OR COALESCE(v_line ->> 'variant_id', '') !~ '^[0-9a-fA-F-]{36}$'
       OR COALESCE(v_line ->> 'sale_presentation_id', '') !~ '^[0-9a-fA-F-]{36}$'
       OR COALESCE(v_line ->> 'inventory_location_id', '') !~ '^[0-9a-fA-F-]{36}$' THEN
      RAISE EXCEPTION 'Order contains a non-V2 inventory line'
        USING ERRCODE = '22023';
    END IF;

    v_state := COALESCE(v_line ->> 'inventory_state', '');
    IF v_state = 'released' THEN
      v_lines := v_lines || jsonb_build_array(v_line);
      CONTINUE;
    END IF;
    IF v_state NOT IN ('reserved', 'committed') THEN
      RAISE EXCEPTION 'Order inventory state is invalid'
        USING ERRCODE = '23514';
    END IF;

    v_variant_id := (v_line ->> 'variant_id')::UUID;
    v_presentation_id := (v_line ->> 'sale_presentation_id')::UUID;
    v_location_id := (v_line ->> 'inventory_location_id')::UUID;
    v_ordered_quantity := (v_line ->> 'cantidad')::INTEGER;
    v_fulfilled_quantity := COALESCE(
      NULLIF(v_line ->> 'cantidad_surtida', '')::INTEGER,
      v_ordered_quantity
    );

    SELECT
      COALESCE(presentation.inventory_policy, variant.inventory_policy),
      presentation.base_units_total
    INTO v_policy, v_base_units
    FROM public.catalog_sale_presentations presentation
    JOIN public.catalog_variants variant
      ON variant.id = presentation.variant_id
    WHERE presentation.id = v_presentation_id
      AND variant.id = v_variant_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Catalog presentation no longer exists'
        USING ERRCODE = 'P0002';
    END IF;

    IF v_policy = 'shared_base_units' THEN
      v_reserved_needed := v_ordered_quantity * v_base_units;
      v_committed_needed := v_fulfilled_quantity * v_base_units;
    ELSE
      v_reserved_needed := v_ordered_quantity;
      v_committed_needed := v_fulfilled_quantity;
    END IF;

    SELECT inventory.id INTO v_inventory_id
    FROM public.catalog_inventory inventory
    WHERE inventory.variant_id = v_variant_id
      AND inventory.location_id = v_location_id
      AND (
        (v_policy = 'shared_base_units' AND inventory.sale_presentation_id IS NULL)
        OR
        (v_policy <> 'shared_base_units'
          AND inventory.sale_presentation_id = v_presentation_id)
      )
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Inventory row no longer exists'
        USING ERRCODE = 'P0002';
    END IF;

    IF v_state = 'reserved' THEN
      UPDATE public.catalog_inventory
      SET
        reserved_quantity = reserved_quantity - v_reserved_needed,
        updated_at = NOW()
      WHERE id = v_inventory_id
        AND reserved_quantity >= v_reserved_needed;
    ELSE
      UPDATE public.catalog_inventory
      SET
        quantity = quantity + v_committed_needed,
        updated_at = NOW()
      WHERE id = v_inventory_id;
    END IF;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Reserved inventory is no longer consistent'
        USING ERRCODE = '23514';
    END IF;

    v_lines := v_lines || jsonb_build_array(
      v_line || jsonb_build_object('inventory_state', 'released')
    );
  END LOOP;

  UPDATE public.pedidos
  SET
    estado = 'Cancelado',
    detalles_json = v_lines,
    notificado_estado = NULL,
    fecha_cancelado = v_cancelled_at,
    updated_at = v_cancelled_at
  WHERE id = p_order_id;

  RETURN jsonb_build_object(
    'folio', v_order.folio,
    'details', v_lines,
    'cancelled_at', v_cancelled_at,
    'replay', FALSE
  );
END;
$$;

REVOKE ALL ON FUNCTION public.catalog_cancel_order_inventory(UUID)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.catalog_cancel_order_inventory(UUID)
  TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
