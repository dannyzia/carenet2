-- ============================================================================
-- Fix unique_active_rate to use partial unique index
-- ============================================================================
-- The original implementation used a 3-column UNIQUE constraint with NULLS NOT DISTINCT.
-- This deviates from the plan which specifies a partial unique index WHERE effective_to IS NULL.
-- 
-- This migration:
-- 1. Drops the existing UNIQUE NULLS NOT DISTINCT constraint
-- 2. Creates a partial unique index that only constrains rows where effective_to IS NULL
-- 
-- This is the correct pattern per the plan and ensures only one active rate per role per CP.
-- ============================================================================

-- Drop the existing constraint
ALTER TABLE public.channel_partner_commission_rates 
DROP CONSTRAINT IF EXISTS unique_active_rate;

-- Create partial unique index as per plan specification
-- This ensures only one active rate (effective_to IS NULL) per (channel_partner_id, lead_role)
CREATE UNIQUE INDEX idx_unique_active_rate_per_role 
ON public.channel_partner_commission_rates (channel_partner_id, lead_role) 
WHERE effective_to IS NULL;

COMMENT ON INDEX idx_unique_active_rate_per_role IS 'Ensures only one active rate per role per Channel Partner (partial index on effective_to IS NULL)';
