BEGIN;

-- Internal trigger/default helpers must not be callable as public RPCs.
REVOKE ALL ON FUNCTION public.set_updated_at()
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.generar_folio()
  FROM PUBLIC, anon, authenticated;

ALTER FUNCTION public.set_updated_at() SET search_path = '';
ALTER FUNCTION public.generar_folio() SET search_path = '';

COMMIT;
