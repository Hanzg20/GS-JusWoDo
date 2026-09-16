-- Record-only migration. The actual upload (image bytes to Supabase
-- Storage's `avatars` bucket) was done via a temp Edge Function
-- (deployed/invoked/deleted immediately, not preserved in this repo) since
-- storage writes need the service role — this file just records the
-- resulting state for repo history. See jwd_zhao_shifu_provider memory.

UPDATE user_profiles
SET avatar = 'https://fvjgmydkxklqclcyhuvl.supabase.co/storage/v1/object/public/avatars/providers/66905ed7-6053-4e1b-a8ae-8d3490e64935/avatar.jpg'
WHERE id = '66905ed7-6053-4e1b-a8ae-8d3490e64935';
