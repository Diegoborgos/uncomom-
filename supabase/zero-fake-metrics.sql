-- Zero out all fake platform metrics in the cities table
-- Run AFTER seed-signals.sql to ensure no stale family counts remain

BEGIN;

UPDATE public.cities SET
  families_now = 0,
  families_been = 0,
  return_rate = 0,
  updated_at = now();

-- Also zero out schools ratings and review counts
UPDATE public.schools SET
  rating = 0,
  family_reviews = 0,
  updated_at = now();

COMMIT;

-- Verify
SELECT slug, families_now, families_been, return_rate FROM public.cities LIMIT 5;
