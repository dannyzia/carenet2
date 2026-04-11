-- Package procurement (client↔agency) and staffing (caregiver↔agency) on published offers.
-- RLS: parties only; admin/moderator read-all where noted.

-- ─── Helpers: agency user for an offer row (owner_id and agency_id should match for offers) ───
CREATE OR REPLACE FUNCTION public.package_offer_agency_user_id(p_pkg public.care_contracts)
RETURNS UUID
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(p_pkg.agency_id, p_pkg.owner_id);
$$;

-- ─── Client engagements (guardian/patient user as client_user_id) ───
CREATE TABLE IF NOT EXISTS public.package_client_engagements (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_contract_id UUID NOT NULL REFERENCES public.care_contracts(id) ON DELETE CASCADE,
  client_user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agency_user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status              TEXT NOT NULL DEFAULT 'interested'
    CHECK (status IN (
      'draft', 'interested', 'negotiating', 'accepted', 'declined', 'withdrawn', 'expired'
    )),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pce_package ON public.package_client_engagements(package_contract_id);
CREATE INDEX IF NOT EXISTS idx_pce_agency_status ON public.package_client_engagements(agency_user_id, status);
CREATE INDEX IF NOT EXISTS idx_pce_client ON public.package_client_engagements(client_user_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_pce_one_active_per_client_pkg
  ON public.package_client_engagements(package_contract_id, client_user_id)
  WHERE status NOT IN ('accepted', 'declined', 'withdrawn', 'expired');

CREATE TABLE IF NOT EXISTS public.package_client_engagement_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id   UUID NOT NULL REFERENCES public.package_client_engagements(id) ON DELETE CASCADE,
  author_user_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_role     TEXT NOT NULL CHECK (author_role IN ('client', 'agency')),
  event_kind      TEXT NOT NULL DEFAULT 'message'
    CHECK (event_kind IN ('created', 'message', 'counter_offer', 'accept', 'withdraw', 'decline')),
  payload         JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pcee_engagement ON public.package_client_engagement_events(engagement_id, created_at);

-- ─── Caregiver engagements ───
CREATE TABLE IF NOT EXISTS public.package_caregiver_engagements (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_contract_id UUID NOT NULL REFERENCES public.care_contracts(id) ON DELETE CASCADE,
  caregiver_user_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agency_user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status              TEXT NOT NULL DEFAULT 'applied'
    CHECK (status IN (
      'draft', 'applied', 'negotiating', 'accepted', 'declined', 'withdrawn', 'expired'
    )),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pcge_package ON public.package_caregiver_engagements(package_contract_id);
CREATE INDEX IF NOT EXISTS idx_pcge_agency_status ON public.package_caregiver_engagements(agency_user_id, status);
CREATE INDEX IF NOT EXISTS idx_pcge_caregiver ON public.package_caregiver_engagements(caregiver_user_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_pcge_one_active_per_cg_pkg
  ON public.package_caregiver_engagements(package_contract_id, caregiver_user_id)
  WHERE status NOT IN ('accepted', 'declined', 'withdrawn', 'expired');

CREATE TABLE IF NOT EXISTS public.package_caregiver_engagement_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id   UUID NOT NULL REFERENCES public.package_caregiver_engagements(id) ON DELETE CASCADE,
  author_user_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_role     TEXT NOT NULL CHECK (author_role IN ('caregiver', 'agency')),
  event_kind      TEXT NOT NULL DEFAULT 'message'
    CHECK (event_kind IN ('created', 'message', 'counter_offer', 'accept', 'withdraw', 'decline')),
  payload         JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pcgee_engagement ON public.package_caregiver_engagement_events(engagement_id, created_at);

-- ─── updated_at triggers ───
CREATE TRIGGER package_client_engagements_updated_at
  BEFORE UPDATE ON public.package_client_engagements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER package_caregiver_engagements_updated_at
  BEFORE UPDATE ON public.package_caregiver_engagements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ─── Integrity: package must be published offer; agency_user_id must match package agency ───
CREATE OR REPLACE FUNCTION public.enforce_package_client_engagement_pkg()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  pkg public.care_contracts%ROWTYPE;
BEGIN
  SELECT * INTO pkg FROM public.care_contracts WHERE id = NEW.package_contract_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'package_client_engagements: care_contract not found';
  END IF;
  IF pkg.type <> 'offer' OR pkg.status <> 'published' THEN
    RAISE EXCEPTION 'package_client_engagements: package must be published offer';
  END IF;
  IF NEW.agency_user_id IS DISTINCT FROM public.package_offer_agency_user_id(pkg) THEN
    RAISE EXCEPTION 'package_client_engagements: agency_user_id does not match package';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_pce_enforce_pkg
  BEFORE INSERT OR UPDATE OF package_contract_id, agency_user_id ON public.package_client_engagements
  FOR EACH ROW EXECUTE FUNCTION public.enforce_package_client_engagement_pkg();

CREATE OR REPLACE FUNCTION public.enforce_package_caregiver_engagement_pkg()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  pkg public.care_contracts%ROWTYPE;
BEGIN
  SELECT * INTO pkg FROM public.care_contracts WHERE id = NEW.package_contract_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'package_caregiver_engagements: care_contract not found';
  END IF;
  IF pkg.type <> 'offer' OR pkg.status <> 'published' THEN
    RAISE EXCEPTION 'package_caregiver_engagements: package must be published offer';
  END IF;
  IF NEW.agency_user_id IS DISTINCT FROM public.package_offer_agency_user_id(pkg) THEN
    RAISE EXCEPTION 'package_caregiver_engagements: agency_user_id does not match package';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_pcge_enforce_pkg
  BEFORE INSERT OR UPDATE OF package_contract_id, agency_user_id ON public.package_caregiver_engagements
  FOR EACH ROW EXECUTE FUNCTION public.enforce_package_caregiver_engagement_pkg();

-- ─── Status transitions ───
CREATE OR REPLACE FUNCTION public.package_engagement_status_transition_ok(
  p_old TEXT,
  p_new TEXT,
  p_is_terminal_allowed BOOLEAN DEFAULT TRUE
) RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN p_old IS NOT DISTINCT FROM p_new THEN TRUE
    WHEN p_new IN ('accepted', 'declined', 'withdrawn', 'expired') AND p_is_terminal_allowed THEN TRUE
    WHEN p_old = 'draft' AND p_new IN ('interested', 'applied') THEN TRUE
    WHEN p_old = 'interested' AND p_new IN ('negotiating', 'withdrawn', 'declined', 'expired') THEN TRUE
    WHEN p_old = 'applied' AND p_new IN ('negotiating', 'withdrawn', 'declined', 'expired') THEN TRUE
    WHEN p_old = 'negotiating' AND p_new IN ('negotiating', 'accepted', 'declined', 'withdrawn', 'expired') THEN TRUE
    ELSE FALSE
  END;
$$;

CREATE OR REPLACE FUNCTION public.enforce_pce_status_transition()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    IF NOT public.package_engagement_status_transition_ok(OLD.status, NEW.status, TRUE) THEN
      RAISE EXCEPTION 'Invalid package_client_engagements status transition: % → %', OLD.status, NEW.status
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_pce_status
  BEFORE UPDATE OF status ON public.package_client_engagements
  FOR EACH ROW EXECUTE FUNCTION public.enforce_pce_status_transition();

CREATE OR REPLACE FUNCTION public.enforce_pcge_status_transition()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_old TEXT := CASE WHEN OLD.status = 'applied' THEN 'interested' ELSE OLD.status END;
  v_new TEXT := CASE WHEN NEW.status = 'applied' THEN 'interested' ELSE NEW.status END;
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    IF OLD.status = 'draft' AND NEW.status = 'applied' THEN
      RETURN NEW;
    END IF;
    IF public.package_engagement_status_transition_ok(v_old, v_new, TRUE) THEN
      RETURN NEW;
    END IF;
    RAISE EXCEPTION 'Invalid package_caregiver_engagements status transition: % → %', OLD.status, NEW.status
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_pcge_status
  BEFORE UPDATE OF status ON public.package_caregiver_engagements
  FOR EACH ROW EXECUTE FUNCTION public.enforce_pcge_status_transition();

-- ─── RLS ───
ALTER TABLE public.package_client_engagements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.package_client_engagement_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.package_caregiver_engagements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.package_caregiver_engagement_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY pce_select ON public.package_client_engagements
  FOR SELECT TO public USING (
    is_admin()
    OR is_mod_or_admin()
    OR client_user_id = (SELECT auth.uid())
    OR agency_user_id = (SELECT auth.uid())
  );

CREATE POLICY pce_insert ON public.package_client_engagements
  FOR INSERT TO public WITH CHECK (
    is_admin()
    OR (
      client_user_id = (SELECT auth.uid())
      AND agency_user_id IS NOT NULL
    )
  );

CREATE POLICY pce_update ON public.package_client_engagements
  FOR UPDATE TO public USING (
    is_admin()
    OR client_user_id = (SELECT auth.uid())
    OR agency_user_id = (SELECT auth.uid())
  )
  WITH CHECK (
    is_admin()
    OR client_user_id = (SELECT auth.uid())
    OR agency_user_id = (SELECT auth.uid())
  );

CREATE POLICY pcee_select ON public.package_client_engagement_events
  FOR SELECT TO public USING (
    EXISTS (
      SELECT 1 FROM public.package_client_engagements e
      WHERE e.id = engagement_id
        AND (
          is_admin()
          OR e.client_user_id = (SELECT auth.uid())
          OR e.agency_user_id = (SELECT auth.uid())
        )
    )
    OR is_mod_or_admin()
  );

CREATE POLICY pcee_insert ON public.package_client_engagement_events
  FOR INSERT TO public WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.package_client_engagements e
      WHERE e.id = engagement_id
        AND (
          is_admin()
          OR e.client_user_id = (SELECT auth.uid())
          OR e.agency_user_id = (SELECT auth.uid())
        )
    )
    AND author_user_id = (SELECT auth.uid())
  );

CREATE POLICY pcge_select ON public.package_caregiver_engagements
  FOR SELECT TO public USING (
    is_admin()
    OR caregiver_user_id = (SELECT auth.uid())
    OR agency_user_id = (SELECT auth.uid())
  );

CREATE POLICY pcge_insert ON public.package_caregiver_engagements
  FOR INSERT TO public WITH CHECK (
    is_admin()
    OR (
      caregiver_user_id = (SELECT auth.uid())
      AND agency_user_id IS NOT NULL
    )
  );

CREATE POLICY pcge_update ON public.package_caregiver_engagements
  FOR UPDATE TO public USING (
    is_admin()
    OR caregiver_user_id = (SELECT auth.uid())
    OR agency_user_id = (SELECT auth.uid())
  )
  WITH CHECK (
    is_admin()
    OR caregiver_user_id = (SELECT auth.uid())
    OR agency_user_id = (SELECT auth.uid())
  );

CREATE POLICY pcgee_select ON public.package_caregiver_engagement_events
  FOR SELECT TO public USING (
    EXISTS (
      SELECT 1 FROM public.package_caregiver_engagements e
      WHERE e.id = engagement_id
        AND (
          is_admin()
          OR e.caregiver_user_id = (SELECT auth.uid())
          OR e.agency_user_id = (SELECT auth.uid())
        )
    )
    OR is_mod_or_admin()
  );

CREATE POLICY pcgee_insert ON public.package_caregiver_engagement_events
  FOR INSERT TO public WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.package_caregiver_engagements e
      WHERE e.id = engagement_id
        AND (
          is_admin()
          OR e.caregiver_user_id = (SELECT auth.uid())
          OR e.agency_user_id = (SELECT auth.uid())
        )
    )
    AND author_user_id = (SELECT auth.uid())
  );

COMMENT ON TABLE public.package_client_engagements IS
  'Guardian/patient interest and negotiation with agency on a published care package (offer).';
COMMENT ON TABLE public.package_caregiver_engagements IS
  'Caregiver application and negotiation with agency on a published care package (offer).';
