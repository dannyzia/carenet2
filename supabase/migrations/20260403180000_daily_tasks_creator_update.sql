-- Allow task creators (e.g. patients) to complete/update their own daily_tasks rows.
DROP POLICY IF EXISTS "dt_update" ON public.daily_tasks;
CREATE POLICY "dt_update" ON public.daily_tasks AS PERMISSIVE FOR UPDATE TO public
  USING (
    caregiver_id = (SELECT auth.uid())
    OR guardian_id = (SELECT auth.uid())
    OR agency_id = (SELECT auth.uid())
    OR created_by = (SELECT auth.uid())
    OR is_admin()
  );
