import { useState } from "react";
import { User as UserIcon, Mail, ArrowRight, Building2, CheckCircle2, Lock, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useConfigStore, writeNodeId } from "@/stores/configStore";

const Register = () => {
    const navigate = useNavigate();
    const { language, activeNodeId } = useConfigStore();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    // Default to whatever this browser session already detected/picked
    // (see configStore.ts) rather than hardcoding one neighborhood for
    // every new signup.
    const [nodeId, setNodeId] = useState(writeNodeId(activeNodeId));
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const t = {
        pwMismatch: language === 'zh' ? '两次输入的密码不一致' : 'Passwords do not match',
        pwTooShort: language === 'zh' ? '密码长度至少为 8 位' : 'Password must be at least 8 characters',
        pwNeedsLetterNumber: language === 'zh' ? '密码必须包含字母和数字' : 'Password must contain both letters and numbers',
        alreadyRegisteredLoginNow: language === 'zh' ? '该邮箱已注册，请直接登录' : 'This email is already registered — please log in',
        registerSuccessToast: language === 'zh' ? '注册成功！请检查邮箱进行验证' : 'Registration successful! Please check your email to verify',
        rateLimited: language === 'zh' ? '操作太频繁，请稍后再试' : 'Too many attempts — please try again later',
        registerFailedRetry: language === 'zh' ? '注册失败，请检查网络后重试' : 'Registration failed — please check your connection and try again',
        registerSuccessTitle: language === 'zh' ? '注册成功！' : 'Registration Successful!',
        confirmationSentPrefix: language === 'zh' ? '我们已向 ' : "We've sent a confirmation email to ",
        confirmationSentSuffix: language === 'zh' ? ' 发送了确认邮件。请点击邮件中的链接完成验证后即可登录。' : '. Click the link in the email to verify, then log in.',
        goToLoginNow: language === 'zh' ? '立刻去登录' : 'Go to Login',
        joinTitle: language === 'zh' ? '加入 JUSTWEDO' : 'Join JUSTWEDO',
        joinSubtitle: language === 'zh' ? '邻里互助，从这里开始' : 'Neighbor help starts here',
        emailPlaceholder: language === 'zh' ? '电子邮箱' : 'Email address',
        nicknamePlaceholder: language === 'zh' ? '你的昵称' : 'Your nickname',
        setPasswordPlaceholder: language === 'zh' ? '设置登录密码' : 'Set a login password',
        confirmPasswordPlaceholder: language === 'zh' ? '确认你的密码' : 'Confirm your password',
        registering: language === 'zh' ? '正在注册...' : 'Registering...',
        registerNow: language === 'zh' ? '立即注册' : 'Register',
        alreadyHaveAccount: language === 'zh' ? '已有账号？' : 'Already have an account?',
        loginDirectly: language === 'zh' ? '直接登录' : 'Log in',
        consentPrefix: language === 'zh' ? '我已阅读并同意 ' : 'I have read and agree to the ',
        termsOfService: language === 'zh' ? '服务条款' : 'Terms of Service',
        consentMiddle: language === 'zh' ? ' 与 ' : ' and ',
        privacyPolicy: language === 'zh' ? '隐私政策' : 'Privacy Policy',
        consentSuffix: language === 'zh' ? '，并理解平台仅作为信息中介。' : ', and understand the platform acts only as an information intermediary.',
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (password !== confirmPassword) {
            setError(t.pwMismatch);
            setLoading(false);
            return;
        }

        if (password.length < 8) {
            setError(t.pwTooShort);
            setLoading(false);
            return;
        }

        if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
            setError(t.pwNeedsLetterNumber);
            setLoading(false);
            return;
        }

        try {
            // Check for redirect param
            const searchParams = new URLSearchParams(window.location.search);
            const role = searchParams.get('role');
            let redirectTo = window.location.origin + "/login";

            if (role === 'PROVIDER') {
                redirectTo += "?redirect=/become-provider";
            }

            const { data, error: signUpError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        name: name,
                        nodeId: nodeId,
                    },
                    emailRedirectTo: redirectTo
                }
            });

            if (signUpError) throw signUpError;

            if (data.user && data.user.identities && data.user.identities.length === 0) {
                toast.error(t.alreadyRegisteredLoginNow);
                navigate('/login');
                return;
            }

            setSuccess(true);
            toast.success(t.registerSuccessToast);
        } catch (err: any) {
            const msg = err.message.includes('rate_limit') ? t.rateLimited :
                err.message.includes('already registered') ? t.alreadyRegisteredLoginNow :
                    t.registerFailedRetry;
            setError(msg);
            toast.error(msg);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-secondary/30 flex items-center justify-center p-4">
                <div className="bg-card w-full max-w-md rounded-3xl shadow-xl p-8 text-center space-y-6">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto animate-bounce">
                        <CheckCircle2 className="w-10 h-10 text-green-600" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold">{t.registerSuccessTitle}</h2>
                        <p className="text-muted-foreground">
                            {t.confirmationSentPrefix}<span className="font-semibold text-foreground">{email}</span>{t.confirmationSentSuffix}
                        </p>
                    </div>
                    <Button
                        className="w-full py-6 font-bold text-lg rounded-xl btn-action"
                        onClick={() => navigate('/login')}
                    >
                        {t.goToLoginNow} <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-secondary/30 flex items-center justify-center p-4">
            <div className="bg-card w-full max-w-md rounded-3xl shadow-xl overflow-hidden flex flex-col">
                <div className="bg-gradient-hero p-8 text-center text-white">
                    <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-4 shadow-glow text-foreground">
                        <span className="text-3xl font-bold">H</span>
                    </div>
                    <h1 className="text-2xl font-extrabold text-white">{t.joinTitle}</h1>
                    <p className="opacity-80 text-sm text-white">{t.joinSubtitle}</p>
                </div>

                <form onSubmit={handleRegister} className="p-8 space-y-5 flex-1 bg-background">
                    <div className="space-y-4">
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder={t.emailPlaceholder}
                                className="w-full pl-12 pr-4 py-4 rounded-xl border bg-muted/30 focus:border-primary focus:bg-background transition-all outline-none"
                            />
                        </div>
                        <div className="relative">
                            <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <input
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder={t.nicknamePlaceholder}
                                className="w-full pl-12 pr-4 py-4 rounded-xl border bg-muted/30 focus:border-primary focus:bg-background transition-all outline-none"
                            />
                        </div>

                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder={t.setPasswordPlaceholder}
                                className="w-full pl-12 pr-12 py-4 rounded-xl border bg-muted/30 focus:border-primary focus:bg-background transition-all outline-none"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>

                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder={t.confirmPasswordPlaceholder}
                                className="w-full pl-12 pr-4 py-4 rounded-xl border bg-muted/30 focus:border-primary focus:bg-background transition-all outline-none"
                            />
                        </div>

                        <div className="relative">
                            <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <select
                                value={nodeId}
                                onChange={(e) => setNodeId(e.target.value)}
                                className="w-full pl-12 pr-10 py-4 rounded-xl border bg-muted/30 focus:border-primary focus:bg-background transition-all outline-none appearance-none"
                            >
                                <option value="NODE_LEES">🏘️ Ottawa - Lees Ave</option>
                                <option value="NODE_KANATA">🌲 Ottawa - Kanata Lakes</option>
                                <option value="NODE_DOWNTOWN">🏛️ Ottawa - Downtown</option>
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                <ArrowRight className="w-4 h-4 text-muted-foreground rotate-90" />
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm border border-red-100 italic">
                            ⚠️ {error}
                        </div>
                    )}

                    <Button
                        type="submit"
                        className="w-full py-6 font-bold text-lg rounded-xl btn-action"
                        disabled={loading}
                    >
                        {loading ? t.registering : t.registerNow}
                    </Button>

                    <p className="text-center text-sm text-muted-foreground">
                        {t.alreadyHaveAccount}
                        <Link to="/login" className="text-primary font-bold hover:underline ml-1">{t.loginDirectly}</Link>
                    </p>

                    <div className="flex items-start gap-2 pt-2">
                        <input
                            type="checkbox"
                            required
                            id="tos-consent"
                            className="mt-1 w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <label htmlFor="tos-consent" className="text-xs text-muted-foreground leading-tight opacity-80 select-none cursor-pointer">
                            {t.consentPrefix}<Link to="/legal/terms" target="_blank" className="underline font-bold hover:text-primary" onClick={(e) => e.stopPropagation()}>{t.termsOfService}</Link>{t.consentMiddle}<Link to="/legal/privacy" target="_blank" className="underline font-bold hover:text-primary" onClick={(e) => e.stopPropagation()}>{t.privacyPolicy}</Link>{t.consentSuffix}
                        </label>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Register;
