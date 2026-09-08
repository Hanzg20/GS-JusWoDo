-- ==========================================
-- WeChat login: links a user_profiles row to the WeChat openid obtained
-- from 公众号网页授权 (OAuth2 web authorization). Nullable — most users
-- won't have one; unique — one WeChat identity maps to at most one JWD
-- account. See wechat-oauth-login Edge Function.
--
-- Applied directly via a temporary service-role Edge Function on
-- 2026-09-08 (supabase db push fails on an unrelated local/remote
-- migration ledger mismatch — see jwd_wechat_js_domain_verified memory).
-- This file exists for the repo's own record; it is NOT what actually
-- ran, just documents what did.
-- ==========================================

ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS wechat_openid text UNIQUE;
