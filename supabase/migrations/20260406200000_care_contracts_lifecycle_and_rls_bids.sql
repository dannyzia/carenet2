-- Aligns DB status transitions with src/backend/domain/lifecycle/contractLifecycle.ts
-- + optional RLS hardening for care_contract_bids DELETE.

-- ─── 1) Allow operational anomaly statuses in CHECK (was 9 values) ───
ALTER TABLE public.care_contracts DROP CONSTRAINT IF EXISTS care_contracts_status_check;
ALTER TABLE public.care_contracts ADD CONSTRAINT care_contracts_status_check CHECK (
  status = ANY (ARRAY[
    'draft'::text, 'published'::text, 'matched'::text, 'bidding'::text, 'locked'::text,
    'booked'::text, 'active'::text, 'completed'::text, 'rated'::text, 'cancelled'::text,
    'no_show'::text, 'replacement_required'::text, 'escalated'::text, 'refunded'::text
  ])
);

-- ─── 2) Transition graph (mirror of TypeScript ALLOWED map) ───
CREATE OR REPLACE FUNCTION public.care_contract_valid_transition(p_from text, p_to text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT
    p_from IS NOT NULL
    AND p_to IS NOT NULL
    AND (
      CASE p_from
        WHEN 'draft' THEN p_to = ANY (ARRAY['published','cancelled'])
        WHEN 'published' THEN p_to = ANY (ARRAY['matched','bidding','cancelled'])
        WHEN 'matched' THEN p_to = ANY (ARRAY['bidding','cancelled'])
        WHEN 'bidding' THEN p_to = ANY (ARRAY['locked','cancelled'])
        WHEN 'locked' THEN p_to = ANY (ARRAY['booked','cancelled'])
        WHEN 'booked' THEN p_to = ANY (ARRAY['active','cancelled','no_show'])
        WHEN 'active' THEN p_to = ANY (ARRAY['completed','replacement_required','escalated','cancelled'])
        WHEN 'completed' THEN p_to = ANY (ARRAY['rated','refunded'])
        WHEN 'rated' THEN false
        WHEN 'cancelled' THEN false
        WHEN 'no_show' THEN p_to = ANY (ARRAY['replacement_required','escalated','cancelled','refunded'])
        WHEN 'replacement_required' THEN p_to = ANY (ARRAY['active','escalated','cancelled'])
        WHEN 'escalated' THEN p_to = ANY (ARRAY['active','cancelled','refunded'])
        WHEN 'refunded' THEN false
        ELSE false
      END
      -- Re-post to marketplace (marketplace.service.repostCareRequest)
      OR (
        p_to = 'published'
        AND p_from = ANY (ARRAY[
          'cancelled','locked','booked','active','completed','rated',
          'bidding','matched','no_show','replacement_required','escalated','refunded'
        ])
      )
    );
$$;

COMMENT ON FUNCTION public.care_contract_valid_transition(text, text) IS
  'Allowed care_contracts.status transitions; keep in sync with contractLifecycle.ts';

-- ─── 3) BEFORE UPDATE trigger ───
CREATE OR REPLACE FUNCTION public.enforce_care_contract_lifecycle()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP <> 'UPDATE' THEN
    RETURN NEW;
  END IF;
  -- Session flag for one-off maintenance / seed fixes (run: SET app.bypass_lifecycle = 'true';)
  IF current_setting('app.bypass_lifecycle', true) = 'true' THEN
    RETURN NEW;
  END IF;
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;
  IF NOT public.care_contract_valid_transition(OLD.status, NEW.status) THEN
    RAISE EXCEPTION 'Invalid care_contract status transition: % → %', OLD.status, NEW.status
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_care_contracts_lifecycle ON public.care_contracts;
CREATE TRIGGER trg_care_contracts_lifecycle
  BEFORE UPDATE OF status ON public.care_contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_care_contract_lifecycle();

-- ─── 4) RLS: allow DELETE on bids for agency (withdraw) or request owner ───
DROP POLICY IF EXISTS "ccb_delete" ON public.care_contract_bids;
CREATE POLICY "ccb_delete" ON public.care_contract_bids
  AS PERMISSIVE FOR DELETE TO public
  USING (
    agency_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.care_contracts cc
      WHERE cc.id = care_contract_bids.contract_id AND cc.owner_id = (SELECT auth.uid())
    )
    OR is_admin()
  );
