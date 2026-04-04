-- CareNet 2 — post-migration sanity checks (run in Supabase SQL Editor)
-- Use this AFTER you have run the 10 SQL files listed in D024 Item 5.
-- Primary production project (carenet) was verified April 2026 (D024 Session 8); re-run when you
-- provision a new Supabase project or after major schema changes.
--
-- SUPABASE UI — avoid this error:
--   "EXPLAIN only works on a single SQL statement..."
--
--   • Use **Run** (execute the query), NOT **Explain** / **Analyze**, when the editor
--     contains multiple statements below.
--   • Or: highlight **only one** SELECT (from start through its ending `;`) then run/explain.
--   • Easiest: copy one numbered block at a time, paste into a new query tab, Run.

-- =============================================================================
-- QUERY 1 — public BASE TABLE count
-- =============================================================================
SELECT COUNT(*) AS public_table_count
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE';

-- =============================================================================
-- QUERY 2 — list public tables
-- =============================================================================
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- =============================================================================
-- QUERY 3 — expected core tables missing from public (empty result = all present)
-- =============================================================================
-- If any row returns "missing", that migration block did not apply.
SELECT unnest(ARRAY[
  'profiles',
  'patients',
  'agencies',
  'shifts',
  'jobs',
  'placements',
  'care_contracts',
  'shop_products',
  'support_tickets',
  'blog_posts'
]) AS expected_table
EXCEPT
SELECT tablename FROM pg_tables WHERE schemaname = 'public';

-- =============================================================================
-- QUERY 4 — row counts (sample)
-- =============================================================================
SELECT
  (SELECT COUNT(*) FROM public.profiles)       AS profiles_count,
  (SELECT COUNT(*) FROM public.patients)       AS patients_count,
  (SELECT COUNT(*) FROM public.agencies)       AS agencies_count;

-- =============================================================================
-- QUERY 5 — RLS enabled (sample tables)
-- =============================================================================
SELECT tablename, rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'patients', 'jobs', 'care_contracts')
ORDER BY tablename;
