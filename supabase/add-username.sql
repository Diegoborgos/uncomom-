-- Add username/slug field to families for short profile URLs
ALTER TABLE public.families
  ADD COLUMN IF NOT EXISTS username text UNIQUE;

-- Create index for username lookups
CREATE INDEX IF NOT EXISTS idx_families_username ON public.families(username);
