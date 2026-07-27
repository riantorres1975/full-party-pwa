-- ═══════════════════════════════════════════════════════════════════════════
-- 001 — CATÁLOGO V2: RESPALDO EN BASE DE DATOS DEL CATÁLOGO V1
-- ═══════════════════════════════════════════════════════════════════════════
-- Ejecutar PRIMERO en Supabase Dashboard → SQL Editor.
-- Es seguro volver a ejecutar (recrea el respaldo con el estado actual).
--
-- Crea:
--   1. public.productos_backup_v1        — copia completa de productos
--      (incluye inactivos; el export REST con anon key no los ve).
--   2. public.catalog_v1_object_backup   — definiciones de la vista, políticas,
--      índices, triggers y funciones del catálogo V1, como referencia para la
--      migración y un posible rollback.
--
-- Ninguna de las dos tablas tiene RLS: hereda el acceso por GRANTs por defecto
-- (solo roles con acceso directo a la base; el API PostgREST no las expone
-- porque no se otorgan GRANTs a anon/authenticated).
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Copia completa de la tabla productos ─────────────────────────────────
DROP TABLE IF EXISTS public.productos_backup_v1;
CREATE TABLE public.productos_backup_v1 AS
SELECT * FROM public.productos;

COMMENT ON TABLE public.productos_backup_v1 IS
  'Respaldo completo de public.productos previo a la migración al catálogo V2 (2026-07-27). No borrar hasta cerrar la Fase 7.';

-- ── 2. Respaldo de definiciones de objetos dependientes ─────────────────────
DROP TABLE IF EXISTS public.catalog_v1_object_backup;
CREATE TABLE public.catalog_v1_object_backup (
  object_type  TEXT NOT NULL,
  object_name  TEXT NOT NULL,
  definition   TEXT,
  backed_up_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Vista de facetas del catálogo V1
INSERT INTO public.catalog_v1_object_backup (object_type, object_name, definition)
SELECT 'view', c.relname, pg_get_viewdef(c.oid)
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind IN ('v', 'm')
  AND pg_get_viewdef(c.oid) ILIKE '%productos%';

-- Políticas RLS de productos
INSERT INTO public.catalog_v1_object_backup (object_type, object_name, definition)
SELECT
  'policy',
  format('%s ON %s', p.policyname, p.tablename),
  format('cmd=%s roles=%s qual=%s with_check=%s', p.cmd, p.roles, p.qual, p.with_check)
FROM pg_policies p
WHERE p.schemaname = 'public'
  AND p.tablename = 'productos';

-- Índices de productos
INSERT INTO public.catalog_v1_object_backup (object_type, object_name, definition)
SELECT 'index', i.indexname, i.indexdef
FROM pg_indexes i
WHERE i.schemaname = 'public'
  AND i.tablename = 'productos';

-- Triggers que dependen de productos (p.ej. canonicalize_public_pedido vive en pedidos)
INSERT INTO public.catalog_v1_object_backup (object_type, object_name, definition)
SELECT 'trigger', t.tgname, pg_get_triggerdef(t.oid)
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND NOT t.tgisinternal
  AND pg_get_triggerdef(t.oid) ILIKE '%productos%';

-- Funciones del esquema público que referencian productos
-- (prokind 'f'/'p': pg_get_functiondef no soporta agregados ni window functions)
INSERT INTO public.catalog_v1_object_backup (object_type, object_name, definition)
SELECT 'function', format('%s(%s)', p.proname, pg_get_function_identity_arguments(p.oid)), pg_get_functiondef(p.oid)
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.prokind IN ('f', 'p')
  AND pg_get_functiondef(p.oid) ILIKE '%productos%';

COMMENT ON TABLE public.catalog_v1_object_backup IS
  'Definiciones de objetos SQL del catálogo V1 (vista, políticas, índices, triggers, funciones) respaldadas antes de la migración V2.';

-- Los respaldos son internos: defensa en profundidad contra los grants
-- automáticos del Data API y contra futuros cambios de privilegios por defecto.
ALTER TABLE public.productos_backup_v1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_v1_object_backup ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.productos_backup_v1 FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.catalog_v1_object_backup FROM PUBLIC, anon, authenticated;

-- ── 3. Verificación ─────────────────────────────────────────────────────────
DO $$
DECLARE
  v_originales BIGINT;
  v_respaldo   BIGINT;
  v_objetos    BIGINT;
BEGIN
  SELECT count(*) INTO v_originales FROM public.productos;
  SELECT count(*) INTO v_respaldo   FROM public.productos_backup_v1;
  SELECT count(*) INTO v_objetos    FROM public.catalog_v1_object_backup;

  IF v_respaldo <> v_originales THEN
    RAISE EXCEPTION 'Respaldo incompleto: productos=% filas, backup=% filas', v_originales, v_respaldo;
  END IF;

  RAISE NOTICE 'Respaldo OK: % productos copiados, % definiciones de objetos guardadas', v_respaldo, v_objetos;
END;
$$;

COMMIT;

-- Verificación manual (ejecutar aparte):
-- SELECT count(*) FROM public.productos_backup_v1;
-- SELECT object_type, object_name FROM public.catalog_v1_object_backup ORDER BY 1, 2;
