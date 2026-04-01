-- Uncomun Four Systems Migration
-- Run this in Supabase SQL Editor

BEGIN;

-- ============================================================
-- EXTEND families table with AI intelligence fields
-- ============================================================
ALTER TABLE public.families
  ADD COLUMN IF NOT EXISTS primary_anxiety text,
  ADD COLUMN IF NOT EXISTS secondary_anxiety text,
  ADD COLUMN IF NOT EXISTS real_budget_min integer,
  ADD COLUMN IF NOT EXISTS real_budget_max integer,
  ADD COLUMN IF NOT EXISTS passport_tier text CHECK (passport_tier IN ('strong', 'medium', 'limited')),
  ADD COLUMN IF NOT EXISTS next_destination_candidates text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS departure_horizon text,
  ADD COLUMN IF NOT EXISTS decision_stage text,
  ADD COLUMN IF NOT EXISTS top_priorities text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS deal_breakers text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS ai_profile_summary text,
  ADD COLUMN IF NOT EXISTS ai_conversation_turns integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ai_last_extracted timestamptz,
  ADD COLUMN IF NOT EXISTS chat_history jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS companion_last_checkin timestamptz,
  ADD COLUMN IF NOT EXISTS companion_next_question text,
  ADD COLUMN IF NOT EXISTS open_to_introductions boolean DEFAULT true;

-- ============================================================
-- FAMILY TRAJECTORIES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.family_trajectories (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id uuid REFERENCES public.families(id) ON DELETE CASCADE,
  kids_ages_at_move integer[],
  budget_tier text,
  passport_tier text,
  education_approach text,
  primary_anxiety text,
  travel_style text,
  city_sequence text[],
  durations_months integer[],
  first_city text,
  second_city text,
  third_city text,
  still_traveling boolean DEFAULT true,
  stopped_reason text,
  would_do_again boolean,
  biggest_surprise text,
  advice_for_families_like_us text,
  profile_hash text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trajectories_first_city ON public.family_trajectories(first_city);
CREATE INDEX IF NOT EXISTS idx_trajectories_second_city ON public.family_trajectories(second_city);
CREATE INDEX IF NOT EXISTS idx_trajectories_passport ON public.family_trajectories(passport_tier);
CREATE INDEX IF NOT EXISTS idx_trajectories_anxiety ON public.family_trajectories(primary_anxiety);

ALTER TABLE public.family_trajectories ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Trajectories are publicly readable" ON public.family_trajectories FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Families can insert their own trajectory" ON public.family_trajectories
  FOR INSERT WITH CHECK (family_id IN (SELECT id FROM public.families WHERE user_id = auth.uid()));
CREATE POLICY IF NOT EXISTS "Families can update their own trajectory" ON public.family_trajectories
  FOR UPDATE USING (family_id IN (SELECT id FROM public.families WHERE user_id = auth.uid()));

-- ============================================================
-- FAMILY MATCHES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.family_matches (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  family_a_id uuid REFERENCES public.families(id) ON DELETE CASCADE,
  family_b_id uuid REFERENCES public.families(id) ON DELETE CASCADE,
  match_reason text NOT NULL,
  match_score integer,
  match_type text,
  shared_context text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted_a', 'accepted_b', 'connected', 'declined')),
  connected_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_matches_family_a ON public.family_matches(family_a_id);
CREATE INDEX IF NOT EXISTS idx_matches_family_b ON public.family_matches(family_b_id);
CREATE INDEX IF NOT EXISTS idx_matches_status ON public.family_matches(status);

ALTER TABLE public.family_matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Families can see their own matches"
  ON public.family_matches FOR SELECT USING (
    family_a_id IN (SELECT id FROM public.families WHERE user_id = auth.uid()) OR
    family_b_id IN (SELECT id FROM public.families WHERE user_id = auth.uid())
  );

-- ============================================================
-- COLLECTIVE INTELLIGENCE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.collective_intelligence (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  computed_at timestamptz DEFAULT now(),
  top_anxieties jsonb DEFAULT '[]',
  median_budget_eur integer,
  budget_p25_eur integer,
  budget_p75_eur integer,
  trending_cities jsonb DEFAULT '[]',
  stage_distribution jsonb DEFAULT '{}',
  passport_distribution jsonb DEFAULT '{}',
  top_priorities jsonb DEFAULT '[]',
  top_deal_breakers jsonb DEFAULT '[]',
  city_family_counts jsonb DEFAULT '{}'
);

ALTER TABLE public.collective_intelligence ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Collective intelligence is public" ON public.collective_intelligence FOR SELECT USING (true);

-- ============================================================
-- CITY COLLECTIVE SIGNALS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.city_collective_signals (
  city_slug text PRIMARY KEY,
  top_anxiety_for_this_city text,
  median_budget_families_here integer,
  common_school_approach text,
  avg_kids_age_here numeric,
  pct_solo_parents integer,
  pct_passport_limited integer,
  families_currently_planning integer,
  families_been_here_total integer,
  most_common_next_city text,
  most_common_prev_city text,
  avg_stay_months numeric,
  pct_would_return integer,
  trending_up boolean DEFAULT false,
  computed_at timestamptz DEFAULT now()
);

ALTER TABLE public.city_collective_signals ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "City signals are public" ON public.city_collective_signals FOR SELECT USING (true);

-- ============================================================
-- COMPANION CHECKINS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.companion_checkins (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id uuid REFERENCES public.families(id) ON DELETE CASCADE,
  trigger_type text NOT NULL,
  question_asked text,
  answer_given text,
  intelligence_extracted jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.companion_checkins ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Families can read their checkins"
  ON public.companion_checkins FOR SELECT USING (
    family_id IN (SELECT id FROM public.families WHERE user_id = auth.uid())
  );

-- Trigger: when family logs a trip, queue companion checkin
CREATE OR REPLACE FUNCTION queue_companion_checkin()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.families
  SET companion_next_question = 'trip_logged',
      updated_at = now()
  WHERE id = NEW.family_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_trip_logged ON public.trips;
CREATE TRIGGER on_trip_logged
  AFTER INSERT ON public.trips
  FOR EACH ROW EXECUTE FUNCTION queue_companion_checkin();

COMMIT;
