-- ═══════════════════════════════════════════════════════════════════════════
-- SETUP COMPLETO — Catálogo PWA en Supabase
-- Ejecuta este script en: Supabase Dashboard → SQL Editor → New Query
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. EXTENSIÓN para UUIDs (ya viene activa en Supabase, pero por si acaso)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ───────────────────────────────────────────────────────────────────────────
-- 1.5 TABLA ADMINS (Control de acceso seguro para RLS)
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.admins (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE
);

-- ───────────────────────────────────────────────────────────────────────────
-- 2. TABLA PRODUCTOS
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.productos (
  id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre      TEXT          NOT NULL,
  descripcion TEXT,
  precio      NUMERIC(10,2) NOT NULL CHECK (precio >= 0),
  imagen_url  TEXT,
  categoria   TEXT,
  marca       TEXT,
  tamano      TEXT,
  activo      BOOLEAN       NOT NULL DEFAULT true,  -- para ocultar sin borrar
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Índices para las columnas que se usan en filtros
CREATE INDEX IF NOT EXISTS idx_productos_categoria ON public.productos (categoria);
CREATE INDEX IF NOT EXISTS idx_productos_marca     ON public.productos (marca);
CREATE INDEX IF NOT EXISTS idx_productos_activo    ON public.productos (activo);

-- ───────────────────────────────────────────────────────────────────────────
-- 3. ROW LEVEL SECURITY (RLS) PRODUCTOS
-- ───────────────────────────────────────────────────────────────────────────
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lectura pública de productos" ON public.productos;
CREATE POLICY "Lectura pública de productos"
  ON public.productos
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Solo admins pueden insertar" ON public.productos;
CREATE POLICY "Solo admins pueden insertar"
  ON public.productos
  FOR INSERT
  WITH CHECK (auth.uid() IN (SELECT user_id FROM public.admins));

DROP POLICY IF EXISTS "Solo admins pueden actualizar" ON public.productos;
CREATE POLICY "Solo admins pueden actualizar"
  ON public.productos
  FOR UPDATE
  USING (auth.uid() IN (SELECT user_id FROM public.admins));

DROP POLICY IF EXISTS "Solo admins pueden eliminar" ON public.productos;
CREATE POLICY "Solo admins pueden eliminar"
  ON public.productos
  FOR DELETE
  USING (auth.uid() IN (SELECT user_id FROM public.admins));

-- ───────────────────────────────────────────────────────────────────────────
-- 4. TABLA PEDIDOS Y SU ROW LEVEL SECURITY (RLS)
-- ───────────────────────────────────────────────────────────────────────────
-- Crear la tabla pedidos si no está creada aún mediante panel
CREATE TABLE IF NOT EXISTS public.pedidos (
  id                UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  folio             TEXT          NOT NULL UNIQUE,
  cliente_nombre    TEXT          NOT NULL,
  cliente_telefono  TEXT          NOT NULL,
  tipo_entrega      TEXT          NOT NULL,
  direccion         TEXT,
  total             NUMERIC(10,2) NOT NULL,
  estado            TEXT          NOT NULL DEFAULT 'Por Surtir',
  detalles_json     JSONB         NOT NULL,
  notificado_estado TEXT,
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;

-- Cualquier persona puede insertar (hacer un pedido) sin estar auth
DROP POLICY IF EXISTS "Public puede insertar pedidos" ON public.pedidos;
CREATE POLICY "Public puede insertar pedidos"
  ON public.pedidos
  FOR INSERT
  WITH CHECK (true);

-- Solo ADMINS pueden leer los pedidos completos
DROP POLICY IF EXISTS "Solo admins pueden leer pedidos" ON public.pedidos;
CREATE POLICY "Solo admins pueden leer pedidos"
  ON public.pedidos
  FOR SELECT
  USING (auth.uid() IN (SELECT user_id FROM public.admins));

-- Solo ADMINS pueden modificar o actualizar el estado
DROP POLICY IF EXISTS "Solo admins pueden actualizar pedidos" ON public.pedidos;
CREATE POLICY "Solo admins pueden actualizar pedidos"
  ON public.pedidos
  FOR UPDATE
  USING (auth.uid() IN (SELECT user_id FROM public.admins));

-- ───────────────────────────────────────────────────────────────────────────
-- 4.5 TABLA CONFIGURACION (key-value para anuncios, ajustes, etc.)
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.configuracion (
  clave TEXT PRIMARY KEY,
  valor JSONB NOT NULL DEFAULT '{}'::JSONB
);

ALTER TABLE public.configuracion ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lectura pública de configuracion" ON public.configuracion;
CREATE POLICY "Lectura pública de configuracion"
  ON public.configuracion
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Solo admins pueden insertar config" ON public.configuracion;
CREATE POLICY "Solo admins pueden insertar config"
  ON public.configuracion
  FOR INSERT
  WITH CHECK (auth.uid() IN (SELECT user_id FROM public.admins));

DROP POLICY IF EXISTS "Solo admins pueden actualizar config" ON public.configuracion;
CREATE POLICY "Solo admins pueden actualizar config"
  ON public.configuracion
  FOR UPDATE
  USING (auth.uid() IN (SELECT user_id FROM public.admins));

-- ───────────────────────────────────────────────────────────────────────────
-- 5. DATOS DE EJEMPLO (los mismos del catálogo estático)
-- Borra este bloque cuando subas tu inventario real.
-- ───────────────────────────────────────────────────────────────────────────
INSERT INTO public.productos
  (nombre, descripcion, precio, imagen_url, categoria, marca, tamano)
VALUES
  ('Globo Metálico Estrella',
   'Globo metálico en forma de estrella de 5 puntas. Ideal para decorar mesas y bouquets.',
   45.00,
   'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=600&q=80',
   'globos-metal', 'Anagram', '18 pulgadas'),

  ('Globo Metálico Corazón',
   'Globo metálico corazón color rosa gold. Perfecto para XV años y bodas.',
   50.00,
   'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
   'globos-metal', 'Anagram', '18 pulgadas')
ON CONFLICT DO NOTHING;

-- ───────────────────────────────────────────────────────────────────────────
-- 6. PASO MANUAL FINAL (Para el panel de Supabase)
-- ───────────────────────────────────────────────────────────────────────────
-- Para darte permisos de Admin y que el panel funcione:
-- 1. Ve a "Authentication" > "Users" en tu dashboard, copia el "User UID" de tu usuario.
-- 2. Ve a "SQL Editor" y ejecuta esta única línea (quitando los guiones y poniendo tu UID real):
-- 
-- INSERT INTO public.admins (user_id) VALUES ('TU-UUID-AQUI');
-- ───────────────────────────────────────────────────────────────────────────
