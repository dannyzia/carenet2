-- ===========================================================================
-- Drop legacy "Service role …" RLS policies that were created without TO
-- service_role and used USING/WITH CHECK (TRUE).
--
-- PostgreSQL combines permissive policies with OR. If these coexist with
-- stricter policies from 20260323051429_fix_rls_auth_initplan_wrap_auth_uid.sql,
-- the trivially-true checks still allow any authenticated row access that
-- matches the command (e.g. arbitrary notification inserts, all device_tokens
-- SELECT).
--
-- Supabase service_role bypasses RLS entirely; Edge Functions using
-- SUPABASE_SERVICE_ROLE_KEY do not need these policies.
-- ===========================================================================

DROP POLICY IF EXISTS "Service role inserts notifications" ON public.notifications;
DROP POLICY IF EXISTS "Service role reads device tokens" ON public.device_tokens;
