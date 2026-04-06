CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'arrival', 'follow', 'nearby', 'city_update', 'briefing', 'system'
  title TEXT NOT NULL,
  body TEXT,
  icon_url TEXT, -- avatar URL or city photo
  action_url TEXT, -- where tapping goes
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb -- dedup key, source IDs, etc.
);

CREATE INDEX IF NOT EXISTS idx_notifications_family ON notifications(family_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(family_id, read) WHERE read = false;

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own notifications"
  ON notifications FOR SELECT
  USING (family_id IN (SELECT id FROM families WHERE user_id = auth.uid()));

CREATE POLICY "Users update own notifications"
  ON notifications FOR UPDATE
  USING (family_id IN (SELECT id FROM families WHERE user_id = auth.uid()));
