import { useState, useEffect } from "react";
import { Lock, Eye, EyeOff, CheckCircle2, Shield, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const ResetPassword = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [validToken, setValidToken] = useState(true);

    // Password strength indicators
    const [passwordStrength, setPasswordStrength] = useState({
        length: false,
        uppercase: false,
        lowercase: false,
        number: false,
        special: false
    });

    useEffect(() => {
        // Check if we have a valid session from the reset link
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                setValidToken(false);
                toast.error("重置链接无效或已过期");
            }
        };
        checkSession();
    }, []);

    useEffect(() => {
        // Check password strength
        setPasswordStrength({
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /[0-9]/.test(password),
            special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
        });
    }, [password]);

    const getPasswordStrengthColor = () => {
        const score = Object.values(passwordStrength).filter(Boolean).length;
        if (score <= 2) return "text-red-500";
        if (score <= 3) return "text-yellow-500";
        if (score <= 4) return "text-blue-500";
        return "text-green-500";
    };

    const getPasswordStrengthText = () => {
        const score = Object.values(passwordStrength).filter(Boolean).length;
        if (score <= 2) return "弱";
        if (score <= 3) return "中等";
        if (score <= 4) return "强";
        return "非常强";
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // Validation
        if (password !== confirmPassword) {
            setError("两次输入的密码不一致");
            setLoading(false);
            return;
        }

        if (password.length < 8) {
            setError("密码长度至少为 8 位");
            setLoading(false);
            return;
        }

        if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
            setError("密码必须包含字母和数字");
            setLoading(false);
            return;
        }

        try {
            const { error: updateError } = await supabase.auth.updateUser({
                password: password
            });

            if (updateError) throw updateError;

            setSuccess(true);
            toast.success("密码重置成功！");

            // Auto redirect to login after 3 seconds
            setTimeout(() => {
                navigate('/login');
            }, 3000);

        } catch (err: any) {
            const msg = err.message.includes('same password')
                ? '新密码不能与旧密码相同'
                : "重置失败，请重试";
            setError(msg);
            toast.error(msg);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (!validToken) {
        return (
            <div className="min-h-screen bg-secondary/30 flex items-center justify-center p-4">
                <div className="bg-card w-full max-w-md rounded-3xl shadow-xl p-8 text-center space-y-6">
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                        <Shield className="w-10 h-10 text-red-600" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold">链接已失效</h2>
                        <p className="text-muted-foreground">
                            重置链接无效或已过期，请重新申请密码重置
                        </p>
                    </div>
                    <Button
                        className="w-full py-6 font-bold text-lg rounded-xl btn-action"
                        onClick={() => navigate('/forgot-password')}
                    >
                        重新申请
                    </Button>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="min-h-screen bg-secondary/30 flex items-center justify-center p-4">
                <div className="bg-card w-full max-w-md rounded-3xl shadow-xl p-8 text-center space-y-6">
                    <div className="relative">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto animate-bounce">
                            <CheckCircle2 className="w-10 h-10 text-green-600" />
                        </div>
                        <div className="absolute inset-0 w-20 h-20 bg-green-100 rounded-full mx-auto animate-ping" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold">密码重置成功！</h2>
                        <p className="text-muted-foreground">
                            您的密码已成功重置，正在跳转到登录页...
                        </p>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        3秒后自动跳转
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-secondary/30 flex items-center justify-center p-4">
            <div className="bg-card w-full max-w-md rounded-3xl shadow-xl overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-hero p-8 text-center text-white">
                    <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-4 shadow-glow">
                        <KeyRound className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-extrabold text-white">重置密码</h1>
                    <p className="opacity-80 text-sm text-white">设置您的新密码</p>
                </div>

                {/* Form */}
                <form onSubmit={handleResetPassword} className="p-8 space-y-6 bg-background">
                    <div className="space-y-4">
                        {/* New Password */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">
                                新密码
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="输入新密码"
                                    className="w-full pl-12 pr-12 py-4 rounded-xl border bg-muted/30 focus:border-primary focus:bg-background transition-all outline-none"
                                    autoFocus
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Password Strength Indicator */}
                        {password && (
                            <div className="space-y-2 animate-in fade-in duration-200">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">密码强度</span>
                                    <span className={`text-sm font-medium ${getPasswordStrengthColor()}`}>
                                        {getPasswordStrengthText()}
                                    </span>
                                </div>
                                <div className="grid grid-cols-5 gap-1">
                                    {[...Array(5)].map((_, i) => (
                                        <div
                                            key={i}
                                            className={`h-1 rounded-full transition-all duration-300 ${i < Object.values(passwordStrength).filter(Boolean).length
                                                ? getPasswordStrengthColor().replace('text-', 'bg-')
                                                : 'bg-muted'
                                                }`}
                                        />
                                    ))}
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                                    <div className={`flex items-center gap-1 ${passwordStrength.length ? 'text-green-600' : ''}`}>
                                        <div className={`w-1.5 h-1.5 rounded-full ${passwordStrength.length ? 'bg-green-600' : 'bg-muted'}`} />
                                        至少8个字符
                                    </div>
                                    <div className={`flex items-center gap-1 ${passwordStrength.uppercase ? 'text-green-600' : ''}`}>
                                        <div className={`w-1.5 h-1.5 rounded-full ${passwordStrength.uppercase ? 'bg-green-600' : 'bg-muted'}`} />
                                        包含大写字母
                                    </div>
                                    <div className={`flex items-center gap-1 ${passwordStrength.lowercase ? 'text-green-600' : ''}`}>
                                        <div className={`w-1.5 h-1.5 rounded-full ${passwordStrength.lowercase ? 'bg-green-600' : 'bg-muted'}`} />
                                        包含小写字母
                                    </div>
                                    <div className={`flex items-center gap-1 ${passwordStrength.number ? 'text-green-600' : ''}`}>
                                        <div className={`w-1.5 h-1.5 rounded-full ${passwordStrength.number ? 'bg-green-600' : 'bg-muted'}`} />
                                        包含数字
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Confirm Password */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">
                                确认新密码
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="再次输入新密码"
                                    className={`w-full pl-12 pr-4 py-4 rounded-xl border bg-muted/30 focus:border-primary focus:bg-background transition-all outline-none ${confirmPassword && password !== confirmPassword ? 'border-red-500' : ''
                                        }`}
                                />
                                {confirmPassword && password === confirmPassword && (
                                    <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-green-600" />
                                )}
                            </div>
                            {confirmPassword && password !== confirmPassword && (
                                <p className="text-xs text-red-600">密码不匹配</p>
                            )}
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm border border-red-100 animate-in fade-in duration-200">
                                ⚠️ {error}
                            </div>
                        )}
                    </div>

                    {/* Submit Button */}
                    <Button
                        type="submit"
                        className="w-full py-6 font-bold text-lg rounded-xl btn-action"
                        disabled={loading || !password || !confirmPassword || password !== confirmPassword}
                    >
                        {loading ? (
                            <div className="flex items-center justify-center gap-2">
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                重置中...
                            </div>
                        ) : (
                            '确认重置'
                        )}
                    </Button>
                </form>
            </div>
        </div>
    );
};

export default ResetPassword;