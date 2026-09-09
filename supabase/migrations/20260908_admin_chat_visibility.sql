-- Record-only: applied directly via `supabase db query --linked` since
-- `supabase db push` is broken for this project (migration ledger
-- mismatch, see repo conversation history). This file documents what was
-- actually run against the live DB on 2026-09-08.

-- Minimal admin visibility for chat support/dispute handling.
-- `user_profiles.roles` already supported 'SUPER_ADMIN' in the TS type
-- (src/types/domain.ts) but no row had ever been granted it and no RLS
-- policy checked for it — conversations/messages were only ever visible
-- to their two participants, with zero staff access.

CREATE POLICY "Admins can view all conversations"
ON conversations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.id = auth.uid() AND 'SUPER_ADMIN' = ANY(up.roles)
  )
);

CREATE POLICY "Admins can view all messages"
ON messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.id = auth.uid() AND 'SUPER_ADMIN' = ANY(up.roles)
  )
);

-- Operator account granted SUPER_ADMIN (roles is an array — array_append,
-- not overwrite, to keep existing BUYER/PROVIDER roles):
--   UPDATE user_profiles SET roles = array_append(roles, 'SUPER_ADMIN')
--   WHERE id = 'e1507f9e-7343-4474-a1da-301a213943ec';
