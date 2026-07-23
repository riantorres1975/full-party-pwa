-- SECURITY HARDENING
-- Run after:
--   supabase_setup.sql
--   supabase_profiles_migration.sql
--   supabase_invites_migration.sql
--   supabase_pagos_migration.sql
--   supabase_rate_limit.sql
--
-- This migration is safe to run more than once. It makes database permissions
-- match the frontend permission matrix and restricts anonymous writes.

BEGIN;

-- Legacy admin membership must never be readable or writable from the API.
REVOKE ALL ON TABLE public.admins FROM anon, authenticated;

-- Known SECURITY DEFINER functions must resolve objects only from trusted
-- schemas. The list is explicit to avoid changing unrelated project functions.
DO $$
DECLARE
  signature TEXT;
  resolved REGPROCEDURE;
BEGIN
  FOREACH signature IN ARRAY ARRAY[
    'public.has_role(text[])',
    'public.get_invite_by_token(uuid)',
    'public.check_email_exists(text)',
    'public.handle_new_user()',
    'public.check_pedido_rate_limit()',
    'public.check_pedido_duplicate()',
    'public.buscar_pedido_por_folio(text)'
  ]
  LOOP
    resolved := to_regprocedure(signature);
    IF resolved IS NOT NULL THEN
      EXECUTE format(
        'ALTER FUNCTION %s SET search_path = public, pg_temp',
        resolved
      );
      EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC', resolved);
    END IF;
  END LOOP;
END;
$$;

-- Restore only the function access required by the application.
GRANT EXECUTE ON FUNCTION public.has_role(TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_invite_by_token(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_email_exists(TEXT) TO authenticated;

DO $$
BEGIN
  IF to_regprocedure('public.buscar_pedido_por_folio(text)') IS NOT NULL THEN
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.buscar_pedido_por_folio(TEXT) TO anon, authenticated';
  END IF;
END;
$$;

REVOKE SELECT ON TABLE public.profiles_pending FROM anon;

-- Remove legacy and transitional policies before installing one canonical set.
DO $$
DECLARE
  policy_row RECORD;
  target_table TEXT;
BEGIN
  FOREACH target_table IN ARRAY ARRAY[
    'productos',
    'pedidos',
    'configuracion',
    'push_subscriptions'
  ]
  LOOP
    FOR policy_row IN
      SELECT policyname
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = target_table
    LOOP
      EXECUTE format(
        'DROP POLICY IF EXISTS %I ON public.%I',
        policy_row.policyname,
        target_table
      );
    END LOOP;
  END LOOP;
END;
$$;

-- Products: visitors see active products; panel roles see the full catalog.
CREATE POLICY productos_public_select
  ON public.productos FOR SELECT
  TO anon, authenticated
  USING (activo = true);

CREATE POLICY productos_panel_select
  ON public.productos FOR SELECT
  TO authenticated
  USING (public.has_role(ARRAY['admin', 'manager', 'empleado', 'viewer']));

CREATE POLICY productos_manager_insert
  ON public.productos FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(ARRAY['admin', 'manager']));

CREATE POLICY productos_manager_update
  ON public.productos FOR UPDATE
  TO authenticated
  USING (public.has_role(ARRAY['admin', 'manager']))
  WITH CHECK (public.has_role(ARRAY['admin', 'manager']));

CREATE POLICY productos_admin_delete
  ON public.productos FOR DELETE
  TO authenticated
  USING (public.has_role(ARRAY['admin']));

REVOKE ALL ON TABLE public.productos FROM anon, authenticated;
GRANT SELECT ON TABLE public.productos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.productos TO authenticated;

-- Anonymous orders are normalized before RLS checks. Administrative fields
-- cannot be forged even if a caller bypasses the web form.
CREATE OR REPLACE FUNCTION public.normalize_public_pedido()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL
     OR NOT COALESCE(
       public.has_role(ARRAY['admin', 'manager', 'empleado']),
       false
     ) THEN
    -- Random public folios prevent sequential order enumeration.
    NEW.folio := 'FP-' || upper(substr(replace(gen_random_uuid()::TEXT, '-', ''), 1, 10));
    NEW.estado := 'Por Surtir';
    NEW.notificado_estado := NULL;
    NEW.fecha_envio := NULL;
    NEW.fecha_cancelado := NULL;
    NEW.pago_estado := 'pendiente';
    NEW.metodo_pago := NULL;
    NEW.pago_fecha := NULL;
    NEW.pago_notas := NULL;
    NEW.created_at := NOW();
    NEW.updated_at := NOW();

    -- INSERT ... RETURNING may expose only the folio created in this statement.
    PERFORM set_config('app.inserted_pedido_folio', NEW.folio, true);
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.normalize_public_pedido() FROM PUBLIC;

DROP TRIGGER IF EXISTS normalize_public_pedido_before_insert ON public.pedidos;
DROP TRIGGER IF EXISTS zz_normalize_public_pedido_before_insert ON public.pedidos;
CREATE TRIGGER zz_normalize_public_pedido_before_insert
  BEFORE INSERT ON public.pedidos
  FOR EACH ROW
  EXECUTE FUNCTION public.normalize_public_pedido();

CREATE POLICY pedidos_public_insert
  ON public.pedidos FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    estado = 'Por Surtir'
    AND notificado_estado IS NULL
    AND fecha_envio IS NULL
    AND fecha_cancelado IS NULL
    AND pago_estado = 'pendiente'
    AND metodo_pago IS NULL
    AND pago_fecha IS NULL
    AND pago_notas IS NULL
    AND char_length(btrim(cliente_nombre)) BETWEEN 2 AND 120
    AND cliente_telefono ~ '^[0-9]{10}$'
    AND tipo_entrega IN ('tienda', 'envio')
    AND (
      (tipo_entrega = 'tienda' AND (direccion IS NULL OR char_length(direccion) <= 500))
      OR
      (tipo_entrega = 'envio' AND char_length(btrim(direccion)) BETWEEN 5 AND 500)
    )
    AND total > 0
    AND total <= 1000000
    AND jsonb_typeof(detalles_json) = 'array'
    AND CASE
      WHEN jsonb_typeof(detalles_json) = 'array'
        THEN jsonb_array_length(detalles_json) BETWEEN 1 AND 200
      ELSE false
    END
    AND octet_length(detalles_json::TEXT) <= 200000
  );

CREATE POLICY pedidos_panel_select
  ON public.pedidos FOR SELECT
  TO authenticated
  USING (public.has_role(ARRAY['admin', 'manager', 'empleado', 'viewer']));

CREATE POLICY pedidos_insert_returning_select
  ON public.pedidos FOR SELECT
  TO anon, authenticated
  USING (
    folio = NULLIF(current_setting('app.inserted_pedido_folio', true), '')
  );

CREATE POLICY pedidos_staff_update
  ON public.pedidos FOR UPDATE
  TO authenticated
  USING (
    public.has_role(ARRAY['admin', 'manager'])
    OR (
      public.has_role(ARRAY['empleado'])
      AND estado <> 'Cancelado'
    )
  )
  WITH CHECK (
    public.has_role(ARRAY['admin', 'manager'])
    OR (
      public.has_role(ARRAY['empleado'])
      AND estado <> 'Cancelado'
    )
  );

-- Immutable identifiers are protected for every role. Employees can update the
-- picking workflow, but customer and payment data require manager privileges.
CREATE OR REPLACE FUNCTION public.validate_pedido_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.id IS DISTINCT FROM OLD.id
     OR NEW.folio IS DISTINCT FROM OLD.folio
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Order identifiers cannot be changed'
      USING ERRCODE = '42501';
  END IF;

  IF public.has_role(ARRAY['empleado']) AND (
    NEW.cliente_nombre IS DISTINCT FROM OLD.cliente_nombre
    OR NEW.cliente_telefono IS DISTINCT FROM OLD.cliente_telefono
    OR NEW.tipo_entrega IS DISTINCT FROM OLD.tipo_entrega
    OR NEW.direccion IS DISTINCT FROM OLD.direccion
    OR NEW.pago_estado IS DISTINCT FROM OLD.pago_estado
    OR NEW.metodo_pago IS DISTINCT FROM OLD.metodo_pago
    OR NEW.pago_fecha IS DISTINCT FROM OLD.pago_fecha
    OR NEW.pago_notas IS DISTINCT FROM OLD.pago_notas
    OR NEW.estado = 'Cancelado'
  ) THEN
    RAISE EXCEPTION 'Employee role cannot change customer, payment, or cancellation data'
      USING ERRCODE = '42501';
  END IF;

  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.validate_pedido_update() FROM PUBLIC;

DROP TRIGGER IF EXISTS validate_pedido_update_before_update ON public.pedidos;
CREATE TRIGGER validate_pedido_update_before_update
  BEFORE UPDATE ON public.pedidos
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_pedido_update();

REVOKE ALL ON TABLE public.pedidos FROM anon, authenticated;
GRANT INSERT ON TABLE public.pedidos TO anon;
GRANT SELECT (folio) ON TABLE public.pedidos TO anon;
GRANT SELECT, INSERT, UPDATE ON TABLE public.pedidos TO authenticated;

-- Only storefront settings are public. Internal settings remain visible to
-- managers and editable only by administrators.
CREATE POLICY configuracion_public_select
  ON public.configuracion FOR SELECT
  TO anon, authenticated
  USING (clave IN ('anuncio', 'pedidos_habilitados', 'catalogo_categorias'));

CREATE POLICY configuracion_panel_select
  ON public.configuracion FOR SELECT
  TO authenticated
  USING (public.has_role(ARRAY['admin', 'manager']));

CREATE POLICY configuracion_admin_insert
  ON public.configuracion FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(ARRAY['admin']));

CREATE POLICY configuracion_admin_update
  ON public.configuracion FOR UPDATE
  TO authenticated
  USING (public.has_role(ARRAY['admin']))
  WITH CHECK (public.has_role(ARRAY['admin']));

REVOKE ALL ON TABLE public.configuracion FROM anon, authenticated;
GRANT SELECT ON TABLE public.configuracion TO anon;
GRANT SELECT, INSERT, UPDATE ON TABLE public.configuracion TO authenticated;

-- Push is optional. Harden it when installed without blocking projects that do
-- not use web notifications.
DO $$
BEGIN
  IF to_regclass('public.push_subscriptions') IS NOT NULL THEN
    EXECUTE $policy$
      CREATE POLICY push_public_insert
        ON public.push_subscriptions FOR INSERT
        TO anon, authenticated
        WITH CHECK (
          folio ~ '^FP-[A-Z0-9-]{4,32}$'
          AND endpoint ~ '^https://'
          AND char_length(endpoint) BETWEEN 20 AND 2048
          AND char_length(keys_p256dh) BETWEEN 16 AND 512
          AND char_length(keys_auth) BETWEEN 8 AND 256
          AND (cliente_telefono IS NULL OR cliente_telefono ~ '^[0-9]{10}$')
        )
    $policy$;

    EXECUTE $policy$
      CREATE POLICY push_admin_select
        ON public.push_subscriptions FOR SELECT
        TO authenticated
        USING (public.has_role(ARRAY['admin']))
    $policy$;

    EXECUTE $policy$
      CREATE POLICY push_admin_delete
        ON public.push_subscriptions FOR DELETE
        TO authenticated
        USING (public.has_role(ARRAY['admin']))
    $policy$;

    EXECUTE 'REVOKE ALL ON TABLE public.push_subscriptions FROM anon, authenticated';
    EXECUTE 'GRANT INSERT ON TABLE public.push_subscriptions TO anon';
    EXECUTE 'GRANT INSERT, SELECT, DELETE ON TABLE public.push_subscriptions TO authenticated';
  ELSE
    RAISE NOTICE 'push_subscriptions not installed; skipping optional push policies';
  END IF;
END;
$$;

COMMIT;

-- Verification queries (run separately):
-- SELECT schemaname, tablename, policyname, roles, cmd
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename, cmd, policyname;
--
-- SELECT n.nspname, p.proname, p.prosecdef, p.proconfig
-- FROM pg_proc p
-- JOIN pg_namespace n ON n.oid = p.pronamespace
-- WHERE n.nspname = 'public' AND p.prosecdef = true;
