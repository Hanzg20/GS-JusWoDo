import { useState, useEffect } from "react";
import SEO from "@/components/SEO";
import {
    Mail,
    Eye,
    EyeOff,
    ShieldCheck,
    AlertCircle,
    Phone,
    ChevronDown,
    Sparkles,
    ArrowRight,
    UserPlus,
    Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, Link } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const Login = () => {
    const navigate = useNavigate();
    const { currentUser, isLoading: authLoading } = useAuthStore();
    const [loading, setLoading] = useState(false);

    // Smart input that detects phone or email
    const [identifier, setIdentifier] = useState("");
    const [identifierType, setIdentifierType] = useState<'phone' | 'email' | null>(null);
    const [otpCode, setOtpCode] = useState("");
    const [step, setStep] = useState<'INPUT' | 'VERIFY'>('INPUT');
    const [timer, setTimer] = useState(0);
    const [error, setError] = useState<string | null>(null);

    // Password login toggles
    const [showPasswordLogin, setShowPasswordLogin] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    // Auto-navigate when user is loaded
    useEffect(() => {
        if (currentUser) {
            navigate("/");
        }
    }, [currentUser, navigate]);

    // Timer countdown
    useEffect(() => {
        if (timer > 0) {
            const countdown = setTimeout(() => setTimer(timer - 1), 1000);
            return () => clearTimeout(countdown);
        }
    }, [timer]);

    // Detect if input is phone or email
    const detectIdentifierType = (value: string): 'phone' | 'email' | null => {
        const cleaned = value.replace(/\D/g, '');
        if (cleaned.length >= 10 || value.startsWith('+1') || value.startsWith('1')) {
            return 'phone';
        }
        if (value.includes('@')) {
            return 'email';
        }
        return null;
    };

    // Format phone number (Canada)
    const formatPhoneNumber = (value: string) => {
        const digits = value.replace(/\D/g, '');
        const limited = digits.slice(0, 11);
        if (limited.length === 0) return '';
        if (limited.length <= 1) return `+${limited}`;
        if (limited.length <= 4) return `+${limited[0]} (${limited.slice(1)}`;
        if (limited.length <= 7) return `+${limited[0]} (${limited.slice(1, 4)}) ${limited.slice(4)}`;
        return `+${limited[0]} (${limited.slice(1, 4)}) ${limited.slice(4, 7)}-${limited.slice(7)}`;
    };

    const handleIdentifierChange = (value: string) => {
        const type = detectIdentifierType(value);
        setIdentifierType(type);
        if (type === 'phone') {
            setIdentifier(formatPhoneNumber(value));
        } else {
            setIdentifier(value);
        }
        setError(null);
    };

    const getCleanPhone = (formatted: string): string => {
        const digits = formatted.replace(/\D/g, '');
        return `+${digits}`;
    };

    const handleSendOtp = async (e: React.FormEvent) => {
        if (e) e.preventDefault();
        setError(null);
        if (!identifierType) {
            setError("请输入有效的手机号或邮箱");
            return;
        }
        setLoading(true);
        try {
            if (identifierType === 'phone') {
                const cleanPhone = getCleanPhone(identifier);
                const { error: otpError } = await supabase.auth.signInWithOtp({
                    phone: cleanPhone,
                    options: { channel: 'sms' }
                });
                if (otpError) throw otpError;
                toast.success(`验证码已发送至 ${identifier}`);
            } else {
                const { error: otpError } = await supabase.auth.signInWithOtp({
                    email: identifier.trim(),
                    options: { emailRedirectTo: window.location.origin }
                });
                if (otpError) throw otpError;
                toast.success("验证码已发送到您的邮箱");
            }
            setStep('VERIFY');
            setTimer(60);
        } catch (err: any) {
            setError(err.message || "发送失败");
            toast.error(err.message || "发送失败");
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
            let verifyResult;
            if (identifierType === 'phone') {
                verifyResult = await supabase.auth.verifyOtp({
                    phone: getCleanPhone(identifier),
                    token: otpCode,
                    type: 'sms'
                });
            } else {
                verifyResult = await supabase.auth.verifyOtp({
                    email: identifier.trim(),
                    token: otpCode,
                    type: 'email'
                });
            }

            if (verifyResult.error) throw verifyResult.error;
            toast.success("登录成功");
            // AuthStore will handle the state change automatically via onAuthStateChange
            navigate("/");
        } catch (err: any) {
            setError("验证码无效或已过期");
            toast.error("验证码无效");
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            const { error: loginError } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password,
            });
            if (loginError) throw loginError;
            toast.success("登录成功");
            navigate("/");
        } catch (err: any) {
            setError("邮箱或密码错误");
            toast.error("登录失败");
        } finally {
            setLoading(false);
        }
    };

    const handleSocialLogin = async (provider: 'google' | 'apple') => {
        try {
            setLoading(true);
            const { error } = await supabase.auth.signInWithOAuth({
                provider,
                options: { redirectTo: window.location.origin }
            });
            if (error) throw error;
        } catch (err: any) {
            toast.error(`${provider} 登录失败`);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4 sm:p-6 overflow-hidden relative">
            <SEO title="登录 / Login" />
            {/* Background Orbs */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/10 rounded-full blur-[120px] animate-pulse" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-[1000px] grid lg:grid-cols-2 bg-white rounded-[32px] shadow-2xl overflow-hidden border border-white/20 backdrop-blur-sm"
            >
                {/* Left Tier: Hero & Branding */}
                <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-white relative">
                    <div className="relative z-10">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-8">
                            <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <h2 className="text-4xl font-black mb-4 leading-tight">
                            让邻里互助<br />变得更简单
                        </h2>
                        <p className="text-white/80 text-lg max-w-sm">
                            加入 JUSTWEDO 社区，发现身边的美好服务，与邻居一起 Get Things Done.
                        </p>
                    </div>

                    <div className="relative z-10 space-y-6">
                        <div className="flex -space-x-3">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="w-10 h-10 rounded-full border-2 border-primary bg-white/10 backdrop-blur-md overflow-hidden">
                                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=user${i}`} alt="avatar" />
                                </div>
                            ))}
                            <div className="w-10 h-10 rounded-full border-2 border-primary bg-white/20 backdrop-blur-md flex items-center justify-center text-xs font-bold">
                                +2k
                            </div>
                        </div>
                        <p className="text-sm font-medium text-white/70 italic">
                            "这是我在渥太华用过最温馨的社区平台"
                        </p>
                    </div>

                    {/* Decorative Elements */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/5 rounded-full -ml-32 -mb-32 blur-3xl" />
                </div>

                {/* Right Tier: Auth Forms */}
                <div className="p-8 lg:p-12">
                    <div className="max-w-md mx-auto h-full flex flex-col justify-center">
                        {/* Mobile Header / Brand */}
                        <div className="lg:hidden text-center mb-10">
                            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
                                <Sparkles className="w-8 h-8 text-white" />
                            </div>
                            <h1 className="text-3xl font-black text-slate-900">欢迎回来</h1>
                            <p className="text-muted-foreground mt-2">登录 JUSTWEDO 开启邻里互助之旅</p>
                        </div>

                        <div className="hidden lg:block mb-10">
                            <h1 className="text-3xl font-black text-slate-900">登录</h1>
                            <p className="text-muted-foreground mt-2">很高兴再次见到您！</p>
                        </div>

                        <div className="space-y-6">
                            <AnimatePresence mode="wait">
                                {step === 'INPUT' ? (
                                    <motion.div
                                        key="input"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        className="space-y-6"
                                    >
                                        {!showPasswordLogin ? (
                                            <form onSubmit={handleSendOtp} className="space-y-4">
                                                <div className="space-y-2">
                                                    <label className="text-sm font-bold text-slate-700 ml-1">手机号或邮箱</label>
                                                    <div className="relative group">
                                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                                                            {identifierType === 'phone' ? <Phone className="w-5 h-5" /> : <Mail className="w-5 h-5" />}
                                                        </div>
                                                        <input
                                                            type="text"
                                                            required
                                                            value={identifier}
                                                            onChange={(e) => handleIdentifierChange(e.target.value)}
                                                            placeholder="手机号 (Canada) 或 邮箱"
                                                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none font-medium"
                                                        />
                                                    </div>
                                                </div>

                                                {error && (
                                                    <motion.div
                                                        initial={{ opacity: 0, scale: 0.95 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm flex items-start gap-3"
                                                    >
                                                        <AlertCircle className="w-5 h-5 shrink-0" />
                                                        <span>{error}</span>
                                                    </motion.div>
                                                )}

                                                <Button
                                                    type="submit"
                                                    disabled={loading || !identifierType}
                                                    className="w-full py-7 rounded-2xl font-black text-lg bg-primary hover:bg-primary/90 shadow-xl hover:shadow-primary/20 transition-all active:scale-[0.98]"
                                                >
                                                    {loading ? (
                                                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                    ) : (
                                                        <span className="flex items-center gap-2">
                                                            获取验证码 <ArrowRight className="w-5 h-5" />
                                                        </span>
                                                    )}
                                                </Button>
                                            </form>
                                        ) : (
                                            <form onSubmit={handlePasswordLogin} className="space-y-4">
                                                <div className="space-y-4">
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-bold text-slate-700 ml-1">邮箱</label>
                                                        <div className="relative group">
                                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                                                            <input
                                                                type="email"
                                                                required
                                                                value={email}
                                                                onChange={(e) => setEmail(e.target.value)}
                                                                placeholder="your@email.com"
                                                                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none font-medium"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <div className="flex items-center justify-between px-1">
                                                            <label className="text-sm font-bold text-slate-700">密码</label>
                                                            <Link to="/forgot-password" className="text-xs text-primary font-bold hover:underline">
                                                                忘记密码？
                                                            </Link>
                                                        </div>
                                                        <div className="relative group">
                                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                                                            <input
                                                                type={showPassword ? "text" : "password"}
                                                                required
                                                                value={password}
                                                                onChange={(e) => setPassword(e.target.value)}
                                                                placeholder="••••••••"
                                                                className="w-full pl-12 pr-12 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none font-medium"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => setShowPassword(!showPassword)}
                                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                                            >
                                                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>

                                                {error && (
                                                    <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm flex items-start gap-3">
                                                        <AlertCircle className="w-5 h-5 shrink-0" />
                                                        <span>{error}</span>
                                                    </div>
                                                )}

                                                <Button
                                                    type="submit"
                                                    disabled={loading}
                                                    className="w-full py-7 rounded-2xl font-black text-lg bg-slate-900 hover:bg-slate-800 shadow-xl transition-all"
                                                >
                                                    {loading ? "登录中..." : "立即登录"}
                                                </Button>
                                            </form>
                                        )}
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="verify"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="space-y-6"
                                    >
                                        <div className="bg-primary/5 rounded-2xl p-4 border border-primary/20 flex items-center gap-3">
                                            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                                                {identifierType === 'phone' ? <Phone className="w-5 h-5" /> : <Mail className="w-5 h-5" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs text-primary/60 font-bold uppercase tracking-wider">验证码已发送至</p>
                                                <p className="text-sm font-black truncate">{identifier}</p>
                                            </div>
                                            <button
                                                onClick={() => setStep('INPUT')}
                                                className="text-xs font-bold text-primary hover:underline underline-offset-4"
                                            >
                                                更换
                                            </button>
                                        </div>

                                        <form onSubmit={handleVerifyOtp} className="space-y-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-bold text-slate-700 ml-1">6 位验证码</label>
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
                                                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm flex items-start gap-3">
                                                    <AlertCircle className="w-5 h-5 shrink-0" />
                                                    <span>{error}</span>
                                                </div>
                                            )}

                                            <Button
                                                type="submit"
                                                disabled={loading || otpCode.length !== 6}
                                                className="w-full py-7 rounded-2xl font-black text-lg bg-primary hover:bg-primary/90 shadow-xl transition-all"
                                            >
                                                {loading ? "验证中..." : "确认登录"}
                                            </Button>

                                            <p className="text-center text-sm text-muted-foreground pt-2">
                                                没收到验证码？{" "}
                                                {timer > 0 ? (
                                                    <span className="text-slate-400 font-bold">{timer}秒后可重发</span>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={handleSendOtp}
                                                        disabled={loading}
                                                        className="text-primary font-bold hover:underline"
                                                    >
                                                        重新发送
                                                    </button>
                                                )}
                                            </p>
                                        </form>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Toggle Login Method */}
                            {step === 'INPUT' && (
                                <div className="pt-2">
                                    <button
                                        onClick={() => {
                                            setShowPasswordLogin(!showPasswordLogin);
                                            setError(null);
                                        }}
                                        className="w-full py-3 text-sm font-bold text-slate-500 hover:text-primary transition-colors flex items-center justify-center gap-2"
                                    >
                                        {!showPasswordLogin ? (
                                            <><Lock className="w-4 h-4" /> 使用邮箱密码登录</>
                                        ) : (
                                            <><Phone className="w-4 h-4" /> 使用手机验证码登录</>
                                        )}
                                    </button>
                                </div>
                            )}

                            {/* OAuth Tier */}
                            <div className="pt-6 border-t border-slate-100 space-y-4">
                                <p className="text-xs font-black text-slate-400 text-center uppercase tracking-widest">第三方登录</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => handleSocialLogin('google')}
                                        disabled={loading}
                                        className="flex items-center justify-center gap-2 py-4 border-2 border-slate-100 rounded-2xl hover:bg-slate-50 hover:border-slate-200 transition-all font-bold text-sm disabled:opacity-50"
                                    >
                                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                        </svg>
                                        Google
                                    </button>
                                    <button
                                        onClick={() => handleSocialLogin('apple')}
                                        disabled={loading}
                                        className="flex items-center justify-center gap-2 py-4 border-2 border-slate-100 rounded-2xl hover:bg-slate-50 hover:border-slate-200 transition-all font-bold text-sm disabled:opacity-50"
                                    >
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                                        </svg>
                                        Apple
                                    </button>
                                </div>
                            </div>

                            {/* Bottom tier */}
                            <div className="pt-6 text-center">
                                <p className="text-slate-500 font-medium">
                                    还没有账号？{" "}
                                    <Link to="/register" className="text-primary font-black hover:underline inline-flex items-center gap-1 group">
                                        <UserPlus className="w-4 h-4" /> 开启体验
                                    </Link>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
