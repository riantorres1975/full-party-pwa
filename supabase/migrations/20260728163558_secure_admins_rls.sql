BEGIN;

-- `admins` is a legacy compatibility table. Authorization now comes from
-- `profiles` through `has_role`, so browser clients do not need direct access.
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.admins FROM PUBLIC, anon, authenticated;

-- Trigger functions are invoked by PostgreSQL and must not be exposed as RPCs.
REVOKE ALL ON FUNCTION public.handle_new_user()
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.check_order_rate_limit()
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_profile_timestamp()
  FROM PUBLIC, anon, authenticated;

-- Role and account-existence helpers are authenticated-only APIs.
REVOKE ALL ON FUNCTION public.has_role(TEXT[])
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(TEXT[])
  TO authenticated;

REVOKE ALL ON FUNCTION public.check_email_exists(TEXT)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.check_email_exists(TEXT)
  TO authenticated;

-- Eliminate mutable search paths on the functions touched by this migration.
ALTER FUNCTION public.handle_new_user() SET search_path = '';
ALTER FUNCTION public.has_role(TEXT[]) SET search_path = '';
ALTER FUNCTION public.check_email_exists(TEXT) SET search_path = '';
ALTER FUNCTION public.check_order_rate_limit() SET search_path = '';
ALTER FUNCTION public.update_profile_timestamp() SET search_path = '';

COMMENT ON TABLE public.admins IS
  'Legacy admin compatibility allowlist. RLS denies client access; roles live in public.profiles.';

COMMIT;
