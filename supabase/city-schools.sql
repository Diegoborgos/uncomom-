-- ============================================================
-- CITY SCHOOLS — Google Places school data cached per city
-- Extends basic Google data with school-specific fields for manual enrichment
-- ============================================================

CREATE TABLE IF NOT EXISTS public.city_schools (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  city_slug text NOT NULL,
  google_place_id text NOT NULL UNIQUE,
  name text NOT NULL,
  school_type text DEFAULT 'International',
  curriculum text DEFAULT '',
  age_range text DEFAULT '',
  monthly_fee integer,
  rating numeric,
  review_count integer DEFAULT 0,
  address text,
  phone text,
  website text,
  google_maps_url text,
  photo_urls text[] DEFAULT '{}',
  latitude numeric,
  longitude numeric,
  description text,
  languages text[] DEFAULT '{}',
  tags text[] DEFAULT '{}',
  manually_verified boolean DEFAULT false,
  cached_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_city_schools_slug ON public.city_schools(city_slug);
CREATE INDEX IF NOT EXISTS idx_city_schools_type ON public.city_schools(city_slug, school_type);

ALTER TABLE public.city_schools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "City schools are publicly readable"
  ON public.city_schools FOR SELECT USING (true);
