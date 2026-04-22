-- ============================================================================
-- Channel Partner (ChanP) System — RLS Policies
-- ============================================================================
-- Migration: 20260420120100_channel_partner_rls.sql
-- Phase 1: Foundation — Row Level Security policies for all ChanP tables
-- ============================================================================

-- Enable RLS on all ChanP tables
ALTER TABLE public.channel_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_partner_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_partner_commission_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_partner_commissions ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- Helper function: Check if user is admin
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    );
$$;

-- ----------------------------------------------------------------------------
-- Helper function: Check if user is moderator
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION is_moderator()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'moderator'
    );
$$;

-- ----------------------------------------------------------------------------
-- Helper function: Check if user is admin or moderator
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION is_admin_or_moderator()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role IN ('admin', 'moderator')
    );
$$;

-- ----------------------------------------------------------------------------
-- 1. channel_partners RLS Policies
-- ----------------------------------------------------------------------------

-- Allow users to read their own channel partner record
CREATE POLICY "channel_partners_select_own" ON public.channel_partners
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Allow admins/moderators to read all channel partners
CREATE POLICY "channel_partners_select_admin" ON public.channel_partners
    FOR SELECT
    TO authenticated
    USING (is_admin_or_moderator());

-- Allow admins/moderators to insert channel partners
CREATE POLICY "channel_partners_insert_admin" ON public.channel_partners
    FOR INSERT
    TO authenticated
    WITH CHECK (is_admin_or_moderator());

-- Allow admins/moderators to update channel partners
CREATE POLICY "channel_partners_update_admin" ON public.channel_partners
    FOR UPDATE
    TO authenticated
    USING (is_admin_or_moderator())
    WITH CHECK (is_admin_or_moderator());

-- ----------------------------------------------------------------------------
-- 2. channel_partner_leads RLS Policies
-- ----------------------------------------------------------------------------

-- Allow Channel Partners to read their own leads
CREATE POLICY "channel_partner_leads_select_cp" ON public.channel_partner_leads
    FOR SELECT
    TO authenticated
    USING (
        channel_partner_id IN (
            SELECT id FROM public.channel_partners WHERE user_id = auth.uid()
        )
    );

-- Allow leads to see their own attribution
CREATE POLICY "channel_partner_leads_select_lead" ON public.channel_partner_leads
    FOR SELECT
    TO authenticated
    USING (lead_user_id = auth.uid());

-- Allow admins/moderators to read all leads
CREATE POLICY "channel_partner_leads_select_admin" ON public.channel_partner_leads
    FOR SELECT
    TO authenticated
    USING (is_admin_or_moderator());

-- Allow Channel Partners to create leads (proxy registration)
CREATE POLICY "channel_partner_leads_insert_cp" ON public.channel_partner_leads
    FOR INSERT
    TO authenticated
    WITH CHECK (
        channel_partner_id IN (
            SELECT id FROM public.channel_partners 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

-- Allow admins/moderators to create leads
CREATE POLICY "channel_partner_leads_insert_admin" ON public.channel_partner_leads
    FOR INSERT
    TO authenticated
    WITH CHECK (is_admin_or_moderator());

-- Allow admins/moderators to update leads
CREATE POLICY "channel_partner_leads_update_admin" ON public.channel_partner_leads
    FOR UPDATE
    TO authenticated
    USING (is_admin_or_moderator())
    WITH CHECK (is_admin_or_moderator());

-- ----------------------------------------------------------------------------
-- 3. channel_partner_commission_rates RLS Policies
-- ----------------------------------------------------------------------------

-- Allow Channel Partners to read their own rates
CREATE POLICY "channel_partner_rates_select_cp" ON public.channel_partner_commission_rates
    FOR SELECT
    TO authenticated
    USING (
        channel_partner_id IN (
            SELECT id FROM public.channel_partners WHERE user_id = auth.uid()
        )
    );

-- Allow admins/moderators to read all rates
CREATE POLICY "channel_partner_rates_select_admin" ON public.channel_partner_commission_rates
    FOR SELECT
    TO authenticated
    USING (is_admin_or_moderator());

-- Allow admins/moderators to insert rates
CREATE POLICY "channel_partner_rates_insert_admin" ON public.channel_partner_commission_rates
    FOR INSERT
    TO authenticated
    WITH CHECK (is_admin_or_moderator());

-- Allow admins/moderators to update rates
CREATE POLICY "channel_partner_rates_update_admin" ON public.channel_partner_commission_rates
    FOR UPDATE
    TO authenticated
    USING (is_admin_or_moderator())
    WITH CHECK (is_admin_or_moderator());

-- ----------------------------------------------------------------------------
-- 4. channel_partner_commissions RLS Policies
-- ----------------------------------------------------------------------------

-- Allow Channel Partners to read their own commissions
CREATE POLICY "channel_partner_commissions_select_cp" ON public.channel_partner_commissions
    FOR SELECT
    TO authenticated
    USING (
        channel_partner_id IN (
            SELECT id FROM public.channel_partners WHERE user_id = auth.uid()
        )
    );

-- Allow leads to see commissions from their invoices
CREATE POLICY "channel_partner_commissions_select_lead" ON public.channel_partner_commissions
    FOR SELECT
    TO authenticated
    USING (lead_user_id = auth.uid());

-- Allow admins/moderators to read all commissions
CREATE POLICY "channel_partner_commissions_select_admin" ON public.channel_partner_commissions
    FOR SELECT
    TO authenticated
    USING (is_admin_or_moderator());

-- Allow Channel Partners to update their commissions (limited: confirm payout receipt only)
CREATE POLICY "channel_partner_commissions_update_cp" ON public.channel_partner_commissions
    FOR UPDATE
    TO authenticated
    USING (
        channel_partner_id IN (
            SELECT id FROM public.channel_partners WHERE user_id = auth.uid()
        )
        AND status = 'credited'
    )
    WITH CHECK (
        channel_partner_id IN (
            SELECT id FROM public.channel_partners WHERE user_id = auth.uid()
        )
    );

-- Allow admins/moderators to update all commissions
CREATE POLICY "channel_partner_commissions_update_admin" ON public.channel_partner_commissions
    FOR UPDATE
    TO authenticated
    USING (is_admin_or_moderator())
    WITH CHECK (is_admin_or_moderator());

-- ----------------------------------------------------------------------------
-- 5. Service Role Bypass (for Edge Functions and triggers)
-- ----------------------------------------------------------------------------

-- Create policies for service_role to bypass RLS
CREATE POLICY "channel_partners_service_all" ON public.channel_partners
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "channel_partner_leads_service_all" ON public.channel_partner_leads
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "channel_partner_rates_service_all" ON public.channel_partner_commission_rates
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "channel_partner_commissions_service_all" ON public.channel_partner_commissions
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- 6. Anonymous Access (none - all ChanP data requires authentication)
-- ----------------------------------------------------------------------------

-- No anonymous policies - all operations require authenticated user
