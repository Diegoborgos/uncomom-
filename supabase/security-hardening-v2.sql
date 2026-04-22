-- ============================================================
-- SECURITY HARDENING v2 — Tighten RLS on three append-only tables
-- Run in Supabase SQL Editor after security-hardening.sql
-- ============================================================
-- family_events, city_submissions, and waitlist all allow anonymous INSERT
-- by design. This migration:
--   1. Prevents family_events spoofing (inserter must own family_id, or
--      pass NULL for anon tracking).
--   2. Adds explicit restrictive UPDATE and DELETE policies so writes are
--      truly append-only from the API (service_role still bypasses).
-- Service-side code (using service_role key) is unaffected.

-- ------------------------------------------------------------
-- family_events — append-only + owner-bound INSERT
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can insert events" ON public.family_events;
CREATE POLICY "family_events insert own or anon"
  ON public.family_events FOR INSERT WITH CHECK (
    family_id IS NULL
    OR family_id IN (SELECT id FROM public.families WHERE user_id = auth.uid())
  );

-- (Existing SELECT policy "Families can read their own events" stays.)

DROP POLICY IF EXISTS "family_events no update" ON public.family_events;
CREATE POLICY "family_events no update"
  ON public.family_events FOR UPDATE USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "family_events no delete" ON public.family_events;
CREATE POLICY "family_events no delete"
  ON public.family_events FOR DELETE USING (false);

-- ------------------------------------------------------------
-- city_submissions — anonymous INSERT only, no reads/updates/deletes
-- ------------------------------------------------------------
-- (Existing INSERT policy "Anyone can submit a city" stays as-is; that's
-- the product intent. Existing SELECT policy already returns false.)

DROP POLICY IF EXISTS "city_submissions no update" ON public.city_submissions;
CREATE POLICY "city_submissions no update"
  ON public.city_submissions FOR UPDATE USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "city_submissions no delete" ON public.city_submissions;
CREATE POLICY "city_submissions no delete"
  ON public.city_submissions FOR DELETE USING (false);

-- ------------------------------------------------------------
-- waitlist — anonymous INSERT only, no reads/updates/deletes
-- ------------------------------------------------------------
-- (Existing INSERT policy "Anyone can join waitlist" stays.)

DROP POLICY IF EXISTS "waitlist no update" ON public.waitlist;
CREATE POLICY "waitlist no update"
  ON public.waitlist FOR UPDATE USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "waitlist no delete" ON public.waitlist;
CREATE POLICY "waitlist no delete"
  ON public.waitlist FOR DELETE USING (false);
