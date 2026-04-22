CREATE TABLE IF NOT EXISTS public.sos_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  note TEXT,
  client_lat DOUBLE PRECISION,
  client_lng DOUBLE PRECISION
);

CREATE INDEX IF NOT EXISTS idx_sos_events_user_created ON public.sos_events (user_id, created_at DESC);

ALTER TABLE public.sos_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sos_events_insert_own" ON public.sos_events;
CREATE POLICY "sos_events_insert_own" ON public.sos_events
  AS PERMISSIVE FOR INSERT TO public
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "sos_events_select_own" ON public.sos_events;
CREATE POLICY "sos_events_select_own" ON public.sos_events
  AS PERMISSIVE FOR SELECT TO public
  USING (user_id = (SELECT auth.uid()) OR is_admin());
