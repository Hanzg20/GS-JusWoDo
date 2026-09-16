-- Support Facebook-Messenger-style conversation-list actions: archive
-- (归档, hidden from the main inbox but not deleted) and delete (删除,
-- hidden from just the deleting party's own view — same "delete for me
-- only" semantics already used for individual messages, see
-- 20260917_message_recall_and_delete.sql). Both are per-user arrays,
-- not a shared/global state.
ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS archived_for uuid[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS deleted_for uuid[] NOT NULL DEFAULT '{}';

-- No UPDATE policy existed on conversations before this (last_message_at
-- is set by a SECURITY DEFINER trigger, not a client UPDATE) — this adds
-- one so a participant can update their own archive/delete state.
CREATE POLICY "Participants can update their own conversation state"
ON conversations FOR UPDATE
USING (auth.uid() = participant_a OR auth.uid() = participant_b)
WITH CHECK (auth.uid() = participant_a OR auth.uid() = participant_b);

-- A new message un-archives/un-deletes the conversation for everyone —
-- matches Messenger's behavior where an archived/removed thread
-- reappears in the inbox once new activity happens, rather than staying
-- silently hidden forever.
CREATE OR REPLACE FUNCTION public.update_conversation_last_message()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    UPDATE public.conversations
    SET last_message_at = NEW.created_at,
        archived_for = '{}',
        deleted_for = '{}'
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$function$;
