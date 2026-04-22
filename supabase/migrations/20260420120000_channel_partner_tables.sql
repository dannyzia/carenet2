-- ============================================================================
-- Channel Partner (ChanP) System — Foundation Tables
-- ============================================================================
-- Migration: 20260420120000_channel_partner_tables.sql
-- Phase 1: Foundation — Core database schema for Channel Partner referral system
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. channel_partners — Main ChanP profile and status
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.channel_partners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    referral_code TEXT,
    status TEXT NOT NULL DEFAULT 'pending_approval' 
        CHECK (status IN ('pending_approval', 'active', 'suspended', 'deactivated', 'rejected')),
    business_name TEXT,
    nid_number TEXT,
    phone TEXT,
    bank_account JSONB DEFAULT '{}'::jsonb,
    notes TEXT,
    reapplication_count INTEGER NOT NULL DEFAULT 0,
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMPTZ,
    rejected_by UUID REFERENCES auth.users(id),
    rejected_at TIMESTAMPTZ,
    rejection_reason TEXT,
    suspended_by UUID REFERENCES auth.users(id),
    suspended_at TIMESTAMPTZ,
    suspended_reason TEXT,
    deactivated_by UUID REFERENCES auth.users(id),
    deactivated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    CONSTRAINT unique_user_id UNIQUE (user_id),
    CONSTRAINT unique_referral_code UNIQUE NULLS NOT DISTINCT (referral_code)
);

-- Indexes for channel_partners
CREATE INDEX IF NOT EXISTS idx_channel_partners_user_id ON public.channel_partners(user_id);
CREATE INDEX IF NOT EXISTS idx_channel_partners_status ON public.channel_partners(status);
CREATE INDEX IF NOT EXISTS idx_channel_partners_referral_code ON public.channel_partners(referral_code) WHERE referral_code IS NOT NULL;

COMMENT ON TABLE public.channel_partners IS 'Channel Partner profiles and status tracking';

-- ----------------------------------------------------------------------------
-- 2. channel_partner_leads — Attributed leads for each ChanP
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.channel_partner_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_partner_id UUID NOT NULL REFERENCES public.channel_partners(id) ON DELETE CASCADE,
    lead_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    lead_role TEXT NOT NULL CHECK (lead_role IN ('guardian', 'agency', 'caregiver', 'shop')),
    attribution_method TEXT NOT NULL DEFAULT 'referral_code' 
        CHECK (attribution_method IN ('referral_code', 'cp_created', 'admin_assignment')),
    referral_code_used TEXT,
    assigned_by UUID REFERENCES auth.users(id),
    is_active BOOLEAN NOT NULL DEFAULT true,
    registration_completed_at TIMESTAMPTZ,
    deactivated_at TIMESTAMPTZ,
    deactivation_reason TEXT,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    CONSTRAINT unique_lead_user_id UNIQUE (lead_user_id)
);

-- Indexes for channel_partner_leads
CREATE INDEX IF NOT EXISTS idx_channel_partner_leads_cp_id ON public.channel_partner_leads(channel_partner_id);
CREATE INDEX IF NOT EXISTS idx_channel_partner_leads_cp_active ON public.channel_partner_leads(channel_partner_id, is_active);
CREATE INDEX IF NOT EXISTS idx_channel_partner_leads_user_id ON public.channel_partner_leads(lead_user_id);

COMMENT ON TABLE public.channel_partner_leads IS 'Leads attributed to Channel Partners';

-- ----------------------------------------------------------------------------
-- 3. channel_partner_commission_rates — Rate history per role
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.channel_partner_commission_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_partner_id UUID NOT NULL REFERENCES public.channel_partners(id) ON DELETE CASCADE,
    lead_role TEXT NOT NULL CHECK (lead_role IN ('guardian', 'agency', 'caregiver', 'shop')),
    rate NUMERIC(5,2) NOT NULL CHECK (rate >= 0 AND rate <= 100),
    effective_from TIMESTAMPTZ NOT NULL DEFAULT now(),
    effective_to TIMESTAMPTZ,
    expires_at TIMESTAMPTZ NOT NULL,
    expiry_notified BOOLEAN NOT NULL DEFAULT false,
    previous_rate NUMERIC(5,2),
    changed_by UUID NOT NULL REFERENCES auth.users(id),
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Only one active rate per role per ChanP
    CONSTRAINT unique_active_rate UNIQUE NULLS NOT DISTINCT (channel_partner_id, lead_role, effective_to)
);

-- Indexes for commission rates
CREATE INDEX IF NOT EXISTS idx_cp_rates_cp_role_from ON public.channel_partner_commission_rates(channel_partner_id, lead_role, effective_from);
CREATE INDEX IF NOT EXISTS idx_cp_rates_expiry_notified ON public.channel_partner_commission_rates(expires_at) WHERE expiry_notified = false;

COMMENT ON TABLE public.channel_partner_commission_rates IS 'Channel Partner commission rate history by lead role';

-- ----------------------------------------------------------------------------
-- 4. channel_partner_commissions — Commission ledger
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.channel_partner_commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_partner_id UUID NOT NULL REFERENCES public.channel_partners(id) ON DELETE CASCADE,
    lead_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    lead_role TEXT NOT NULL CHECK (lead_role IN ('guardian', 'agency', 'caregiver', 'shop')),
    invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    rate_record_id UUID NOT NULL REFERENCES public.channel_partner_commission_rates(id),
    invoice_amount INTEGER NOT NULL CHECK (invoice_amount >= 0),
    platform_commission_amount INTEGER NOT NULL CHECK (platform_commission_amount >= 0),
    cp_commission_rate NUMERIC(5,2) NOT NULL,
    cp_commission_amount INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'credited', 'paid', 'reversed')),
    wallet_transaction_id UUID REFERENCES public.wallet_transactions(id),
    invoice_generated_at TIMESTAMPTZ NOT NULL,
    payment_collected_at TIMESTAMPTZ,
    credited_at TIMESTAMPTZ,
    reversed_at TIMESTAMPTZ,
    reversal_reason TEXT,
    reversed_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Idempotency: one commission per invoice per ChanP
    CONSTRAINT unique_invoice_commission UNIQUE (invoice_id, channel_partner_id)
);

-- Indexes for commissions
CREATE INDEX IF NOT EXISTS idx_cp_commissions_cp_status ON public.channel_partner_commissions(channel_partner_id, status);
CREATE INDEX IF NOT EXISTS idx_cp_commissions_lead ON public.channel_partner_commissions(lead_user_id, lead_role);
CREATE INDEX IF NOT EXISTS idx_cp_commissions_invoice_date ON public.channel_partner_commissions(invoice_generated_at);
CREATE INDEX IF NOT EXISTS idx_cp_commissions_status ON public.channel_partner_commissions(status);

COMMENT ON TABLE public.channel_partner_commissions IS 'Channel Partner commission ledger';

-- ----------------------------------------------------------------------------
-- 5. SECURITY DEFINER Functions
-- ----------------------------------------------------------------------------

-- Close previous rate when new rate inserted
CREATE OR REPLACE FUNCTION close_previous_rate(p_cp_id UUID, p_lead_role TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Lock the row to prevent concurrent updates (function-level locking per plan spec)
    PERFORM 1 FROM channel_partner_commission_rates
    WHERE channel_partner_id = p_cp_id 
      AND lead_role = p_lead_role 
      AND effective_to IS NULL
    FOR UPDATE;
    
    UPDATE channel_partner_commission_rates
    SET effective_to = now()
    WHERE channel_partner_id = p_cp_id 
      AND lead_role = p_lead_role 
      AND effective_to IS NULL;
END;
$$;

COMMENT ON FUNCTION close_previous_rate(UUID, TEXT) IS 'Closes the previous active rate for a Channel Partner role';

-- Calculate commission on invoice creation
CREATE OR REPLACE FUNCTION calculate_cp_commission(p_invoice_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_lead_user_id UUID;
    v_lead_role TEXT;
    v_invoice_amount INTEGER;
    v_platform_commission INTEGER;
    v_channel_partner_id UUID;
    v_active_rate NUMERIC(5,2);
    v_rate_record_id UUID;
    v_cp_commission_amount INTEGER;
    v_invoice_created_at TIMESTAMPTZ;
BEGIN
    -- Get invoice details - use from_party_id (service provider/seller) to support all lead roles
    SELECT i.total_amount, i.platform_fee_amount, i.from_party_id, i.created_at,
           p.role INTO v_invoice_amount, v_platform_commission, v_lead_user_id, v_invoice_created_at, v_lead_role
    FROM public.invoices i
    JOIN public.profiles p ON p.id = i.from_party_id
    WHERE i.id = p_invoice_id;
    
    IF v_lead_user_id IS NULL THEN
        RETURN; -- No from_party_id found
    END IF;
    
    -- Find the Channel Partner for this lead
    SELECT channel_partner_id INTO v_channel_partner_id
    FROM public.channel_partner_leads
    WHERE lead_user_id = v_lead_user_id AND is_active = true;
    
    IF v_channel_partner_id IS NULL THEN
        -- Log that no ChanP was found (optional, for audit)
        RETURN;
    END IF;
    
    -- Check ChanP status - only active ChanPs get commissions
    IF NOT EXISTS (
        SELECT 1 FROM public.channel_partners 
        WHERE id = v_channel_partner_id AND status = 'active'
    ) THEN
        -- Log skipped commission (CP inactive) per plan edge case table
        INSERT INTO public.audit_logs (action, uid, ip, severity, metadata)
        VALUES (
            'CP_COMMISSION_SKIPPED_CP_INACTIVE',
            v_lead_user_id,
            NULL,
            'warning',
            jsonb_build_object(
                'invoice_id', p_invoice_id,
                'lead_user_id', v_lead_user_id,
                'channel_partner_id', v_channel_partner_id,
                'cp_status', (SELECT status FROM public.channel_partners WHERE id = v_channel_partner_id)
            )
        );
        RETURN;
    END IF;
    
    -- Get active rate for this role
    SELECT rate, id INTO v_active_rate, v_rate_record_id
    FROM public.channel_partner_commission_rates
    WHERE channel_partner_id = v_channel_partner_id 
      AND lead_role = v_lead_role 
      AND effective_to IS NULL
      AND effective_from <= v_invoice_created_at
      AND expires_at > v_invoice_created_at;
    
    IF v_active_rate IS NULL THEN
        -- Log skipped commission (no active rate) per plan edge case table
        INSERT INTO public.audit_logs (action, uid, ip, severity, metadata)
        VALUES (
            'CP_COMMISSION_SKIPPED_NO_RATE',
            v_lead_user_id,
            NULL,
            'warning',
            jsonb_build_object(
                'invoice_id', p_invoice_id,
                'lead_user_id', v_lead_user_id,
                'lead_role', v_lead_role,
                'channel_partner_id', v_channel_partner_id
            )
        );
        RETURN;
    END IF;
    
    -- Calculate commission (percentage of platform commission)
    v_cp_commission_amount := ROUND(v_platform_commission * (v_active_rate / 100));
    
    -- Insert commission record (idempotent via unique constraint)
    INSERT INTO public.channel_partner_commissions (
        channel_partner_id, lead_user_id, lead_role, invoice_id, rate_record_id,
        invoice_amount, platform_commission_amount, cp_commission_rate, cp_commission_amount,
        invoice_generated_at, status
    ) VALUES (
        v_channel_partner_id, v_lead_user_id, v_lead_role, p_invoice_id, v_rate_record_id,
        v_invoice_amount, v_platform_commission, v_active_rate, v_cp_commission_amount,
        v_invoice_created_at, 'pending'
    )
    ON CONFLICT (invoice_id, channel_partner_id) DO NOTHING;
    
END;
$$;

COMMENT ON FUNCTION calculate_cp_commission(UUID) IS 'Calculates and creates pending commission when invoice is created. Idempotency: UNIQUE(invoice_id, channel_partner_id) with ON CONFLICT DO NOTHING (Spec 4.4)';

-- Credit commission on payment verification
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
            CONTINUE; -- Skip if no wallet found
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
        
    END LOOP;
END;
$$;

COMMENT ON FUNCTION credit_cp_commission(UUID) IS 'Credits commission to wallet when invoice is paid/verified. Idempotency: Filters by status = pending, so calling twice is a no-op (Spec 4.4)';

-- Attribute lead via referral code
CREATE OR REPLACE FUNCTION attribute_lead_via_referral_code(
    p_referral_code TEXT,
    p_lead_user_id UUID,
    p_lead_role TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_cp_id UUID;
BEGIN
    -- Find active Channel Partner by referral code
    SELECT id INTO v_cp_id 
    FROM public.channel_partners
    WHERE referral_code = upper(trim(p_referral_code)) 
      AND status = 'active';
    
    IF v_cp_id IS NULL THEN
        RAISE EXCEPTION 'Invalid or inactive referral code';
    END IF;
    
    -- Check if lead already attributed
    IF EXISTS (
        SELECT 1 FROM public.channel_partner_leads 
        WHERE lead_user_id = p_lead_user_id
    ) THEN
        RAISE EXCEPTION 'Lead already attributed to a Channel Partner';
    END IF;
    
    -- Attribute the lead
    INSERT INTO public.channel_partner_leads (
        channel_partner_id, lead_user_id, lead_role, 
        attribution_method, referral_code_used
    ) VALUES (
        v_cp_id, p_lead_user_id, p_lead_role, 
        'referral_code', upper(trim(p_referral_code))
    );
END;
$$;

COMMENT ON FUNCTION attribute_lead_via_referral_code(TEXT, UUID, TEXT) IS 'Attributes a new user to a Channel Partner via referral code';

-- Generate unique referral code for approved ChanP
CREATE OR REPLACE FUNCTION generate_cp_referral_code(p_cp_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_code TEXT;
    v_exists BOOLEAN;
BEGIN
    LOOP
        -- Generate random 6-character alphanumeric code
        v_code := 'REF-CP-' || upper(substring(md5(random()::text) from 1 for 6));
        
        -- Check if code exists
        SELECT EXISTS(
            SELECT 1 FROM public.channel_partners 
            WHERE referral_code = v_code
        ) INTO v_exists;
        
        EXIT WHEN NOT v_exists;
    END LOOP;
    
    -- Update the Channel Partner with the new code
    UPDATE public.channel_partners
    SET referral_code = v_code,
        updated_at = now()
    WHERE id = p_cp_id;
    
    RETURN v_code;
END;
$$;

COMMENT ON FUNCTION generate_cp_referral_code(UUID) IS 'Generates a unique referral code for a Channel Partner';

-- ----------------------------------------------------------------------------
-- 6. Triggers on invoices for commission lifecycle
-- ----------------------------------------------------------------------------

-- Trigger: Calculate commission when invoice is created (Spec 4.4 - Pending Trigger)
-- Fires AFTER INSERT ON invoices, calls calculate_cp_commission(NEW.id)
-- Idempotent via UNIQUE(invoice_id, channel_partner_id) + ON CONFLICT DO NOTHING
CREATE OR REPLACE FUNCTION trigger_calculate_cp_commission()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    PERFORM calculate_cp_commission(NEW.id);
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_calculate_cp_commission ON public.invoices;
CREATE TRIGGER trg_calculate_cp_commission
    AFTER INSERT ON public.invoices
    FOR EACH ROW
    EXECUTE FUNCTION trigger_calculate_cp_commission();

COMMENT ON TRIGGER trg_calculate_cp_commission ON public.invoices IS 'Spec 4.4: Pending trigger - creates pending commission on invoice creation';

-- Trigger: Credit commission when invoice is paid/verified (Spec 4.4)
CREATE OR REPLACE FUNCTION trigger_credit_cp_commission()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Credit commission on payment verification (spec: 'verified' or 'paid')
    IF NEW.status IN ('verified', 'paid') AND OLD.status NOT IN ('verified', 'paid') THEN
        PERFORM credit_cp_commission(NEW.id);
    END IF;
    
    -- Handle invoice cancellation/dispute - reverse commission (Spec 2.12b)
    IF NEW.status IN ('disputed', 'cancelled', 'refunded') 
       AND OLD.status NOT IN ('disputed', 'cancelled', 'refunded') THEN
        PERFORM reverse_cp_commission(NEW.id, 'Invoice ' || NEW.status);
    END IF;
    
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_credit_cp_commission ON public.invoices;
CREATE TRIGGER trg_credit_cp_commission
    AFTER UPDATE OF status ON public.invoices
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION trigger_credit_cp_commission();

COMMENT ON TRIGGER trg_credit_cp_commission ON public.invoices IS 'Spec 4.4: Credit trigger - credits commission when invoice status becomes verified/paid, reverses on disputed/cancelled/refunded';

-- Reverse commission function
CREATE OR REPLACE FUNCTION reverse_cp_commission(
    p_invoice_id UUID,
    p_reason TEXT DEFAULT 'Commission reversal'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_commission RECORD;
    v_wallet_id UUID;
BEGIN
    FOR v_commission IN
        SELECT * FROM public.channel_partner_commissions
        WHERE invoice_id = p_invoice_id 
          AND status IN ('pending', 'credited')
    LOOP
        IF v_commission.status = 'credited' THEN
            -- Get wallet and debit
            SELECT id INTO v_wallet_id
            FROM public.wallets
            WHERE user_id = (
                SELECT user_id FROM public.channel_partners 
                WHERE id = v_commission.channel_partner_id
            );
            
            IF v_wallet_id IS NOT NULL THEN
                -- Create debit transaction
                INSERT INTO public.wallet_transactions (
                    wallet_id, type, amount, balance_after, description, 
                    status, created_at
                ) VALUES (
                    v_wallet_id, 'admin_debit', -v_commission.cp_commission_amount, 
                    GREATEST(0, (SELECT balance FROM public.wallets WHERE id = v_wallet_id) - v_commission.cp_commission_amount),
                    'Reversed commission: ' || p_reason,
                    'completed', now()
                );
                
                -- Debit wallet
                UPDATE public.wallets
                SET balance = GREATEST(0, balance - v_commission.cp_commission_amount)
                WHERE id = v_wallet_id;
            END IF;
        END IF;
        
        -- Mark commission as reversed
        UPDATE public.channel_partner_commissions
        SET status = 'reversed',
            reversal_reason = p_reason,
            reversed_at = now()
        WHERE id = v_commission.id;
    END LOOP;
END;
$$;

COMMENT ON FUNCTION reverse_cp_commission(UUID, TEXT) IS 'Reverses commission when invoice is cancelled/disputed';

-- ----------------------------------------------------------------------------
-- 7. Enable Realtime for ChanP tables
-- ----------------------------------------------------------------------------
ALTER TABLE public.channel_partner_commissions REPLICA IDENTITY FULL;
ALTER TABLE public.channel_partner_leads REPLICA IDENTITY FULL;

-- ----------------------------------------------------------------------------
-- 8. Update profiles role constraint to include channel_partner
-- ----------------------------------------------------------------------------
-- Note: This requires dropping and re-adding the constraint
-- Only run this if the constraint exists and doesn't already include channel_partner
DO $$
BEGIN
    -- Update role column check constraint
    ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
        CHECK (role IN ('caregiver', 'guardian', 'patient', 'agency', 'admin', 'moderator', 'shop', 'channel_partner'));
    
    -- Update active_role column check constraint
    ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_active_role_check;
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_active_role_check 
        CHECK (active_role IN ('caregiver', 'guardian', 'patient', 'agency', 'admin', 'moderator', 'shop', 'channel_partner'));
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not update profiles constraints: %', SQLERRM;
END;
$$;

-- ----------------------------------------------------------------------------
-- 9. Auto-update updated_at timestamp
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_channel_partners_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_channel_partners_updated_at ON public.channel_partners;
CREATE TRIGGER trg_channel_partners_updated_at
    BEFORE UPDATE ON public.channel_partners
    FOR EACH ROW
    EXECUTE FUNCTION update_channel_partners_updated_at();
