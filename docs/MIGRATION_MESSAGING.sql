-- ==========================================
-- MESSAGING SCHEMA MIGRATION v1.1
-- ==========================================
-- Run this migration to add real-time messaging support
-- SAFE FOR RE-RUNS: Uses DROP IF EXISTS where needed

-- ==========================================
-- PART 1: TABLES (Run first)
-- ==========================================
DROP VIEW IF EXISTS conversation_unread_counts;
DROP TRIGGER IF EXISTS on_new_message ON public.messages;
DROP TABLE IF EXISTS public.messages;
DROP TABLE IF EXISTS public.conversations;

-- 1. Conversations Table
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participant_a UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    participant_b UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(participant_a, participant_b)
);

-- 2. Messages Table
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    message_type TEXT DEFAULT 'TEXT',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_participants ON public.conversations(participant_a, participant_b);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON public.conversations(last_message_at DESC);

-- ==========================================
-- PART 2: RLS POLICIES (Run second)
-- ==========================================

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running
DROP POLICY IF EXISTS "Users can view their conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can create conversations they are part of" ON public.conversations;
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages to their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can update read status of messages sent to them" ON public.messages;

-- Conversations policies
CREATE POLICY "Users can view their conversations"
    ON public.conversations FOR SELECT
    USING (auth.uid() = participant_a OR auth.uid() = participant_b);

CREATE POLICY "Users can create conversations they are part of"
    ON public.conversations FOR INSERT
    WITH CHECK (auth.uid() = participant_a OR auth.uid() = participant_b);

-- Messages policies
CREATE POLICY "Users can view messages in their conversations"
    ON public.messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.conversations c
            WHERE c.id = conversation_id
            AND (auth.uid() = c.participant_a OR auth.uid() = c.participant_b)
        )
    );

CREATE POLICY "Users can send messages to their conversations"
    ON public.messages FOR INSERT
    WITH CHECK (
        auth.uid() = sender_id AND
        EXISTS (
            SELECT 1 FROM public.conversations c
            WHERE c.id = conversation_id
            AND (auth.uid() = c.participant_a OR auth.uid() = c.participant_b)
        )
    );

CREATE POLICY "Users can update read status of messages sent to them"
    ON public.messages FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.conversations c
            WHERE c.id = conversation_id
            AND (auth.uid() = c.participant_a OR auth.uid() = c.participant_b)
        )
    );

-- ==========================================
-- PART 3: REALTIME & TRIGGERS (Run third)
-- ==========================================

-- Enable Realtime (may error if already added, that's OK)
DO $$ 
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
EXCEPTION WHEN duplicate_object THEN
    NULL; -- Already exists, ignore
END $$;

-- Trigger function
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.conversations
    SET last_message_at = NEW.created_at
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS on_new_message ON public.messages;
CREATE TRIGGER on_new_message
    AFTER INSERT ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_last_message();

-- ==========================================
-- PART 4: VIEWS (Run last)
-- ==========================================

-- Drop and recreate view
DROP VIEW IF EXISTS conversation_unread_counts;
CREATE VIEW conversation_unread_counts AS
SELECT 
    c.id as conversation_id,
    c.participant_a,
    c.participant_b,
    COUNT(CASE WHEN m.is_read = FALSE AND m.sender_id != c.participant_a THEN 1 END) as unread_for_a,
    COUNT(CASE WHEN m.is_read = FALSE AND m.sender_id != c.participant_b THEN 1 END) as unread_for_b
FROM public.conversations c
LEFT JOIN public.messages m ON m.conversation_id = c.id
GROUP BY c.id, c.participant_a, c.participant_b;


