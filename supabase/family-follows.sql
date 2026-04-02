-- Family follows system
BEGIN;

CREATE TABLE IF NOT EXISTS public.family_follows (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id uuid REFERENCES public.families(id) ON DELETE CASCADE,
  following_id uuid REFERENCES public.families(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

CREATE INDEX IF NOT EXISTS idx_follows_follower ON public.family_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON public.family_follows(following_id);

ALTER TABLE public.family_follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Follows are public" ON public.family_follows;
CREATE POLICY "Follows are public" ON public.family_follows FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can follow" ON public.family_follows;
CREATE POLICY "Users can follow" ON public.family_follows FOR INSERT
  WITH CHECK (follower_id IN (SELECT id FROM public.families WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can unfollow" ON public.family_follows;
CREATE POLICY "Users can unfollow" ON public.family_follows FOR DELETE
  USING (follower_id IN (SELECT id FROM public.families WHERE user_id = auth.uid()));

COMMIT;
