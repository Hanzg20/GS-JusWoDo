import { useState, useEffect } from "react";
import { User as UserIcon, Mail, ArrowRight, Lock, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useConfigStore, NODE_ALL } from "@/stores/configStore";
import { NodePicker } from "@/components/NodePicker";

const Register = () => {
    const navigate = useNavigate();
    const { language } = useConfigStore();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    // Starts as the generic "Ottawa (All)" placeholder rather than silently
    // pre-picking a specific neighborhood (previously defaulted to whatever
    // activeNodeId happened to be, which could look like a decision nobody
    // actually made). NODE_ALL can never be persisted as a profile's real
    // node — handleRegister blocks submission until the user picks one of
    // the 37 real neighborhoods, same explicit-or-nothing treatment as the
    // consent checkbox below.
    const [nodeId, setNodeId] = useState(NODE_ALL);
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [error, setError] = useState<string | null>(null);
    // Email confirmation used to be link-only (open the email, tap the
    // link, then separately log in) — a real friction point, especially
    // anywhere clicking out of the current context is awkward (e.g. the
    // WeChat Mini Program's web-view). Supabase's own "Confirm signup"
    // email can carry a 6-digit code (the same {{ .Token }} the Login
    // page's OTP flow already uses) alongside the link — verifying it
    // here logs the user straight in, no separate login step needed.
    const [step, setStep] = useState<'FORM' | 'VERIFY'>('FORM');
    const [otpCode, setOtpCode] = useState("");
    const [verifyLoading, setVerifyLoading] = useState(false);
    const [resendTimer, setResendTimer] = useState(0);

    const t = {
        pwMismatch: language === 'zh' ? '两次输入的密码不一致' : 'Passwords do not match',
        pwTooShort: language === 'zh' ? '密码长度至少为 8 位' : 'Password must be at least 8 characters',
        pwNeedsLetterNumber: language === 'zh' ? '密码必须包含字母和数字' : 'Password must contain both letters and numbers',
        errNoLocation: language === 'zh' ? '请选择您所在的社区' : 'Please select your neighborhood',
        errNoConsent: language === 'zh' ? '请先同意服务条款与隐私政策' : 'Please agree to the Terms of Service and Privacy Policy',
        alreadyRegisteredLoginNow: language === 'zh' ? '该邮箱已注册，请直接登录' : 'This email is already registered — please log in',
        registerSuccessToast: language === 'zh' ? '验证码已发送到您的邮箱' : 'Verification code sent to your email',
        rateLimited: language === 'zh' ? '操作太频繁，请稍后再试' : 'Too many attempts — please try again later',
        registerFailedRetry: language === 'zh' ? '注册失败，请检查网络后重试' : 'Registration failed — please check your connection and try again',
        codeSentTitle: language === 'zh' ? '查收验证码' : 'Check your email',
        codeSentPrefix: language === 'zh' ? '我们已向 ' : "We've sent a 6-digit code to ",
        codeSentSuffix: language === 'zh' ? ' 发送了 6 位验证码，输入后即可完成注册。' : '. Enter it below to finish creating your account.',
        codeLabel: language === 'zh' ? '6 位验证码' : '6-Digit Code',
        confirmRegister: language === 'zh' ? '确认注册' : 'Confirm',
        verifying: language === 'zh' ? '验证中...' : 'Verifying...',
        codeInvalid: language === 'zh' ? '验证码无效或已过期' : 'Invalid or expired code',
        noCode: language === 'zh' ? '没收到验证码？' : "Didn't get a code?",
        resend: language === 'zh' ? '重新发送' : 'Resend',
        resendIn: (s: number) => language === 'zh' ? `${s}秒后可重发` : `Resend in ${s}s`,
        changeEmail: language === 'zh' ? '换个邮箱' : 'Use a different email',
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
        setError(null);

        if (nodeId === NODE_ALL) {
            setError(t.errNoLocation);
            toast.error(t.errNoLocation);
            return;
        }

        if (!agreedToTerms) {
            setError(t.errNoConsent);
            toast.error(t.errNoConsent);
            return;
        }

        setLoading(true);

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

            setStep('VERIFY');
            setResendTimer(60);
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

    // Resend countdown
    useEffect(() => {
        if (resendTimer > 0) {
            const countdown = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
            return () => clearTimeout(countdown);
        }
    }, [resendTimer]);

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setVerifyLoading(true);
        try {
            const { error: verifyError } = await supabase.auth.verifyOtp({
                email: email.trim(),
                token: otpCode,
                type: 'signup',
            });
            if (verifyError) throw verifyError;
            // A confirmed session comes back directly — no separate login step.
            navigate('/');
        } catch (err: any) {
            setError(t.codeInvalid);
            toast.error(t.codeInvalid);
        } finally {
            setVerifyLoading(false);
        }
    };

    const handleResendCode = async () => {
        setError(null);
        try {
            const { error: resendError } = await supabase.auth.resend({ type: 'signup', email: email.trim() });
            if (resendError) throw resendError;
            toast.success(t.registerSuccessToast);
            setResendTimer(60);
        } catch (err: any) {
            toast.error(err.message || t.registerFailedRetry);
        }
    };

    if (step === 'VERIFY') {
        return (
            <div className="min-h-screen bg-secondary/30 flex items-center justify-center p-4">
                <div className="bg-card w-full max-w-md rounded-3xl shadow-xl p-8 text-center space-y-6">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                        <Mail className="w-10 h-10 text-green-600" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold">{t.codeSentTitle}</h2>
                        <p className="text-muted-foreground">
                            {t.codeSentPrefix}<span className="font-semibold text-foreground">{email}</span>{t.codeSentSuffix}
                        </p>
                    </div>

                    <form onSubmit={handleVerifyOtp} className="space-y-4 text-left">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 ml-1">{t.codeLabel}</label>
                            <input
                                type="text"
                                required
                                maxLength={6}
                                value={otpCode}
                                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                                placeholder="0 0 0 0 0 0"
                                className="w-full py-5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none font-black text-center text-2xl tracking-[0.5em] placeholder:tracking-normal placeholder:font-medium placeholder:text-sm"
                                autoFocus
                            />
                        </div>

                        {error && (
                            <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm border border-red-100 italic">
                                ⚠️ {error}
                            </div>
                        )}

                        <Button
                            type="submit"
                            disabled={verifyLoading || otpCode.length !== 6}
                            className="w-full py-6 font-bold text-lg rounded-xl btn-action"
                        >
                            {verifyLoading ? t.verifying : (<>{t.confirmRegister} <ArrowRight className="ml-2 w-5 h-5" /></>)}
                        </Button>

                        <p className="text-center text-sm text-muted-foreground">
                            {t.noCode}{" "}
                            {resendTimer > 0 ? (
                                <span className="text-slate-400 font-bold">{t.resendIn(resendTimer)}</span>
                            ) : (
                                <button type="button" onClick={handleResendCode} className="text-primary font-bold hover:underline">
                                    {t.resend}
                                </button>
                            )}
                        </p>

                        <button
                            type="button"
                            onClick={() => { setStep('FORM'); setOtpCode(""); setError(null); }}
                            className="w-full text-center text-sm text-muted-foreground hover:text-primary transition-colors"
                        >
                            {t.changeEmail}
                        </button>
                    </form>
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

                        {/* Was a hardcoded 3-option <select> (NODE_LEES/NODE_KANATA/
                            NODE_DOWNTOWN) from before the 37-neighborhood district-
                            grouped node system shipped (see NodePicker.tsx) — anyone
                            whose activeNodeId was one of the other 34 real
                            neighborhoods got a <select> whose value matched no
                            <option>, which is exactly the kind of thing that can
                            silently break submission. Reuses the same real picker
                            BecomeProvider.tsx already uses in controlled mode. */}
                        <NodePicker
                            value={nodeId}
                            onChange={setNodeId}
                            className="w-full !h-[58px] !justify-between !px-4 !rounded-xl !border !border-input !bg-muted/30 hover:!bg-background !text-sm !font-medium !text-foreground focus:!border-primary transition-all"
                        />
                    </div>

                    <div className="flex items-start gap-2 pt-2">
                        <input
                            type="checkbox"
                            id="tos-consent"
                            checked={agreedToTerms}
                            onChange={(e) => { setAgreedToTerms(e.target.checked); setError(null); }}
                            className="mt-1 w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <label htmlFor="tos-consent" className="text-xs text-muted-foreground leading-tight opacity-80 select-none cursor-pointer">
                            {t.consentPrefix}<Link to="/legal/terms" target="_blank" className="underline font-bold hover:text-primary" onClick={(e) => e.stopPropagation()}>{t.termsOfService}</Link>{t.consentMiddle}<Link to="/legal/privacy" target="_blank" className="underline font-bold hover:text-primary" onClick={(e) => e.stopPropagation()}>{t.privacyPolicy}</Link>{t.consentSuffix}
                        </label>
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
                </form>
            </div>
        </div>
    );
};

export default Register;
