-- Gamification schema for Uncomun Points (UP) system
-- Run manually in Supabase SQL Editor

-- Points ledger — every point award is logged
CREATE TABLE IF NOT EXISTS family_points (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  action TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_family_points_family ON family_points(family_id, created_at DESC);

-- Badges earned — collectible achievements
CREATE TABLE IF NOT EXISTS family_badges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  badge_key TEXT NOT NULL,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(family_id, badge_key)
);
CREATE INDEX IF NOT EXISTS idx_family_badges_family ON family_badges(family_id);

-- Streaks — weekly contribution tracking
CREATE TABLE IF NOT EXISTS family_streaks (
  family_id UUID PRIMARY KEY REFERENCES families(id) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_week TEXT,
  streak_freezes_remaining INTEGER DEFAULT 1
);

-- Weekly quests — 3 tasks per family per week
CREATE TABLE IF NOT EXISTS family_quests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  week TEXT NOT NULL,
  quests JSONB NOT NULL DEFAULT '[]',
  up_earned INTEGER DEFAULT 0,
  UNIQUE(family_id, week)
);

-- Add level + points columns to families table
ALTER TABLE families ADD COLUMN IF NOT EXISTS total_points INTEGER DEFAULT 0;
ALTER TABLE families ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;

-- RLS policies
ALTER TABLE family_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_quests ENABLE ROW LEVEL SECURITY;

-- Points and badges are publicly readable (visible on profiles)
CREATE POLICY "Points are public" ON family_points FOR SELECT USING (true);
CREATE POLICY "Badges are public" ON family_badges FOR SELECT USING (true);

-- Streaks and quests are private
CREATE POLICY "Users read own streaks" ON family_streaks FOR SELECT
  USING (family_id IN (SELECT id FROM families WHERE user_id = auth.uid()));
CREATE POLICY "Users read own quests" ON family_quests FOR SELECT
  USING (family_id IN (SELECT id FROM families WHERE user_id = auth.uid()));
