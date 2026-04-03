-- ============================================================
-- DATA PIPELINE PHASE 2 — Run in Supabase SQL Editor
-- ============================================================

-- 1a — CITY DATA SOURCES — Provenance for every signal
CREATE TABLE IF NOT EXISTS public.city_data_sources (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  city_slug text NOT NULL REFERENCES public.cities(slug) ON DELETE CASCADE,
  signal_key text NOT NULL,
  signal_value text NOT NULL,
  source_name text NOT NULL,
  source_url text,
  source_type text NOT NULL CHECK (source_type IN (
    'public_api', 'field_report', 'manual', 'estimated'
  )),
  fetched_at timestamptz NOT NULL DEFAULT now(),
  valid_until timestamptz,
  confidence integer DEFAULT 70 CHECK (confidence BETWEEN 0 AND 100),
  report_count integer DEFAULT 1,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_city_data_sources_city ON public.city_data_sources(city_slug);
CREATE UNIQUE INDEX IF NOT EXISTS idx_city_data_sources_signal ON public.city_data_sources(city_slug, signal_key);
CREATE INDEX IF NOT EXISTS idx_city_data_sources_stale ON public.city_data_sources(valid_until) WHERE valid_until IS NOT NULL;

ALTER TABLE public.city_data_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Data sources are publicly readable"
  ON public.city_data_sources FOR SELECT USING (true);

-- 1b — Add arrival curve columns to city_field_reports
ALTER TABLE public.city_field_reports
  ADD COLUMN IF NOT EXISTS days_to_housing integer,
  ADD COLUMN IF NOT EXISTS days_to_first_community integer,
  ADD COLUMN IF NOT EXISTS days_to_school_enrolled integer,
  ADD COLUMN IF NOT EXISTS days_to_operational integer,
  ADD COLUMN IF NOT EXISTS housing_search_difficulty text CHECK (housing_search_difficulty IN ('easy', 'moderate', 'hard', 'very_hard')),
  ADD COLUMN IF NOT EXISTS nif_required boolean,
  ADD COLUMN IF NOT EXISTS nif_days integer,
  ADD COLUMN IF NOT EXISTS bank_account_days integer,
  ADD COLUMN IF NOT EXISTS biggest_setup_blocker text,
  ADD COLUMN IF NOT EXISTS arrival_month integer CHECK (arrival_month BETWEEN 1 AND 12),
  ADD COLUMN IF NOT EXISTS passport_tier text CHECK (passport_tier IN ('strong', 'medium', 'limited')),
  ADD COLUMN IF NOT EXISTS visa_processing_days integer,
  ADD COLUMN IF NOT EXISTS visa_issues text,
  ADD COLUMN IF NOT EXISTS setup_narrative text;

-- 1c — Add signals_stale flag and last_aggregated to cities
ALTER TABLE public.cities
  ADD COLUMN IF NOT EXISTS signals_stale boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_aggregated timestamptz,
  ADD COLUMN IF NOT EXISTS field_report_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pending_report_count integer DEFAULT 0;

-- Trigger: mark city stale when a new field report is submitted
CREATE OR REPLACE FUNCTION mark_city_signals_stale()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.cities
  SET
    signals_stale = true,
    pending_report_count = pending_report_count + 1,
    updated_at = now()
  WHERE slug = NEW.city_slug;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_field_report_submitted ON public.city_field_reports;
CREATE TRIGGER on_field_report_submitted
  AFTER INSERT OR UPDATE ON public.city_field_reports
  FOR EACH ROW EXECUTE FUNCTION mark_city_signals_stale();

-- 1d — Backfill source records for existing data
INSERT INTO public.city_data_sources (city_slug, signal_key, signal_value, source_name, source_type, confidence, notes)
SELECT
  slug,
  'signals.all',
  'initial_seed',
  'manual',
  'manual',
  70,
  'Initial seed from data/cities.ts — manually researched March 2026'
FROM public.cities
WHERE signals IS NOT NULL
ON CONFLICT DO NOTHING;
