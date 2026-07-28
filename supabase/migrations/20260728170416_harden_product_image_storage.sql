BEGIN;

UPDATE storage.buckets
SET
  file_size_limit = 5 * 1024 * 1024,
  allowed_mime_types = ARRAY[
    'image/avif',
    'image/jpeg',
    'image/png',
    'image/webp'
  ]
WHERE id = 'productos-imagenes';

DROP POLICY IF EXISTS "Lectura pública imágenes productos"
  ON storage.objects;
DROP POLICY IF EXISTS "Admins suben imágenes productos"
  ON storage.objects;
DROP POLICY IF EXISTS "Admins actualizan imágenes productos"
  ON storage.objects;
DROP POLICY IF EXISTS "Admins eliminan imágenes productos"
  ON storage.objects;

CREATE POLICY "Equipo catálogo lista imágenes productos"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'productos-imagenes'
    AND (SELECT public.has_role(ARRAY['admin', 'manager']))
  );

CREATE POLICY "Equipo catálogo sube imágenes productos"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'productos-imagenes'
    AND (SELECT public.has_role(ARRAY['admin', 'manager']))
  );

CREATE POLICY "Equipo catálogo actualiza imágenes productos"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'productos-imagenes'
    AND (SELECT public.has_role(ARRAY['admin', 'manager']))
  )
  WITH CHECK (
    bucket_id = 'productos-imagenes'
    AND (SELECT public.has_role(ARRAY['admin', 'manager']))
  );

CREATE POLICY "Equipo catálogo elimina imágenes productos"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'productos-imagenes'
    AND (SELECT public.has_role(ARRAY['admin', 'manager']))
  );

COMMIT;
