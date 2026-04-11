-- Block direct conversations between caregiver and guardian/patient (agency-mediated model).
-- DB cannot read Vite env; this is always enforced. Re-enable direct DM later via a new migration if product changes.

CREATE OR REPLACE FUNCTION public.conversation_pair_care_seeker_and_caregiver(
  p_a UUID,
  p_b UUID
) RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  ra TEXT;
  rb TEXT;
BEGIN
  SELECT role INTO ra FROM public.profiles WHERE id = p_a;
  SELECT role INTO rb FROM public.profiles WHERE id = p_b;
  IF ra IS NULL OR rb IS NULL THEN
    RETURN FALSE;
  END IF;
  IF ra IN ('admin', 'moderator') OR rb IN ('admin', 'moderator') THEN
    RETURN FALSE;
  END IF;
  RETURN (ra = 'caregiver' AND rb IN ('guardian', 'patient'))
    OR (rb = 'caregiver' AND ra IN ('guardian', 'patient'));
END;
$$;

CREATE OR REPLACE FUNCTION public.enforce_conversations_no_care_seeker_caregiver()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF public.conversation_pair_care_seeker_and_caregiver(NEW.participant_a, NEW.participant_b) THEN
    RAISE EXCEPTION 'Conversations between caregiver and guardian/patient are not allowed'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_conversations_block_cg_seeker ON public.conversations;
CREATE TRIGGER trg_conversations_block_cg_seeker
  BEFORE INSERT ON public.conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_conversations_no_care_seeker_caregiver();

-- Allow authenticated users to create conversations they participate in (trigger enforces pairing rules).
DROP POLICY IF EXISTS conv_insert ON public.conversations;
CREATE POLICY conv_insert ON public.conversations
  AS PERMISSIVE FOR INSERT TO public
  WITH CHECK (
    participant_a = (SELECT auth.uid()) OR participant_b = (SELECT auth.uid())
  );

COMMENT ON FUNCTION public.conversation_pair_care_seeker_and_caregiver IS
  'True when participants are caregiver+guardian/patient (excluding admin/moderator). Used to block DMs.';
