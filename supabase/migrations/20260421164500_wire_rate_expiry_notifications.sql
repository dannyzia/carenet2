-- ============================================================================
-- Wire Up Rate Expiry Notifications
-- Migration: 20260421164500_wire_rate_expiry_notifications.sql
-- Purpose: Create functions for rate expiry notifications
-- ============================================================================
-- This migration fixes Bug #6 part: notifyCpRateExpiring and notifyAdminRateExpiring
-- are never called. This creates the notification functions that will be called
-- by the rate expiry cron job.
-- ============================================================================

-- Function to notify Channel Partner that their rate is expiring soon
CREATE OR REPLACE FUNCTION public.notify_cp_rate_expiring(p_rate_id UUID, p_days_remaining INTEGER)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cp_user_id UUID;
  v_cp_business_name TEXT;
  v_lead_role TEXT;
  v_rate NUMERIC(5,2);
  v_expires_at TIMESTAMPTZ;
BEGIN
  SELECT 
    cp.user_id,
    COALESCE(cp.business_name, 'Channel Partner'),
    r.lead_role,
    r.rate,
    r.expires_at
  INTO v_cp_user_id, v_cp_business_name, v_lead_role, v_rate, v_expires_at
  FROM public.channel_partner_commission_rates r
  JOIN public.channel_partners cp ON cp.id = r.channel_partner_id
  WHERE r.id = p_rate_id;
  
  IF v_cp_user_id IS NULL THEN RETURN; END IF;
  
  INSERT INTO public.notifications (
    type,
    channel,
    title_en,
    title_bn,
    message_en,
    message_bn,
    receiver_id,
    metadata
  ) VALUES (
    'CP_RATE_EXPIRING',
    'cp_rate',
    'Commission Rate Expiring Soon',
    'কমিশন হার শীঘ্রই শেষ হবে',
    'Your ' || v_lead_role || ' commission rate of ' || v_rate || '% will expire in ' || p_days_remaining || ' days. Contact admin to renew.',
    'আপনার ' || v_lead_role || ' কমিশন হার ' || v_rate || '% ' || p_days_remaining || ' দিনের মধ্যে শেষ হবে। নবায়নের জন্য অ্যাডমিনের সাথে যোগাযোগ করুন।',
    v_cp_user_id,
    jsonb_build_object(
      'rate_id', p_rate_id,
      'lead_role', v_lead_role,
      'rate', v_rate,
      'expires_at', v_expires_at,
      'days_remaining', p_days_remaining
    )
  );
  
  -- Mark as notified
  UPDATE public.channel_partner_commission_rates
  SET expiry_notified = true
  WHERE id = p_rate_id;
  
END;
$$;

COMMENT ON FUNCTION public.notify_cp_rate_expiring(UUID, INTEGER) IS 'Sends notification to Channel Partner when their commission rate is expiring soon';

-- Function to notify admin that a Channel Partner rate is expiring soon
CREATE OR REPLACE FUNCTION public.notify_admin_rate_expiring(p_rate_id UUID, p_days_remaining INTEGER)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cp_business_name TEXT;
  v_lead_role TEXT;
  v_rate NUMERIC(5,2);
  v_expires_at TIMESTAMPTZ;
  v_admin_ids UUID[];
BEGIN
  SELECT 
    COALESCE(cp.business_name, 'Channel Partner'),
    r.lead_role,
    r.rate,
    r.expires_at
  INTO v_cp_business_name, v_lead_role, v_rate, v_expires_at
  FROM public.channel_partner_commission_rates r
  JOIN public.channel_partners cp ON cp.id = r.channel_partner_id
  WHERE r.id = p_rate_id;
  
  IF v_cp_business_name IS NULL THEN RETURN; END IF;
  
  -- Get all admin and moderator IDs
  SELECT ARRAY_AGG(id) INTO v_admin_ids
  FROM public.profiles
  WHERE role IN ('admin', 'moderator');
  
  IF v_admin_ids IS NULL OR array_length(v_admin_ids, 1) = 0 THEN RETURN; END IF;
  
  -- Send notification to each admin
  INSERT INTO public.notifications (type, channel, title_en, title_bn, message_en, message_bn, receiver_id, metadata)
  SELECT
    'CP_RATE_EXPIRING_ADMIN',
    'admin_cp',
    'Channel Partner Rate Expiring Soon',
    'চ্যানেল পার্টনার কমিশন হার শীঘ্রই শেষ হবে',
    v_cp_business_name || ' - ' || v_lead_role || ' rate of ' || v_rate || '% expires in ' || p_days_remaining || ' days.',
    v_cp_business_name || ' - ' || v_lead_role || ' হার ' || v_rate || '% ' || p_days_remaining || ' দিনের মধ্যে শেষ হবে।',
    unnest(v_admin_ids),
    jsonb_build_object(
      'rate_id', p_rate_id,
      'business_name', v_cp_business_name,
      'lead_role', v_lead_role,
      'rate', v_rate,
      'expires_at', v_expires_at,
      'days_remaining', p_days_remaining
    );
  
END;
$$;

COMMENT ON FUNCTION public.notify_admin_rate_expiring(UUID, INTEGER) IS 'Sends notification to admins when a Channel Partner commission rate is expiring soon';
