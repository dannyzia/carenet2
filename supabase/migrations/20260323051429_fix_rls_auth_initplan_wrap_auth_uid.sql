
-- Fix RLS auth initplan: wrap auth.uid() in (SELECT auth.uid())
-- Prevents per-row function evaluation, improving query performance significantly.
-- Generated from live pg_policies scan — covers all 100+ affected policies.

-- ─── admin_actions ───
DROP POLICY IF EXISTS "admin_actions_admin_only" ON public.admin_actions;
CREATE POLICY "admin_actions_admin_only" ON public.admin_actions AS PERMISSIVE FOR ALL TO public
  USING (EXISTS (SELECT 1 FROM wallets w WHERE ((w.user_id = (SELECT auth.uid())) AND (w.user_role = 'admin'::text))));

-- ─── agencies ───
DROP POLICY IF EXISTS "Agency updates own" ON public.agencies;
CREATE POLICY "Agency updates own" ON public.agencies AS PERMISSIVE FOR UPDATE TO public
  USING (((SELECT auth.uid()) = id));

DROP POLICY IF EXISTS "agencies_update_own" ON public.agencies;
CREATE POLICY "agencies_update_own" ON public.agencies AS PERMISSIVE FOR UPDATE TO public
  USING ((id = (SELECT auth.uid())) OR is_admin());

-- ─── blog_posts ───
DROP POLICY IF EXISTS "Admins manage blog" ON public.blog_posts;
CREATE POLICY "Admins manage blog" ON public.blog_posts AS PERMISSIVE FOR ALL TO public
  USING (EXISTS (SELECT 1 FROM profiles WHERE ((profiles.id = (SELECT auth.uid())) AND (profiles.role = ANY (ARRAY['admin'::text, 'moderator'::text])))));

DROP POLICY IF EXISTS "bp_manage" ON public.blog_posts;
CREATE POLICY "bp_manage" ON public.blog_posts AS PERMISSIVE FOR ALL TO public
  USING ((author_id = (SELECT auth.uid())) OR is_admin());

DROP POLICY IF EXISTS "bp_select_public" ON public.blog_posts;
CREATE POLICY "bp_select_public" ON public.blog_posts AS PERMISSIVE FOR SELECT TO public
  USING ((published = true) OR (author_id = (SELECT auth.uid())) OR is_admin());

-- ─── care_contract_bids ───
DROP POLICY IF EXISTS "Agencies create bids" ON public.care_contract_bids;
CREATE POLICY "Agencies create bids" ON public.care_contract_bids AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((SELECT auth.uid()) = agency_id);

DROP POLICY IF EXISTS "Bid parties read" ON public.care_contract_bids;
CREATE POLICY "Bid parties read" ON public.care_contract_bids AS PERMISSIVE FOR SELECT TO public
  USING (((Select auth.uid()) = agency_id) OR (contract_id IN (SELECT care_contracts.id FROM care_contracts WHERE (care_contracts.owner_id = (SELECT auth.uid())))));

DROP POLICY IF EXISTS "ccb_insert" ON public.care_contract_bids;
CREATE POLICY "ccb_insert" ON public.care_contract_bids AS PERMISSIVE FOR INSERT TO public
  WITH CHECK (agency_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "ccb_select" ON public.care_contract_bids;
CREATE POLICY "ccb_select" ON public.care_contract_bids AS PERMISSIVE FOR SELECT TO public
  USING ((agency_id = (SELECT auth.uid())) OR (EXISTS (SELECT 1 FROM care_contracts cc WHERE ((cc.id = care_contract_bids.contract_id) AND (cc.owner_id = (SELECT auth.uid()))))) OR is_admin());

DROP POLICY IF EXISTS "ccb_update" ON public.care_contract_bids;
CREATE POLICY "ccb_update" ON public.care_contract_bids AS PERMISSIVE FOR UPDATE TO public
  USING ((agency_id = (SELECT auth.uid())) OR (EXISTS (SELECT 1 FROM care_contracts cc WHERE ((cc.id = care_contract_bids.contract_id) AND (cc.owner_id = (SELECT auth.uid()))))) OR is_admin());

-- ─── care_contracts ───
DROP POLICY IF EXISTS "Care contracts public read published" ON public.care_contracts;
CREATE POLICY "Care contracts public read published" ON public.care_contracts AS PERMISSIVE FOR SELECT TO public
  USING ((status = ANY (ARRAY['published'::text, 'bidding'::text, 'matched'::text])) OR ((Select auth.uid()) = owner_id));

DROP POLICY IF EXISTS "Owners manage own contracts" ON public.care_contracts;
CREATE POLICY "Owners manage own contracts" ON public.care_contracts AS PERMISSIVE FOR ALL TO public
  USING ((Select auth.uid()) = owner_id);

DROP POLICY IF EXISTS "cc_manage" ON public.care_contracts;
CREATE POLICY "cc_manage" ON public.care_contracts AS PERMISSIVE FOR ALL TO public
  USING ((owner_id = (SELECT auth.uid())) OR is_admin());

DROP POLICY IF EXISTS "cc_select" ON public.care_contracts;
CREATE POLICY "cc_select" ON public.care_contracts AS PERMISSIVE FOR SELECT TO public
  USING ((status = ANY (ARRAY['published'::text, 'bidding'::text])) OR (owner_id = (SELECT auth.uid())) OR (agency_id = (SELECT auth.uid())) OR is_admin());

-- ─── care_notes ───
DROP POLICY IF EXISTS "Caregivers manage own notes" ON public.care_notes;
CREATE POLICY "Caregivers manage own notes" ON public.care_notes AS PERMISSIVE FOR ALL TO public
  USING ((Select auth.uid()) = caregiver_id);

DROP POLICY IF EXISTS "cn_insert" ON public.care_notes;
CREATE POLICY "cn_insert" ON public.care_notes AS PERMISSIVE FOR INSERT TO public
  WITH CHECK (caregiver_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "cn_select" ON public.care_notes;
CREATE POLICY "cn_select" ON public.care_notes AS PERMISSIVE FOR SELECT TO public
  USING ((caregiver_id = (SELECT auth.uid())) OR (EXISTS (SELECT 1 FROM patients p WHERE ((p.id = care_notes.patient_id) AND (p.guardian_id = (SELECT auth.uid()))))) OR (EXISTS (SELECT 1 FROM placements pl WHERE ((pl.patient_id = care_notes.patient_id) AND (pl.agency_id = (SELECT auth.uid()))))) OR is_admin());

DROP POLICY IF EXISTS "cn_update" ON public.care_notes;
CREATE POLICY "cn_update" ON public.care_notes AS PERMISSIVE FOR UPDATE TO public
  USING (caregiver_id = (SELECT auth.uid()));

-- ─── caregiver_documents ───
DROP POLICY IF EXISTS "Agencies read caregiver docs" ON public.caregiver_documents;
CREATE POLICY "Agencies read caregiver docs" ON public.caregiver_documents AS PERMISSIVE FOR SELECT TO public
  USING (EXISTS (SELECT 1 FROM profiles WHERE ((profiles.id = (SELECT auth.uid())) AND (profiles.role = ANY (ARRAY['agency'::text, 'admin'::text])))));

DROP POLICY IF EXISTS "Caregivers manage own docs" ON public.caregiver_documents;
CREATE POLICY "Caregivers manage own docs" ON public.caregiver_documents AS PERMISSIVE FOR ALL TO public
  USING ((Select auth.uid()) = caregiver_id);

DROP POLICY IF EXISTS "Caregivers read own docs" ON public.caregiver_documents;
CREATE POLICY "Caregivers read own docs" ON public.caregiver_documents AS PERMISSIVE FOR SELECT TO public
  USING ((Select auth.uid()) = caregiver_id);

DROP POLICY IF EXISTS "cd_insert" ON public.caregiver_documents;
CREATE POLICY "cd_insert" ON public.caregiver_documents AS PERMISSIVE FOR INSERT TO public
  WITH CHECK (caregiver_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "cd_select" ON public.caregiver_documents;
CREATE POLICY "cd_select" ON public.caregiver_documents AS PERMISSIVE FOR SELECT TO public
  USING ((caregiver_id = (SELECT auth.uid())) OR (EXISTS (SELECT 1 FROM caregiver_profiles cp WHERE ((cp.id = caregiver_documents.caregiver_id) AND (cp.agency_id = (SELECT auth.uid()))))) OR is_mod_or_admin());

DROP POLICY IF EXISTS "cd_update" ON public.caregiver_documents;
CREATE POLICY "cd_update" ON public.caregiver_documents AS PERMISSIVE FOR UPDATE TO public
  USING ((caregiver_id = (SELECT auth.uid())) OR (EXISTS (SELECT 1 FROM caregiver_profiles cp WHERE ((cp.id = caregiver_documents.caregiver_id) AND (cp.agency_id = (SELECT auth.uid()))))) OR is_mod_or_admin());

-- ─── caregiver_profiles ───
DROP POLICY IF EXISTS "Caregivers update own" ON public.caregiver_profiles;
CREATE POLICY "Caregivers update own" ON public.caregiver_profiles AS PERMISSIVE FOR UPDATE TO public
  USING ((Select auth.uid()) = id);

DROP POLICY IF EXISTS "cgp_update_own" ON public.caregiver_profiles;
CREATE POLICY "cgp_update_own" ON public.caregiver_profiles AS PERMISSIVE FOR UPDATE TO public
  USING ((id = (SELECT auth.uid())) OR is_admin());

-- ─── caregiver_reviews ───
DROP POLICY IF EXISTS "cr_delete" ON public.caregiver_reviews;
CREATE POLICY "cr_delete" ON public.caregiver_reviews AS PERMISSIVE FOR DELETE TO public
  USING ((reviewer_id = (SELECT auth.uid())) OR is_mod_or_admin());

DROP POLICY IF EXISTS "cr_insert" ON public.caregiver_reviews;
CREATE POLICY "cr_insert" ON public.caregiver_reviews AS PERMISSIVE FOR INSERT TO public
  WITH CHECK (reviewer_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "cr_update" ON public.caregiver_reviews;
CREATE POLICY "cr_update" ON public.caregiver_reviews AS PERMISSIVE FOR UPDATE TO public
  USING ((reviewer_id = (SELECT auth.uid())) OR is_mod_or_admin());

-- ─── chat_messages ───
DROP POLICY IF EXISTS "Chat participants read messages" ON public.chat_messages;
CREATE POLICY "Chat participants read messages" ON public.chat_messages AS PERMISSIVE FOR SELECT TO public
  USING (conversation_id IN (SELECT conversations.id FROM conversations WHERE (((Select auth.uid()) = conversations.participant_a) OR ((Select auth.uid()) = conversations.participant_b))));

DROP POLICY IF EXISTS "Chat participants send messages" ON public.chat_messages;
CREATE POLICY "Chat participants send messages" ON public.chat_messages AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((Select auth.uid()) = sender_id);

DROP POLICY IF EXISTS "msg_insert" ON public.chat_messages;
CREATE POLICY "msg_insert" ON public.chat_messages AS PERMISSIVE FOR INSERT TO public
  WITH CHECK (sender_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "msg_select" ON public.chat_messages;
CREATE POLICY "msg_select" ON public.chat_messages AS PERMISSIVE FOR SELECT TO public
  USING ((EXISTS (SELECT 1 FROM conversations c WHERE ((c.id = chat_messages.conversation_id) AND ((c.participant_a = (SELECT auth.uid())) OR (c.participant_b = (SELECT auth.uid())))))) OR is_mod_or_admin());

-- ─── contract_disputes ───
DROP POLICY IF EXISTS "cd_disp_insert" ON public.contract_disputes;
CREATE POLICY "cd_disp_insert" ON public.contract_disputes AS PERMISSIVE FOR INSERT TO public
  WITH CHECK (filed_by = (SELECT auth.uid()));

DROP POLICY IF EXISTS "cd_disp_select" ON public.contract_disputes;
CREATE POLICY "cd_disp_select" ON public.contract_disputes AS PERMISSIVE FOR SELECT TO public
  USING ((filed_by = (SELECT auth.uid())) OR (against_party_id = (SELECT auth.uid())) OR (assigned_mediator = (SELECT auth.uid())) OR is_mod_or_admin());

DROP POLICY IF EXISTS "cd_disp_update" ON public.contract_disputes;
CREATE POLICY "cd_disp_update" ON public.contract_disputes AS PERMISSIVE FOR UPDATE TO public
  USING ((assigned_mediator = (SELECT auth.uid())) OR is_mod_or_admin());

-- ─── contract_offers ───
DROP POLICY IF EXISTS "offer_admin_all" ON public.contract_offers;
CREATE POLICY "offer_admin_all" ON public.contract_offers AS PERMISSIVE FOR ALL TO public
  USING (EXISTS (SELECT 1 FROM wallets w WHERE ((w.user_id = (SELECT auth.uid())) AND (w.user_role = 'admin'::text))));

DROP POLICY IF EXISTS "offer_party_create" ON public.contract_offers;
CREATE POLICY "offer_party_create" ON public.contract_offers AS PERMISSIVE FOR INSERT TO public
  WITH CHECK (contract_id IN (SELECT contracts.id FROM contracts WHERE ((contracts.party_a_id = (SELECT auth.uid())) OR (contracts.party_b_id = (SELECT auth.uid())))));

DROP POLICY IF EXISTS "offer_party_read" ON public.contract_offers;
CREATE POLICY "offer_party_read" ON public.contract_offers AS PERMISSIVE FOR SELECT TO public
  USING (contract_id IN (SELECT contracts.id FROM contracts WHERE ((contracts.party_a_id = (SELECT auth.uid())) OR (contracts.party_b_id = (SELECT auth.uid())))));

-- ─── contracts ───
DROP POLICY IF EXISTS "contract_admin_all" ON public.contracts;
CREATE POLICY "contract_admin_all" ON public.contracts AS PERMISSIVE FOR ALL TO public
  USING (EXISTS (SELECT 1 FROM wallets w WHERE ((w.user_id = (SELECT auth.uid())) AND (w.user_role = 'admin'::text))));

DROP POLICY IF EXISTS "contract_party_read" ON public.contracts;
CREATE POLICY "contract_party_read" ON public.contracts AS PERMISSIVE FOR SELECT TO public
  USING (((Select auth.uid()) = party_a_id) OR ((Select auth.uid()) = party_b_id));

-- ─── conversations ───
DROP POLICY IF EXISTS "Participants read own conversations" ON public.conversations;
CREATE POLICY "Participants read own conversations" ON public.conversations AS PERMISSIVE FOR SELECT TO public
  USING (((Select auth.uid()) = participant_a) OR ((Select auth.uid()) = participant_b));

DROP POLICY IF EXISTS "conv_select" ON public.conversations;
CREATE POLICY "conv_select" ON public.conversations AS PERMISSIVE FOR SELECT TO public
  USING ((participant_a = (SELECT auth.uid())) OR (participant_b = (SELECT auth.uid())) OR is_mod_or_admin());

DROP POLICY IF EXISTS "conv_update" ON public.conversations;
CREATE POLICY "conv_update" ON public.conversations AS PERMISSIVE FOR UPDATE TO public
  USING ((participant_a = (SELECT auth.uid())) OR (participant_b = (SELECT auth.uid())));

-- ─── daily_tasks ───
DROP POLICY IF EXISTS "Task participants read" ON public.daily_tasks;
CREATE POLICY "Task participants read" ON public.daily_tasks AS PERMISSIVE FOR SELECT TO public
  USING (((((Select auth.uid()) = caregiver_id) OR ((Select auth.uid()) = guardian_id)) OR ((Select auth.uid()) = agency_id) OR ((Select auth.uid()) = created_by)) OR (EXISTS (SELECT 1 FROM profiles WHERE ((profiles.id = (SELECT auth.uid())) AND (profiles.role = 'admin'::text)))));

DROP POLICY IF EXISTS "dt_insert" ON public.daily_tasks;
CREATE POLICY "dt_insert" ON public.daily_tasks AS PERMISSIVE FOR INSERT TO public
  WITH CHECK (created_by = (SELECT auth.uid()));

DROP POLICY IF EXISTS "dt_select" ON public.daily_tasks;
CREATE POLICY "dt_select" ON public.daily_tasks AS PERMISSIVE FOR SELECT TO public
  USING ((caregiver_id = (SELECT auth.uid())) OR (guardian_id = (SELECT auth.uid())) OR (agency_id = (SELECT auth.uid())) OR is_admin());

DROP POLICY IF EXISTS "dt_update" ON public.daily_tasks;
CREATE POLICY "dt_update" ON public.daily_tasks AS PERMISSIVE FOR UPDATE TO public
  USING ((caregiver_id = (SELECT auth.uid())) OR (guardian_id = (SELECT auth.uid())) OR (agency_id = (SELECT auth.uid())) OR is_admin());

-- ─── device_tokens ───
DROP POLICY IF EXISTS "Users manage own device tokens" ON public.device_tokens;
CREATE POLICY "Users manage own device tokens" ON public.device_tokens AS PERMISSIVE FOR ALL TO authenticated
  USING ((Select auth.uid()) = user_id)
  WITH CHECK ((Select auth.uid()) = user_id);

-- ─── dispute_messages ───
DROP POLICY IF EXISTS "dm_insert" ON public.dispute_messages;
CREATE POLICY "dm_insert" ON public.dispute_messages AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((sender_id = (SELECT auth.uid())) OR is_mod_or_admin());

DROP POLICY IF EXISTS "dm_select" ON public.dispute_messages;
CREATE POLICY "dm_select" ON public.dispute_messages AS PERMISSIVE FOR SELECT TO public
  USING ((EXISTS (SELECT 1 FROM contract_disputes d WHERE ((d.id = dispute_messages.dispute_id) AND ((d.filed_by = (SELECT auth.uid())) OR (d.against_party_id = (SELECT auth.uid())) OR (d.assigned_mediator = (SELECT auth.uid())))))) OR is_mod_or_admin());

-- ─── flagged_content ───
DROP POLICY IF EXISTS "fc_insert" ON public.flagged_content;
CREATE POLICY "fc_insert" ON public.flagged_content AS PERMISSIVE FOR INSERT TO public
  WITH CHECK (reporter_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "fc_select" ON public.flagged_content;
CREATE POLICY "fc_select" ON public.flagged_content AS PERMISSIVE FOR SELECT TO public
  USING (is_mod_or_admin() OR (reporter_id = (SELECT auth.uid())));

-- ─── guardian_profiles ───
DROP POLICY IF EXISTS "Guardians read own" ON public.guardian_profiles;
CREATE POLICY "Guardians read own" ON public.guardian_profiles AS PERMISSIVE FOR SELECT TO public
  USING ((Select auth.uid()) = id);

DROP POLICY IF EXISTS "Guardians update own" ON public.guardian_profiles;
CREATE POLICY "Guardians update own" ON public.guardian_profiles AS PERMISSIVE FOR UPDATE TO public
  USING ((Select auth.uid()) = id);

DROP POLICY IF EXISTS "gp_select_own" ON public.guardian_profiles;
CREATE POLICY "gp_select_own" ON public.guardian_profiles AS PERMISSIVE FOR SELECT TO public
  USING ((id = (SELECT auth.uid())) OR is_admin());

DROP POLICY IF EXISTS "gp_update_own" ON public.guardian_profiles;
CREATE POLICY "gp_update_own" ON public.guardian_profiles AS PERMISSIVE FOR UPDATE TO public
  USING ((id = (SELECT auth.uid())) OR is_admin());

-- ─── incident_reports ───
DROP POLICY IF EXISTS "ir_insert" ON public.incident_reports;
CREATE POLICY "ir_insert" ON public.incident_reports AS PERMISSIVE FOR INSERT TO public
  WITH CHECK (reported_by = (SELECT auth.uid()));

DROP POLICY IF EXISTS "ir_select" ON public.incident_reports;
CREATE POLICY "ir_select" ON public.incident_reports AS PERMISSIVE FOR SELECT TO public
  USING ((reported_by = (SELECT auth.uid())) OR (EXISTS (SELECT 1 FROM patients p WHERE ((p.id = incident_reports.patient_id) AND (p.guardian_id = (SELECT auth.uid()))))) OR (EXISTS (SELECT 1 FROM placements pl WHERE ((pl.patient_id = incident_reports.patient_id) AND (pl.agency_id = (SELECT auth.uid()))))) OR is_mod_or_admin());

DROP POLICY IF EXISTS "ir_update" ON public.incident_reports;
CREATE POLICY "ir_update" ON public.incident_reports AS PERMISSIVE FOR UPDATE TO public
  USING ((reported_by = (SELECT auth.uid())) OR is_mod_or_admin());

-- ─── invoice_line_items ───
DROP POLICY IF EXISTS "Invoice line items via invoice" ON public.invoice_line_items;
CREATE POLICY "Invoice line items via invoice" ON public.invoice_line_items AS PERMISSIVE FOR SELECT TO public
  USING (invoice_id IN (SELECT invoices.id FROM invoices WHERE (((Select auth.uid()) = invoices.from_party_id) OR ((Select auth.uid()) = invoices.to_party_id))));

DROP POLICY IF EXISTS "ili_select" ON public.invoice_line_items;
CREATE POLICY "ili_select" ON public.invoice_line_items AS PERMISSIVE FOR SELECT TO public
  USING ((EXISTS (SELECT 1 FROM invoices i WHERE ((i.id = invoice_line_items.invoice_id) AND ((i.from_party_id = (SELECT auth.uid())) OR (i.to_party_id = (SELECT auth.uid())))))) OR is_admin());

-- ─── invoices ───
DROP POLICY IF EXISTS "Invoice parties read" ON public.invoices;
CREATE POLICY "Invoice parties read" ON public.invoices AS PERMISSIVE FOR SELECT TO public
  USING (((Select auth.uid()) = from_party_id) OR ((Select auth.uid()) = to_party_id));

DROP POLICY IF EXISTS "inv_manage" ON public.invoices;
CREATE POLICY "inv_manage" ON public.invoices AS PERMISSIVE FOR ALL TO public
  USING ((from_party_id = (SELECT auth.uid())) OR is_admin());

DROP POLICY IF EXISTS "inv_select" ON public.invoices;
CREATE POLICY "inv_select" ON public.invoices AS PERMISSIVE FOR SELECT TO public
  USING ((from_party_id = (SELECT auth.uid())) OR (to_party_id = (SELECT auth.uid())) OR is_admin());

-- ─── job_applications ───
DROP POLICY IF EXISTS "Applicants read own apps" ON public.job_applications;
CREATE POLICY "Applicants read own apps" ON public.job_applications AS PERMISSIVE FOR SELECT TO public
  USING ((Select auth.uid()) = applicant_id);

DROP POLICY IF EXISTS "Job posters read apps" ON public.job_applications;
CREATE POLICY "Job posters read apps" ON public.job_applications AS PERMISSIVE FOR SELECT TO public
  USING (job_id IN (SELECT jobs.id FROM jobs WHERE (jobs.posted_by = (SELECT auth.uid()))));

DROP POLICY IF EXISTS "ja_insert" ON public.job_applications;
CREATE POLICY "ja_insert" ON public.job_applications AS PERMISSIVE FOR INSERT TO public
  WITH CHECK (applicant_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "ja_select" ON public.job_applications;
CREATE POLICY "ja_select" ON public.job_applications AS PERMISSIVE FOR SELECT TO public
  USING ((applicant_id = (SELECT auth.uid())) OR (EXISTS (SELECT 1 FROM jobs j WHERE ((j.id = job_applications.job_id) AND (j.posted_by = (SELECT auth.uid()))))) OR is_admin());

DROP POLICY IF EXISTS "ja_update" ON public.job_applications;
CREATE POLICY "ja_update" ON public.job_applications AS PERMISSIVE FOR UPDATE TO public
  USING ((EXISTS (SELECT 1 FROM jobs j WHERE ((j.id = job_applications.job_id) AND (j.posted_by = (SELECT auth.uid()))))) OR is_admin());

-- ─── jobs ───
DROP POLICY IF EXISTS "Posters manage own jobs" ON public.jobs;
CREATE POLICY "Posters manage own jobs" ON public.jobs AS PERMISSIVE FOR ALL TO public
  USING ((Select auth.uid()) = posted_by);

DROP POLICY IF EXISTS "jobs_manage" ON public.jobs;
CREATE POLICY "jobs_manage" ON public.jobs AS PERMISSIVE FOR ALL TO public
  USING ((posted_by = (SELECT auth.uid())) OR is_admin());

-- ─── moderation_queue ───
DROP POLICY IF EXISTS "mq_insert" ON public.moderation_queue;
CREATE POLICY "mq_insert" ON public.moderation_queue AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((reporter_id = (SELECT auth.uid())) OR (EXISTS (SELECT 1 FROM profiles WHERE ((profiles.id = (SELECT auth.uid())) AND (profiles.role = ANY (ARRAY['admin'::text, 'moderator'::text]))))));

-- ─── moderator_sanctions ───
DROP POLICY IF EXISTS "ms_select" ON public.moderator_sanctions;
CREATE POLICY "ms_select" ON public.moderator_sanctions AS PERMISSIVE FOR SELECT TO public
  USING ((user_id = (SELECT auth.uid())) OR is_mod_or_admin());

-- ─── notifications ───
DROP POLICY IF EXISTS "Users read own notifications" ON public.notifications;
CREATE POLICY "Users read own notifications" ON public.notifications AS PERMISSIVE FOR SELECT TO public
  USING ((Select auth.uid()) = receiver_id);

DROP POLICY IF EXISTS "Users update own notifications" ON public.notifications;
CREATE POLICY "Users update own notifications" ON public.notifications AS PERMISSIVE FOR UPDATE TO public
  USING ((Select auth.uid()) = receiver_id)
  WITH CHECK ((Select auth.uid()) = receiver_id);

DROP POLICY IF EXISTS "notif_delete" ON public.notifications;
CREATE POLICY "notif_delete" ON public.notifications AS PERMISSIVE FOR DELETE TO public
  USING ((receiver_id = (SELECT auth.uid())) OR is_admin());

DROP POLICY IF EXISTS "notif_insert" ON public.notifications;
CREATE POLICY "notif_insert" ON public.notifications AS PERMISSIVE FOR INSERT TO public
  WITH CHECK (sender_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "notif_select" ON public.notifications;
CREATE POLICY "notif_select" ON public.notifications AS PERMISSIVE FOR SELECT TO public
  USING ((receiver_id = (SELECT auth.uid())) OR is_admin());

DROP POLICY IF EXISTS "notif_update" ON public.notifications;
CREATE POLICY "notif_update" ON public.notifications AS PERMISSIVE FOR UPDATE TO public
  USING (receiver_id = (SELECT auth.uid()));

-- ─── patient_vitals ───
DROP POLICY IF EXISTS "pv_insert" ON public.patient_vitals;
CREATE POLICY "pv_insert" ON public.patient_vitals AS PERMISSIVE FOR INSERT TO public
  WITH CHECK (recorded_by = (SELECT auth.uid()));

DROP POLICY IF EXISTS "pv_select" ON public.patient_vitals;
CREATE POLICY "pv_select" ON public.patient_vitals AS PERMISSIVE FOR SELECT TO public
  USING ((recorded_by = (SELECT auth.uid())) OR (patient_id = (SELECT auth.uid())) OR (EXISTS (SELECT 1 FROM patients p WHERE ((p.id = patient_vitals.patient_id) AND (p.guardian_id = (SELECT auth.uid()))))) OR (EXISTS (SELECT 1 FROM placements pl WHERE ((pl.patient_id = patient_vitals.patient_id) AND (pl.agency_id = (SELECT auth.uid()))))) OR is_admin());

-- ─── patients ───
DROP POLICY IF EXISTS "Admins read all patients" ON public.patients;
CREATE POLICY "Admins read all patients" ON public.patients AS PERMISSIVE FOR SELECT TO public
  USING (EXISTS (SELECT 1 FROM profiles WHERE ((profiles.id = (SELECT auth.uid())) AND (profiles.role = 'admin'::text))));

DROP POLICY IF EXISTS "Guardian manages own patients" ON public.patients;
CREATE POLICY "Guardian manages own patients" ON public.patients AS PERMISSIVE FOR ALL TO public
  USING ((Select auth.uid()) = guardian_id);

DROP POLICY IF EXISTS "Guardian reads own patients" ON public.patients;
CREATE POLICY "Guardian reads own patients" ON public.patients AS PERMISSIVE FOR SELECT TO public
  USING ((Select auth.uid()) = guardian_id);

DROP POLICY IF EXISTS "patients_insert_guardian" ON public.patients;
CREATE POLICY "patients_insert_guardian" ON public.patients AS PERMISSIVE FOR INSERT TO public
  WITH CHECK (guardian_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "patients_select_agency" ON public.patients;
CREATE POLICY "patients_select_agency" ON public.patients AS PERMISSIVE FOR SELECT TO public
  USING (EXISTS (SELECT 1 FROM placements WHERE ((placements.patient_id = patients.id) AND (placements.agency_id = (SELECT auth.uid())))));

DROP POLICY IF EXISTS "patients_select_caregiver" ON public.patients;
CREATE POLICY "patients_select_caregiver" ON public.patients AS PERMISSIVE FOR SELECT TO public
  USING (EXISTS (SELECT 1 FROM placements WHERE ((placements.patient_id = patients.id) AND (placements.caregiver_id = (SELECT auth.uid())) AND (placements.status = 'active'::text))));

DROP POLICY IF EXISTS "patients_select_guardian" ON public.patients;
CREATE POLICY "patients_select_guardian" ON public.patients AS PERMISSIVE FOR SELECT TO public
  USING ((guardian_id = (SELECT auth.uid())) OR (id = (SELECT auth.uid())) OR is_admin());

DROP POLICY IF EXISTS "patients_update_guardian" ON public.patients;
CREATE POLICY "patients_update_guardian" ON public.patients AS PERMISSIVE FOR UPDATE TO public
  USING ((guardian_id = (SELECT auth.uid())) OR is_admin());

-- ─── payment_proofs ───
DROP POLICY IF EXISTS "Payment proof parties read" ON public.payment_proofs;
CREATE POLICY "Payment proof parties read" ON public.payment_proofs AS PERMISSIVE FOR SELECT TO public
  USING (((Select auth.uid()) = submitted_by_id) OR ((Select auth.uid()) = received_by_id));

DROP POLICY IF EXISTS "pp_insert" ON public.payment_proofs;
CREATE POLICY "pp_insert" ON public.payment_proofs AS PERMISSIVE FOR INSERT TO public
  WITH CHECK (submitted_by_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "pp_select" ON public.payment_proofs;
CREATE POLICY "pp_select" ON public.payment_proofs AS PERMISSIVE FOR SELECT TO public
  USING ((submitted_by_id = (SELECT auth.uid())) OR (received_by_id = (SELECT auth.uid())) OR is_admin());

DROP POLICY IF EXISTS "pp_update" ON public.payment_proofs;
CREATE POLICY "pp_update" ON public.payment_proofs AS PERMISSIVE FOR UPDATE TO public
  USING ((received_by_id = (SELECT auth.uid())) OR is_admin());

-- ─── placements ───
DROP POLICY IF EXISTS "Placement parties read" ON public.placements;
CREATE POLICY "Placement parties read" ON public.placements AS PERMISSIVE FOR SELECT TO public
  USING ((((Select auth.uid()) = guardian_id) OR ((Select auth.uid()) = agency_id) OR ((Select auth.uid()) = caregiver_id)) OR (EXISTS (SELECT 1 FROM profiles WHERE ((profiles.id = (SELECT auth.uid())) AND (profiles.role = 'admin'::text)))));

DROP POLICY IF EXISTS "placements_insert_agency" ON public.placements;
CREATE POLICY "placements_insert_agency" ON public.placements AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((agency_id = (SELECT auth.uid())) OR is_admin());

DROP POLICY IF EXISTS "placements_select" ON public.placements;
CREATE POLICY "placements_select" ON public.placements AS PERMISSIVE FOR SELECT TO public
  USING ((guardian_id = (SELECT auth.uid())) OR (caregiver_id = (SELECT auth.uid())) OR (agency_id = (SELECT auth.uid())) OR is_admin());

DROP POLICY IF EXISTS "placements_update" ON public.placements;
CREATE POLICY "placements_update" ON public.placements AS PERMISSIVE FOR UPDATE TO public
  USING ((agency_id = (SELECT auth.uid())) OR is_admin());

-- ─── platform_config ───
DROP POLICY IF EXISTS "config_admin_write" ON public.platform_config;
CREATE POLICY "config_admin_write" ON public.platform_config AS PERMISSIVE FOR ALL TO public
  USING (EXISTS (SELECT 1 FROM wallets w WHERE ((w.user_id = (SELECT auth.uid())) AND (w.user_role = 'admin'::text))));

-- ─── prescriptions ───
DROP POLICY IF EXISTS "rx_select" ON public.prescriptions;
CREATE POLICY "rx_select" ON public.prescriptions AS PERMISSIVE FOR SELECT TO public
  USING ((EXISTS (SELECT 1 FROM patients p WHERE ((p.id = prescriptions.patient_id) AND (p.guardian_id = (SELECT auth.uid()))))) OR (EXISTS (SELECT 1 FROM placements pl WHERE ((pl.patient_id = prescriptions.patient_id) AND ((pl.caregiver_id = (SELECT auth.uid())) OR (pl.agency_id = (SELECT auth.uid())))))) OR (patient_id = (SELECT auth.uid())) OR is_admin());

-- ─── product_reviews ───
DROP POLICY IF EXISTS "Users create reviews" ON public.product_reviews;
CREATE POLICY "Users create reviews" ON public.product_reviews AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((Select auth.uid()) = author_id);

-- ─── profiles ───
DROP POLICY IF EXISTS "Users read own profile" ON public.profiles;
CREATE POLICY "Users read own profile" ON public.profiles AS PERMISSIVE FOR SELECT TO public
  USING ((Select auth.uid()) = id);

DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile" ON public.profiles AS PERMISSIVE FOR UPDATE TO public
  USING ((Select auth.uid()) = id);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles AS PERMISSIVE FOR UPDATE TO public
  USING (id = (SELECT auth.uid()));

-- ─── queued_notifications ───
DROP POLICY IF EXISTS "Service role manages queued notifications" ON public.queued_notifications;
CREATE POLICY "Service role manages queued notifications" ON public.queued_notifications AS PERMISSIVE FOR ALL TO authenticated
  USING (receiver_id = (SELECT auth.uid()))
  WITH CHECK (receiver_id = (SELECT auth.uid()));

-- ─── refund_requests ───
DROP POLICY IF EXISTS "Users read own refunds" ON public.refund_requests;
CREATE POLICY "Users read own refunds" ON public.refund_requests AS PERMISSIVE FOR SELECT TO public
  USING ((Select auth.uid()) = user_id);

-- ─── shift_ratings ───
DROP POLICY IF EXISTS "sr_insert" ON public.shift_ratings;
CREATE POLICY "sr_insert" ON public.shift_ratings AS PERMISSIVE FOR INSERT TO public
  WITH CHECK (rated_by = (SELECT auth.uid()));

DROP POLICY IF EXISTS "sr_select" ON public.shift_ratings;
CREATE POLICY "sr_select" ON public.shift_ratings AS PERMISSIVE FOR SELECT TO public
  USING ((rated_by = (SELECT auth.uid())) OR (EXISTS (SELECT 1 FROM shifts s WHERE ((s.id = shift_ratings.shift_id) AND (s.caregiver_id = (SELECT auth.uid()))))) OR is_admin());

-- ─── shifts ───
DROP POLICY IF EXISTS "Caregivers update own shifts" ON public.shifts;
CREATE POLICY "Caregivers update own shifts" ON public.shifts AS PERMISSIVE FOR UPDATE TO public
  USING ((Select auth.uid()) = caregiver_id);

DROP POLICY IF EXISTS "Shift parties read" ON public.shifts;
CREATE POLICY "Shift parties read" ON public.shifts AS PERMISSIVE FOR SELECT TO public
  USING (((Select auth.uid()) = caregiver_id) OR ((Select auth.uid()) IN (SELECT patients.guardian_id FROM patients WHERE (patients.id = shifts.patient_id))) OR (EXISTS (SELECT 1 FROM profiles WHERE ((profiles.id = (SELECT auth.uid())) AND (profiles.role = ANY (ARRAY['agency'::text, 'admin'::text]))))));

DROP POLICY IF EXISTS "shifts_manage_agency" ON public.shifts;
CREATE POLICY "shifts_manage_agency" ON public.shifts AS PERMISSIVE FOR ALL TO public
  USING ((EXISTS (SELECT 1 FROM placements p WHERE ((p.id = shifts.placement_id) AND (p.agency_id = (SELECT auth.uid()))))) OR is_admin());

DROP POLICY IF EXISTS "shifts_select" ON public.shifts;
CREATE POLICY "shifts_select" ON public.shifts AS PERMISSIVE FOR SELECT TO public
  USING ((caregiver_id = (SELECT auth.uid())) OR (EXISTS (SELECT 1 FROM placements p WHERE ((p.id = shifts.placement_id) AND ((p.guardian_id = (SELECT auth.uid())) OR (p.agency_id = (SELECT auth.uid())))))) OR is_admin());

DROP POLICY IF EXISTS "shifts_update_caregiver" ON public.shifts;
CREATE POLICY "shifts_update_caregiver" ON public.shifts AS PERMISSIVE FOR UPDATE TO public
  USING (caregiver_id = (SELECT auth.uid()));

-- ─── shop_order_items ───
DROP POLICY IF EXISTS "Order items via order" ON public.shop_order_items;
CREATE POLICY "Order items via order" ON public.shop_order_items AS PERMISSIVE FOR SELECT TO public
  USING (order_id IN (SELECT shop_orders.id FROM shop_orders WHERE (((Select auth.uid()) = shop_orders.customer_id) OR ((Select auth.uid()) = shop_orders.merchant_id))));

-- ─── shop_orders ───
DROP POLICY IF EXISTS "Order parties read" ON public.shop_orders;
CREATE POLICY "Order parties read" ON public.shop_orders AS PERMISSIVE FOR SELECT TO public
  USING (((Select auth.uid()) = customer_id) OR ((Select auth.uid()) = merchant_id));

DROP POLICY IF EXISTS "so_insert" ON public.shop_orders;
CREATE POLICY "so_insert" ON public.shop_orders AS PERMISSIVE FOR INSERT TO public
  WITH CHECK (customer_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "so_select" ON public.shop_orders;
CREATE POLICY "so_select" ON public.shop_orders AS PERMISSIVE FOR SELECT TO public
  USING ((customer_id = (SELECT auth.uid())) OR (merchant_id = (SELECT auth.uid())) OR is_admin());

DROP POLICY IF EXISTS "so_update" ON public.shop_orders;
CREATE POLICY "so_update" ON public.shop_orders AS PERMISSIVE FOR UPDATE TO public
  USING ((merchant_id = (SELECT auth.uid())) OR is_admin());

-- ─── shop_products ───
DROP POLICY IF EXISTS "Merchants manage own products" ON public.shop_products;
CREATE POLICY "Merchants manage own products" ON public.shop_products AS PERMISSIVE FOR ALL TO public
  USING ((Select auth.uid()) = merchant_id);

DROP POLICY IF EXISTS "sp_manage" ON public.shop_products;
CREATE POLICY "sp_manage" ON public.shop_products AS PERMISSIVE FOR ALL TO public
  USING ((merchant_id = (SELECT auth.uid())) OR is_admin());

-- ─── support_ticket_messages ───
DROP POLICY IF EXISTS "Ticket messages via ticket" ON public.support_ticket_messages;
CREATE POLICY "Ticket messages via ticket" ON public.support_ticket_messages AS PERMISSIVE FOR SELECT TO public
  USING ((ticket_id IN (SELECT support_tickets.id FROM support_tickets WHERE (support_tickets.user_id = (SELECT auth.uid())))) OR (EXISTS (SELECT 1 FROM profiles WHERE ((profiles.id = (SELECT auth.uid())) AND (profiles.role = ANY (ARRAY['admin'::text, 'moderator'::text]))))));

-- ─── support_tickets ───
DROP POLICY IF EXISTS "Admins read all tickets" ON public.support_tickets;
CREATE POLICY "Admins read all tickets" ON public.support_tickets AS PERMISSIVE FOR SELECT TO public
  USING (EXISTS (SELECT 1 FROM profiles WHERE ((profiles.id = (SELECT auth.uid())) AND (profiles.role = ANY (ARRAY['admin'::text, 'moderator'::text])))));

DROP POLICY IF EXISTS "Users create tickets" ON public.support_tickets;
CREATE POLICY "Users create tickets" ON public.support_tickets AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((Select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users read own tickets" ON public.support_tickets;
CREATE POLICY "Users read own tickets" ON public.support_tickets AS PERMISSIVE FOR SELECT TO public
  USING ((Select auth.uid()) = user_id);

DROP POLICY IF EXISTS "st_insert" ON public.support_tickets;
CREATE POLICY "st_insert" ON public.support_tickets AS PERMISSIVE FOR INSERT TO public
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "st_select" ON public.support_tickets;
CREATE POLICY "st_select" ON public.support_tickets AS PERMISSIVE FOR SELECT TO public
  USING ((user_id = (SELECT auth.uid())) OR is_mod_or_admin());

DROP POLICY IF EXISTS "st_update" ON public.support_tickets;
CREATE POLICY "st_update" ON public.support_tickets AS PERMISSIVE FOR UPDATE TO public
  USING ((user_id = (SELECT auth.uid())) OR is_mod_or_admin());

-- ─── uploaded_files ───
DROP POLICY IF EXISTS "Users create uploads" ON public.uploaded_files;
CREATE POLICY "Users create uploads" ON public.uploaded_files AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((Select auth.uid()) = uploaded_by);

DROP POLICY IF EXISTS "Users read own uploads" ON public.uploaded_files;
CREATE POLICY "Users read own uploads" ON public.uploaded_files AS PERMISSIVE FOR SELECT TO public
  USING ((Select auth.uid()) = uploaded_by);

-- ─── user_preferences ───
DROP POLICY IF EXISTS "Users read own preferences" ON public.user_preferences;
CREATE POLICY "Users read own preferences" ON public.user_preferences AS PERMISSIVE FOR SELECT TO public
  USING ((Select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users update own preferences" ON public.user_preferences;
CREATE POLICY "Users update own preferences" ON public.user_preferences AS PERMISSIVE FOR UPDATE TO public
  USING ((Select auth.uid()) = user_id)
  WITH CHECK ((Select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users upsert own preferences" ON public.user_preferences;
CREATE POLICY "Users upsert own preferences" ON public.user_preferences AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((Select auth.uid()) = user_id);

-- ─── wallet_transactions ───
DROP POLICY IF EXISTS "tx_admin_all" ON public.wallet_transactions;
CREATE POLICY "tx_admin_all" ON public.wallet_transactions AS PERMISSIVE FOR ALL TO public
  USING (EXISTS (SELECT 1 FROM wallets w WHERE ((w.user_id = (SELECT auth.uid())) AND (w.user_role = 'admin'::text))));

DROP POLICY IF EXISTS "tx_own_read" ON public.wallet_transactions;
CREATE POLICY "tx_own_read" ON public.wallet_transactions AS PERMISSIVE FOR SELECT TO public
  USING (wallet_id IN (SELECT wallets.id FROM wallets WHERE (wallets.user_id = (SELECT auth.uid()))));

DROP POLICY IF EXISTS "wtx_select_own" ON public.wallet_transactions;
CREATE POLICY "wtx_select_own" ON public.wallet_transactions AS PERMISSIVE FOR SELECT TO public
  USING ((wallet_id = (SELECT auth.uid())) OR is_admin());

-- ─── wallets ───
DROP POLICY IF EXISTS "wallet_admin_all" ON public.wallets;
CREATE POLICY "wallet_admin_all" ON public.wallets AS PERMISSIVE FOR ALL TO public
  USING (EXISTS (SELECT 1 FROM wallets w WHERE ((w.user_id = (SELECT auth.uid())) AND (w.user_role = 'admin'::text))));

DROP POLICY IF EXISTS "wallet_own_read" ON public.wallets;
CREATE POLICY "wallet_own_read" ON public.wallets AS PERMISSIVE FOR SELECT TO public
  USING ((Select auth.uid()) = user_id);

DROP POLICY IF EXISTS "wallets_select_own" ON public.wallets;
CREATE POLICY "wallets_select_own" ON public.wallets AS PERMISSIVE FOR SELECT TO public
  USING ((user_id = (SELECT auth.uid())) OR is_admin());

-- ─── wishlists ───
DROP POLICY IF EXISTS "Users manage own wishlist" ON public.wishlists;
CREATE POLICY "Users manage own wishlist" ON public.wishlists AS PERMISSIVE FOR ALL TO public
  USING ((Select auth.uid()) = user_id);
