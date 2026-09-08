// WeChat login (公众号网页授权) — redirect-based, only works when the page
// is opened inside WeChat's own in-app browser (see isWeChatBrowser() in
// wechatShare.ts). There's no Supabase-native WeChat provider, so this
// pairs with the wechat-oauth-login Edge Function: this file sends the
// user to WeChat and gets them back with a `code`; the Edge Function
// exchanges that code and hands back a token the frontend redeems for a
// real Supabase session — see WeChatCallback.tsx.

// Public identifier, not a secret — same one baked into the JS-SDK share
// signature flow (see wechat-relay/config.json for where the paired
// AppSecret actually lives, server-side only).
const WECHAT_APP_ID = 'wxf0ae0e709384b1df';

const STATE_STORAGE_KEY = 'wechat_login_state';

function randomState(): string {
    return Array.from(crypto.getRandomValues(new Uint8Array(16)))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
}

/**
 * Redirects to WeChat's OAuth authorize page. Call only from inside
 * WeChat's browser (isWeChatBrowser()) — outside it, this URL just shows
 * WeChat's "open in app" interstitial instead of a working login.
 */
export function startWeChatLogin(): void {
    const state = randomState();
    sessionStorage.setItem(STATE_STORAGE_KEY, state);

    const redirectUri = `${window.location.origin}/auth/wechat/callback`;
    const params = new URLSearchParams({
        appid: WECHAT_APP_ID,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'snsapi_userinfo',
        state,
    });

    window.location.href = `https://open.weixin.qq.com/connect/oauth2/authorize?${params.toString()}#wechat_redirect`;
}

/**
 * Consumes the state stored before redirecting — call once from the
 * callback page and compare against the `state` query param. Removes it
 * either way so a stale value can't be reused.
 */
export function consumeWeChatLoginState(): string | null {
    const state = sessionStorage.getItem(STATE_STORAGE_KEY);
    sessionStorage.removeItem(STATE_STORAGE_KEY);
    return state;
}
