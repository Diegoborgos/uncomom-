-- Messaging system: conversations + messages
BEGIN;

-- Conversations between two families
CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  family_a_id uuid REFERENCES public.families(id) ON DELETE CASCADE NOT NULL,
  family_b_id uuid REFERENCES public.families(id) ON DELETE CASCADE NOT NULL,
  last_message_text text,
  last_message_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(family_a_id, family_b_id)
);

CREATE INDEX IF NOT EXISTS idx_conversations_family_a ON public.conversations(family_a_id);
CREATE INDEX IF NOT EXISTS idx_conversations_family_b ON public.conversations(family_b_id);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Participants can view conversations" ON public.conversations;
CREATE POLICY "Participants can view conversations" ON public.conversations FOR SELECT USING (
  family_a_id IN (SELECT id FROM public.families WHERE user_id = auth.uid()) OR
  family_b_id IN (SELECT id FROM public.families WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Participants can insert conversations" ON public.conversations;
CREATE POLICY "Participants can insert conversations" ON public.conversations FOR INSERT WITH CHECK (
  family_a_id IN (SELECT id FROM public.families WHERE user_id = auth.uid()) OR
  family_b_id IN (SELECT id FROM public.families WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Participants can update conversations" ON public.conversations;
CREATE POLICY "Participants can update conversations" ON public.conversations FOR UPDATE USING (
  family_a_id IN (SELECT id FROM public.families WHERE user_id = auth.uid()) OR
  family_b_id IN (SELECT id FROM public.families WHERE user_id = auth.uid())
);

-- Messages within conversations
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES public.families(id) ON DELETE CASCADE NOT NULL,
  text text NOT NULL,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON public.messages(conversation_id) WHERE read_at IS NULL;

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Participants can view messages" ON public.messages;
CREATE POLICY "Participants can view messages" ON public.messages FOR SELECT USING (
  conversation_id IN (
    SELECT id FROM public.conversations WHERE
      family_a_id IN (SELECT id FROM public.families WHERE user_id = auth.uid()) OR
      family_b_id IN (SELECT id FROM public.families WHERE user_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Participants can send messages" ON public.messages;
CREATE POLICY "Participants can send messages" ON public.messages FOR INSERT WITH CHECK (
  sender_id IN (SELECT id FROM public.families WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Recipients can mark read" ON public.messages;
CREATE POLICY "Recipients can mark read" ON public.messages FOR UPDATE USING (
  conversation_id IN (
    SELECT id FROM public.conversations WHERE
      family_a_id IN (SELECT id FROM public.families WHERE user_id = auth.uid()) OR
      family_b_id IN (SELECT id FROM public.families WHERE user_id = auth.uid())
  )
);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

COMMIT;
