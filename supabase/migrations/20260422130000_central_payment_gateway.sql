-- Migration: Central Payment Gateway (CENTRAL_PAYMENT_GATEWAY_001)
-- Transition billing from peer-to-peer to centralized platform escrow
-- Payment proofs route to Admin for verification. On approval, credit_escrow_earning RPC credits provider wallet.

-- A. Seed platform_config rows
INSERT INTO platform_config (key, value) VALUES
  ('platform_bkash_number',          '"01613249520"'),
  ('platform_bank_name',             '"Eastern Bank Limited"'),
  ('platform_bank_account',          '"(set by admin)"'),
  ('moderator_can_verify_payments',  'false')
ON CONFLICT (key) DO NOTHING;

-- B. credit_escrow_earning (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.credit_escrow_earning(
  p_invoice_id       UUID,
  p_provider_user_id UUID,
  p_amount           BIGINT
) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Idempotency: return early if this invoice was already credited
  IF EXISTS (
    SELECT 1 FROM wallet_transactions
    WHERE contract_id = p_invoice_id::text AND type = 'earning'
  ) THEN RETURN; END IF;

  -- Upsert wallet (handles case where provider wallet doesn't exist yet)
  INSERT INTO wallets (user_id, user_role, balance, total_earned)
    SELECT p_provider_user_id,
           COALESCE((SELECT role FROM profiles WHERE id = p_provider_user_id), 'agency'),
           p_amount,
           p_amount
  ON CONFLICT (user_id) DO UPDATE
    SET balance      = wallets.balance + p_amount,
        total_earned = wallets.total_earned + p_amount;

  -- Record the earning transaction
  INSERT INTO wallet_transactions (
    wallet_id, type, amount, balance_after,
    description, contract_id, status
  ) VALUES (
    p_provider_user_id,
    'earning',
    p_amount,
    (SELECT balance FROM wallets WHERE user_id = p_provider_user_id),
    'Escrow payout — invoice ' || p_invoice_id::text,
    p_invoice_id::text,
    'completed'
  );
END;
$$;

-- C. RLS Policy Changes

-- payment_proofs UPDATE: restrict to admin/moderator only
DROP POLICY IF EXISTS "pp_update" ON public.payment_proofs;
CREATE POLICY "pp_update" ON public.payment_proofs
  AS PERMISSIVE FOR UPDATE TO public
  USING (is_mod_or_admin());

-- payment_proofs SELECT: guardians, providers for their invoices, admins/mods
DROP POLICY IF EXISTS "pp_select"               ON public.payment_proofs;
DROP POLICY IF EXISTS "Payment proof parties read" ON public.payment_proofs;
CREATE POLICY "pp_select" ON public.payment_proofs
  AS PERMISSIVE FOR SELECT TO public
  USING (
    submitted_by_id = (SELECT auth.uid())
    OR received_by_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM invoices i
      WHERE i.id = payment_proofs.invoice_id
        AND i.from_party_id = (SELECT auth.uid())
    )
    OR is_mod_or_admin()
  );
