-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRACIÓN: Tabla profiles con roles
-- Ejecutar UNA SOLA VEZ en Supabase Dashboard → SQL Editor
-- Extiende la tabla `admins` existente con roles granulares
-- ═══════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────
-- 1. Tabla profiles
-- ───────────────────────────────────────────────────────────────────────────
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

CREATE INDEX IF NOT EXISTS idx_profiles_role   ON public.profiles (role);
CREATE INDEX IF NOT EXISTS idx_profiles_activo ON public.profiles (activo);

-- ───────────────────────────────────────────────────────────────────────────
-- 2. RLS
-- ───────────────────────────────────────────────────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuarios leen su propio perfil" ON public.profiles;
CREATE POLICY "Usuarios leen su propio perfil"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Nota: esta policy usa una subquery recursiva mínima. La función has_role()
-- (definida más abajo) no puede usarse aquí porque aún no existe en este punto
-- del script. Supabase evalúa cada policy en su propio contexto; la subquery
-- no genera loop porque busca por id = auth.uid(), que es una lookup directa.
DROP POLICY IF EXISTS "Admins leen todos los perfiles" ON public.profiles;
CREATE POLICY "Admins leen todos los perfiles"
  ON public.profiles FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  ));

DROP POLICY IF EXISTS "Admins modifican perfiles" ON public.profiles;
CREATE POLICY "Admins modifican perfiles"
  ON public.profiles FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  ));

-- ───────────────────────────────────────────────────────────────────────────
-- 3. Trigger updated_at
-- ───────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_profile_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_profile_updated ON public.profiles;
CREATE TRIGGER on_profile_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_profile_timestamp();

-- ───────────────────────────────────────────────────────────────────────────
-- 4. Tabla profiles_pending (invitaciones pendientes)
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles_pending (
  email      TEXT PRIMARY KEY,
  role       TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'empleado', 'viewer')),
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles_pending ENABLE ROW LEVEL SECURITY;

-- La policy de profiles_pending referencia has_role(), que se define en paso 6.
-- Se crea después de esa función.

-- ───────────────────────────────────────────────────────────────────────────
-- 5. Trigger handle_new_user
--    Orden de prioridad para el rol inicial:
--    1. profiles_pending (invitación explícita)
--    2. tabla admins (admins preexistentes)
--    3. viewer (default seguro)
-- ───────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  pending_role    TEXT;
  pending_expired BOOLEAN;
BEGIN
  SELECT role, (expires_at < NOW())
    INTO pending_role, pending_expired
    FROM public.profiles_pending
    WHERE email = NEW.email;

  IF pending_role IS NOT NULL THEN
    DELETE FROM public.profiles_pending WHERE email = NEW.email;
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ───────────────────────────────────────────────────────────────────────────
-- 6. Función helper has_role() para RLS futuras
-- ───────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.has_role(required_roles TEXT[])
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role = ANY(required_roles)
      AND activo = true
  );
$$;

-- Policy de profiles_pending (ahora que has_role() existe)
DROP POLICY IF EXISTS "Solo admins manejan invitaciones" ON public.profiles_pending;
CREATE POLICY "Solo admins manejan invitaciones"
  ON public.profiles_pending FOR ALL
  USING (public.has_role(ARRAY['admin']));

-- ───────────────────────────────────────────────────────────────────────────
-- 7. Poblar profiles con usuarios existentes
--    Admins de la tabla `admins` → role 'admin'
--    Resto de usuarios registrados → role 'viewer'
-- ───────────────────────────────────────────────────────────────────────────
INSERT INTO public.profiles (id, email, role)
SELECT
  u.id,
  u.email,
  CASE WHEN a.user_id IS NOT NULL THEN 'admin' ELSE 'viewer' END
FROM auth.users u
LEFT JOIN public.admins a ON a.user_id = u.id
ON CONFLICT (id) DO NOTHING;

-- ───────────────────────────────────────────────────────────────────────────
-- VERIFICACIÓN — Corre estas queries después para confirmar:
--
-- SELECT id, email, role, activo FROM public.profiles;
-- SELECT COUNT(*) FROM public.profiles;
-- SELECT has_role(ARRAY['admin']);   -- debe devolver true si eres admin
-- ───────────────────────────────────────────────────────────────────────────

-- NOTAS DE COMPATIBILIDAD:
-- • La tabla `admins` NO se toca. Las RLS de productos y pedidos siguen
--   usando `admins` hasta la Fase 5.
-- • `has_role()` está lista para usarse en RLS futuras como sustituto moderno.
-- • `ON DELETE CASCADE` en profiles.id elimina el profile cuando se borra
--   el usuario de auth.users. Borrar de auth.users requiere Dashboard o
--   Edge Function (no se puede con el cliente JS por seguridad).
