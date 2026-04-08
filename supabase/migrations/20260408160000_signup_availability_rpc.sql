-- Allow anonymous signup flow to detect email/phone already present in profiles.
-- Client RLS only permits SELECT on own row (auth.uid() = id), so a plain profiles query
-- from the browser never sees other users and cannot enforce uniqueness before signUp.

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
    EXISTS (SELECT 1 FROM public.profiles pr WHERE lower(trim(COALESCE(pr.email, ''))) = em),
    (ph <> '' AND EXISTS (SELECT 1 FROM public.profiles pr2 WHERE trim(COALESCE(pr2.phone, '')) = ph));
END;
$$;

REVOKE ALL ON FUNCTION public.check_signup_availability(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_signup_availability(text, text) TO anon;
GRANT EXECUTE ON FUNCTION public.check_signup_availability(text, text) TO authenticated;
