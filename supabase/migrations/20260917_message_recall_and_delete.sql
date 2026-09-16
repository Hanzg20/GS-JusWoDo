-- Support WeChat-style message actions:
-- - Recall (撤回): sender-only, client enforces a 2-minute window; both
--   sides then see a placeholder instead of the original content.
-- - Delete (删除): hides a message from just the deleting party's own
--   view (matches WeChat's "delete for me only" semantics), so it's a
--   per-user array rather than a shared delete.
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS is_recalled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS recalled_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_for uuid[] NOT NULL DEFAULT '{}';

-- Only the original sender can recall their own message.
CREATE POLICY "Sender can recall own message"
ON messages FOR UPDATE
USING (auth.uid() = sender_id)
WITH CHECK (auth.uid() = sender_id);

-- Either conversation participant can hide any message (theirs or the
-- other party's) from their own view via deleted_for.
CREATE POLICY "Participants can delete-for-self any message"
ON messages FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = messages.conversation_id
      AND (auth.uid() = c.participant_a OR auth.uid() = c.participant_b)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = messages.conversation_id
      AND (auth.uid() = c.participant_a OR auth.uid() = c.participant_b)
  )
);
