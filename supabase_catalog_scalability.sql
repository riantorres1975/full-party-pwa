-- CATALOGO PUBLICO: PAGINACION, BUSQUEDA Y FACETAS
-- Ejecutar en Supabase Dashboard -> SQL Editor.
-- Es seguro volver a ejecutar este archivo.

BEGIN;

CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;

-- Orden principal del catalogo y desempate estable para paginacion.
CREATE INDEX IF NOT EXISTS idx_productos_catalogo_destacados
  ON public.productos (activo DESC, es_nuevo DESC NULLS LAST, nombre ASC, id ASC);

CREATE INDEX IF NOT EXISTS idx_productos_catalogo_precio
  ON public.productos (precio, id);

CREATE INDEX IF NOT EXISTS idx_productos_catalogo_categoria
  ON public.productos (categoria, activo, nombre, id);

CREATE INDEX IF NOT EXISTS idx_productos_catalogo_marca
  ON public.productos (marca, activo, nombre, id);

CREATE INDEX IF NOT EXISTS idx_productos_catalogo_tamano
  ON public.productos (tamano, activo, nombre, id);

-- Acelera ILIKE con comodines para la busqueda publica.
CREATE INDEX IF NOT EXISTS idx_productos_nombre_trgm
  ON public.productos USING gin (nombre extensions.gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_productos_descripcion_trgm
  ON public.productos USING gin (descripcion extensions.gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_productos_categoria_trgm
  ON public.productos USING gin (categoria extensions.gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_productos_marca_trgm
  ON public.productos USING gin (marca extensions.gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_productos_tamano_trgm
  ON public.productos USING gin (tamano extensions.gin_trgm_ops);

CREATE OR REPLACE VIEW public.catalogo_facetas_publicas
WITH (security_invoker = true)
AS
SELECT
  'categoria'::text AS dimension,
  categoria::text AS valor,
  count(*)::bigint AS cantidad,
  NULL::numeric AS precio_min,
  NULL::numeric AS precio_max,
  (array_agg(imagen_url ORDER BY nombre) FILTER (
    WHERE imagen_url IS NOT NULL AND btrim(imagen_url) <> ''
  ))[1]::text AS imagen
FROM public.productos
WHERE activo IS NOT FALSE
  AND categoria IS NOT NULL
  AND btrim(categoria) <> ''
GROUP BY categoria

UNION ALL

SELECT
  'marca'::text,
  marca::text,
  count(*)::bigint,
  NULL::numeric,
  NULL::numeric,
  NULL::text
FROM public.productos
WHERE activo IS NOT FALSE
  AND marca IS NOT NULL
  AND btrim(marca) <> ''
GROUP BY marca

UNION ALL

SELECT
  'tamano'::text,
  tamano::text,
  count(*)::bigint,
  NULL::numeric,
  NULL::numeric,
  NULL::text
FROM public.productos
WHERE activo IS NOT FALSE
  AND tamano IS NOT NULL
  AND btrim(tamano) <> ''
GROUP BY tamano

UNION ALL

SELECT
  'resumen'::text,
  'catalogo'::text,
  count(*)::bigint,
  min(precio) FILTER (WHERE activo IS NOT FALSE)::numeric,
  max(precio) FILTER (WHERE activo IS NOT FALSE)::numeric,
  NULL::text
FROM public.productos;

REVOKE ALL ON public.catalogo_facetas_publicas FROM PUBLIC;
GRANT SELECT ON public.catalogo_facetas_publicas TO anon, authenticated;

COMMENT ON VIEW public.catalogo_facetas_publicas IS
  'Conteos ligeros para filtros del catalogo publico; respeta RLS de productos.';

NOTIFY pgrst, 'reload schema';

COMMIT;
