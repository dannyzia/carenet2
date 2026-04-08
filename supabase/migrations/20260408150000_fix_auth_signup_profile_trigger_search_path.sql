-- Fix auth signup trigger failure:
-- "Database error saving new user" caused by create_profile_for_user() resolving
-- unqualified `profiles` with the wrong search_path during auth trigger execution.

CREATE OR REPLACE FUNCTION public.create_profile_for_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, phone, role, active_role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    NEW.email,
    COALESCE(NEW.phone, NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'guardian'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'guardian')
  );
  RETURN NEW;
END;
$$;

