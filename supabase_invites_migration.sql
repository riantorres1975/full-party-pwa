-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRACIÓN: Flujo de invitación con token
-- Ejecutar UNA SOLA VEZ en Supabase Dashboard → SQL Editor
-- Requiere que supabase_profiles_migration.sql ya haya sido ejecutada.
-- ═══════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────
-- 1. Agregar columnas token y expires_at a profiles_pending
-- ───────────────────────────────────────────────────────────────────────────
ALTER TABLE public.profiles_pending
  ADD COLUMN IF NOT EXISTS token      UUID        NOT NULL DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days');

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_pending_token
  ON public.profiles_pending (token);

-- ───────────────────────────────────────────────────────────────────────────
-- 2. Bloquear lectura directa de invitaciones
--    La validación pública se hace exclusivamente mediante el RPC por token.
--    Una policy SELECT no puede saber qué token incluyó el cliente y terminaría
--    permitiendo enumerar todas las invitaciones vigentes.
-- ───────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Lectura pública con token válido" ON public.profiles_pending;
DROP POLICY IF EXISTS "Lectura por token válido" ON public.profiles_pending;
REVOKE SELECT ON TABLE public.profiles_pending FROM anon;

-- ───────────────────────────────────────────────────────────────────────────
-- 3. RPC: get_invite_by_token
--    Retorna email, role, expires_at de una invitación vigente por token.
--    SECURITY DEFINER — puede leer la tabla sin RLS del caller.
--    Accesible sin autenticación (rol anon).
-- ───────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_invite_by_token(p_token UUID)
RETURNS TABLE (email TEXT, role TEXT, expires_at TIMESTAMPTZ)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT email, role, expires_at
  FROM public.profiles_pending
  WHERE token = p_token
    AND expires_at > NOW();
$$;

-- Permitir únicamente el RPC necesario para RegistroPage sin sesión.
REVOKE ALL ON FUNCTION public.get_invite_by_token(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_invite_by_token(UUID) TO anon, authenticated;

-- ───────────────────────────────────────────────────────────────────────────
-- 4. RPC: check_email_exists
--    Verifica si un email ya tiene cuenta en auth.users.
--    Solo accesible para usuarios autenticados (admins al invitar).
-- ───────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.check_email_exists(p_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT public.has_role(ARRAY['admin']) THEN
    RAISE EXCEPTION 'Insufficient privileges' USING ERRCODE = '42501';
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM auth.users WHERE lower(email) = lower(p_email)
  );
END;
$$;

-- Solo usuarios autenticados pueden ejecutarla
REVOKE ALL ON FUNCTION public.check_email_exists(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_email_exists(TEXT) TO authenticated;

-- ───────────────────────────────────────────────────────────────────────────
-- 5. Actualizar trigger handle_new_user
--    - Respeta expiración de la invitación
--    - Guarda raw_user_meta_data->>'nombre' en profiles.nombre
-- ───────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  pending_role    TEXT;
  pending_expired BOOLEAN;
BEGIN
  SELECT role, (expires_at < NOW())
    INTO pending_role, pending_expired
    FROM public.profiles_pending
    WHERE lower(email) = lower(NEW.email);

  IF pending_role IS NOT NULL THEN
    DELETE FROM public.profiles_pending WHERE lower(email) = lower(NEW.email);
    IF pending_expired THEN
      pending_role := NULL;
    END IF;
  END IF;

  INSERT INTO public.profiles (id, email, nombre, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'nombre',
    COALESCE(
      pending_role,
      CASE WHEN EXISTS (SELECT 1 FROM public.admins WHERE user_id = NEW.id)
           THEN 'admin' ELSE 'viewer' END
    )
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;

-- ───────────────────────────────────────────────────────────────────────────
-- VERIFICACIÓN
--
-- SELECT token, email, role, expires_at FROM public.profiles_pending;
-- SELECT public.check_email_exists('test@example.com');
-- SELECT * FROM public.get_invite_by_token('<uuid>');
-- ───────────────────────────────────────────────────────────────────────────

-- NOTA OPERATIVA:
-- Supabase Dashboard → Authentication → Providers → Email:
-- "Confirm email" debe estar DESACTIVADO para que signUp cree sesión
-- inmediata sin requerir verificación de correo. Si se activa, el flujo
-- de RegistroPage cambia a "Revisa tu correo" sin redirección automática.
