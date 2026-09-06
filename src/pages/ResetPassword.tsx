import { useState, useEffect } from "react";
import { Lock, Eye, EyeOff, CheckCircle2, Shield, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useConfigStore } from "@/stores/configStore";

const ResetPassword = () => {
    const navigate = useNavigate();
    const { language } = useConfigStore();
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

    const t = {
        linkInvalidToast: language === 'zh' ? '重置链接无效或已过期' : 'Reset link is invalid or has expired',
        strengthWeak: language === 'zh' ? '弱' : 'Weak',
        strengthMedium: language === 'zh' ? '中等' : 'Medium',
        strengthStrong: language === 'zh' ? '强' : 'Strong',
        strengthVeryStrong: language === 'zh' ? '非常强' : 'Very Strong',
        pwMismatch: language === 'zh' ? '两次输入的密码不一致' : 'Passwords do not match',
        pwTooShort: language === 'zh' ? '密码长度至少为 8 位' : 'Password must be at least 8 characters',
        pwNeedsLetterNumber: language === 'zh' ? '密码必须包含字母和数字' : 'Password must contain both letters and numbers',
        resetSuccessToast: language === 'zh' ? '密码重置成功！' : 'Password reset successful!',
        pwSameAsOld: language === 'zh' ? '新密码不能与旧密码相同' : 'New password cannot be the same as the old one',
        resetFailedRetry: language === 'zh' ? '重置失败，请重试' : 'Reset failed — please try again',
        linkExpiredTitle: language === 'zh' ? '链接已失效' : 'Link Expired',
        linkExpiredHint: language === 'zh' ? '重置链接无效或已过期，请重新申请密码重置' : 'The reset link is invalid or has expired — please request a new one',
        reapply: language === 'zh' ? '重新申请' : 'Request New Link',
        resetSuccessTitle: language === 'zh' ? '密码重置成功！' : 'Password Reset!',
        resetSuccessHint: language === 'zh' ? '您的密码已成功重置，正在跳转到登录页...' : 'Your password has been reset — redirecting to login...',
        redirectingIn3s: language === 'zh' ? '3秒后自动跳转' : 'Redirecting in 3 seconds',
        resetPasswordTitle: language === 'zh' ? '重置密码' : 'Reset Password',
        resetPasswordSubtitle: language === 'zh' ? '设置您的新密码' : 'Set your new password',
        newPassword: language === 'zh' ? '新密码' : 'New Password',
        enterNewPassword: language === 'zh' ? '输入新密码' : 'Enter new password',
        passwordStrengthLabel: language === 'zh' ? '密码强度' : 'Password Strength',
        atLeast8Chars: language === 'zh' ? '至少8个字符' : 'At least 8 characters',
        containsUppercase: language === 'zh' ? '包含大写字母' : 'Contains uppercase letter',
        containsLowercase: language === 'zh' ? '包含小写字母' : 'Contains lowercase letter',
        containsNumber: language === 'zh' ? '包含数字' : 'Contains a number',
        confirmNewPassword: language === 'zh' ? '确认新密码' : 'Confirm New Password',
        reenterNewPassword: language === 'zh' ? '再次输入新密码' : 'Re-enter new password',
        pwNoMatch: language === 'zh' ? '密码不匹配' : "Passwords don't match",
        resetting: language === 'zh' ? '重置中...' : 'Resetting...',
        confirmReset: language === 'zh' ? '确认重置' : 'Confirm Reset',
    };

    useEffect(() => {
        // Check if we have a valid session from the reset link
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                setValidToken(false);
                toast.error(t.linkInvalidToast);
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
        if (score <= 2) return t.strengthWeak;
        if (score <= 3) return t.strengthMedium;
        if (score <= 4) return t.strengthStrong;
        return t.strengthVeryStrong;
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // Validation
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
            const { error: updateError } = await supabase.auth.updateUser({
                password: password
            });

            if (updateError) throw updateError;

            setSuccess(true);
            toast.success(t.resetSuccessToast);

            // Auto redirect to login after 3 seconds
            setTimeout(() => {
                navigate('/login');
            }, 3000);

        } catch (err: any) {
            const msg = err.message.includes('same password')
                ? t.pwSameAsOld
                : t.resetFailedRetry;
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
                        <h2 className="text-2xl font-bold">{t.linkExpiredTitle}</h2>
                        <p className="text-muted-foreground">
                            {t.linkExpiredHint}
                        </p>
                    </div>
                    <Button
                        className="w-full py-6 font-bold text-lg rounded-xl btn-action"
                        onClick={() => navigate('/forgot-password')}
                    >
                        {t.reapply}
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
                        <h2 className="text-2xl font-bold">{t.resetSuccessTitle}</h2>
                        <p className="text-muted-foreground">
                            {t.resetSuccessHint}
                        </p>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        {t.redirectingIn3s}
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
                    <h1 className="text-2xl font-extrabold text-white">{t.resetPasswordTitle}</h1>
                    <p className="opacity-80 text-sm text-white">{t.resetPasswordSubtitle}</p>
                </div>

                {/* Form */}
                <form onSubmit={handleResetPassword} className="p-8 space-y-6 bg-background">
                    <div className="space-y-4">
                        {/* New Password */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">
                                {t.newPassword}
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder={t.enterNewPassword}
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
                                    <span className="text-sm text-muted-foreground">{t.passwordStrengthLabel}</span>
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
                                        {t.atLeast8Chars}
                                    </div>
                                    <div className={`flex items-center gap-1 ${passwordStrength.uppercase ? 'text-green-600' : ''}`}>
                                        <div className={`w-1.5 h-1.5 rounded-full ${passwordStrength.uppercase ? 'bg-green-600' : 'bg-muted'}`} />
                                        {t.containsUppercase}
                                    </div>
                                    <div className={`flex items-center gap-1 ${passwordStrength.lowercase ? 'text-green-600' : ''}`}>
                                        <div className={`w-1.5 h-1.5 rounded-full ${passwordStrength.lowercase ? 'bg-green-600' : 'bg-muted'}`} />
                                        {t.containsLowercase}
                                    </div>
                                    <div className={`flex items-center gap-1 ${passwordStrength.number ? 'text-green-600' : ''}`}>
                                        <div className={`w-1.5 h-1.5 rounded-full ${passwordStrength.number ? 'bg-green-600' : 'bg-muted'}`} />
                                        {t.containsNumber}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Confirm Password */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">
                                {t.confirmNewPassword}
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder={t.reenterNewPassword}
                                    className={`w-full pl-12 pr-4 py-4 rounded-xl border bg-muted/30 focus:border-primary focus:bg-background transition-all outline-none ${confirmPassword && password !== confirmPassword ? 'border-red-500' : ''
                                        }`}
                                />
                                {confirmPassword && password === confirmPassword && (
                                    <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-green-600" />
                                )}
                            </div>
                            {confirmPassword && password !== confirmPassword && (
                                <p className="text-xs text-red-600">{t.pwNoMatch}</p>
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
                                {t.resetting}
                            </div>
                        ) : (
                            t.confirmReset
                        )}
                    </Button>
                </form>
            </div>
        </div>
    );
};

export default ResetPassword;