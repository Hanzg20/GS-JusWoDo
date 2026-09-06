import { useState } from "react";
import { Mail, ArrowLeft, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useConfigStore } from "@/stores/configStore";

const ForgotPassword = () => {
    const navigate = useNavigate();
    const { language } = useConfigStore();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [countdown, setCountdown] = useState(0);

    const t = {
        resetLinkSent: language === 'zh' ? '重置链接已发送' : 'Reset link sent',
        genericSendFailed: language === 'zh' ? '发送失败，请检查邮箱地址' : 'Failed to send — please check the email address',
        rateLimited: language === 'zh' ? '发送频率过高，请等待 1 小时后再试' : 'Too many requests — please wait 1 hour and try again',
        emailNotRegistered: language === 'zh' ? '该邮箱尚未注册' : "This email isn't registered yet",
        sendFailedWithMsg: (msg: string) => language === 'zh' ? `发送失败: ${msg}` : `Failed to send: ${msg}`,
        emailSentTitle: language === 'zh' ? '邮件已发送' : 'Email Sent',
        emailSentPrefix: language === 'zh' ? '我们已向 ' : "We've sent a password reset link to ",
        emailSentSuffix: language === 'zh' ? ' 发送了密码重置链接' : '',
        checkInboxHint: language === 'zh' ? '请检查您的收件箱并点击链接重置密码' : 'Check your inbox and click the link to reset your password',
        noEmailHint: language === 'zh' ? '没有收到邮件？请检查垃圾邮件文件夹' : "Didn't get the email? Check your spam folder",
        resendWithCountdown: (s: number) => language === 'zh' ? `重新发送 (${s}秒)` : `Resend (${s}s)`,
        resend: language === 'zh' ? '重新发送' : 'Resend',
        backToLogin: language === 'zh' ? '返回登录' : 'Back to Login',
        forgotPasswordTitle: language === 'zh' ? '忘记密码' : 'Forgot Password',
        forgotPasswordSubtitle: language === 'zh' ? '我们将发送重置链接到您的邮箱' : "We'll send a reset link to your email",
        enterRegisteredEmail: language === 'zh' ? '输入您的注册邮箱' : 'Enter your registered email',
        infoWithinHourPrefix: language === 'zh' ? '发送重置链接后，请在 ' : 'After sending the reset link, please complete it within ',
        infoWithinHourBold: language === 'zh' ? '1小时内' : '1 hour',
        infoWithinHourSuffix: language === 'zh' ? ' 完成密码重置' : '',
        sending: language === 'zh' ? '发送中...' : 'Sending...',
        sendResetLink: language === 'zh' ? '发送重置链接' : 'Send Reset Link',
        noAccount: language === 'zh' ? '还没有账号？' : "Don't have an account?",
        registerNow: language === 'zh' ? '立即注册' : 'Register',
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });

            if (resetError) throw resetError;

            setSuccess(true);
            toast.success(t.resetLinkSent);

            // Start countdown for resend button
            setCountdown(60);
            const timer = setInterval(() => {
                setCountdown((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

        } catch (err: any) {
            console.error('Reset password error:', err);

            let msg = t.genericSendFailed;

            // Check for rate limit (429 or specific text)
            if (err.status === 429 ||
                err.message?.toLowerCase().includes('rate limit') ||
                err.message?.toLowerCase().includes('rate_limit') ||
                err.message?.includes('security purposes')) {
                msg = t.rateLimited;
            }
            // Check for user not found
            else if (err.message?.toLowerCase().includes('not found')) {
                msg = t.emailNotRegistered;
            }
            // Fallback: show specific error if available to help debugging
            else if (err.message) {
                msg = t.sendFailedWithMsg(err.message);
            }

            setError(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (countdown > 0) return;
        await handleResetPassword(new Event('submit') as any);
    };

    if (success) {
        return (
            <div className="min-h-screen bg-secondary/30 flex items-center justify-center p-4">
                <div className="bg-card w-full max-w-md rounded-3xl shadow-xl p-8 space-y-6">
                    {/* Success Icon Animation */}
                    <div className="relative">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto animate-in zoom-in duration-500">
                            <CheckCircle2 className="w-10 h-10 text-green-600" />
                        </div>
                        <div className="absolute inset-0 w-20 h-20 bg-green-100 rounded-full mx-auto animate-ping" />
                    </div>

                    <div className="text-center space-y-3">
                        <h2 className="text-2xl font-bold">{t.emailSentTitle}</h2>
                        <p className="text-muted-foreground">
                            {t.emailSentPrefix}<span className="font-semibold text-foreground break-all">{email}</span>{t.emailSentSuffix}
                        </p>
                        <p className="text-sm text-muted-foreground">
                            {t.checkInboxHint}
                        </p>
                    </div>

                    {/* Tips */}
                    <div className="bg-muted/30 rounded-xl p-4 space-y-2">
                        <div className="flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-muted-foreground mt-0.5" />
                            <div className="text-sm text-muted-foreground">
                                <p>{t.noEmailHint}</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Button
                            variant="outline"
                            className="w-full py-6 font-bold text-lg rounded-xl"
                            onClick={handleResend}
                            disabled={countdown > 0}
                        >
                            {countdown > 0 ? (
                                <>{t.resendWithCountdown(countdown)}</>
                            ) : (
                                <>
                                    <RefreshCw className="mr-2 w-5 h-5" />
                                    {t.resend}
                                </>
                            )}
                        </Button>

                        <Button
                            className="w-full py-6 font-bold text-lg rounded-xl btn-action"
                            onClick={() => navigate('/login')}
                        >
                            {t.backToLogin}
                        </Button>
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
                        <Mail className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-extrabold text-white">{t.forgotPasswordTitle}</h1>
                    <p className="opacity-80 text-sm text-white">{t.forgotPasswordSubtitle}</p>
                </div>

                {/* Form */}
                <form onSubmit={handleResetPassword} className="p-8 space-y-6 bg-background">
                    <div className="space-y-4">
                        {/* Email Input */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">
                                {t.enterRegisteredEmail}
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="your@email.com"
                                    className="w-full pl-12 pr-4 py-4 rounded-xl border bg-muted/30 focus:border-primary focus:bg-background transition-all outline-none"
                                    autoFocus
                                />
                            </div>
                        </div>

                        {/* Info Message */}
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                            <p className="text-sm text-blue-700">
                                💡 {t.infoWithinHourPrefix}<strong>{t.infoWithinHourBold}</strong>{t.infoWithinHourSuffix}
                            </p>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm border border-red-100 animate-in fade-in duration-200">
                                ⚠️ {error}
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="space-y-3">
                        <Button
                            type="submit"
                            className="w-full py-6 font-bold text-lg rounded-xl btn-action"
                            disabled={loading || !email}
                        >
                            {loading ? (
                                <div className="flex items-center justify-center gap-2">
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    {t.sending}
                                </div>
                            ) : (
                                t.sendResetLink
                            )}
                        </Button>

                        <Link
                            to="/login"
                            className="flex items-center justify-center gap-2 w-full py-3 text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span className="font-medium">{t.backToLogin}</span>
                        </Link>
                    </div>

                    {/* Footer Links */}
                    <div className="pt-4 border-t text-center space-y-2">
                        <p className="text-sm text-muted-foreground">
                            {t.noAccount}
                            <Link to="/register" className="text-primary font-bold hover:underline ml-1">
                                {t.registerNow}
                            </Link>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ForgotPassword;