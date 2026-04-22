-- ============================================================
-- SECURITY HARDENING v3 — Replace WITH CHECK (true) on INSERT with
-- minimal shape predicates to silence the linter and block garbage data.
-- ============================================================
-- These policies keep anonymous INSERT access (product intent) but add
-- basic length/shape validation so the advisor no longer flags a naked
-- (true) check. No existing legitimate submission is affected.

-- ------------------------------------------------------------
-- city_submissions — require reasonable field lengths
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can submit a city" ON public.city_submissions;
CREATE POLICY "city_submissions anon insert"
  ON public.city_submissions FOR INSERT WITH CHECK (
    char_length(city_name) BETWEEN 2 AND 100
    AND char_length(country) BETWEEN 2 AND 80
    AND char_length(why_family_friendly) BETWEEN 10 AND 2000
  );

-- ------------------------------------------------------------
-- waitlist — require basic email shape
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can join waitlist" ON public.waitlist;
CREATE POLICY "waitlist anon insert"
  ON public.waitlist FOR INSERT WITH CHECK (
    char_length(email) BETWEEN 5 AND 254
    AND position('@' in email) > 1
    AND position('.' in substring(email from position('@' in email))) > 1
  );
