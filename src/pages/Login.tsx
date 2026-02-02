import { useState, useEffect } from "react";
import { Mail, Eye, EyeOff, ShieldCheck, AlertCircle, Phone, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, Link } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const LoginMinimal = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuthStore();
    const [loading, setLoading] = useState(false);

    // Smart input that detects phone or email
    const [identifier, setIdentifier] = useState(""); // phone or email
    const [identifierType, setIdentifierType] = useState<'phone' | 'email' | null>(null);
    const [otpCode, setOtpCode] = useState("");
    const [step, setStep] = useState<'INPUT' | 'VERIFY'>('INPUT');
    const [timer, setTimer] = useState(0);
    const [error, setError] = useState<string | null>(null);

    // Password login (collapsed by default)
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

        // Phone: starts with 1 or has 10+ digits
        if (cleaned.length >= 10 || value.startsWith('+1') || value.startsWith('1')) {
            return 'phone';
        }

        // Email: contains @
        if (value.includes('@')) {
            return 'email';
        }

        return null;
    };

    // Format phone number
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
        e.preventDefault();
        setError(null);

        if (!identifierType) {
            setError("请输入有效的手机号或邮箱");
            return;
        }

        setLoading(true);

        try {
            if (identifierType === 'phone') {
                const cleanPhone = getCleanPhone(identifier);
                const phoneRegex = /^\+1[2-9]\d{9}$/;

                if (!phoneRegex.test(cleanPhone)) {
                    throw new Error('请输入有效的加拿大手机号');
                }

                const { error: otpError } = await supabase.auth.signInWithOtp({
                    phone: cleanPhone,
                    options: { channel: 'sms' }
                });

                if (otpError) throw otpError;
                toast.success(`验证码已发送至 ${identifier}`);
            } else {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(identifier)) {
                    throw new Error('请输入有效的邮箱地址');
                }

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
            const msg = err.message.includes('rate_limit') ? '发送太频繁，请稍后再试' :
                err.message || "发送失败，请稍后重试";
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
            if (identifierType === 'phone') {
                const cleanPhone = getCleanPhone(identifier);
                const { data, error: verifyError } = await supabase.auth.verifyOtp({
                    phone: cleanPhone,
                    token: otpCode,
                    type: 'sms'
                });
                if (verifyError) throw verifyError;

                // Create user_profiles if it doesn't exist (phone login)
                if (data?.user) {
                    await ensureUserProfile(data.user);
                }
            } else {
                const { data, error: verifyError } = await supabase.auth.verifyOtp({
                    email: identifier.trim(),
                    token: otpCode,
                    type: 'email'
                });
                if (verifyError) throw verifyError;

                // Create user_profiles if it doesn't exist (email login)
                if (data?.user) {
                    await ensureUserProfile(data.user);
                }
            }

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

    // Helper function to ensure user_profiles exists
    const ensureUserProfile = async (user: any) => {
        try {
            // Check if user_profiles exists
            const { data: existingProfile, error: checkError } = await supabase
                .from('user_profiles')
                .select('id')
                .eq('id', user.id)
                .maybeSingle();

            if (checkError && checkError.code !== 'PGRST116') {
                console.error('Error checking user profile:', checkError);
                return;
            }

            // If profile doesn't exist, create it
            if (!existingProfile) {
                console.log('Creating user_profiles for new user:', user.id);

                // Generate default name
                let defaultName = 'Neighbor';
                if (user.user_metadata?.name) {
                    defaultName = user.user_metadata.name;
                } else if (user.email) {
                    defaultName = user.email.split('@')[0];
                } else if (user.phone) {
                    defaultName = `User_${user.phone.slice(-4)}`;
                }

                const { error: insertError } = await supabase
                    .from('user_profiles')
                    .insert({
                        id: user.id,
                        email: user.email || null,
                        phone: user.phone || null,
                        name: defaultName,
                        node_id: 'NODE_LEES',
                        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`,
                        roles: ['BUYER'],
                        beans_balance: 0
                    });

                if (insertError) {
                    console.error('Error creating user profile:', insertError);
                } else {
                    console.log('Successfully created user_profiles for:', user.id);
                }
            }
        } catch (error) {
            console.error('Error in ensureUserProfile:', error);
        }
    };

    const handlePasswordLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const { data, error: loginError } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password,
            });

            if (loginError) throw loginError;

            toast.success("正在进入社区...");
            useAuthStore.getState().initializeAuth(data.session);
        } catch (err: any) {
            const msg = err.message === 'Invalid login credentials' ? '邮箱或密码错误' :
                err.message === 'Email not confirmed' ? '邮箱未验证，请检查收件箱' :
                "登录失败，请稍后重试";
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
                options: { redirectTo: window.location.origin }
            });
        } catch (err: any) {
            toast.error('Apple 登录失败，请稍后重试');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10 flex items-center justify-center p-4">
            <div className="bg-card w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-hero p-8 text-center text-white">
                    <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-4 shadow-glow">
                        <span className="text-3xl font-bold">H</span>
                    </div>
                    <h1 className="text-2xl font-extrabold text-white">欢迎回来</h1>
                    <p className="opacity-90 text-sm text-white mt-1">登录 JUSTWEDO 社区</p>
                </div>

                <div className="p-8 space-y-6 bg-background">
                    {/* OAuth Providers - Google & Apple in same row */}
                    <div className="grid grid-cols-2 gap-3">
                        {/* Google Login */}
                        <button
                            onClick={handleGoogleLogin}
                            disabled={loading}
                            className="flex flex-col items-center justify-center gap-2 px-4 py-4 bg-white border-2 border-gray-200 rounded-2xl hover:border-primary hover:bg-primary/5 hover:shadow-md transition-all font-semibold group disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <svg className="w-6 h-6" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            <span className="text-sm">Google</span>
                        </button>

                        {/* Apple Login - Disabled for now */}
                        <button
                            onClick={handleAppleLogin}
                            disabled={true}
                            title="即将推出"
                            className="relative flex flex-col items-center justify-center gap-2 px-4 py-4 bg-gray-100 border-2 border-gray-200 rounded-2xl transition-all font-semibold cursor-not-allowed opacity-60"
                        >
                            <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                            </svg>
                            <span className="text-sm text-gray-400">Apple</span>
                            <span className="absolute top-1 right-1 text-[9px] bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded-full font-bold">即将推出</span>
                        </button>
                    </div>

                    {/* Divider */}
                    <div className="relative py-4">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-gray-200"></span>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-background text-muted-foreground font-medium">或</span>
                        </div>
                    </div>

                    {/* Smart OTP Login */}
                    {step === 'INPUT' ? (
                        <form onSubmit={handleSendOtp} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                    {identifierType === 'phone' ? <Phone className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
                                    {identifierType === 'phone' ? '手机号' : identifierType === 'email' ? '邮箱' : '手机号或邮箱'}
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={identifier}
                                    onChange={(e) => handleIdentifierChange(e.target.value)}
                                    placeholder="输入手机号或邮箱"
                                    className="w-full px-4 py-4 rounded-xl border-2 border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none font-mono"
                                />
                                {identifierType && (
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                        {identifierType === 'phone' ? '📱 将发送短信验证码' : '📧 将发送邮件验证码'}
                                    </p>
                                )}
                            </div>

                            {error && (
                                <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm border border-red-100 flex items-start gap-2">
                                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}

                            <Button
                                type="submit"
                                className="w-full py-6 font-bold text-base rounded-xl shadow-lg hover:shadow-xl transition-all"
                                disabled={loading || timer > 0 || !identifierType}
                            >
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
                            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                                <p className="text-sm text-green-700 flex items-center gap-2">
                                    {identifierType === 'phone' ? '📲' : '📧'} 验证码已发送至 <strong className="font-mono">{identifier}</strong>
                                </p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4" />
                                    验证码
                                </label>
                                <input
                                    type="text"
                                    required
                                    maxLength={6}
                                    value={otpCode}
                                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                                    placeholder="6位验证码"
                                    className="w-full px-4 py-4 rounded-xl border-2 border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 tracking-[0.5em] font-mono text-center text-xl outline-none"
                                    autoFocus
                                />
                            </div>

                            {error && (
                                <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm border border-red-100 flex items-start gap-2">
                                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}

                            <Button
                                type="submit"
                                className="w-full py-6 font-bold text-base rounded-xl shadow-lg hover:shadow-xl transition-all"
                                disabled={loading || otpCode.length !== 6}
                            >
                                {loading ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        验证中...
                                    </div>
                                ) : (
                                    '确认登录'
                                )}
                            </Button>

                            <div className="flex items-center justify-between text-sm">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setStep('INPUT');
                                        setOtpCode('');
                                        setError(null);
                                    }}
                                    className="text-muted-foreground hover:text-primary transition-colors"
                                >
                                    ← 返回修改
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (timer === 0) {
                                            handleSendOtp(new Event('submit') as any);
                                        }
                                    }}
                                    disabled={timer > 0 || loading}
                                    className={`font-medium transition-colors ${
                                        timer > 0 || loading
                                            ? 'text-muted-foreground cursor-not-allowed'
                                            : 'text-primary hover:underline'
                                    }`}
                                >
                                    {timer > 0 ? `重新发送(${timer}s)` : '重新发送'}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Password Login (Collapsed) */}
                    {step === 'INPUT' && (
                        <div className="pt-2 border-t border-gray-100">
                            <button
                                onClick={() => setShowPasswordLogin(!showPasswordLogin)}
                                className="w-full text-sm text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-1 py-2"
                            >
                                使用密码登录
                                <ChevronDown className={`w-4 h-4 transition-transform ${showPasswordLogin ? 'rotate-180' : ''}`} />
                            </button>

                            {showPasswordLogin && (
                                <form onSubmit={handlePasswordLogin} className="mt-4 space-y-3 animate-in fade-in duration-200">
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="电子邮箱"
                                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                    />
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="密码"
                                            className="w-full px-4 py-3 pr-12 rounded-xl border-2 border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                    <Button
                                        type="submit"
                                        variant="outline"
                                        className="w-full py-3 font-semibold rounded-xl"
                                        disabled={loading}
                                    >
                                        {loading ? '登录中...' : '登录'}
                                    </Button>
                                    <Link
                                        to="/forgot-password"
                                        className="block text-center text-xs text-primary hover:underline"
                                    >
                                        忘记密码？
                                    </Link>
                                </form>
                            )}
                        </div>
                    )}

                    {/* Register Link */}
                    <p className="text-center text-sm text-muted-foreground pt-4">
                        还没有账号？
                        <Link to="/register" className="text-primary font-semibold hover:underline ml-1">
                            立即注册
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginMinimal;
