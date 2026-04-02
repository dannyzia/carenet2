
-- ===========================================================================
-- Consolidate duplicate permissive RLS policies
-- Drops redundant or subset policies, keeping the canonical snake_case ones.
--
-- ⚠ CRITICAL SECURITY FIXES (4 policies): drops USING(true) on sensitive tables
-- that were letting any authenticated user read ALL rows of medical data.
-- ===========================================================================

-- ── CRITICAL: drop USING(true) policies that expose sensitive medical data ──
DROP POLICY IF EXISTS "Incidents readable by care team" ON public.incident_reports;
DROP POLICY IF EXISTS "Vitals readable by care team" ON public.patient_vitals;
DROP POLICY IF EXISTS "Prescriptions care team access" ON public.prescriptions;
DROP POLICY IF EXISTS "Shift ratings readable" ON public.shift_ratings;

-- ── IDENTICAL DUPLICATES ──
DROP POLICY IF EXISTS "Agencies public read" ON public.agencies;
DROP POLICY IF EXISTS "Caregiver profiles public read" ON public.caregiver_profiles;
DROP POLICY IF EXISTS "Caregiver reviews public read" ON public.caregiver_reviews;
DROP POLICY IF EXISTS "Chat participants send messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Jobs public read" ON public.jobs;
DROP POLICY IF EXISTS "Public profiles readable" ON public.profiles;
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Agencies create bids" ON public.care_contract_bids;
DROP POLICY IF EXISTS "Caregivers update own shifts" ON public.shifts;
DROP POLICY IF EXISTS "wallet_own_read" ON public.wallets;
DROP POLICY IF EXISTS "wtx_select_own" ON public.wallet_transactions;

-- ── SUBSET POLICIES ──
DROP POLICY IF EXISTS "Agency updates own" ON public.agencies;
DROP POLICY IF EXISTS "Blog posts public read" ON public.blog_posts;
DROP POLICY IF EXISTS "Bid parties read" ON public.care_contract_bids;
DROP POLICY IF EXISTS "Owners manage own contracts" ON public.care_contracts;
DROP POLICY IF EXISTS "Care contracts public read published" ON public.care_contracts;
DROP POLICY IF EXISTS "Agencies read caregiver docs" ON public.caregiver_documents;
DROP POLICY IF EXISTS "Caregivers read own docs" ON public.caregiver_documents;
DROP POLICY IF EXISTS "Caregivers update own" ON public.caregiver_profiles;
DROP POLICY IF EXISTS "Chat participants read messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Participants read own conversations" ON public.conversations;
DROP POLICY IF EXISTS "dt_select" ON public.daily_tasks;
DROP POLICY IF EXISTS "Guardians read own" ON public.guardian_profiles;
DROP POLICY IF EXISTS "Guardians update own" ON public.guardian_profiles;
DROP POLICY IF EXISTS "Invoice line items via invoice" ON public.invoice_line_items;
DROP POLICY IF EXISTS "Invoice parties read" ON public.invoices;
DROP POLICY IF EXISTS "Applicants read own apps" ON public.job_applications;
DROP POLICY IF EXISTS "Job posters read apps" ON public.job_applications;
DROP POLICY IF EXISTS "Posters manage own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Users read own notifications" ON public.notifications;
DROP POLICY IF EXISTS "notif_update" ON public.notifications;
DROP POLICY IF EXISTS "Admins read all patients" ON public.patients;
DROP POLICY IF EXISTS "Guardian reads own patients" ON public.patients;
DROP POLICY IF EXISTS "Payment proof parties read" ON public.payment_proofs;
DROP POLICY IF EXISTS "Placement parties read" ON public.placements;
DROP POLICY IF EXISTS "Users read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Shift parties read" ON public.shifts;
DROP POLICY IF EXISTS "Order parties read" ON public.shop_orders;
DROP POLICY IF EXISTS "Merchants manage own products" ON public.shop_products;
DROP POLICY IF EXISTS "Admins read all tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Users read own tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Users create tickets" ON public.support_tickets;
