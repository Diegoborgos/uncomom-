-- RLS policies for saved_cities table
-- Run this in Supabase SQL Editor

ALTER TABLE saved_cities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own saved cities"
  ON saved_cities FOR SELECT
  USING (family_id IN (
    SELECT id FROM families WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own saved cities"
  ON saved_cities FOR INSERT
  WITH CHECK (family_id IN (
    SELECT id FROM families WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own saved cities"
  ON saved_cities FOR DELETE
  USING (family_id IN (
    SELECT id FROM families WHERE user_id = auth.uid()
  ));
