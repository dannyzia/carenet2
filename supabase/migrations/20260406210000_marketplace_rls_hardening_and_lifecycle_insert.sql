-- Marketplace RLS hardening + lifecycle on INSERT (priorities 1 & 3)
-- Idempotent drops for policies that may exist under multiple historical names.

-- ═══════════════════════════════════════════════════════════════════════════
-- 1) Lifecycle: reject invalid *initial* status on INSERT (draft → active, etc.)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.enforce_care_contract_lifecycle()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF current_setting('app.bypass_lifecycle', true) = 'true' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.status IS NULL OR NEW.status NOT IN ('draft', 'published') THEN
      RAISE EXCEPTION 'Invalid initial care_contract status: % (allowed: draft, published)', NEW.status
        USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF OLD.status IS NOT DISTINCT FROM NEW.status THEN
      RETURN NEW;
    END IF;
    IF NOT public.care_contract_valid_transition(OLD.status, NEW.status) THEN
      RAISE EXCEPTION 'Invalid care_contract status transition: % → %', OLD.status, NEW.status
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_care_contracts_lifecycle ON public.care_contracts;
CREATE TRIGGER trg_care_contracts_lifecycle
  BEFORE INSERT OR UPDATE OF status ON public.care_contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_care_contract_lifecycle();

COMMENT ON FUNCTION public.enforce_care_contract_lifecycle() IS
  'INSERT: only draft|published. UPDATE status: care_contract_valid_transition. SET app.bypass_lifecycle=true to skip.';

-- ═══════════════════════════════════════════════════════════════════════════
-- 2) care_contracts — consolidated RLS (guardian: own requests; agency: own offers;
--    everyone: published request listings + published agency packages)
-- ═══════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Care contracts public read published" ON public.care_contracts;
DROP POLICY IF EXISTS "Owners manage own contracts" ON public.care_contracts;
DROP POLICY IF EXISTS "cc_manage" ON public.care_contracts;
DROP POLICY IF EXISTS "cc_select" ON public.care_contracts;
DROP POLICY IF EXISTS "cc_select_marketplace" ON public.care_contracts;
DROP POLICY IF EXISTS "cc_insert_own" ON public.care_contracts;
DROP POLICY IF EXISTS "cc_update_own" ON public.care_contracts;
DROP POLICY IF EXISTS "cc_delete_own" ON public.care_contracts;

CREATE POLICY "cc_select_marketplace" ON public.care_contracts
  AS PERMISSIVE FOR SELECT TO public
  USING (
    is_admin()
    OR owner_id = (SELECT auth.uid())
    OR agency_id = (SELECT auth.uid())
    OR (type = 'request' AND status = ANY (ARRAY['published'::text, 'bidding'::text, 'matched'::text]))
    OR (type = 'offer' AND status = 'published')
  );

CREATE POLICY "cc_insert_own" ON public.care_contracts
  AS PERMISSIVE FOR INSERT TO public
  WITH CHECK (
    is_admin()
    OR (
      owner_id = (SELECT auth.uid())
      AND (
        type = 'request'
        OR (type = 'offer' AND agency_id IS NOT DISTINCT FROM (SELECT auth.uid()))
      )
    )
  );

CREATE POLICY "cc_update_own" ON public.care_contracts
  AS PERMISSIVE FOR UPDATE TO public
  USING (
    is_admin()
    OR owner_id = (SELECT auth.uid())
    OR agency_id = (SELECT auth.uid())
  )
  WITH CHECK (
    is_admin()
    OR owner_id = (SELECT auth.uid())
    OR agency_id = (SELECT auth.uid())
  );

CREATE POLICY "cc_delete_own" ON public.care_contracts
  AS PERMISSIVE FOR DELETE TO public
  USING (
    is_admin()
    OR owner_id = (SELECT auth.uid())
    OR agency_id = (SELECT auth.uid())
  );

-- ═══════════════════════════════════════════════════════════════════════════
-- 3) care_contract_bids — single set; INSERT only on open requests; WITH CHECK on UPDATE
-- ═══════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Agencies create bids" ON public.care_contract_bids;
DROP POLICY IF EXISTS "Bid parties read" ON public.care_contract_bids;
DROP POLICY IF EXISTS "ccb_insert" ON public.care_contract_bids;
DROP POLICY IF EXISTS "ccb_select" ON public.care_contract_bids;
DROP POLICY IF EXISTS "ccb_update" ON public.care_contract_bids;
DROP POLICY IF EXISTS "ccb_delete" ON public.care_contract_bids;

CREATE POLICY "ccb_select" ON public.care_contract_bids
  AS PERMISSIVE FOR SELECT TO public
  USING (
    is_admin()
    OR agency_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.care_contracts cc
      WHERE cc.id = care_contract_bids.contract_id AND cc.owner_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "ccb_insert" ON public.care_contract_bids
  AS PERMISSIVE FOR INSERT TO public
  WITH CHECK (
    agency_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.care_contracts cc
      WHERE cc.id = care_contract_bids.contract_id
        AND cc.type = 'request'
        AND cc.status = ANY (ARRAY['published'::text, 'bidding'::text, 'matched'::text])
    )
  );

CREATE POLICY "ccb_update" ON public.care_contract_bids
  AS PERMISSIVE FOR UPDATE TO public
  USING (
    is_admin()
    OR agency_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.care_contracts cc
      WHERE cc.id = care_contract_bids.contract_id AND cc.owner_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    is_admin()
    OR agency_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.care_contracts cc
      WHERE cc.id = care_contract_bids.contract_id AND cc.owner_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "ccb_delete" ON public.care_contract_bids
  AS PERMISSIVE FOR DELETE TO public
  USING (
    is_admin()
    OR agency_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.care_contracts cc
      WHERE cc.id = care_contract_bids.contract_id AND cc.owner_id = (SELECT auth.uid())
    )
  );
