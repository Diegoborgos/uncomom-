-- ============================================================
-- CRON TELEMETRY — Run in Supabase SQL Editor
-- ============================================================
-- Adds two tables:
--   cron_state   — small key/value store for cursors (e.g., refresh batch position)
--   cron_run_log — one row per cron invocation; admin UI reads the latest rows
-- Both are publicly readable so the admin page (client-side Supabase) can display
-- them; writes go through the service role in cron routes.

CREATE TABLE IF NOT EXISTS public.cron_state (
  key        text PRIMARY KEY,
  value      jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.cron_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cron_state readable" ON public.cron_state;
CREATE POLICY "cron_state readable"
  ON public.cron_state FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.cron_run_log (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route            text NOT NULL,
  started_at       timestamptz NOT NULL DEFAULT now(),
  finished_at      timestamptz,
  duration_ms      integer,
  ok               boolean,
  batch_offset     text,
  cities_processed integer,
  signals_ok       integer,
  signals_err      integer,
  errors_by_city   jsonb,
  note             text
);

CREATE INDEX IF NOT EXISTS idx_cron_run_log_route_started
  ON public.cron_run_log (route, started_at DESC);

ALTER TABLE public.cron_run_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cron_run_log readable" ON public.cron_run_log;
CREATE POLICY "cron_run_log readable"
  ON public.cron_run_log FOR SELECT USING (true);
