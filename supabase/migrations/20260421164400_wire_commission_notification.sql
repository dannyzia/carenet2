-- ============================================================================
-- Wire Up Commission Credit Notification
-- Migration: 20260421164400_wire_commission_notification.sql
-- Purpose: Call notifyCpCommissionCredited after commission is credited
-- ============================================================================
-- This migration fixes Bug #6 part: notifyCpCommissionCredited is never called.
-- The credit_cp_commission function credits wallets but sends NO notification to the CP.
-- This modifies the function to send a notification after crediting.
-- ============================================================================

-- Create a function to send commission credit notification
CREATE OR REPLACE FUNCTION public.notify_cp_commission_credited(p_commission_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cp_user_id UUID;
  v_cp_business_name TEXT;
  v_commission_amount INTEGER;
  v_lead_role TEXT;
BEGIN
  -- Get Channel Partner user ID and commission details
  SELECT 
    cp.user_id,
    COALESCE(cp.business_name, 'Channel Partner'),
    c.cp_commission_amount,
    c.lead_role
  INTO v_cp_user_id, v_cp_business_name, v_commission_amount, v_lead_role
  FROM public.channel_partner_commissions c
  JOIN public.channel_partners cp ON cp.id = c.channel_partner_id
  WHERE c.id = p_commission_id;
  
  IF v_cp_user_id IS NULL THEN
    RETURN;
  END IF;
  
  -- Insert notification to the Channel Partner
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
    'CP_COMMISSION_CREDITED',
    'cp_commission',
    'Commission Credited',
    'কমিশন জমা হয়েছে',
    'You have been credited ' || v_commission_amount || ' BDT for ' || v_lead_role || ' referral.',
    'আপনার ' || v_lead_role || ' রেফারেলের জন্য ' || v_commission_amount || ' টাকা জমা হয়েছে।',
    v_cp_user_id,
    jsonb_build_object(
      'commission_id', p_commission_id,
      'amount', v_commission_amount,
      'lead_role', v_lead_role
    )
  );
  
END;
$$;

COMMENT ON FUNCTION public.notify_cp_commission_credited(UUID) IS 'Sends notification to Channel Partner when commission is credited to their wallet';

-- Drop previous version of credit_cp_commission to ensure clean replacement
-- This function was originally defined in 20260420120000_channel_partner_tables.sql
-- This migration adds notification support by replacing it
DROP FUNCTION IF EXISTS public.credit_cp_commission(UUID);

-- Modify credit_cp_commission to call the notification function
CREATE OR REPLACE FUNCTION credit_cp_commission(p_invoice_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_commission RECORD;
  v_wallet_id UUID;
  v_transaction_id UUID;
BEGIN
  -- Find pending commission for this invoice
  FOR v_commission IN
      SELECT * FROM public.channel_partner_commissions
      WHERE invoice_id = p_invoice_id AND status = 'pending'
  LOOP
    -- Get Channel Partner wallet
    SELECT id INTO v_wallet_id
    FROM public.wallets
    WHERE user_id = (
      SELECT user_id FROM public.channel_partners WHERE id = v_commission.channel_partner_id
    );
    
    IF v_wallet_id IS NULL THEN
      CONTINUE;
    END IF;
    
    -- Create wallet transaction
    INSERT INTO public.wallet_transactions (
      wallet_id, type, amount, balance_after, description, 
      status, created_at
    ) VALUES (
      v_wallet_id, 'cp_commission', v_commission.cp_commission_amount, 
      (SELECT balance FROM public.wallets WHERE id = v_wallet_id) + v_commission.cp_commission_amount,
      'Channel Partner commission from invoice ' || p_invoice_id,
      'completed', now()
    )
    RETURNING id INTO v_transaction_id;
    
    -- Update wallet balance
    UPDATE public.wallets
    SET balance = balance + v_commission.cp_commission_amount,
        total_earned = total_earned + v_commission.cp_commission_amount
    WHERE id = v_wallet_id;
    
    -- Update commission status
    UPDATE public.channel_partner_commissions
    SET status = 'credited',
        wallet_transaction_id = v_transaction_id,
        credited_at = now(),
        payment_collected_at = now()
    WHERE id = v_commission.id;
    
    -- SEND NOTIFICATION TO CHANNEL PARTNER (FIX FOR BUG #6)
    PERFORM public.notify_cp_commission_credited(v_commission.id);
    
  END LOOP;
END;
$$;
