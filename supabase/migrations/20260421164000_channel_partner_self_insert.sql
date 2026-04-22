-- ============================================================================
-- Channel Partner Self-Insert RLS Policy
-- Migration: 20260421164000_channel_partner_self_insert.sql
-- Purpose: Allow authenticated users to insert their own channel_partner application
-- ============================================================================
-- This policy enables the intended public application flow where users can
-- register as Channel Partners and submit for admin approval.
--
-- Security Model:
-- - Users can only insert records with their own user_id (auth.uid())
-- - Users can only insert with status = 'pending_approval'
-- - Admins/moderators retain full insert capabilities via existing policies
-- - Users cannot modify others' records or create active accounts directly
-- ============================================================================

-- Ensure RLS is enabled (should already be true, but idempotent)
ALTER TABLE public.channel_partners ENABLE ROW LEVEL SECURITY;

-- Drop conflicting policy if it exists (for idempotency during re-runs)
DROP POLICY IF EXISTS "Users can insert own pending application" ON public.channel_partners;

-- Policy: Authenticated users can insert a row ONLY if:
--   - user_id matches their own auth.uid()
--   - status is explicitly 'pending_approval'
CREATE POLICY "Users can insert own pending application" 
ON public.channel_partners 
FOR INSERT 
TO authenticated 
WITH CHECK (
  auth.uid() = user_id 
  AND status = 'pending_approval'
);

-- Note: This policy works in conjunction with existing admin/moderator policies.
-- The existing "channel_partners_insert_admin" policy (if present) allows
-- admins/moderators to insert any record, which is the intended behavior.
-- Supabase RLS policies use OR logic - if ANY policy allows the operation,
-- the operation succeeds.
