-- Dedicated column for the Mini Program's own openid, separate from
-- wechat_openid (which is the 公众号-scoped identity, used for template-
-- message push — see 20260917 wechat-oauth-login fix). These two openids
-- are different values for the same person (each WeChat "app" gets its
-- own openid; only unionid is shared) and were previously both being
-- written into the single wechat_openid column, which broke 公众号 push
-- for anyone who registered via the Mini Program first. wechat_mp_openid
-- is what content-security checks (msgSecCheck/imgSecCheck) need, since
-- those WeChat APIs require a Mini-Program-scoped openid specifically.
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS wechat_mp_openid text;
