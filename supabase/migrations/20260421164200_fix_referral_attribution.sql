-- ============================================================================
-- Fix Referral Code Attribution
-- Migration: 20260421164200_fix_referral_attribution.sql
-- Purpose: Wire up referral code processing in signup trigger
-- ============================================================================
-- This migration fixes Bug #1 from audit: referral codes are collected but never
-- processed. The attribute_lead_via_referral_code() SECURITY DEFINER function
-- exists but is never called. This migration modifies the signup trigger to
-- process referral codes when users register.
-- ============================================================================

-- Extend the create_profile_for_user function to handle referral code attribution
CREATE OR REPLACE FUNCTION public.create_profile_for_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referral_code TEXT;
  v_lead_role TEXT;
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
  
  -- Process referral code attribution (FIX FOR BUG #1)
  -- This handles all roles, not just channel_partner
  v_referral_code := COALESCE(NEW.raw_user_meta_data->>'referralCode', '');
  v_lead_role := COALESCE(NEW.raw_user_meta_data->>'role', 'guardian');
  
  IF v_referral_code IS NOT NULL AND v_referral_code != '' THEN
    BEGIN
      -- Call the SECURITY DEFINER function to attribute the lead
      PERFORM public.attribute_lead_via_referral_code(
        v_referral_code,
        NEW.id,
        v_lead_role
      );
    EXCEPTION WHEN OTHERS THEN
      -- Log attribution failure but don't fail the signup
      -- This ensures user signup succeeds even if referral code is invalid
      RAISE NOTICE 'Referral code attribution failed for user %: %', NEW.id, SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Recreate the trigger to use the updated function
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.create_profile_for_user();

COMMENT ON FUNCTION public.create_profile_for_user() IS 'Creates profile record, channel_partners record (if role=channel_partner), and processes referral code attribution on user signup';
