-- Include auth.users in signup pre-check. Profiles-only missed emails that exist in Auth
-- (e.g. orphaned auth row, trigger failure, or timing). In those cases Supabase signUp
-- returns an obfuscated user with identities = [] and does not send a "new signup" email.

CREATE OR REPLACE FUNCTION public.check_signup_availability(p_email text, p_phone text)
RETURNS TABLE(email_busy boolean, phone_busy boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  em text := lower(trim(COALESCE(p_email, '')));
  ph text := trim(COALESCE(p_phone, ''));
BEGIN
  RETURN QUERY
  SELECT
    EXISTS (
      SELECT 1 FROM auth.users u
      WHERE lower(trim(COALESCE(u.email, ''))) = em
    ),
    (
      ph <> '' AND (
        EXISTS (SELECT 1 FROM public.profiles pr WHERE trim(COALESCE(pr.phone, '')) = ph)
        OR EXISTS (
          SELECT 1 FROM auth.users u2
          WHERE trim(COALESCE(u2.phone, '')) = ph
        )
      )
    );
END;
$$;
