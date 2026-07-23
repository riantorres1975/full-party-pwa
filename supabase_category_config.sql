-- CATEGORY PRESENTATION
-- Run after supabase_security_hardening.sql.
-- Allows the public catalog to read only the category presentation key while
-- keeping every internal configuration value private.

BEGIN;

DROP POLICY IF EXISTS configuracion_public_select ON public.configuracion;
CREATE POLICY configuracion_public_select
  ON public.configuracion FOR SELECT
  TO anon, authenticated
  USING (
    clave IN (
      'anuncio',
      'pedidos_habilitados',
      'catalogo_categorias'
    )
  );

GRANT SELECT ON TABLE public.configuracion TO anon;

COMMIT;
