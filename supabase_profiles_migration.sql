-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRACIÓN: Tabla profiles con roles
-- Ejecutar UNA SOLA VEZ en Supabase Dashboard → SQL Editor
-- Extiende la tabla `admins` existente con roles granulares
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Crear tabla profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      TEXT,
  nombre     TEXT,
  role       TEXT NOT NULL DEFAULT 'viewer'
             CHECK (role IN ('admin', 'manager', 'empleado', 'viewer')),
  activo     BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles (role);
CREATE INDEX IF NOT EXISTS idx_profiles_activo ON public.profiles (activo);

-- 2. Función helper para RLS futuras (sustituto moderno de la tabla admins)
CREATE OR REPLACE FUNCTION public.has_role(required_roles TEXT[])
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = ANY(required_roles)
      AND activo = true
  );
$$;

REVOKE ALL ON FUNCTION public.has_role(TEXT[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(TEXT[]) TO authenticated;

-- 3. RLS de profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuarios leen su propio perfil" ON public.profiles;
CREATE POLICY "Usuarios leen su propio perfil"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins leen todos los perfiles" ON public.profiles;
CREATE POLICY "Admins leen todos los perfiles"
  ON public.profiles FOR SELECT
  USING (public.has_role(ARRAY['admin']));

DROP POLICY IF EXISTS "Admins modifican perfiles" ON public.profiles;
CREATE POLICY "Admins modifican perfiles"
  ON public.profiles FOR ALL
  USING (public.has_role(ARRAY['admin']))
  WITH CHECK (public.has_role(ARRAY['admin']));

-- 4. Tabla auxiliar de invitaciones pendientes
CREATE TABLE IF NOT EXISTS public.profiles_pending (
  email      TEXT PRIMARY KEY,
  role       TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'empleado', 'viewer')),
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles_pending ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Solo admins manejan invitaciones" ON public.profiles_pending;
CREATE POLICY "Solo admins manejan invitaciones"
  ON public.profiles_pending
  FOR ALL
  USING (public.has_role(ARRAY['admin']))
  WITH CHECK (public.has_role(ARRAY['admin']));

-- 5. Trigger para auto-crear profile al registrarse
-- Respeta invitaciones en profiles_pending; si no hay, usa admins legacy o viewer.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  pending_role TEXT;
  default_role TEXT;
BEGIN
  SELECT role
  INTO pending_role
  FROM public.profiles_pending
  WHERE email = NEW.email;

  IF pending_role IS NOT NULL THEN
    default_role := pending_role;
    DELETE FROM public.profiles_pending WHERE email = NEW.email;
  ELSIF EXISTS (SELECT 1 FROM public.admins WHERE user_id = NEW.id) THEN
    default_role := 'admin';
  ELSE
    default_role := 'viewer';
  END IF;

  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, default_role)
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Trigger para updated_at
CREATE OR REPLACE FUNCTION public.update_profile_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_profile_updated ON public.profiles;
CREATE TRIGGER on_profile_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_profile_timestamp();

-- 7. Poblar profiles con usuarios existentes
-- Los que están en `admins` quedan como admin, el resto como viewer.
INSERT INTO public.profiles (id, email, role)
SELECT
  u.id,
  u.email,
  CASE WHEN a.user_id IS NOT NULL THEN 'admin' ELSE 'viewer' END
FROM auth.users u
LEFT JOIN public.admins a ON a.user_id = u.id
ON CONFLICT (id) DO NOTHING;

-- NOTA: La tabla `admins` sigue funcionando para compatibilidad con las RLS
-- existentes de productos y pedidos. En una futura fase se migrarán esas
-- policies para usar `has_role(ARRAY['admin','manager'])`.
