-- Spec-friendly name: same graph as care_contract_valid_transition / contractLifecycle.ts
CREATE OR REPLACE FUNCTION public.valid_transition(p_from text, p_to text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT public.care_contract_valid_transition(p_from, p_to);
$$;

COMMENT ON FUNCTION public.valid_transition(text, text) IS
  'Alias for care_contract_valid_transition; use in triggers and ad hoc checks.';

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
    IF NOT public.valid_transition(OLD.status, NEW.status) THEN
      RAISE EXCEPTION 'Invalid transition: % → %', OLD.status, NEW.status
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Recreate trigger to fire on both INSERT and UPDATE (was UPDATE-only).
DROP TRIGGER IF EXISTS trg_care_contracts_lifecycle ON public.care_contracts;
CREATE TRIGGER trg_care_contracts_lifecycle
  BEFORE INSERT OR UPDATE OF status ON public.care_contracts
  FOR EACH ROW
  EXECUTE FUNCTION enforce_care_contract_lifecycle();
