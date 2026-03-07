-- ═══════════════════════════════════════════════════════════════════════════
-- SETUP COMPLETO — Catálogo PWA en Supabase
-- Ejecuta este script en: Supabase Dashboard → SQL Editor → New Query
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. EXTENSIÓN para UUIDs (ya viene activa en Supabase, pero por si acaso)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

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
-- 3. ROW LEVEL SECURITY (RLS)
-- Sin estas políticas el anon key NO puede leer nada.
-- ───────────────────────────────────────────────────────────────────────────
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;

-- Lectura pública — todos los productos (activos y agotados) son visibles
-- El frontend se encarga de mostrar el estado "Agotado" visualmente
CREATE POLICY "Lectura pública de productos"
  ON public.productos
  FOR SELECT
  USING (true);

-- Escritura solo para usuarios autenticados (panel de admin futuro)
CREATE POLICY "Solo admins pueden insertar"
  ON public.productos
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Solo admins pueden actualizar"
  ON public.productos
  FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Solo admins pueden eliminar"
  ON public.productos
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- ───────────────────────────────────────────────────────────────────────────
-- 4. DATOS DE EJEMPLO (los mismos del catálogo estático)
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
   'globos-metal', 'Anagram', '18 pulgadas'),

  ('Globo Número 1 Gigante',
   'Globo metálico número 1 dorado. Grande y vistoso para el cumpleaños del año.',
   65.00,
   'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=600&q=80',
   'globos-metal', 'Sempertex', 'Número 34'),

  ('Globo Látex Pastel Surtido',
   'Globo de látex en colores pastel suave. Venta por pieza, colores surtidos.',
   18.00,
   'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=600&q=80',
   'globos', 'Sempertex', '11 pulgadas'),

  ('Globo Látex Jumbo',
   'Globo de látex gigante, perfecto para decoraciones de piso o arcos impactantes.',
   35.00,
   'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=600&q=80',
   'globos', 'Sempertex', '36 pulgadas'),

  ('Piñata Tradicional de Estrella',
   'Piñata artesanal de estrella con colores brillantes para posada o cumpleaños.',
   180.00,
   'https://images.unsplash.com/photo-1547573854-74d2a71d0826?w=600&q=80',
   'pinatas', 'Granmark', 'Grande'),

  ('Kit Platos y Vasos Fiesta',
   'Kit de 10 platos + 10 vasos desechables con diseño de fiesta colorido.',
   75.00,
   'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=600&q=80',
   'desechables', 'Granmark', 'Chico'),

  ('Banner de Cumpleaños',
   'Banner de tela reutilizable con letras de FELIZ CUMPLEAÑOS en colores vibrantes.',
   120.00,
   'https://images.unsplash.com/photo-1558618047-f4e70c6c4e16?w=600&q=80',
   'decoracion', 'Anagram', 'Grande');

-- ───────────────────────────────────────────────────────────────────────────
-- 5. STORAGE BUCKET para imágenes (opcional — si quieres subir fotos reales)
-- ───────────────────────────────────────────────────────────────────────────
-- Ejecuta esto en Storage → New Bucket si prefieres no usar URLs externas:
--
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('productos-imagenes', 'productos-imagenes', true);
--
-- CREATE POLICY "Imágenes públicas"
--   ON storage.objects FOR SELECT
--   USING (bucket_id = 'productos-imagenes');
--
-- Luego la URL de cada imagen será:
-- https://xxxx.supabase.co/storage/v1/object/public/productos-imagenes/foto.jpg

