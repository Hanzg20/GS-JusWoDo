import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { consumeWeChatLoginState } from "@/lib/wechatAuth";
import { useConfigStore } from "@/stores/configStore";
import { Loader2, AlertCircle } from "lucide-react";

// Where startWeChatLogin() (wechatAuth.ts) sends the browser back to after
// WeChat's consent screen. Exchanges the `code` for a real Supabase
// session via wechat-oauth-login, then hands off to authStore's existing
// onAuthStateChange subscription (see authStore.ts) — this page doesn't
// populate currentUser itself, just establishes the session and leaves.
const WeChatCallback = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { language } = useConfigStore();
    const [error, setError] = useState<string | null>(null);

    const t = {
        signingIn: language === 'zh' ? '正在用微信登录…' : 'Signing in with WeChat…',
        failed: language === 'zh' ? '微信登录失败' : 'WeChat login failed',
        backToLogin: language === 'zh' ? '返回登录页' : 'Back to login',
    };

    useEffect(() => {
        const run = async () => {
            const code = searchParams.get('code');
            const state = searchParams.get('state');
            const expectedState = consumeWeChatLoginState();

            if (!code || !state || state !== expectedState) {
                setError(language === 'zh' ? '登录请求无效或已过期，请重试' : 'Invalid or expired login request — please try again');
                return;
            }

            try {
                const { data, error: fnError } = await supabase.functions.invoke('wechat-oauth-login', {
                    body: { code },
                });
                if (fnError || !data || data.error) {
                    throw new Error(data?.error || fnError?.message || 'Unknown error');
                }

                const { error: verifyError } = await supabase.auth.verifyOtp({
                    email: data.email,
                    token: data.tokenHash,
                    type: 'magiclink',
                });
                if (verifyError) throw verifyError;

                navigate('/', { replace: true });
            } catch (err: any) {
                console.error('WeChat login failed:', err);
                setError(err.message || String(err));
            }
        };

        run();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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
