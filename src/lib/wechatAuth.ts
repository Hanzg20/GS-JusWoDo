// WeChat login (公众号网页授权) — redirect-based, only works when the page
// is opened inside WeChat's own in-app browser (see isWeChatBrowser() in
// wechatShare.ts). There's no Supabase-native WeChat provider, so this
// pairs with the wechat-oauth-login Edge Function: this file sends the
// user to WeChat and gets them back with a `code`; the Edge Function
// exchanges that code and hands back a token the frontend redeems for a
// real Supabase session — see WeChatCallback.tsx.
//
// Two flows share this file:
//  - startWeChatLogin(): the "微信登录" button. scope snsapi_userinfo shows
//    WeChat's consent screen and returns nickname/avatar too, so a brand
//    new visitor can be auto-registered from it.
//  - startSilentWeChatCheck(): fires on its own (see App.tsx) for a
//    WeChat-browser visitor who isn't signed in yet. scope snsapi_base is
//    invisible — no consent screen — but only returns an openid, so it can
//    complete a login for an *already-registered* WeChat user; it can't
//    register a new one (no name/avatar to give them).

export type WeChatAuthMode = 'silent' | 'consent';

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
const SILENT_CHECK_DONE_KEY = 'wechat_silent_check_done';
const RETURN_TO_KEY = 'wechat_login_return_to';

// The state (and silent-check-done marker) round-trip crosses hosts (see
// WECHAT_REDIRECT_ORIGIN above — the visitor may start on
// www.justwedo.com but always lands back on bare justwedo.com), and
// sessionStorage/localStorage are strictly per-origin, so they can't carry
// a value across that hop. A cookie scoped to the parent domain
// (.justwedo.com) can.
function setCookie(name: string, value: string, maxAgeSeconds: number): void {
    document.cookie = `${name}=${value}; domain=.justwedo.com; path=/; max-age=${maxAgeSeconds}; secure; samesite=lax`;
}

function readCookie(name: string): string | null {
    const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
    return match ? decodeURIComponent(match[1]) : null;
}

function clearCookie(name: string): void {
    document.cookie = `${name}=; domain=.justwedo.com; path=/; max-age=0`;
}

function randomState(): string {
    return Array.from(crypto.getRandomValues(new Uint8Array(16)))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
}

function startWeChatOAuth(scope: 'snsapi_base' | 'snsapi_userinfo', mode: WeChatAuthMode): void {
    // Mode travels inside the state value itself — WeChatCallback.tsx needs
    // to know which flow it's handling (silent failures stay invisible;
    // consent failures show an error) and this avoids a second cookie.
    const state = `${mode}:${randomState()}`;
    setCookie(STATE_STORAGE_KEY, state, 600);

    // Where to send the visitor back to once the OAuth round-trip is done —
    // without this, WeChatCallback.tsx had nowhere to return to and always
    // sent everyone home, silently dropping whatever page (e.g. a specific
    // community post opened from a WeChat Moments share) they'd actually
    // been trying to view. Same-origin path+query only, never a full URL —
    // this value only ever comes from our own window.location, but kept
    // path-shaped anyway as a matter of course.
    const returnTo = `${window.location.pathname}${window.location.search}`;
    setCookie(RETURN_TO_KEY, encodeURIComponent(returnTo), 600);

    const redirectUri = `${WECHAT_REDIRECT_ORIGIN}/auth/wechat/callback`;
    const params = new URLSearchParams({
        appid: WECHAT_APP_ID,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope,
        state,
    });

    window.location.href = `https://open.weixin.qq.com/connect/oauth2/authorize?${params.toString()}#wechat_redirect`;
}

/**
 * Redirects to WeChat's OAuth consent screen. Call only from inside
 * WeChat's browser (isWeChatBrowser()) — outside it, this URL just shows
 * WeChat's "open in app" interstitial instead of a working login.
 */
export function startWeChatLogin(): void {
    startWeChatOAuth('snsapi_userinfo', 'consent');
}

/**
 * Silently checks whether this WeChat identity already has a JWD account,
 * and if so, logs them in — no consent screen, the visitor never sees
 * WeChat at all beyond a brief redirect. Runs at most once per ~7 days
 * (see SILENT_CHECK_DONE_KEY) so an unregistered visitor isn't bounced
 * through this redirect on every single page load.
 */
export function startSilentWeChatCheck(): void {
    if (readCookie(SILENT_CHECK_DONE_KEY)) return;
    setCookie(SILENT_CHECK_DONE_KEY, '1', 60 * 60 * 24 * 7);
    startWeChatOAuth('snsapi_base', 'silent');
}

/**
 * Consumes the state stashed before redirecting — call once from the
 * callback page and compare `state` against the returned value's `raw`
 * field. Removes the cookie either way so it can't be reused.
 */
export function consumeWeChatLoginState(): { raw: string; mode: WeChatAuthMode } | null {
    const raw = readCookie(STATE_STORAGE_KEY);
    clearCookie(STATE_STORAGE_KEY);
    if (!raw) return null;

    const separatorIndex = raw.indexOf(':');
    if (separatorIndex === -1) return null;
    const mode = raw.slice(0, separatorIndex);
    if (mode !== 'silent' && mode !== 'consent') return null;

    return { raw, mode };
}

/**
 * Consumes the page path stashed before redirecting to WeChat — call once
 * from the callback page and navigate here instead of always going home.
 * Falls back to '/' if there's nothing stashed (e.g. the callback page was
 * opened directly, not via startWeChatOAuth) or the stored value doesn't
 * look like a same-origin path.
 */
export function consumeReturnTo(): string {
    const raw = readCookie(RETURN_TO_KEY);
    clearCookie(RETURN_TO_KEY);
    if (!raw) return '/';

    try {
        const decoded = decodeURIComponent(raw);
        // Must be a relative, same-origin path — reject anything that could
        // be interpreted as a protocol-relative or absolute external URL.
        if (decoded.startsWith('/') && !decoded.startsWith('//')) return decoded;
    } catch {
        // fall through to default
    }
    return '/';
}
