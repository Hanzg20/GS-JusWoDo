import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { consumeWeChatLoginState, consumeReturnTo, WeChatAuthMode } from "@/lib/wechatAuth";
import { useConfigStore } from "@/stores/configStore";
import { useAuthStore } from "@/stores/authStore";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

// verifyOtp() establishing a session doesn't mean authStore's currentUser
// is populated yet — that happens a moment later, async, via the
// onAuthStateChange listener in authStore.ts (which does its own network
// round-trip to fetch the profile). Navigating away immediately after
// verifyOtp (the old behavior) raced that: the header could show the
// logged-in avatar (once currentUser did populate) while whatever page the
// visitor landed on — most visibly /login, when they started the flow
// from there — still rendered its logged-out UI for a beat, with nothing
// on screen explaining what was happening. Waits here instead, with a
// short timeout as a fallback so a visitor is never stuck if something
// about the auth-state sync goes wrong.
function waitForCurrentUser(timeoutMs = 5000): Promise<void> {
    if (useAuthStore.getState().currentUser) return Promise.resolve();
    return new Promise((resolve) => {
        const unsubscribe = useAuthStore.subscribe((state) => {
            if (state.currentUser) {
                clearTimeout(timer);
                unsubscribe();
                resolve();
            }
        });
        const timer = setTimeout(() => {
            unsubscribe();
            resolve();
        }, timeoutMs);
    });
}

// Where wechatAuth.ts sends the browser back to after WeChat's OAuth step
// (either the "微信登录" button's consent screen, or the invisible
// startSilentWeChatCheck() redirect). Exchanges the `code` for a real
// Supabase session via wechat-oauth-login, then hands off to authStore's
// existing onAuthStateChange subscription (see authStore.ts) — this page
// doesn't populate currentUser itself, just establishes the session and
// leaves.
//
// Silent-mode failures (state mismatch, not a registered user, etc.) never
// surface an error screen — the visitor never asked for this, so it just
// returns them to whatever page they were on quietly (see consumeReturnTo()
// — previously this always went home, silently dropping visitors who'd
// opened e.g. a specific community post from a WeChat Moments share).
// Consent-mode failures (the visitor did click "微信登录") show the usual
// error + retry UI instead.
const WeChatCallback = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { language } = useConfigStore();
    const [error, setError] = useState<string | null>(null);
    const [mode, setMode] = useState<WeChatAuthMode>('consent');
    const [success, setSuccess] = useState(false);

    const t = {
        signingIn: language === 'zh' ? '正在登录…' : 'Signing in…',
        signedIn: language === 'zh' ? '登录成功！' : 'Signed in!',
        failed: language === 'zh' ? '登录失败' : 'Login failed',
        backToLogin: language === 'zh' ? '返回登录页' : 'Back to login',
    };

    useEffect(() => {
        const run = async () => {
            const code = searchParams.get('code');
            const state = searchParams.get('state');
            const expected = consumeWeChatLoginState();
            const currentMode = expected?.mode || 'consent';
            setMode(currentMode);
            // Read once, up front — this is the page the visitor was
            // actually on before startWeChatOAuth() redirected them here
            // (e.g. a specific community post opened from a WeChat Moments
            // share), not always home. Every navigate() below should land
            // them back there, success or failure alike — except /login
            // itself: sending a freshly-authenticated visitor back to the
            // login page (the common case, since that's usually where the
            // "微信登录" button was clicked from) just shows them the login
            // form again for a beat, which reads as "did this even work?"
            // regardless of any timing race. Home is always a safe landing
            // spot for someone who's just signed in.
            const consumedReturnTo = consumeReturnTo();
            const returnTo = (consumedReturnTo === '/login' || consumedReturnTo.startsWith('/login?'))
                ? '/'
                : consumedReturnTo;

            const fail = (message: string) => {
                if (currentMode === 'silent') {
                    navigate(returnTo, { replace: true });
                } else {
                    setError(message);
                }
            };

            if (!code || !state || !expected || state !== expected.raw) {
                fail(language === 'zh' ? '登录请求无效或已过期，请重试' : 'Invalid or expired login request — please try again');
                return;
            }

            try {
                const { data, error: fnError } = await supabase.functions.invoke('wechat-oauth-login', {
                    body: { code, mode: currentMode },
                });
                if (fnError || !data || data.error) {
                    throw new Error(data?.error || fnError?.message || 'Unknown error');
                }

                // Silent check found no matching account — nothing to log
                // into, and snsapi_base has no name/avatar to register one
                // with. Just leave the visitor browsing anonymously.
                if (data.notFound) {
                    navigate(returnTo, { replace: true });
                    return;
                }

                // token_hash (not token) + type 'email' (not 'magiclink') —
                // confirmed by direct testing 2026-09-08, see jwd_wechat_login
                // memory. token/type:'magiclink' looks correct per most docs
                // but consistently fails with "Token has expired or is invalid".
                const { error: verifyError } = await supabase.auth.verifyOtp({
                    token_hash: data.tokenHash,
                    type: 'email',
                });
                if (verifyError) throw verifyError;

                // Wait for authStore's currentUser to actually populate
                // before leaving this page — otherwise the header can show
                // the logged-in avatar while the destination page (still
                // reading stale state) briefly renders as logged-out, with
                // nothing on screen to explain the gap.
                await waitForCurrentUser();

                if (currentMode === 'consent') {
                    setSuccess(true);
                    await new Promise((resolve) => setTimeout(resolve, 600));
                }

                navigate(returnTo, { replace: true });
            } catch (err: any) {
                console.error('WeChat login failed:', err);
                fail(err.message || String(err));
            }
        };

        run();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Silent mode never shows anything — mid-flight it's just a blank beat
    // during the redirect round-trip; on failure it's already navigated away.
    if (mode === 'silent' && !error) {
        return null;
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-6">
            <div className="text-center space-y-4">
                {error ? (
                    <>
                        <AlertCircle className="w-10 h-10 text-destructive mx-auto" />
                        <p className="text-sm text-muted-foreground">{t.failed}: {error}</p>
                        <button
                            onClick={() => navigate('/login', { replace: true })}
                            className="text-sm font-semibold text-primary hover:underline"
                        >
                            {t.backToLogin}
                        </button>
                    </>
                ) : success ? (
                    <>
                        <CheckCircle2 className="w-10 h-10 text-primary mx-auto" />
                        <p className="text-sm text-muted-foreground">{t.signedIn}</p>
                    </>
                ) : (
                    <>
                        <Loader2 className="w-10 h-10 text-primary mx-auto animate-spin" />
                        <p className="text-sm text-muted-foreground">{t.signingIn}</p>
                    </>
                )}
            </div>
        </div>
    );
};

export default WeChatCallback;
