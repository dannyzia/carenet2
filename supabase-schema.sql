-- ═══════════════════════════════════════════════════════════════════════
-- CareNet Monetization Schema — Supabase PostgreSQL
-- ═══════════════════════════════════════════════════════════════════════
-- Run this in your Supabase SQL Editor to set up the monetization tables.
-- Requires: Supabase Auth enabled (references auth.users)
--
-- Tables:
--   wallets              — Point-based wallet per user
--   wallet_transactions  — All point movements (audit trail)
--   contracts            — Service agreements (Guardian↔Agency, Agency↔Caregiver)
--   contract_offers      — Negotiation offers (eBay-style)
--   platform_config      — Global platform settings (fee %, conversion rate)
--   admin_actions        — Audit log for admin credit/debit/freeze actions
-- ═══════════════════════════════════════════════════════════════════════

-- ─── Enable UUID extension ───
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Platform Configuration ───
CREATE TABLE IF NOT EXISTS platform_config (
  key         TEXT PRIMARY KEY,
  value       JSONB NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_by  UUID REFERENCES auth.users(id)
);

-- Seed default config
INSERT INTO platform_config (key, value) VALUES
  ('platform_fee_percent', '2.5'),
  ('default_commission_percent', '25'),
  ('points_per_bdt', '10'),
  ('min_withdrawal_points', '5000'),
  ('registration_bonus_guardian', '5000'),
  ('registration_bonus_agency', '10000'),
  ('registration_bonus_caregiver', '2000'),
  ('registration_bonus_shop', '5000')
ON CONFLICT (key) DO NOTHING;

-- ─── Wallets ───
CREATE TABLE IF NOT EXISTS wallets (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_role           TEXT NOT NULL CHECK (user_role IN ('guardian', 'agency', 'caregiver', 'shop', 'patient', 'moderator', 'admin')),
  
  -- Balances (all in CarePoints)
  balance             BIGINT NOT NULL DEFAULT 0 CHECK (balance >= 0),
  pending_due         BIGINT NOT NULL DEFAULT 0 CHECK (pending_due >= 0),     -- Platform fees owed
  frozen_amount       BIGINT NOT NULL DEFAULT 0 CHECK (frozen_amount >= 0),   -- Withheld by admin
  total_earned        BIGINT NOT NULL DEFAULT 0,
  total_spent         BIGINT NOT NULL DEFAULT 0,
  total_withdrawn     BIGINT NOT NULL DEFAULT 0,
  
  -- Per-user fee config (overrides platform defaults)
  fee_percent         NUMERIC(5,2) NOT NULL DEFAULT 2.5,
  commission_percent  NUMERIC(5,2) NOT NULL DEFAULT 25.0,
  registration_bonus  BIGINT NOT NULL DEFAULT 0,
  
  -- Status
  status              TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'frozen', 'suspended')),
  
  -- Metadata
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Index for fast lookup by user
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_wallets_status ON wallets(status);

-- ─── Wallet Transactions ───
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_id       UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  
  type            TEXT NOT NULL CHECK (type IN (
    'purchase', 'withdrawal', 'contract_payment', 'earning',
    'platform_fee', 'commission', 'admin_credit', 'admin_debit',
    'bonus', 'refund', 'transfer'
  )),
  
  amount          BIGINT NOT NULL,             -- Positive = credit, negative = debit
  balance_after   BIGINT NOT NULL,             -- Wallet balance after this transaction
  description     TEXT NOT NULL,
  
  -- Optional references
  counterparty_id UUID REFERENCES auth.users(id),
  counterparty_name TEXT,
  contract_id     UUID,                        -- FK added after contracts table
  fee_amount      BIGINT DEFAULT 0,            -- Fee portion of this transaction
  
  -- Payment method (for purchase/withdrawal)
  payment_method  TEXT,                        -- 'bkash', 'nagad', 'rocket', 'bank'
  external_ref    TEXT,                        -- External transaction reference
  
  status          TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'pending', 'failed', 'reversed')),
  
  -- Admin action reference
  admin_action_id UUID,
  
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wallet_tx_wallet_id ON wallet_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_type ON wallet_transactions(type);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_contract ON wallet_transactions(contract_id);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_created ON wallet_transactions(created_at DESC);

-- ─── Contracts ───
CREATE TABLE IF NOT EXISTS contracts (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_number TEXT NOT NULL UNIQUE,        -- Human-readable: CTR-2026-XXXX
  
  type            TEXT NOT NULL CHECK (type IN ('guardian_agency', 'agency_caregiver')),
  status          TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft', 'offered', 'negotiating', 'accepted', 'active', 'completed', 'cancelled', 'disputed'
  )),
  
  -- Parties
  party_a_id      UUID NOT NULL REFERENCES auth.users(id),
  party_a_name    TEXT NOT NULL,
  party_a_role    TEXT NOT NULL CHECK (party_a_role IN ('guardian', 'agency')),
  
  party_b_id      UUID NOT NULL REFERENCES auth.users(id),
  party_b_name    TEXT NOT NULL,
  party_b_role    TEXT NOT NULL CHECK (party_b_role IN ('agency', 'caregiver')),
  
  -- Service details
  patient_name    TEXT,
  service_type    TEXT NOT NULL,
  description     TEXT NOT NULL DEFAULT '',
  
  -- Financial terms (all in CarePoints)
  listed_price    BIGINT NOT NULL,             -- Original daily rate
  agreed_price    BIGINT NOT NULL DEFAULT 0,   -- Final negotiated daily rate
  duration_days   INTEGER NOT NULL,
  total_value     BIGINT NOT NULL DEFAULT 0,   -- agreed_price × duration_days
  
  -- Platform fees
  party_a_fee_pct NUMERIC(5,2) NOT NULL DEFAULT 2.5,
  party_b_fee_pct NUMERIC(5,2) NOT NULL DEFAULT 2.5,
  party_a_fee     BIGINT NOT NULL DEFAULT 0,
  party_b_fee     BIGINT NOT NULL DEFAULT 0,
  platform_revenue BIGINT NOT NULL DEFAULT 0,  -- Total fees collected
  
  -- Dates
  start_date      DATE,
  end_date        DATE,
  accepted_at     TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  cancelled_at    TIMESTAMPTZ,
  
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contracts_party_a ON contracts(party_a_id);
CREATE INDEX IF NOT EXISTS idx_contracts_party_b ON contracts(party_b_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_type ON contracts(type);

-- Add FK from wallet_transactions to contracts
ALTER TABLE wallet_transactions
  ADD CONSTRAINT fk_wallet_tx_contract
  FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE SET NULL;

-- ─── Contract Offers (Negotiation History) ───
CREATE TABLE IF NOT EXISTS contract_offers (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id     UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  
  offered_by      UUID NOT NULL REFERENCES auth.users(id),
  offered_by_name TEXT NOT NULL,
  offered_by_role TEXT NOT NULL CHECK (offered_by_role IN ('guardian', 'agency', 'caregiver')),
  
  points_per_day  BIGINT NOT NULL,
  total_points    BIGINT NOT NULL,
  duration_days   INTEGER NOT NULL,
  message         TEXT NOT NULL DEFAULT '',
  
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'accepted', 'rejected', 'countered', 'expired', 'withdrawn'
  )),
  
  responded_at    TIMESTAMPTZ,
  response_message TEXT,
  
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_offers_contract ON contract_offers(contract_id);
CREATE INDEX IF NOT EXISTS idx_offers_status ON contract_offers(status);

-- ─── Admin Actions (Audit Log) ───
CREATE TABLE IF NOT EXISTS admin_actions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id        UUID NOT NULL REFERENCES auth.users(id),
  target_wallet_id UUID NOT NULL REFERENCES wallets(id),
  
  action_type     TEXT NOT NULL CHECK (action_type IN (
    'credit', 'debit', 'freeze_wallet', 'unfreeze_wallet',
    'freeze_amount', 'unfreeze_amount', 'update_fee', 'update_commission'
  )),
  
  amount          BIGINT,                      -- For credit/debit actions
  reason          TEXT NOT NULL,
  reason_category TEXT,                        -- 'registration_bonus', 'promo', 'refund', etc.
  
  -- Previous values (for audit trail)
  previous_value  JSONB,
  new_value       JSONB,
  
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_actions_admin ON admin_actions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_wallet ON admin_actions(target_wallet_id);

-- ═══════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS)
-- ═══════════════════════════════════════════════════════════════════════

ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_config ENABLE ROW LEVEL SECURITY;

-- ─── Wallets: Users can read their own, admins can read all ───
CREATE POLICY wallet_own_read ON wallets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY wallet_admin_all ON wallets
  FOR ALL USING (
    EXISTS (SELECT 1 FROM wallets w WHERE w.user_id = auth.uid() AND w.user_role = 'admin')
  );

-- ─── Transactions: Users can read their own wallet's transactions ───
CREATE POLICY tx_own_read ON wallet_transactions
  FOR SELECT USING (
    wallet_id IN (SELECT id FROM wallets WHERE user_id = auth.uid())
  );

CREATE POLICY tx_admin_all ON wallet_transactions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM wallets w WHERE w.user_id = auth.uid() AND w.user_role = 'admin')
  );

-- ─── Contracts: Parties can read their own contracts ───
CREATE POLICY contract_party_read ON contracts
  FOR SELECT USING (
    auth.uid() = party_a_id OR auth.uid() = party_b_id
  );

CREATE POLICY contract_admin_all ON contracts
  FOR ALL USING (
    EXISTS (SELECT 1 FROM wallets w WHERE w.user_id = auth.uid() AND w.user_role = 'admin')
  );

-- ─── Offers: Parties of the contract can read/create offers ───
CREATE POLICY offer_party_read ON contract_offers
  FOR SELECT USING (
    contract_id IN (
      SELECT id FROM contracts WHERE party_a_id = auth.uid() OR party_b_id = auth.uid()
    )
  );

CREATE POLICY offer_party_create ON contract_offers
  FOR INSERT WITH CHECK (
    contract_id IN (
      SELECT id FROM contracts WHERE party_a_id = auth.uid() OR party_b_id = auth.uid()
    )
  );

CREATE POLICY offer_admin_all ON contract_offers
  FOR ALL USING (
    EXISTS (SELECT 1 FROM wallets w WHERE w.user_id = auth.uid() AND w.user_role = 'admin')
  );

-- ─── Admin Actions: Only admins ───
CREATE POLICY admin_actions_admin_only ON admin_actions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM wallets w WHERE w.user_id = auth.uid() AND w.user_role = 'admin')
  );

-- ─── Platform Config: Read all, write admin only ───
CREATE POLICY config_read_all ON platform_config
  FOR SELECT USING (true);

CREATE POLICY config_admin_write ON platform_config
  FOR ALL USING (
    EXISTS (SELECT 1 FROM wallets w WHERE w.user_id = auth.uid() AND w.user_role = 'admin')
  );

-- ═══════════════════════════════════════════════════════════════════════
-- FUNCTIONS — Atomic wallet operations
-- ═══════════════════════════════════════════════════════════════════════

-- ─── Create wallet on user registration ───
CREATE OR REPLACE FUNCTION create_wallet_for_user()
RETURNS TRIGGER AS $$
DECLARE
  bonus BIGINT;
  role_val TEXT;
BEGIN
  -- Determine role from user metadata
  role_val := COALESCE(NEW.raw_user_meta_data->>'role', 'guardian');
  
  -- Get registration bonus from config
  SELECT (value::TEXT)::BIGINT INTO bonus
  FROM platform_config
  WHERE key = 'registration_bonus_' || role_val;
  
  IF bonus IS NULL THEN bonus := 0; END IF;
  
  -- Create wallet
  INSERT INTO wallets (user_id, user_role, balance, registration_bonus, total_earned)
  VALUES (NEW.id, role_val, bonus, bonus, bonus);
  
  -- Record bonus transaction if > 0
  IF bonus > 0 THEN
    INSERT INTO wallet_transactions (wallet_id, type, amount, balance_after, description, status)
    SELECT id, 'bonus', bonus, bonus, 'Registration welcome bonus', 'completed'
    FROM wallets WHERE user_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: auto-create wallet when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created_wallet ON auth.users;
CREATE TRIGGER on_auth_user_created_wallet
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_wallet_for_user();

-- ─── Transfer points between wallets (for contract payments) ───
CREATE OR REPLACE FUNCTION transfer_points(
  p_from_wallet_id UUID,
  p_to_wallet_id UUID,
  p_amount BIGINT,
  p_description TEXT,
  p_contract_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  from_balance BIGINT;
  to_balance BIGINT;
  fee_pct NUMERIC;
  fee_amount BIGINT;
  from_wallet wallets%ROWTYPE;
  to_wallet wallets%ROWTYPE;
BEGIN
  -- Lock wallets for update
  SELECT * INTO from_wallet FROM wallets WHERE id = p_from_wallet_id FOR UPDATE;
  SELECT * INTO to_wallet FROM wallets WHERE id = p_to_wallet_id FOR UPDATE;
  
  IF from_wallet IS NULL OR to_wallet IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Wallet not found');
  END IF;
  
  IF from_wallet.status != 'active' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Source wallet is ' || from_wallet.status);
  END IF;
  
  IF from_wallet.balance < p_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient balance');
  END IF;
  
  -- Calculate fees for both parties
  fee_amount := ROUND(p_amount * from_wallet.fee_percent / 100);
  
  -- Debit sender
  UPDATE wallets SET
    balance = balance - p_amount,
    total_spent = total_spent + p_amount,
    pending_due = pending_due + fee_amount,
    updated_at = NOW()
  WHERE id = p_from_wallet_id
  RETURNING balance INTO from_balance;
  
  -- Credit receiver
  UPDATE wallets SET
    balance = balance + p_amount,
    total_earned = total_earned + p_amount,
    pending_due = pending_due + ROUND(p_amount * to_wallet.fee_percent / 100),
    updated_at = NOW()
  WHERE id = p_to_wallet_id
  RETURNING balance INTO to_balance;
  
  -- Record debit transaction
  INSERT INTO wallet_transactions (wallet_id, type, amount, balance_after, description, contract_id, fee_amount, status)
  VALUES (p_from_wallet_id, 'contract_payment', -p_amount, from_balance, p_description, p_contract_id, fee_amount, 'completed');
  
  -- Record credit transaction
  INSERT INTO wallet_transactions (wallet_id, type, amount, balance_after, description, contract_id, fee_amount, status)
  VALUES (p_to_wallet_id, 'earning', p_amount, to_balance, p_description, p_contract_id, ROUND(p_amount * to_wallet.fee_percent / 100), 'completed');
  
  -- Record fee transactions (pending)
  INSERT INTO wallet_transactions (wallet_id, type, amount, balance_after, description, contract_id, status)
  VALUES (p_from_wallet_id, 'platform_fee', -fee_amount, from_balance, 'Platform fee ' || from_wallet.fee_percent || '%', p_contract_id, 'pending');
  
  INSERT INTO wallet_transactions (wallet_id, type, amount, balance_after, description, contract_id, status)
  VALUES (p_to_wallet_id, 'platform_fee', -ROUND(p_amount * to_wallet.fee_percent / 100), to_balance, 'Platform fee ' || to_wallet.fee_percent || '%', p_contract_id, 'pending');
  
  RETURN jsonb_build_object(
    'success', true,
    'from_balance', from_balance,
    'to_balance', to_balance,
    'fee_from', fee_amount,
    'fee_to', ROUND(p_amount * to_wallet.fee_percent / 100)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── Admin: Credit points to a wallet ───
CREATE OR REPLACE FUNCTION admin_credit_points(
  p_admin_id UUID,
  p_wallet_id UUID,
  p_amount BIGINT,
  p_reason TEXT,
  p_reason_category TEXT DEFAULT 'other'
)
RETURNS JSONB AS $$
DECLARE
  new_balance BIGINT;
BEGIN
  UPDATE wallets SET
    balance = balance + p_amount,
    total_earned = total_earned + p_amount,
    updated_at = NOW()
  WHERE id = p_wallet_id
  RETURNING balance INTO new_balance;
  
  IF new_balance IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Wallet not found');
  END IF;
  
  -- Record transaction
  INSERT INTO wallet_transactions (wallet_id, type, amount, balance_after, description, status)
  VALUES (p_wallet_id, 'admin_credit', p_amount, new_balance, p_reason, 'completed');
  
  -- Record admin action
  INSERT INTO admin_actions (admin_id, target_wallet_id, action_type, amount, reason, reason_category, new_value)
  VALUES (p_admin_id, p_wallet_id, 'credit', p_amount, p_reason, p_reason_category,
    jsonb_build_object('balance', new_balance));
  
  RETURN jsonb_build_object('success', true, 'new_balance', new_balance);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── Admin: Debit/withhold points from a wallet ───
CREATE OR REPLACE FUNCTION admin_debit_points(
  p_admin_id UUID,
  p_wallet_id UUID,
  p_amount BIGINT,
  p_reason TEXT,
  p_reason_category TEXT DEFAULT 'other',
  p_freeze BOOLEAN DEFAULT FALSE
)
RETURNS JSONB AS $$
DECLARE
  w wallets%ROWTYPE;
  new_balance BIGINT;
BEGIN
  SELECT * INTO w FROM wallets WHERE id = p_wallet_id FOR UPDATE;
  
  IF w IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Wallet not found');
  END IF;
  
  IF p_freeze THEN
    -- Freeze amount (don't deduct, just lock)
    UPDATE wallets SET
      frozen_amount = frozen_amount + p_amount,
      updated_at = NOW()
    WHERE id = p_wallet_id;
    
    INSERT INTO admin_actions (admin_id, target_wallet_id, action_type, amount, reason, reason_category)
    VALUES (p_admin_id, p_wallet_id, 'freeze_amount', p_amount, p_reason, p_reason_category);
    
    RETURN jsonb_build_object('success', true, 'frozen_amount', w.frozen_amount + p_amount);
  ELSE
    -- Actually debit
    IF w.balance < p_amount THEN
      RETURN jsonb_build_object('success', false, 'error', 'Insufficient balance');
    END IF;
    
    UPDATE wallets SET
      balance = balance - p_amount,
      updated_at = NOW()
    WHERE id = p_wallet_id
    RETURNING balance INTO new_balance;
    
    INSERT INTO wallet_transactions (wallet_id, type, amount, balance_after, description, status)
    VALUES (p_wallet_id, 'admin_debit', -p_amount, new_balance, p_reason, 'completed');
    
    INSERT INTO admin_actions (admin_id, target_wallet_id, action_type, amount, reason, reason_category)
    VALUES (p_admin_id, p_wallet_id, 'debit', p_amount, p_reason, p_reason_category);
    
    RETURN jsonb_build_object('success', true, 'new_balance', new_balance);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── Admin: Freeze/unfreeze entire wallet ───
CREATE OR REPLACE FUNCTION admin_toggle_wallet_freeze(
  p_admin_id UUID,
  p_wallet_id UUID,
  p_freeze BOOLEAN,
  p_reason TEXT
)
RETURNS JSONB AS $$
DECLARE
  new_status TEXT;
  prev_status TEXT;
BEGIN
  SELECT status INTO prev_status FROM wallets WHERE id = p_wallet_id;
  
  IF prev_status IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Wallet not found');
  END IF;
  
  new_status := CASE WHEN p_freeze THEN 'frozen' ELSE 'active' END;
  
  UPDATE wallets SET status = new_status, updated_at = NOW()
  WHERE id = p_wallet_id;
  
  INSERT INTO admin_actions (
    admin_id, target_wallet_id, action_type, reason,
    previous_value, new_value
  ) VALUES (
    p_admin_id, p_wallet_id,
    CASE WHEN p_freeze THEN 'freeze_wallet' ELSE 'unfreeze_wallet' END,
    p_reason,
    jsonb_build_object('status', prev_status),
    jsonb_build_object('status', new_status)
  );
  
  RETURN jsonb_build_object('success', true, 'status', new_status);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── Accept contract offer & activate contract ───
CREATE OR REPLACE FUNCTION accept_contract_offer(
  p_offer_id UUID,
  p_accepted_by UUID,
  p_response_message TEXT DEFAULT ''
)
RETURNS JSONB AS $$
DECLARE
  offer contract_offers%ROWTYPE;
  contract contracts%ROWTYPE;
  total BIGINT;
  fee_a BIGINT;
  fee_b BIGINT;
BEGIN
  SELECT * INTO offer FROM contract_offers WHERE id = p_offer_id FOR UPDATE;
  IF offer IS NULL OR offer.status != 'pending' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or already processed offer');
  END IF;
  
  SELECT * INTO contract FROM contracts WHERE id = offer.contract_id FOR UPDATE;
  
  total := offer.points_per_day * offer.duration_days;
  fee_a := ROUND(total * contract.party_a_fee_pct / 100);
  fee_b := ROUND(total * contract.party_b_fee_pct / 100);
  
  -- Update offer
  UPDATE contract_offers SET
    status = 'accepted',
    responded_at = NOW(),
    response_message = p_response_message
  WHERE id = p_offer_id;
  
  -- Mark any other pending offers as expired
  UPDATE contract_offers SET status = 'expired'
  WHERE contract_id = offer.contract_id AND id != p_offer_id AND status = 'pending';
  
  -- Update contract
  UPDATE contracts SET
    status = 'accepted',
    agreed_price = offer.points_per_day,
    total_value = total,
    party_a_fee = fee_a,
    party_b_fee = fee_b,
    platform_revenue = fee_a + fee_b,
    accepted_at = NOW(),
    updated_at = NOW()
  WHERE id = offer.contract_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'contract_id', offer.contract_id,
    'agreed_price', offer.points_per_day,
    'total_value', total,
    'platform_revenue', fee_a + fee_b
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── Generate contract number ───
CREATE OR REPLACE FUNCTION generate_contract_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.contract_number := 'CTR-' || TO_CHAR(NOW(), 'YYYY') || '-' ||
    LPAD((nextval('contract_number_seq'))::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE IF NOT EXISTS contract_number_seq START 1;
CREATE TRIGGER set_contract_number
  BEFORE INSERT ON contracts
  FOR EACH ROW
  WHEN (NEW.contract_number IS NULL OR NEW.contract_number = '')
  EXECUTE FUNCTION generate_contract_number();

-- ─── Updated_at trigger ───
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER wallets_updated_at BEFORE UPDATE ON wallets FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER contracts_updated_at BEFORE UPDATE ON contracts FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── Role Activation Approval Gate ───

-- Add activation_status column to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS activation_status TEXT
    NOT NULL DEFAULT 'profile_incomplete'
    CHECK (activation_status IN (
      'profile_incomplete',
      'pending_approval',
      'approved',
      'rejected',
      'suspended'
    ));

-- Add activation_note column to profiles (for rejection reasons)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS activation_note TEXT;

-- Create role_activation_reviews audit table
CREATE TABLE IF NOT EXISTS role_activation_reviews (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reviewer_id   UUID REFERENCES auth.users(id),
  reviewer_name TEXT,
  decision      TEXT NOT NULL CHECK (decision IN ('approved', 'rejected')),
  note          TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Create auto-approve trigger function for low-risk roles (guardian, patient, channel_partner)
CREATE OR REPLACE FUNCTION auto_approve_low_risk_roles()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role IN ('guardian', 'patient', 'channel_partner') THEN
    NEW.activation_status := 'approved';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-approve guardian/patient on profile creation
DROP TRIGGER IF EXISTS trg_auto_approve_role ON profiles;
CREATE TRIGGER trg_auto_approve_role
  BEFORE INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION auto_approve_low_risk_roles();

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_activation
  ON profiles(activation_status, role);

CREATE INDEX IF NOT EXISTS idx_activation_reviews_profile
  ON role_activation_reviews(profile_id);

CREATE INDEX IF NOT EXISTS idx_activation_reviews_created_at
  ON role_activation_reviews(created_at DESC);

-- Enable RLS on role_activation_reviews
ALTER TABLE role_activation_reviews ENABLE ROW LEVEL SECURITY;

-- Policy: Reviewer (admin or mod) can insert reviews
CREATE POLICY IF NOT EXISTS activation_review_insert ON role_activation_reviews
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'moderator')
    )
  );

-- Policy: Admin/mod can read all reviews
CREATE POLICY IF NOT EXISTS activation_review_admin_read ON role_activation_reviews
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'moderator')
    )
  );

-- Policy: User can read their own review history
CREATE POLICY IF NOT EXISTS activation_review_own_read ON role_activation_reviews
  FOR SELECT USING (profile_id = auth.uid());

-- Ensure profiles_mod_select policy exists for moderator queue access
CREATE POLICY IF NOT EXISTS profiles_mod_select ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'moderator'
    )
  );
