-- ============================================================
-- CITY PLACES — Google Places data cached per city
-- ============================================================

CREATE TABLE IF NOT EXISTS public.city_places (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  city_slug text NOT NULL,
  google_place_id text NOT NULL UNIQUE,
  name text NOT NULL,
  category text NOT NULL,
  description text,
  rating numeric,
  review_count integer DEFAULT 0,
  price_level integer,
  address text,
  phone text,
  website text,
  google_maps_url text,
  photo_urls text[] DEFAULT '{}',
  latitude numeric,
  longitude numeric,
  opening_hours text,
  family_friendly boolean DEFAULT true,
  tags text[] DEFAULT '{}',
  cached_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_city_places_slug ON public.city_places(city_slug);
CREATE INDEX IF NOT EXISTS idx_city_places_category ON public.city_places(city_slug, category);

ALTER TABLE public.city_places ENABLE ROW LEVEL SECURITY;

CREATE POLICY "City places are publicly readable"
  ON public.city_places FOR SELECT USING (true);
