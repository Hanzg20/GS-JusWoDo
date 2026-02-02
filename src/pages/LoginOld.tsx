import { useState, useEffect } from "react";
import { User as UserIcon, Lock, ArrowRight, Mail, Eye, EyeOff, ShieldCheck, RefreshCw, KeyRound, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, Link } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { UserRoleType } from "@/types/domain";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { PhoneLogin } from "@/components/auth/PhoneLogin";

const Login = () => {
    const navigate = useNavigate();
    const { login } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [otpCode, setOtpCode] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loginMode, setLoginMode] = useState<'PASSWORD' | 'EMAIL_OTP' | 'PHONE_OTP'>('PASSWORD');
    const [otpStep, setOtpStep] = useState<'SEND' | 'VERIFY'>('SEND');
    const [timer, setTimer] = useState(0);
    const [rememberMe, setRememberMe] = useState(false);
    const [emailError, setEmailError] = useState<string | null>(null);
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const { currentUser } = useAuthStore();

    // Auto-navigate when user is loaded
    useEffect(() => {
        if (currentUser) {
            navigate("/");
        }
    }, [currentUser, navigate]);

    // Email validation
    const validateEmail = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email) {
            setEmailError("请输入邮箱地址");
            return false;
        }
        if (!emailRegex.test(email)) {
            setEmailError("请输入有效的邮箱地址");
            return false;
        }
        setEmailError(null);
        return true;
    };

    // Timer countdown for OTP resend
    useEffect(() => {
        if (timer > 0) {
            const countdown = setTimeout(() => setTimer(timer - 1), 1000);
            return () => clearTimeout(countdown);
        }
    }, [timer]);

    // Load remembered email on mount
    useEffect(() => {
        const rememberedEmail = localStorage.getItem('remembered_email');
        if (rememberedEmail) {
            setEmail(rememberedEmail);
            setRememberMe(true);
        }
    }, []);

    const handlePasswordLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setPasswordError(null);

        // Validate inputs
        if (!validateEmail(email)) {
            return;
        }

        if (!password) {
            setPasswordError("请输入密码");
            return;
        }

        setLoading(true);

        try {
            const { data, error: loginError } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password,
            });

            if (loginError) throw loginError;

            // Save email for next time if remember me is checked
            if (rememberMe) {
                localStorage.setItem('remembered_email', email);
            } else {
                localStorage.removeItem('remembered_email');
            }

            toast.success("正在进入社区...");
            // Direct call to speed up, but useEffect will handle the actual navigation
            useAuthStore.getState().initializeAuth(data.session);
        } catch (err: any) {
            const msg = err.message === 'Invalid login credentials' ? '邮箱或密码错误' :
                err.message === 'Email not confirmed' ? '邮箱未验证，请检查收件箱' :
                    err.message.includes('rate_limit') ? '登录尝试次数过多，请稍后再试' :
                        "登录失败，请稍后重试";
            setError(msg);
            toast.error(msg);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validate email
        if (!validateEmail(email)) {
            return;
        }

        setLoading(true);

        try {
            const { error: otpError } = await supabase.auth.signInWithOtp({
                email: email.trim(),
                options: { emailRedirectTo: window.location.origin }
            });

            if (otpError) throw otpError;
            setOtpStep('VERIFY');
            setTimer(60);
            toast.success("验证码已发送到您的邮箱");
        } catch (err: any) {
            const msg = err.message.includes('rate_limit') ? '发送太频繁，请稍后再试' :
                "发送失败，请检查邮箱地址";
            setError(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (otpCode.length !== 6) {
            setError("请输入6位验证码");
            return;
        }

        setLoading(true);
        try {
            const { error: verifyError } = await supabase.auth.verifyOtp({
                email: email.trim(),
                token: otpCode,
                type: 'email'
            });
            if (verifyError) throw verifyError;
            toast.success("验证成功，正在登录...");
            await useAuthStore.getState().initializeAuth();
            navigate("/");
        } catch (err: any) {
            const msg = err.message.includes('expired') ? '验证码已过期，请重新获取' :
                "验证码无效，请重新输入";
            setError(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            setLoading(true);
            await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin,
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent',
                    }
                }
            });
            // User will be redirected to Google
        } catch (err: any) {
            toast.error('Google 登录失败，请稍后重试');
            setLoading(false);
        }
    };

    const handleAppleLogin = async () => {
        try {
            setLoading(true);
            await supabase.auth.signInWithOAuth({
                provider: 'apple',
                options: {
                    redirectTo: window.location.origin
                }
            });
            // User will be redirected to Apple
        } catch (err: any) {
            toast.error('Apple 登录失败，请稍后重试');
            setLoading(false);
        }
    };



    return (
        <div className="min-h-screen bg-secondary/30 flex items-center justify-center p-4">
            <div className="bg-card w-full max-w-md rounded-3xl shadow-xl overflow-hidden flex flex-col">
                <div className="bg-gradient-hero p-8 text-center text-white">
                    <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-4 shadow-glow">
                        <span className="text-3xl font-bold">H</span>
                    </div>
                    <h1 className="text-2xl font-extrabold text-white">欢迎回来</h1>
                    <p className="opacity-80 text-sm text-white">登录 JUSTWEDO 社区</p>
                </div>

                <div className="flex border-b bg-muted/20">
                    <button
                        onClick={() => { setLoginMode('PASSWORD'); setError(null); }}
                        className={`flex-1 py-3 text-xs font-bold transition-all ${loginMode === 'PASSWORD' ? 'text-primary border-b-2 border-primary bg-background' : 'text-muted-foreground'}`}
                    >
                        密码
                    </button>
                    <button
                        onClick={() => { setLoginMode('PHONE_OTP'); setError(null); }}
                        className={`flex-1 py-3 text-xs font-bold transition-all ${loginMode === 'PHONE_OTP' ? 'text-primary border-b-2 border-primary bg-background' : 'text-muted-foreground'}`}
                    >
                        手机号
                    </button>
                    <button
                        onClick={() => { setLoginMode('EMAIL_OTP'); setError(null); }}
                        className={`flex-1 py-3 text-xs font-bold transition-all ${loginMode === 'EMAIL_OTP' ? 'text-primary border-b-2 border-primary bg-background' : 'text-muted-foreground'}`}
                    >
                        邮箱验证码
                    </button>
                </div>

                <div className="p-8 space-y-6 flex-1 bg-background">
                    {/* Social Login - Top Priority */}
                    <div className="space-y-3">
                        <button
                            onClick={handleGoogleLogin}
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-3 px-6 py-4 border-2 border-gray-200 rounded-xl hover:border-primary hover:bg-primary/5 transition-all font-medium group disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            <span>使用 Google 登录</span>
                        </button>

                        <button
                            onClick={handleAppleLogin}
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-black text-white rounded-xl hover:bg-gray-800 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                            </svg>
                            <span>使用 Apple 登录</span>
                        </button>
                    </div>

                    <div className="relative py-2">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-gray-200"></span>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-background text-muted-foreground">或使用邮箱登录</span>
                        </div>
                    </div>
                    {loginMode === 'PASSWORD' ? (
                        <form onSubmit={handlePasswordLogin} className="space-y-4">
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        setEmailError(null);
                                    }}
                                    onBlur={() => validateEmail(email)}
                                    placeholder="电子邮箱"
                                    className={`w-full pl-12 pr-4 py-4 rounded-xl border bg-muted/30 focus:border-primary focus:bg-background transition-all outline-none ${emailError ? 'border-red-500' : ''
                                        }`}
                                />
                                {emailError && <p className="text-xs text-red-600 mt-1">{emailError}</p>}
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        setPasswordError(null);
                                    }}
                                    placeholder="请输入密码"
                                    className={`w-full pl-12 pr-12 py-4 rounded-xl border bg-muted/30 focus:border-primary focus:bg-background transition-all outline-none ${passwordError ? 'border-red-500' : ''
                                        }`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                                {passwordError && <p className="text-xs text-red-600 mt-1">{passwordError}</p>}
                            </div>

                            {/* Remember Me and Forgot Password */}
                            <div className="flex items-center justify-between">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                        className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                    <span className="text-sm text-muted-foreground">记住我</span>
                                </label>
                                <Link
                                    to="/forgot-password"
                                    className="text-sm text-primary hover:underline font-medium"
                                >
                                    忘记密码？
                                </Link>
                            </div>

                            {error && (
                                <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm border border-red-100 flex items-start gap-2 animate-in fade-in duration-200">
                                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}

                            <Button type="submit" className="w-full py-6 font-bold text-lg rounded-xl btn-action" disabled={loading}>
                                {loading ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        登录中...
                                    </div>
                                ) : '立即登录'}
                            </Button>
                        </form>
                    ) : loginMode === 'PHONE_OTP' ? (
                        <PhoneLogin />
                    ) : (
                        <div className="space-y-4 animate-in fade-in duration-300">
                            {otpStep === 'SEND' ? (
                                <form onSubmit={handleSendOtp} className="space-y-4">
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                        <input
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => {
                                                setEmail(e.target.value);
                                                setEmailError(null);
                                            }}
                                            onBlur={() => validateEmail(email)}
                                            placeholder="电子邮箱"
                                            className={`w-full pl-12 pr-4 py-4 rounded-xl border bg-muted/30 focus:border-primary focus:bg-background transition-all outline-none ${emailError ? 'border-red-500' : ''
                                                }`}
                                        />
                                        {emailError && <p className="text-xs text-red-600 mt-1">{emailError}</p>}
                                    </div>
                                    <Button type="submit" className="w-full py-6 font-bold text-lg rounded-xl btn-action" disabled={loading || timer > 0}>
                                        {loading ? (
                                            <div className="flex items-center justify-center gap-2">
                                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                发送中...
                                            </div>
                                        ) : timer > 0 ? (
                                            `重新发送 (${timer}秒)`
                                        ) : (
                                            '发送验证码'
                                        )}
                                    </Button>
                                </form>
                            ) : (
                                <form onSubmit={handleVerifyOtp} className="space-y-4">
                                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                        <p className="text-sm text-blue-700">
                                            📧 验证码已发送至 <strong>{email}</strong>
                                        </p>
                                    </div>
                                    <div className="relative">
                                        <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                        <input
                                            type="text"
                                            required
                                            maxLength={6}
                                            value={otpCode}
                                            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                                            placeholder="6位验证码"
                                            className="w-full pl-12 pr-4 py-4 rounded-xl border bg-muted/30 focus:border-primary focus:bg-background tracking-[0.5em] font-mono text-center text-xl outline-none"
                                            autoFocus
                                        />
                                    </div>
                                    <Button type="submit" className="w-full py-6 font-bold text-lg rounded-xl btn-action" disabled={loading || otpCode.length !== 6}>
                                        {loading ? (
                                            <div className="flex items-center justify-center gap-2">
                                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                验证中...
                                            </div>
                                        ) : '确认登录'}
                                    </Button>
                                    <div className="flex items-center justify-between">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setOtpStep('SEND');
                                                setOtpCode('');
                                                setError(null);
                                            }}
                                            className="text-sm text-muted-foreground hover:text-primary"
                                        >
                                            ← 返回修改邮箱
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (timer === 0) {
                                                    handleSendOtp(new Event('submit') as any);
                                                }
                                            }}
                                            disabled={timer > 0}
                                            className={`text-sm font-medium ${timer > 0 ? 'text-muted-foreground cursor-not-allowed' : 'text-primary hover:underline'}`}
                                        >
                                            {timer > 0 ? `重新发送(${timer}s)` : '重新发送'}
                                        </button>
                                    </div>
                                </form>
                            )}
                            {error && (
                                <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm border border-red-100 flex items-start gap-2 animate-in fade-in duration-200">
                                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}
                        </div>
                    )}



                    <p className="text-center text-sm text-muted-foreground">
                        还没有账号？
                        <Link to="/register" className="text-primary font-bold hover:underline ml-1">立即注册</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
