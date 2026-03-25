-- ═══════════════════════════════════════════════════════════════════════════
-- Storage: imágenes de productos (subida desde el panel admin)
-- 1) En Supabase → Storage → New bucket: nombre "productos-imagenes", público.
-- 2) Ejecuta este script en SQL Editor para las políticas RLS del bucket.
-- ═══════════════════════════════════════════════════════════════════════════

-- Lectura pública (el catálogo muestra imágenes sin iniciar sesión)
DROP POLICY IF EXISTS "Lectura pública imágenes productos" ON storage.objects;
CREATE POLICY "Lectura pública imágenes productos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'productos-imagenes');

-- Solo usuarios autenticados suben / actualizan / borran
DROP POLICY IF EXISTS "Admins suben imágenes productos" ON storage.objects;
CREATE POLICY "Admins suben imágenes productos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'productos-imagenes');

DROP POLICY IF EXISTS "Admins actualizan imágenes productos" ON storage.objects;
CREATE POLICY "Admins actualizan imágenes productos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'productos-imagenes');

DROP POLICY IF EXISTS "Admins eliminan imágenes productos" ON storage.objects;
CREATE POLICY "Admins eliminan imágenes productos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'productos-imagenes');
