-- Record-only migration (applied directly via `supabase db query --linked`,
-- not through `supabase db push` — see jwd_db_query_bypasses_broken_push).
--
-- Bug: any buyer other than a listing's own provider got a 403 submitting a
-- review. Two AFTER INSERT triggers on `reviews` ran as SECURITY INVOKER
-- (the default) and tried to write to tables the submitting buyer has no
-- RLS permission for:
--   - update_listing_rating() updates listing_masters, which only that
--     listing's own provider may update.
--   - reward_beans_for_review() inserts into bean_transactions, which has
--     no INSERT policy for anyone.
-- Either failure aborted the whole review INSERT. This affected every
-- review-submission path (old order-based flow and the new QR-based
-- /leave-review flow alike) for any buyer who wasn't the provider — a
-- likely explanation for reviews sitting at 0 real rows in production.

ALTER FUNCTION public.update_listing_rating() SECURITY DEFINER;
ALTER FUNCTION public.reward_beans_for_review() SECURITY DEFINER;
