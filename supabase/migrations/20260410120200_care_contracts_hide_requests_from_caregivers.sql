-- Caregivers must not list other users' published care requests (marketplace browse leakage).
-- Own requests still visible via owner_id = auth.uid() in cc_select_marketplace.

DROP POLICY IF EXISTS "cc_select_marketplace" ON public.care_contracts;

CREATE POLICY "cc_select_marketplace" ON public.care_contracts
  AS PERMISSIVE FOR SELECT TO public
  USING (
    is_admin()
    OR owner_id = (SELECT auth.uid())
    OR agency_id = (SELECT auth.uid())
    OR (
      type = 'request'
      AND status = ANY (ARRAY['published'::text, 'bidding'::text, 'matched'::text])
      AND EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = (SELECT auth.uid())
          AND p.role = ANY (ARRAY['agency'::text, 'admin'::text, 'moderator'::text])
      )
    )
    OR (type = 'offer' AND status = 'published')
  );
