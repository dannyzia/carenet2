-- ============================================================================
-- Channel Partner Performance Indexes (Additional)
-- ============================================================================
-- Creates ADDITIONAL performance indexes for Channel Partner tables.
-- This migration only adds indexes that don't exist in the base migration
-- (20260420120000_channel_partner_tables.sql).
--
-- Uses CREATE INDEX CONCURRENTLY to avoid blocking writes during deployment.
-- ============================================================================

-- Composite index on channel_partners for status + created_at (admin queries)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_channel_partners_status_created 
ON public.channel_partners(status, created_at DESC);

-- Index on channel_partner_leads for lead_user_id lookups (profile views)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_channel_partner_leads_lead_user_id 
ON public.channel_partner_leads(lead_user_id);

-- Index on channel_partner_leads for is_active filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_channel_partner_leads_active 
ON public.channel_partner_leads(is_active);

-- Index on channel_partner_leads for joined_at (expiring leads queries)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_channel_partner_leads_joined_at 
ON public.channel_partner_leads(joined_at);

-- Index on channel_partner_commission_rates for channel_partner_id
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_channel_partner_rates_cp_id 
ON public.channel_partner_commission_rates(channel_partner_id);

-- Index on channel_partner_commission_rates for effective_from (rate lookups)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_channel_partner_rates_effective_from 
ON public.channel_partner_commission_rates(effective_from DESC);

-- Index on channel_partner_commission_rates for expires_at (expiry cron job)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_channel_partner_rates_expires_at 
ON public.channel_partner_commission_rates(expires_at);

-- Composite index for finding active rates (effective_to is null)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_channel_partner_rates_active 
ON public.channel_partner_commission_rates(channel_partner_id, lead_role) 
WHERE effective_to IS NULL;

-- Index on channel_partner_commissions for channel_partner_id (CP dashboard)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_channel_partner_commissions_cp_id 
ON public.channel_partner_commissions(channel_partner_id);

-- Index on channel_partner_commissions for lead_user_id (lead attribution)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_channel_partner_commissions_lead_user_id 
ON public.channel_partner_commissions(lead_user_id);

-- Index on channel_partner_commissions for invoice_id (idempotency checks)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_channel_partner_commissions_invoice_id 
ON public.channel_partner_commissions(invoice_id);

-- Index on channel_partner_commissions for created_at (time-based queries)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_channel_partner_commissions_created_at 
ON public.channel_partner_commissions(created_at DESC);

-- Composite index for CP + status + created_at (dashboard queries)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_channel_partner_commissions_cp_status_created 
ON public.channel_partner_commissions(channel_partner_id, status, created_at DESC);

-- ============================================================================
-- Comments for documentation
-- ============================================================================

COMMENT ON INDEX idx_channel_partners_status_created IS 'Admin queries with status sorting';
COMMENT ON INDEX idx_channel_partner_leads_lead_user_id IS 'Profile view lookups';
COMMENT ON INDEX idx_channel_partner_leads_active IS 'Active lead filtering';
COMMENT ON INDEX idx_channel_partner_leads_joined_at IS 'Activation window queries';
COMMENT ON INDEX idx_channel_partner_rates_cp_id IS 'CP rate lookups';
COMMENT ON INDEX idx_channel_partner_rates_effective_from IS 'Current rate lookups';
COMMENT ON INDEX idx_channel_partner_rates_expires_at IS 'Expiry cron job queries';
COMMENT ON INDEX idx_channel_partner_rates_active IS 'Active rate queries (partial index)';
COMMENT ON INDEX idx_channel_partner_commissions_cp_id IS 'CP commission dashboard';
COMMENT ON INDEX idx_channel_partner_commissions_lead_user_id IS 'Lead attribution lookups';
COMMENT ON INDEX idx_channel_partner_commissions_invoice_id IS 'Invoice idempotency checks';
COMMENT ON INDEX idx_channel_partner_commissions_created_at IS 'Time-based queries';
COMMENT ON INDEX idx_channel_partner_commissions_cp_status_created IS 'Dashboard queries with sorting';
