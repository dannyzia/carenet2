-- Contract convergence: engagement contract_id, care_contracts GAC/CAC columns,
-- caregiving_jobs + assignments, backfill, RPCs (accept_client/caregiver, create_caregiving_job, add_caregiver).

-- ─── §6 Engagement contract_id ───
ALTER TABLE public.package_client_engagements
  ADD COLUMN IF NOT EXISTS contract_id UUID REFERENCES public.care_contracts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_pce_contract_id ON public.package_client_engagements(contract_id)
  WHERE contract_id IS NOT NULL;

ALTER TABLE public.package_caregiver_engagements
  ADD COLUMN IF NOT EXISTS contract_id UUID REFERENCES public.care_contracts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_pcge_contract_id ON public.package_caregiver_engagements(contract_id)
  WHERE contract_id IS NOT NULL;

-- ─── §7 care_contracts extensions ───
ALTER TABLE public.care_contracts
  ADD COLUMN IF NOT EXISTS source_type TEXT,
  ADD COLUMN IF NOT EXISTS source_id UUID,
  ADD COLUMN IF NOT EXISTS financial_status TEXT NOT NULL DEFAULT 'pending';

ALTER TABLE public.care_contracts
  DROP CONSTRAINT IF EXISTS check_financial_status_values,
  ADD CONSTRAINT check_financial_status_values CHECK (
    financial_status = ANY (ARRAY['pending','invoiced','paid','waived','cancelled']::text[])
  ) NOT VALID;

ALTER TABLE public.care_contracts
  ADD COLUMN IF NOT EXISTS contract_party_scope TEXT,
  ADD COLUMN IF NOT EXISTS parent_guardian_agency_contract_id UUID REFERENCES public.care_contracts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS gac_kind TEXT,
  ADD COLUMN IF NOT EXISTS staffing_channel TEXT;

ALTER TABLE public.care_contracts
  DROP CONSTRAINT IF EXISTS check_contract_party_scope_values,
  ADD CONSTRAINT check_contract_party_scope_values CHECK (
    contract_party_scope IS NULL
    OR contract_party_scope = ANY (ARRAY['guardian_agency','caregiver_agency']::text[])
  ) NOT VALID;

ALTER TABLE public.care_contracts
  DROP CONSTRAINT IF EXISTS check_gac_kind_values,
  ADD CONSTRAINT check_gac_kind_values CHECK (
    gac_kind IS NULL OR gac_kind = ANY (ARRAY['package_gac','request_gac']::text[])
  ) NOT VALID;

ALTER TABLE public.care_contracts
  DROP CONSTRAINT IF EXISTS check_staffing_channel_values,
  ADD CONSTRAINT check_staffing_channel_values CHECK (
    staffing_channel IS NULL
    OR staffing_channel = ANY (ARRAY['package_caregiver','forwarded_requirement']::text[])
  ) NOT VALID;

ALTER TABLE public.care_contracts
  DROP CONSTRAINT IF EXISTS check_contract_role_consistency,
  ADD CONSTRAINT check_contract_role_consistency CHECK (
    (contract_party_scope IS NULL AND gac_kind IS NULL AND staffing_channel IS NULL)
    OR (contract_party_scope = 'guardian_agency' AND gac_kind IS NOT NULL AND staffing_channel IS NULL)
    OR (contract_party_scope = 'caregiver_agency' AND staffing_channel IS NOT NULL AND gac_kind IS NULL)
  ) NOT VALID;

CREATE INDEX IF NOT EXISTS idx_care_contracts_source ON public.care_contracts(source_type, source_id);

CREATE INDEX IF NOT EXISTS idx_care_contracts_parent_gac
  ON public.care_contracts(parent_guardian_agency_contract_id)
  WHERE parent_guardian_agency_contract_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_care_contracts_scope_kind
  ON public.care_contracts(contract_party_scope, gac_kind)
  WHERE contract_party_scope = 'guardian_agency';

-- ─── §8 Caregiving jobs + placements FKs ───
CREATE TABLE IF NOT EXISTS public.caregiving_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guardian_agency_contract_id UUID NOT NULL REFERENCES public.care_contracts(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES auth.users(id),
  start_date DATE,
  end_date DATE,
  schedule_pattern JSONB,
  location_id UUID,
  job_group_key TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status = ANY (ARRAY['draft','active','paused','completed','cancelled']::text[])),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_caregiving_jobs_gac ON public.caregiving_jobs(guardian_agency_contract_id);
CREATE INDEX IF NOT EXISTS idx_caregiving_jobs_agency ON public.caregiving_jobs(agency_id);

CREATE TABLE IF NOT EXISTS public.caregiving_job_caregiver_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caregiving_job_id UUID NOT NULL REFERENCES public.caregiving_jobs(id) ON DELETE CASCADE,
  caregiver_agency_contract_id UUID NOT NULL REFERENCES public.care_contracts(id) ON DELETE RESTRICT,
  assignment_label TEXT NOT NULL,
  role TEXT,
  status TEXT NOT NULL DEFAULT 'assigned' CHECK (status = ANY (ARRAY['assigned','removed','completed']::text[])),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_cj_cac_label UNIQUE (caregiving_job_id, caregiver_agency_contract_id, assignment_label)
);

CREATE INDEX IF NOT EXISTS idx_cj_assignments_job ON public.caregiving_job_caregiver_assignments(caregiving_job_id);

ALTER TABLE public.placements
  ADD COLUMN IF NOT EXISTS caregiving_job_id UUID REFERENCES public.caregiving_jobs(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS caregiving_assignment_id UUID REFERENCES public.caregiving_job_caregiver_assignments(id) ON DELETE SET NULL;

DROP TRIGGER IF EXISTS trg_caregiving_jobs_updated_at ON public.caregiving_jobs;
CREATE TRIGGER trg_caregiving_jobs_updated_at
  BEFORE UPDATE ON public.caregiving_jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS trg_cj_assignments_updated_at ON public.caregiving_job_caregiver_assignments;
CREATE TRIGGER trg_cj_assignments_updated_at
  BEFORE UPDATE ON public.caregiving_job_caregiver_assignments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ─── §9 Backfill: accepted client engagements → Package-GAC ───
WITH pending AS (
  SELECT e.id AS engagement_id
  FROM public.package_client_engagements e
  WHERE e.status = 'accepted'
    AND e.contract_id IS NULL
),
inserted AS (
  INSERT INTO public.care_contracts (
    owner_id, type, status, title, categories, city, area, address, start_date, duration_type,
    party_role, party_name, party_phone, party_whatsapp, organization, service_areas,
    subject_age, subject_gender, condition_summary, mobility, cognitive, risk_level,
    diagnosis, comorbidities, devices, procedures_required, medication_complexity,
    care_needs, caregiver_count, nurse_count, required_level, gender_preference, experience_years, certifications_required,
    hours_per_day, shift_type, staff_pattern, services, location_type, accommodation_provided, food_provided, travel_distance_km,
    equipment_required, equipment_provider, budget_min, budget_max, preferred_pricing_model,
    base_price, pricing_model, included_hours, overtime_rate, extra_charges,
    replacement_time_hours, emergency_response_minutes, attendance_guarantee_percent, reporting_frequency,
    background_verified, medical_fit, contract_required, trial_available, exclusions, add_ons,
    agency_id, agency_name, agency_rating, agency_verified,
    source_type, source_id, financial_status, contract_party_scope, gac_kind, staffing_channel,
    created_at, updated_at
  )
  SELECT
    e.client_user_id, 'request', 'booked', p.title || ' (GAC)', p.categories, p.city, p.area, p.address, p.start_date, p.duration_type,
    p.party_role, p.party_name, p.party_phone, p.party_whatsapp, p.organization, p.service_areas,
    p.subject_age, p.subject_gender, p.condition_summary, p.mobility, p.cognitive, p.risk_level,
    p.diagnosis, p.comorbidities, p.devices, p.procedures_required, p.medication_complexity,
    p.care_needs, p.caregiver_count, p.nurse_count, p.required_level, p.gender_preference, p.experience_years, p.certifications_required,
    p.hours_per_day, p.shift_type, p.staff_pattern, p.services, p.location_type, p.accommodation_provided, p.food_provided, p.travel_distance_km,
    p.equipment_required, p.equipment_provider, p.budget_min, p.budget_max, p.preferred_pricing_model,
    p.base_price, p.pricing_model, p.included_hours, p.overtime_rate, p.extra_charges,
    p.replacement_time_hours, p.emergency_response_minutes, p.attendance_guarantee_percent, p.reporting_frequency,
    p.background_verified, p.medical_fit, p.contract_required, p.trial_available, p.exclusions, p.add_ons,
    p.agency_id, p.agency_name, p.agency_rating, p.agency_verified,
    'package_client_engagement', e.id, 'pending', 'guardian_agency', 'package_gac', NULL,
    e.updated_at, NOW()
  FROM pending b
  JOIN public.package_client_engagements e ON e.id = b.engagement_id
  JOIN public.care_contracts p ON p.id = e.package_contract_id
  RETURNING id AS contract_id, source_id AS engagement_id
)
UPDATE public.package_client_engagements e
SET contract_id = i.contract_id, updated_at = NOW()
FROM inserted i
WHERE e.id = i.engagement_id;

-- ─── §9 Backfill: accepted caregiver engagements → Package-CAC ───
WITH pending_cg AS (
  SELECT e.id AS engagement_id
  FROM public.package_caregiver_engagements e
  WHERE e.status = 'accepted'
    AND e.contract_id IS NULL
),
inserted_cg AS (
  INSERT INTO public.care_contracts (
    owner_id, type, status, title, categories, city, area, address, start_date, duration_type,
    party_role, party_name, party_phone, party_whatsapp, organization, service_areas,
    subject_age, subject_gender, condition_summary, mobility, cognitive, risk_level,
    diagnosis, comorbidities, devices, procedures_required, medication_complexity,
    care_needs, caregiver_count, nurse_count, required_level, gender_preference, experience_years, certifications_required,
    hours_per_day, shift_type, staff_pattern, services, location_type, accommodation_provided, food_provided, travel_distance_km,
    equipment_required, equipment_provider, budget_min, budget_max, preferred_pricing_model,
    base_price, pricing_model, included_hours, overtime_rate, extra_charges,
    replacement_time_hours, emergency_response_minutes, attendance_guarantee_percent, reporting_frequency,
    background_verified, medical_fit, contract_required, trial_available, exclusions, add_ons,
    agency_id, agency_name, agency_rating, agency_verified,
    source_type, source_id, financial_status, contract_party_scope, gac_kind, staffing_channel,
    created_at, updated_at
  )
  SELECT
    e.caregiver_user_id, 'request', 'booked', p.title || ' (CAC)', p.categories, p.city, p.area, p.address, p.start_date, p.duration_type,
    p.party_role, p.party_name, p.party_phone, p.party_whatsapp, p.organization, p.service_areas,
    p.subject_age, p.subject_gender, p.condition_summary, p.mobility, p.cognitive, p.risk_level,
    p.diagnosis, p.comorbidities, p.devices, p.procedures_required, p.medication_complexity,
    p.care_needs, p.caregiver_count, p.nurse_count, p.required_level, p.gender_preference, p.experience_years, p.certifications_required,
    p.hours_per_day, p.shift_type, p.staff_pattern, p.services, p.location_type, p.accommodation_provided, p.food_provided, p.travel_distance_km,
    p.equipment_required, p.equipment_provider, p.budget_min, p.budget_max, p.preferred_pricing_model,
    p.base_price, p.pricing_model, p.included_hours, p.overtime_rate, p.extra_charges,
    p.replacement_time_hours, p.emergency_response_minutes, p.attendance_guarantee_percent, p.reporting_frequency,
    p.background_verified, p.medical_fit, p.contract_required, p.trial_available, p.exclusions, p.add_ons,
    p.agency_id, p.agency_name, p.agency_rating, p.agency_verified,
    'package_caregiver_engagement', e.id, 'pending', 'caregiver_agency', NULL, 'package_caregiver',
    e.updated_at, NOW()
  FROM pending_cg b
  JOIN public.package_caregiver_engagements e ON e.id = b.engagement_id
  JOIN public.care_contracts p ON p.id = e.package_contract_id
  RETURNING id AS contract_id, source_id AS engagement_id
)
UPDATE public.package_caregiver_engagements e
SET contract_id = i.contract_id, updated_at = NOW()
FROM inserted_cg i
WHERE e.id = i.engagement_id;

-- ─── RLS: new tables ───
ALTER TABLE public.caregiving_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caregiving_job_caregiver_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS caregiving_jobs_select ON public.caregiving_jobs;
CREATE POLICY caregiving_jobs_select ON public.caregiving_jobs
  FOR SELECT TO authenticated
  USING (
    agency_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.care_contracts g
      WHERE g.id = caregiving_jobs.guardian_agency_contract_id
        AND (g.owner_id = (SELECT auth.uid()) OR g.agency_id = (SELECT auth.uid()))
    )
    OR is_admin()
  );

DROP POLICY IF EXISTS caregiving_jobs_mutate ON public.caregiving_jobs;
CREATE POLICY caregiving_jobs_mutate ON public.caregiving_jobs
  FOR ALL TO authenticated
  USING (agency_id = (SELECT auth.uid()) OR is_admin())
  WITH CHECK (agency_id = (SELECT auth.uid()) OR is_admin());

DROP POLICY IF EXISTS cj_assign_select ON public.caregiving_job_caregiver_assignments;
CREATE POLICY cj_assign_select ON public.caregiving_job_caregiver_assignments
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.caregiving_jobs j
      WHERE j.id = caregiving_job_caregiver_assignments.caregiving_job_id
        AND (
          j.agency_id = (SELECT auth.uid())
          OR EXISTS (
            SELECT 1 FROM public.care_contracts g
            WHERE g.id = j.guardian_agency_contract_id
              AND (g.owner_id = (SELECT auth.uid()) OR g.agency_id = (SELECT auth.uid()))
          )
        )
    )
    OR EXISTS (
      SELECT 1 FROM public.care_contracts cac
      WHERE cac.id = caregiving_job_caregiver_assignments.caregiver_agency_contract_id
        AND cac.owner_id = (SELECT auth.uid())
    )
    OR is_admin()
  );

DROP POLICY IF EXISTS cj_assign_mutate ON public.caregiving_job_caregiver_assignments;
CREATE POLICY cj_assign_mutate ON public.caregiving_job_caregiver_assignments
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.caregiving_jobs j
      WHERE j.id = caregiving_job_caregiver_assignments.caregiving_job_id
        AND (j.agency_id = (SELECT auth.uid()) OR is_admin())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.caregiving_jobs j
      WHERE j.id = caregiving_job_caregiver_assignments.caregiving_job_id
        AND (j.agency_id = (SELECT auth.uid()) OR is_admin())
    )
  );

-- ─── §11 accept_client_engagement ───
CREATE OR REPLACE FUNCTION public.accept_client_engagement(
  p_engagement_id UUID,
  p_new_status TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_eng public.package_client_engagements%ROWTYPE;
  v_pkg public.care_contracts%ROWTYPE;
  v_contract_id UUID;
  v_out_eng public.package_client_engagements%ROWTYPE;
BEGIN
  SELECT * INTO v_eng
  FROM public.package_client_engagements
  WHERE id = p_engagement_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Engagement not found';
  END IF;

  IF NOT (v_eng.client_user_id = (SELECT auth.uid()) OR v_eng.agency_user_id = (SELECT auth.uid()) OR is_admin()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF v_eng.status = 'accepted' AND v_eng.contract_id IS NOT NULL THEN
    SELECT * INTO v_out_eng FROM public.package_client_engagements WHERE id = p_engagement_id;
    RETURN jsonb_build_object(
      'engagement', to_jsonb(v_out_eng),
      'contract', (SELECT to_jsonb(c.*) FROM public.care_contracts c WHERE c.id = v_out_eng.contract_id)
    );
  END IF;

  UPDATE public.package_client_engagements
  SET status = p_new_status, updated_at = NOW()
  WHERE id = p_engagement_id;

  IF p_new_status = 'accepted' THEN
    SELECT * INTO v_pkg FROM public.care_contracts WHERE id = v_eng.package_contract_id;
    IF v_pkg.id IS NULL THEN
      RAISE EXCEPTION 'Package contract not found';
    END IF;

    INSERT INTO public.care_contracts (
      owner_id, type, status, title, categories, city, area,
      agency_id, agency_name, agency_rating, agency_verified,
      care_needs, services, budget_min, budget_max, preferred_pricing_model,
      source_type, source_id, financial_status,
      contract_party_scope, gac_kind, staffing_channel
    ) VALUES (
      v_eng.client_user_id,
      'request',
      'booked',
      v_pkg.title,
      v_pkg.categories,
      v_pkg.city,
      v_pkg.area,
      v_pkg.agency_id,
      v_pkg.agency_name,
      v_pkg.agency_rating,
      v_pkg.agency_verified,
      v_pkg.care_needs,
      v_pkg.services,
      v_pkg.budget_min,
      v_pkg.budget_max,
      v_pkg.preferred_pricing_model,
      'package_client_engagement',
      v_eng.id,
      'pending',
      'guardian_agency',
      'package_gac',
      NULL
    )
    RETURNING id INTO v_contract_id;

    UPDATE public.package_client_engagements
    SET contract_id = v_contract_id, updated_at = NOW()
    WHERE id = p_engagement_id;
  END IF;

  SELECT * INTO v_out_eng FROM public.package_client_engagements WHERE id = p_engagement_id;

  RETURN jsonb_build_object(
    'engagement', to_jsonb(v_out_eng),
    'contract', (
      SELECT to_jsonb(c.*) FROM public.care_contracts c
      WHERE c.id = v_out_eng.contract_id
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.accept_client_engagement(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.accept_client_engagement(UUID, TEXT) TO authenticated;

-- ─── accept_caregiver_engagement ───
CREATE OR REPLACE FUNCTION public.accept_caregiver_engagement(
  p_engagement_id UUID,
  p_new_status TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_eng public.package_caregiver_engagements%ROWTYPE;
  v_pkg public.care_contracts%ROWTYPE;
  v_contract_id UUID;
  v_out_eng public.package_caregiver_engagements%ROWTYPE;
BEGIN
  SELECT * INTO v_eng
  FROM public.package_caregiver_engagements
  WHERE id = p_engagement_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Engagement not found';
  END IF;

  IF NOT (v_eng.caregiver_user_id = (SELECT auth.uid()) OR v_eng.agency_user_id = (SELECT auth.uid()) OR is_admin()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF v_eng.status = 'accepted' AND v_eng.contract_id IS NOT NULL THEN
    SELECT * INTO v_out_eng FROM public.package_caregiver_engagements WHERE id = p_engagement_id;
    RETURN jsonb_build_object(
      'engagement', to_jsonb(v_out_eng),
      'contract', (SELECT to_jsonb(c.*) FROM public.care_contracts c WHERE c.id = v_out_eng.contract_id)
    );
  END IF;

  UPDATE public.package_caregiver_engagements
  SET status = p_new_status, updated_at = NOW()
  WHERE id = p_engagement_id;

  IF p_new_status = 'accepted' THEN
    SELECT * INTO v_pkg FROM public.care_contracts WHERE id = v_eng.package_contract_id;
    IF v_pkg.id IS NULL THEN
      RAISE EXCEPTION 'Package contract not found';
    END IF;

    INSERT INTO public.care_contracts (
      owner_id, type, status, title, categories, city, area,
      agency_id, agency_name, agency_rating, agency_verified,
      care_needs, services, budget_min, budget_max, preferred_pricing_model,
      source_type, source_id, financial_status,
      contract_party_scope, gac_kind, staffing_channel
    ) VALUES (
      v_eng.caregiver_user_id,
      'request',
      'booked',
      v_pkg.title,
      v_pkg.categories,
      v_pkg.city,
      v_pkg.area,
      v_pkg.agency_id,
      v_pkg.agency_name,
      v_pkg.agency_rating,
      v_pkg.agency_verified,
      v_pkg.care_needs,
      v_pkg.services,
      v_pkg.budget_min,
      v_pkg.budget_max,
      v_pkg.preferred_pricing_model,
      'package_caregiver_engagement',
      v_eng.id,
      'pending',
      'caregiver_agency',
      NULL,
      'package_caregiver'
    )
    RETURNING id INTO v_contract_id;

    UPDATE public.package_caregiver_engagements
    SET contract_id = v_contract_id, updated_at = NOW()
    WHERE id = p_engagement_id;
  END IF;

  SELECT * INTO v_out_eng FROM public.package_caregiver_engagements WHERE id = p_engagement_id;

  RETURN jsonb_build_object(
    'engagement', to_jsonb(v_out_eng),
    'contract', (
      SELECT to_jsonb(c.*) FROM public.care_contracts c
      WHERE c.id = v_out_eng.contract_id
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.accept_caregiver_engagement(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.accept_caregiver_engagement(UUID, TEXT) TO authenticated;

-- ─── §12 create_caregiving_job ───
CREATE OR REPLACE FUNCTION public.create_caregiving_job(
  p_gac_id UUID,
  p_cac_id UUID,
  p_agency_id UUID,
  p_assignment_label TEXT,
  p_start_date DATE DEFAULT NULL,
  p_schedule_pattern JSONB DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_gac public.care_contracts%ROWTYPE;
  v_cac public.care_contracts%ROWTYPE;
  v_job_id UUID;
  v_assignment_id UUID;
BEGIN
  IF p_assignment_label IS NULL OR btrim(p_assignment_label) = '' THEN
    RAISE EXCEPTION 'assignment_label required';
  END IF;

  IF p_agency_id IS DISTINCT FROM (SELECT auth.uid()) AND NOT is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT * INTO v_gac FROM public.care_contracts WHERE id = p_gac_id FOR SHARE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'GAC not found: %', p_gac_id;
  END IF;

  SELECT * INTO v_cac FROM public.care_contracts WHERE id = p_cac_id FOR SHARE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'CAC not found: %', p_cac_id;
  END IF;

  IF v_gac.contract_party_scope IS DISTINCT FROM 'guardian_agency' THEN
    RAISE EXCEPTION 'Invalid GAC: contract_party_scope must be guardian_agency';
  END IF;
  IF v_cac.contract_party_scope IS DISTINCT FROM 'caregiver_agency' THEN
    RAISE EXCEPTION 'Invalid CAC: contract_party_scope must be caregiver_agency';
  END IF;
  IF v_gac.gac_kind IS NULL OR v_cac.staffing_channel IS NULL THEN
    RAISE EXCEPTION 'gac_kind / staffing_channel must be set on new rows';
  END IF;

  IF v_gac.gac_kind = 'package_gac' AND v_cac.staffing_channel IS DISTINCT FROM 'package_caregiver' THEN
    RAISE EXCEPTION 'Package-GAC requires package_caregiver CAC (got %)', v_cac.staffing_channel;
  END IF;
  IF v_gac.gac_kind = 'request_gac' AND v_cac.staffing_channel IS DISTINCT FROM 'forwarded_requirement' THEN
    RAISE EXCEPTION 'Request-GAC requires forwarded_requirement CAC (got %)', v_cac.staffing_channel;
  END IF;

  INSERT INTO public.caregiving_jobs (
    guardian_agency_contract_id, agency_id, start_date, schedule_pattern, status
  ) VALUES (
    p_gac_id, p_agency_id, p_start_date, p_schedule_pattern, 'active'
  )
  RETURNING id INTO v_job_id;

  INSERT INTO public.caregiving_job_caregiver_assignments (
    caregiving_job_id, caregiver_agency_contract_id, assignment_label, role
  ) VALUES (
    v_job_id, p_cac_id, p_assignment_label, 'primary'
  )
  RETURNING id INTO v_assignment_id;

  RETURN jsonb_build_object('job_id', v_job_id, 'assignment_id', v_assignment_id);
END;
$$;

REVOKE ALL ON FUNCTION public.create_caregiving_job(UUID, UUID, UUID, TEXT, DATE, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_caregiving_job(UUID, UUID, UUID, TEXT, DATE, JSONB) TO authenticated;

-- ─── add_caregiver_to_caregiving_job ───
CREATE OR REPLACE FUNCTION public.add_caregiver_to_caregiving_job(
  p_job_id UUID,
  p_cac_id UUID,
  p_assignment_label TEXT,
  p_role TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_job public.caregiving_jobs%ROWTYPE;
  v_gac public.care_contracts%ROWTYPE;
  v_cac public.care_contracts%ROWTYPE;
  v_assignment_id UUID;
BEGIN
  IF p_assignment_label IS NULL OR btrim(p_assignment_label) = '' THEN
    RAISE EXCEPTION 'assignment_label required';
  END IF;

  SELECT * INTO v_job FROM public.caregiving_jobs WHERE id = p_job_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Job not found';
  END IF;

  IF v_job.agency_id IS DISTINCT FROM (SELECT auth.uid()) AND NOT is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT * INTO v_gac FROM public.care_contracts WHERE id = v_job.guardian_agency_contract_id FOR SHARE;
  IF v_gac.id IS NULL THEN
    RAISE EXCEPTION 'GAC not found for job';
  END IF;

  SELECT * INTO v_cac FROM public.care_contracts WHERE id = p_cac_id FOR SHARE;
  IF v_cac.id IS NULL THEN
    RAISE EXCEPTION 'CAC not found';
  END IF;

  IF v_gac.contract_party_scope IS DISTINCT FROM 'guardian_agency' THEN
    RAISE EXCEPTION 'Invalid GAC';
  END IF;
  IF v_cac.contract_party_scope IS DISTINCT FROM 'caregiver_agency' THEN
    RAISE EXCEPTION 'Invalid CAC';
  END IF;
  IF v_gac.gac_kind IS NULL OR v_cac.staffing_channel IS NULL THEN
    RAISE EXCEPTION 'gac_kind / staffing_channel must be set';
  END IF;
  IF v_gac.gac_kind = 'package_gac' AND v_cac.staffing_channel IS DISTINCT FROM 'package_caregiver' THEN
    RAISE EXCEPTION 'Package-GAC requires package_caregiver CAC (got %)', v_cac.staffing_channel;
  END IF;
  IF v_gac.gac_kind = 'request_gac' AND v_cac.staffing_channel IS DISTINCT FROM 'forwarded_requirement' THEN
    RAISE EXCEPTION 'Request-GAC requires forwarded_requirement CAC (got %)', v_cac.staffing_channel;
  END IF;

  INSERT INTO public.caregiving_job_caregiver_assignments (
    caregiving_job_id, caregiver_agency_contract_id, assignment_label, role
  ) VALUES (
    p_job_id, p_cac_id, p_assignment_label, COALESCE(p_role, 'support')
  )
  RETURNING id INTO v_assignment_id;

  RETURN jsonb_build_object('assignment_id', v_assignment_id);
END;
$$;

REVOKE ALL ON FUNCTION public.add_caregiver_to_caregiving_job(UUID, UUID, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.add_caregiver_to_caregiving_job(UUID, UUID, TEXT, TEXT) TO authenticated;
