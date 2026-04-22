-- ============================================================================
-- Channel Partner Signup Trigger
-- Migration: 20260421164100_channel_partner_signup_trigger.sql
-- Purpose: Auto-create channel_partners record when user registers as channel_partner
-- ============================================================================
-- This trigger extends the existing create_profile_for_user() function to
-- automatically create a channel_partners record with status='pending_approval'
-- when a user signs up with role='channel_partner'.
--
-- This enables the public application flow where users can register as
-- Channel Partners and submit for admin approval.
-- ============================================================================

-- Extend the existing trigger function to handle channel_partner registration
CREATE OR REPLACE FUNCTION public.create_profile_for_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create profile record (existing logic)
  INSERT INTO public.profiles (id, name, email, phone, role, active_role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    NEW.email,
    COALESCE(NEW.phone, NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'guardian'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'guardian')
  );
  
  -- Create channel_partners record if role is channel_partner
  IF COALESCE(NEW.raw_user_meta_data->>'role', '') = 'channel_partner' THEN
    INSERT INTO public.channel_partners (
      user_id,
      status,
      business_name,
      phone,
      nid_number,
      bank_account,
      notes
    ) VALUES (
      NEW.id,
      'pending_approval',
      COALESCE(NEW.raw_user_meta_data->>'business_name', ''),
      COALESCE(NEW.phone, NEW.raw_user_meta_data->>'phone', ''),
      NULL, -- nid_number - to be provided later
      '{}'::jsonb, -- bank_account - to be provided later
      NULL -- notes
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Recreate the trigger (in case it was dropped)
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.create_profile_for_user();

COMMENT ON FUNCTION public.create_profile_for_user() IS 'Creates profile record and channel_partners record (if role=channel_partner) on user signup';
