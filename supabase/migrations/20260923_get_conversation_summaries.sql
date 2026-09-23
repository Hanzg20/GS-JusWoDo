-- Chat list in one round trip.
--
-- MessageRepository.getConversations() used to run 1 query for the
-- conversations and then 3 more PER conversation (other user's profile,
-- latest message, unread count) — 30+ requests for 10 chats, which made
-- the chat tab slow to open, especially in the Mini Program.
--
-- SECURITY INVOKER: runs under the caller's RLS, same visibility as the old
-- per-table queries. Scoped to auth.uid() rather than a user-id parameter so
-- it can only ever return the caller's own conversations.

create or replace function public.get_conversation_summaries()
returns table (
    id uuid,
    participant_a uuid,
    participant_b uuid,
    order_id uuid,
    last_message_at timestamptz,
    created_at timestamptz,
    metadata jsonb,
    archived_for uuid[],
    deleted_for uuid[],
    other_user_name text,
    other_user_avatar text,
    last_message_content text,
    last_message_type text,
    unread_count bigint
)
language sql
stable
security invoker
set search_path = public
as $$
    select
        c.id,
        c.participant_a,
        c.participant_b,
        c.order_id,
        c.last_message_at,
        c.created_at,
        c.metadata,
        c.archived_for,
        c.deleted_for,
        p.name::text,
        p.avatar::text,
        lm.content,
        lm.message_type,
        (
            select count(*)
            from messages m
            where m.conversation_id = c.id
              and m.is_read = false
              and m.sender_id <> auth.uid()
        )
    from conversations c
    left join user_profiles p
        on p.id = case when c.participant_a = auth.uid() then c.participant_b else c.participant_a end
    left join lateral (
        select m.content, m.message_type
        from messages m
        where m.conversation_id = c.id
        order by m.created_at desc
        limit 1
    ) lm on true
    where c.participant_a = auth.uid() or c.participant_b = auth.uid()
    order by c.last_message_at desc;
$$;

grant execute on function public.get_conversation_summaries() to authenticated;
