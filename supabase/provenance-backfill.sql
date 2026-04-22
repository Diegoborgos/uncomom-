-- ============================================================
-- PROVENANCE BACKFILL — Run in Supabase SQL Editor
-- ============================================================
-- Extends city_data_sources.source_type to include 'seed_estimate',
-- 'admin_manual', and 'paid_api_ready', migrates existing 'manual' /
-- 'estimated' rows to the new names, then ensures every scalar signal in
-- cities.signals JSONB has a provenance row.
--
-- After this runs, every number shown to users on a city page has a
-- corresponding row in city_data_sources explaining where it came from.

BEGIN;

-- ------------------------------------------------------------
-- 1. Extend source_type CHECK constraint
-- ------------------------------------------------------------
ALTER TABLE public.city_data_sources
  DROP CONSTRAINT IF EXISTS city_data_sources_source_type_check;

ALTER TABLE public.city_data_sources
  ADD CONSTRAINT city_data_sources_source_type_check
  CHECK (source_type IN (
    'public_api',
    'field_report',
    'admin_manual',
    'seed_estimate',
    'paid_api_ready',
    -- keep legacy values allowed so migration is safe to run twice
    'manual',
    'estimated'
  ));

-- ------------------------------------------------------------
-- 2. Migrate legacy values to the new names
-- ------------------------------------------------------------
UPDATE public.city_data_sources
SET source_type = 'admin_manual'
WHERE source_type = 'manual';

UPDATE public.city_data_sources
SET source_type = 'seed_estimate'
WHERE source_type = 'estimated';

-- ------------------------------------------------------------
-- 3. Narrow the CHECK now that legacy rows are migrated
-- ------------------------------------------------------------
ALTER TABLE public.city_data_sources
  DROP CONSTRAINT IF EXISTS city_data_sources_source_type_check;

ALTER TABLE public.city_data_sources
  ADD CONSTRAINT city_data_sources_source_type_check
  CHECK (source_type IN (
    'public_api',
    'field_report',
    'admin_manual',
    'seed_estimate',
    'paid_api_ready'
  ));

-- ------------------------------------------------------------
-- 4. Backfill seed_estimate rows for every (section.field) in
--    cities.signals that doesn't already have a provenance row.
-- ------------------------------------------------------------
-- Signals that should be marked paid_api_ready instead of seed_estimate
-- so the admin panel can surface "Turn on Numbeo / Google Places"
-- activation opportunities clearly.
WITH paid_api_signals AS (
  SELECT unnest(ARRAY[
    -- Numbeo territory (cost of living)
    'familyCost.groceryIndex',
    'familyCost.rent2br',
    'familyCost.transportCost',
    'familyCost.restaurantIndex',
    'familyCost.utilitiesMonthly',
    -- Google Places territory (schools + POI verification)
    'educationAccess.schoolQuality',
    'educationAccess.ibAvailable',
    'educationAccess.internationalSchoolAvgFee',
    'familyCost.internationalSchoolFee',
    'familyCost.localSchoolFee',
    'familyCost.childcareMonthly'
  ]) AS signal_key
),
leaves AS (
  SELECT
    c.slug AS city_slug,
    section.key || '.' || field.key AS signal_key,
    field.value AS signal_value_jsonb
  FROM public.cities c
  CROSS JOIN LATERAL jsonb_each(COALESCE(c.signals, '{}'::jsonb)) AS section(key, value)
  CROSS JOIN LATERAL jsonb_each(
    CASE WHEN jsonb_typeof(section.value) = 'object' THEN section.value
         ELSE '{}'::jsonb END
  ) AS field(key, value)
  WHERE jsonb_typeof(field.value) IN ('number', 'string', 'boolean')
)
INSERT INTO public.city_data_sources (
  city_slug,
  signal_key,
  signal_value,
  source_name,
  source_type,
  source_url,
  fetched_at,
  confidence,
  notes
)
SELECT
  l.city_slug,
  l.signal_key,
  CASE
    WHEN jsonb_typeof(l.signal_value_jsonb) = 'string'
      THEN trim(both '"' FROM l.signal_value_jsonb::text)
    ELSE l.signal_value_jsonb::text
  END,
  CASE
    WHEN l.signal_key IN (SELECT signal_key FROM paid_api_signals)
      THEN 'Activate paid API to upgrade'
    ELSE 'Uncomun seed data'
  END AS source_name,
  CASE
    WHEN l.signal_key IN (SELECT signal_key FROM paid_api_signals)
      THEN 'paid_api_ready'
    ELSE 'seed_estimate'
  END AS source_type,
  NULL AS source_url,
  now() AS fetched_at,
  CASE
    WHEN l.signal_key IN (SELECT signal_key FROM paid_api_signals) THEN 35
    ELSE 40
  END AS confidence,
  CASE
    WHEN l.signal_key IN (SELECT signal_key FROM paid_api_signals)
      THEN 'Seeded value. Upgrades to live data when the matching paid API is activated.'
    ELSE 'Seeded value. No live source configured yet.'
  END AS notes
FROM leaves l
WHERE NOT EXISTS (
  SELECT 1 FROM public.city_data_sources s
  WHERE s.city_slug = l.city_slug AND s.signal_key = l.signal_key
)
ON CONFLICT (city_slug, signal_key) DO NOTHING;

-- ------------------------------------------------------------
-- 5. Mark admin-editable community signals explicitly as admin_manual
--    (they may have slipped in as seed_estimate in step 4)
-- ------------------------------------------------------------
UPDATE public.city_data_sources
SET
  source_type = 'admin_manual',
  source_name = 'Uncomun admin',
  notes = 'Manually entered by Uncomun team. Pending automation from trips table.'
WHERE signal_key IN (
  'community.uncomonFamiliesNow',
  'community.uncomonFamiliesBeen',
  'community.uncomonReturnRate'
);

COMMIT;

-- ------------------------------------------------------------
-- Follow-up: also run supabase/zero-fake-metrics.sql once to zero
-- seeded school.rating / family_reviews values.
-- ------------------------------------------------------------

-- ------------------------------------------------------------
-- Verify: run this after the migration to see coverage
-- ------------------------------------------------------------
-- SELECT source_type, COUNT(*) FROM public.city_data_sources GROUP BY source_type ORDER BY 2 DESC;
