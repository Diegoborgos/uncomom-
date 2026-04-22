-- ============================================================
-- SECURITY HARDENING — Run in Supabase SQL Editor
-- ============================================================
-- Addresses the 3 Security Advisor ERRORS (RLS disabled on public tables)
-- and 2 WARNINGS (mutable function search_path). Leaked-password protection
-- is a dashboard toggle (Auth → Providers → Email), not SQL.
--
-- The three tables each get a policy appropriate to their data:
--   city_intelligence     — city-level public content (public SELECT)
--   classified_articles   — public news intelligence  (public SELECT)
--   family_briefings      — per-family private content (owner-only SELECT)
--
-- Writes continue to go through the service_role key on the server,
-- which bypasses RLS — so no write policies are needed.

-- ------------------------------------------------------------
-- 1. RLS on city_intelligence (public city data)
-- ------------------------------------------------------------
ALTER TABLE public.city_intelligence ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "city_intelligence readable" ON public.city_intelligence;
CREATE POLICY "city_intelligence readable"
  ON public.city_intelligence FOR SELECT USING (true);

-- ------------------------------------------------------------
-- 2. RLS on classified_articles (public news classification)
-- ------------------------------------------------------------
ALTER TABLE public.classified_articles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "classified_articles readable" ON public.classified_articles;
CREATE POLICY "classified_articles readable"
  ON public.classified_articles FOR SELECT USING (true);

-- ------------------------------------------------------------
-- 3. RLS on family_briefings (per-family private content)
-- ------------------------------------------------------------
ALTER TABLE public.family_briefings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "family_briefings owner read" ON public.family_briefings;
CREATE POLICY "family_briefings owner read"
  ON public.family_briefings FOR SELECT USING (
    family_id IN (
      SELECT id FROM public.families WHERE user_id = auth.uid()
    )
  );

-- Allow a family to mark its own briefing as read (only the read_at column
-- needs updating from the client; other writes happen via service_role).
DROP POLICY IF EXISTS "family_briefings owner update" ON public.family_briefings;
CREATE POLICY "family_briefings owner update"
  ON public.family_briefings FOR UPDATE USING (
    family_id IN (
      SELECT id FROM public.families WHERE user_id = auth.uid()
    )
  );

-- ------------------------------------------------------------
-- 4. Pin search_path on trigger functions
-- ------------------------------------------------------------
-- Without an explicit search_path, a session-level search_path change could
-- redirect unqualified references (like "cities" or "families") to an
-- attacker-controlled schema. Pinning to public + pg_temp closes that.

CREATE OR REPLACE FUNCTION public.mark_city_signals_stale()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.cities
  SET
    signals_stale = true,
    pending_report_count = pending_report_count + 1,
    updated_at = now()
  WHERE slug = NEW.city_slug;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.queue_companion_checkin()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.families
  SET companion_next_question = 'trip_logged',
      updated_at = now()
  WHERE id = NEW.family_id;
  RETURN NEW;
END;
$$;
