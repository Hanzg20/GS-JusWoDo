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

// Must exactly match the one domain registered in 微信公众平台 → 网页授权域名
// (currently "justwedo.com", no www — see jwd_wechat_login memory). Hardcoded
// rather than derived from window.location.origin: SEO.tsx treats
// https://www.justwedo.com as canonical, so a visitor arriving via a www
// link would otherwise build a redirect_uri WeChat rejects with error
// 10003 "redirect_uri域名与后台配置不一致" — this call is the one place
// that must stay pinned to whichever bare host is actually registered.
const WECHAT_REDIRECT_ORIGIN = 'https://justwedo.com';

const STATE_STORAGE_KEY = 'wechat_login_state';

// The state round-trip crosses hosts (see WECHAT_REDIRECT_ORIGIN above —
// the visitor may start on www.justwedo.com but always lands back on
// bare justwedo.com), and sessionStorage/localStorage are strictly
// per-origin, so they can't carry a value across that hop. A cookie
// scoped to the parent domain (.justwedo.com) can.
function setStateCookie(state: string): void {
    document.cookie = `${STATE_STORAGE_KEY}=${state}; domain=.justwedo.com; path=/; max-age=600; secure; samesite=lax`;
}

function readAndClearStateCookie(): string | null {
    const match = document.cookie.match(new RegExp(`(?:^|; )${STATE_STORAGE_KEY}=([^;]*)`));
    const state = match ? decodeURIComponent(match[1]) : null;
    document.cookie = `${STATE_STORAGE_KEY}=; domain=.justwedo.com; path=/; max-age=0`;
    return state;
}

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
    setStateCookie(state);

    const redirectUri = `${WECHAT_REDIRECT_ORIGIN}/auth/wechat/callback`;
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
    return readAndClearStateCookie();
}
