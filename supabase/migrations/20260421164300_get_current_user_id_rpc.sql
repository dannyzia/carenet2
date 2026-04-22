-- ============================================================================
-- Create get_current_user_id RPC Function
-- Migration: 20260421164300_get_current_user_id_rpc.sql
-- Purpose: Create RPC function used by adminCreateChanP
-- ============================================================================
-- This migration fixes Bug #4 from audit: adminCreateChanP calls sbData().rpc('get_current_user_id')
-- but this RPC function was not defined in any migration. This creates the missing function.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid();
$$;

COMMENT ON FUNCTION public.get_current_user_id() IS 'Returns the current authenticated user ID from auth.uid()';
