BEGIN;

CREATE OR REPLACE FUNCTION public.check_email_exists(p_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT public.has_role(ARRAY['admin']) THEN
    RAISE EXCEPTION 'admin role required'
      USING ERRCODE = '42501';
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM auth.users
    WHERE LOWER(email) = LOWER(BTRIM(p_email))
  );
END;
$$;

REVOKE ALL ON FUNCTION public.check_email_exists(TEXT)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.check_email_exists(TEXT)
  TO authenticated;

COMMIT;
