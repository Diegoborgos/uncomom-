-- Add google_reviews column to city_schools
ALTER TABLE public.city_schools
  ADD COLUMN IF NOT EXISTS google_reviews jsonb DEFAULT '[]';
