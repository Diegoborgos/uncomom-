-- Passport visa requirements table
-- Stores visa-free days / visa requirement for every passport→destination pair
-- Source: https://github.com/ilyankou/passport-index-dataset (MIT license)

CREATE TABLE IF NOT EXISTS public.passport_visa_requirements (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  passport_country text NOT NULL,
  destination_country text NOT NULL,
  requirement text NOT NULL,  -- 'visa free', 'visa required', 'e-visa', 'visa on arrival', 'ETA', or number of days
  days_allowed integer,       -- parsed number of days if applicable
  updated_at timestamptz DEFAULT now(),
  UNIQUE(passport_country, destination_country)
);

CREATE INDEX IF NOT EXISTS idx_passport_visa_passport ON public.passport_visa_requirements(passport_country);
CREATE INDEX IF NOT EXISTS idx_passport_visa_destination ON public.passport_visa_requirements(destination_country);

ALTER TABLE public.passport_visa_requirements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Passport visa data is publicly readable"
  ON public.passport_visa_requirements FOR SELECT USING (true);
