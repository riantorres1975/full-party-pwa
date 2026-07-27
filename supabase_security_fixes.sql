-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRACIÓN DE SEGURIDAD — Correcciones críticas/altas
-- Ejecutar UNA SOLA VEZ en Supabase Dashboard → SQL Editor → New Query
-- Requiere: supabase_setup.sql, supabase_profiles_migration.sql,
--           supabase_invites_migration.sql ya aplicadas.
--
-- Orden: del más crítico al menos crítico. Puedes ejecutarlo completo.
-- ═══════════════════════════════════════════════════════════════════════════


-- ╔═══════════════════════════════════════════════════════════════════════╗
-- ║ #1 [CRÍTICO] Fuga de invitaciones en profiles_pending                  ║
-- ╚═══════════════════════════════════════════════════════════════════════╝
-- PROBLEMA: la policy "Lectura por token válido" permitía a CUALQUIER usuario
-- anónimo leer TODA la tabla (USING expires_at > now() no filtra por token).
-- Un atacante podía listar email + role + TOKEN de todas las invitaciones
-- vigentes y registrarse usando una invitación de admin → escalada total.
--
-- FIX: eliminar el SELECT directo de anon. RegistroPage ya usa el RPC
-- get_invite_by_token (SECURITY DEFINER) que solo devuelve la fila del token
-- EXACTO, así que el flujo de registro sigue funcionando sin esta policy.
DROP POLICY IF EXISTS "Lectura por token válido"        ON public.profiles_pending;
DROP POLICY IF EXISTS "Lectura pública con token válido" ON public.profiles_pending;

-- (Defensa extra) Asegurar que anon NO tenga SELECT directo sobre la tabla.
REVOKE SELECT ON public.profiles_pending FROM anon;


-- ╔═══════════════════════════════════════════════════════════════════════╗
-- ║ #3 [ALTO] Rastreo público de pedidos sin exponer la tabla             ║
-- ╚═══════════════════════════════════════════════════════════════════════╝
-- PROBLEMA: la tabla `pedidos` solo permite SELECT a admins. El rastreo
-- público (buscarPedido) leía `pedidos` directamente → o no funciona, o
-- requiere una policy pública que permitiría ENUMERAR todos los pedidos
-- (los folios son secuenciales: FP-00001, FP-00002...).
--
-- FIX: RPC SECURITY DEFINER que devuelve UNA fila solo con el folio EXACTO.
-- No expone la tabla ni permite listar. El cliente debe llamar a este RPC.
CREATE OR REPLACE FUNCTION public.buscar_pedido_por_folio(p_folio TEXT)
RETURNS TABLE (
  folio          TEXT,
  cliente_nombre TEXT,
  estado         TEXT,
  total          NUMERIC,
  tipo_entrega   TEXT,
  created_at     TIMESTAMPTZ,
  updated_at     TIMESTAMPTZ,
  detalles_json  JSONB
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT folio, cliente_nombre, estado, total, tipo_entrega,
         created_at, updated_at, detalles_json
  FROM public.pedidos
  WHERE folio = upper(trim(p_folio))
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.buscar_pedido_por_folio(TEXT) TO anon, authenticated;

-- IMPORTANTE: si en tu proyecto creaste manualmente una policy de SELECT
-- pública sobre `pedidos` (para que funcionara el rastreo), ELIMÍNALA ahora.
-- Revisa en Dashboard → Authentication → Policies → pedidos y borra cualquier
-- policy de SELECT con `USING (true)` o destinada a anon. La única SELECT
-- debe ser "Solo admins pueden leer pedidos".
--
-- RECOMENDACIÓN (no incluida aquí para no romper folios existentes):
-- migrar a folios NO secuenciales (sufijo aleatorio) para impedir que alguien
-- adivine FP-00001, FP-00002... y consulte pedidos ajenos vía el RPC.


-- ╔═══════════════════════════════════════════════════════════════════════╗
-- ║ #5 [MEDIO] check_email_exists enumerable por cualquier autenticado    ║
-- ╚═══════════════════════════════════════════════════════════════════════╝
-- PROBLEMA: estaba GRANTeada a `authenticated`, así que un `viewer`/`empleado`
-- podía enumerar qué emails tienen cuenta.
-- FIX: validar rol admin dentro de la función.
CREATE OR REPLACE FUNCTION public.check_email_exists(p_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  IF NOT public.has_role(ARRAY['admin']) THEN
    RAISE EXCEPTION 'No autorizado' USING ERRCODE = 'insufficient_privilege';
  END IF;
  RETURN EXISTS (SELECT 1 FROM auth.users WHERE email = lower(p_email));
END;
$$;
-- Sigue accesible a authenticated, pero la función rechaza a quien no sea admin.
GRANT EXECUTE ON FUNCTION public.check_email_exists(TEXT) TO authenticated;


-- ╔═══════════════════════════════════════════════════════════════════════╗
-- ║ #2 [ALTO] Aplicar RBAC granular en RLS (no solo tabla `admins`)       ║
-- ╚═══════════════════════════════════════════════════════════════════════╝
-- PROBLEMA: las RLS de productos/pedidos/configuracion solo checaban la tabla
-- `admins`, ignorando los roles de `profiles`. Resultado:
--   - manager/empleado NO podían escribir aunque la UI lo permitiera.
--   - cualquier fila en `admins` obtenía escritura total ignorando su rol.
-- FIX: usar has_role() según la matriz de permisos del cliente.
--
-- Se mantiene un OR con la tabla `admins` como red de seguridad TRANSITORIA
-- para no dejar fuera al dueño durante la migración. Una vez verificado que
-- todos los operadores tienen su rol correcto en `profiles`, vacía la tabla
-- `admins` para cerrar la puerta del "viewer que estaba en admins":
--   -- TRUNCATE public.admins;   (ejecutar SOLO tras verificar profiles)

-- ── productos ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Solo admins pueden insertar"   ON public.productos;
CREATE POLICY "Escritura catalogo (admin/manager)"
  ON public.productos FOR INSERT
  WITH CHECK (
    public.has_role(ARRAY['admin','manager'])
    OR auth.uid() IN (SELECT user_id FROM public.admins)
  );

DROP POLICY IF EXISTS "Solo admins pueden actualizar" ON public.productos;
CREATE POLICY "Actualizar catalogo (admin/manager)"
  ON public.productos FOR UPDATE
  USING (
    public.has_role(ARRAY['admin','manager'])
    OR auth.uid() IN (SELECT user_id FROM public.admins)
  );

DROP POLICY IF EXISTS "Solo admins pueden eliminar"   ON public.productos;
CREATE POLICY "Eliminar catalogo (admin)"
  ON public.productos FOR DELETE
  USING (
    public.has_role(ARRAY['admin'])
    OR auth.uid() IN (SELECT user_id FROM public.admins)
  );

-- ── pedidos ────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Solo admins pueden leer pedidos" ON public.pedidos;
CREATE POLICY "Leer pedidos (admin/manager/empleado/viewer)"
  ON public.pedidos FOR SELECT
  USING (
    public.has_role(ARRAY['admin','manager','empleado','viewer'])
    OR auth.uid() IN (SELECT user_id FROM public.admins)
  );

DROP POLICY IF EXISTS "Solo admins pueden actualizar pedidos" ON public.pedidos;
CREATE POLICY "Actualizar pedidos (admin/manager/empleado)"
  ON public.pedidos FOR UPDATE
  USING (
    public.has_role(ARRAY['admin','manager','empleado'])
    OR auth.uid() IN (SELECT user_id FROM public.admins)
  );

-- ── configuracion ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Solo admins pueden insertar config"   ON public.configuracion;
CREATE POLICY "Insertar config (admin)"
  ON public.configuracion FOR INSERT
  WITH CHECK (
    public.has_role(ARRAY['admin'])
    OR auth.uid() IN (SELECT user_id FROM public.admins)
  );

DROP POLICY IF EXISTS "Solo admins pueden actualizar config" ON public.configuracion;
CREATE POLICY "Actualizar config (admin)"
  ON public.configuracion FOR UPDATE
  USING (
    public.has_role(ARRAY['admin'])
    OR auth.uid() IN (SELECT user_id FROM public.admins)
  );


-- ═══════════════════════════════════════════════════════════════════════════
-- VERIFICACIÓN
--   SELECT * FROM pg_policies WHERE tablename IN
--     ('productos','pedidos','configuracion','profiles_pending');
--   SELECT public.buscar_pedido_por_folio('FP-00001');
-- ═══════════════════════════════════════════════════════════════════════════
