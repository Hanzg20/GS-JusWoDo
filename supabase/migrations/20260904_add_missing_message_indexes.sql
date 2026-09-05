-- ==========================================
-- 20260128_optimize_message_system.sql wraps its message_type/metadata
-- column + index creation in `IF NOT EXISTS (... check column ...) THEN
-- ALTER TABLE ADD COLUMN ...; CREATE INDEX ...; END IF`. Both columns
-- already existed by the time that migration ran (added some other way,
-- dashboard or an earlier pass), so the guard's condition was false and
-- the whole block — index creation included — was skipped. Low severity
-- (query-planner performance only, not correctness), but cheap to fix.
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_messages_type ON public.messages(message_type);
CREATE INDEX IF NOT EXISTS idx_messages_metadata ON public.messages USING GIN (metadata);
