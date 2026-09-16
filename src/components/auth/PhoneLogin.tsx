import { useState, useEffect } from "react";
import { Phone, ShieldCheck, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/authStore";
import { useConfigStore } from "@/stores/configStore";
import { useNavigate } from "react-router-dom";

export const PhoneLogin = () => {
    const navigate = useNavigate();
    const { language } = useConfigStore();
    const isZh = language === 'zh';
    const [loading, setLoading] = useState(false);
    const [phone, setPhone] = useState("");
    const [otpCode, setOtpCode] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [step, setStep] = useState<'SEND' | 'VERIFY'>('SEND');
    const [timer, setTimer] = useState(0);
    const [phoneError, setPhoneError] = useState<string | null>(null);

    // Timer countdown for OTP resend
    useEffect(() => {
        if (timer > 0) {
            const countdown = setTimeout(() => setTimer(timer - 1), 1000);
            return () => clearTimeout(countdown);
        }
    }, [timer]);

    // Format phone number as user types
    const formatPhoneNumber = (value: string) => {
        // Remove all non-digits
        const digits = value.replace(/\D/g, '');

        // Limit to 11 digits (1 + 10 digits)
        const limited = digits.slice(0, 11);

        // Format as +1 (XXX) XXX-XXXX
        if (limited.length === 0) return '';
        if (limited.length <= 1) return `+${limited}`;
        if (limited.length <= 4) return `+${limited[0]} (${limited.slice(1)}`;
        if (limited.length <= 7) return `+${limited[0]} (${limited.slice(1, 4)}) ${limited.slice(4)}`;
        return `+${limited[0]} (${limited.slice(1, 4)}) ${limited.slice(4, 7)}-${limited.slice(7)}`;
    };

    // Get clean phone number (E.164 format)
    const getCleanPhone = (formatted: string): string => {
        const digits = formatted.replace(/\D/g, '');
        return `+${digits}`;
    };

    // Validate phone number
    const validatePhone = (phone: string): boolean => {
        const cleanPhone = getCleanPhone(phone);
        // Canadian phone: +1 followed by 10 digits, area code can't start with 0 or 1
        const phoneRegex = /^\+1[2-9]\d{9}$/;

        if (!phone) {
            setPhoneError(isZh ? "请输入手机号" : "Please enter a phone number");
            return false;
        }
        if (!phoneRegex.test(cleanPhone)) {
            setPhoneError(isZh ? "请输入有效的加拿大手机号" : "Please enter a valid Canadian phone number");
            return false;
        }
        setPhoneError(null);
        return true;
    };

    const handlePhoneChange = (value: string) => {
        const formatted = formatPhoneNumber(value);
        setPhone(formatted);
        setPhoneError(null);
    };

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!validatePhone(phone)) {
            return;
        }

        setLoading(true);
        const cleanPhone = getCleanPhone(phone);

        try {
            const { error: otpError } = await supabase.auth.signInWithOtp({
                phone: cleanPhone,
                options: {
                    channel: 'sms'
                }
            });

            if (otpError) throw otpError;

            setStep('VERIFY');
            setTimer(60);
            toast.success(isZh ? `验证码已发送至 ${phone}` : `Code sent to ${phone}`);
        } catch (err: any) {
            const msg = err.message.includes('rate_limit')
                ? (isZh ? '发送太频繁，请稍后再试' : 'Too many attempts, please try again later')
                : err.message.includes('Invalid phone')
                ? (isZh ? '手机号格式不正确，请使用加拿大号码' : 'Invalid phone format, please use a Canadian number')
                : err.message.includes('SMS could not be sent')
                ? (isZh ? '短信发送失败，请检查 Supabase 配置' : 'Failed to send SMS, please check the Supabase configuration')
                : (isZh ? "发送失败，请稍后重试" : "Failed to send, please try again later");
            setError(msg);
            toast.error(msg);
            console.error('[Phone OTP Error]', err);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (otpCode.length !== 6) {
            setError(isZh ? "请输入6位验证码" : "Please enter the 6-digit code");
            return;
        }

        setLoading(true);
        const cleanPhone = getCleanPhone(phone);

        try {
            const { error: verifyError } = await supabase.auth.verifyOtp({
                phone: cleanPhone,
                token: otpCode,
                type: 'sms'
            });

            if (verifyError) throw verifyError;

            toast.success(isZh ? "验证成功，正在登录..." : "Verified, signing you in...");
            await useAuthStore.getState().initializeAuth();
            navigate("/");
        } catch (err: any) {
            const msg = err.message.includes('expired')
                ? (isZh ? '验证码已过期，请重新获取' : 'Code expired, please request a new one')
                : err.message.includes('invalid')
                ? (isZh ? '验证码错误，请重新输入' : 'Incorrect code, please try again')
                : (isZh ? "验证失败，请稍后重试" : "Verification failed, please try again later");
            setError(msg);
            toast.error(msg);
            console.error('[Phone OTP Verify Error]', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4 animate-in fade-in duration-300">
            {step === 'SEND' ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">
                            {isZh ? '手机号码（加拿大）' : 'Phone Number (Canada)'}
                        </label>
                        <div className="relative">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <input
                                type="tel"
                                required
                                value={phone}
                                onChange={(e) => handlePhoneChange(e.target.value)}
                                onBlur={() => validatePhone(phone)}
                                placeholder="+1 (613) 555-1234"
                                className={`w-full pl-12 pr-4 py-4 rounded-xl border bg-muted/30 focus:border-primary focus:bg-background transition-all outline-none font-mono ${
                                    phoneError ? 'border-red-500' : ''
                                }`}
                            />
                            {phoneError && (
                                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" />
                                    {phoneError}
                                </p>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {isZh ? '💡 提示：输入时自动格式化为加拿大格式' : "💡 Tip: automatically formatted as you type"}
                        </p>
                    </div>

                    {error && (
                        <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm border border-red-100 flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <Button
                        type="submit"
                        className="w-full py-6 font-bold text-lg rounded-xl btn-action"
                        disabled={loading || timer > 0}
                    >
                        {loading ? (
                            <div className="flex items-center justify-center gap-2">
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                {isZh ? '发送中...' : 'Sending...'}
                            </div>
                        ) : timer > 0 ? (
                            isZh ? `重新发送 (${timer}秒)` : `Resend (${timer}s)`
                        ) : (
                            isZh ? '发送验证码' : 'Send Code'
                        )}
                    </Button>

                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                        <p className="text-xs text-blue-700 leading-relaxed">
                            {isZh
                                ? <>📱 <strong>首次使用？</strong> 验证码将发送至您的手机，用于登录和注册。</>
                                : <>📱 <strong>First time?</strong> A code will be sent to your phone for sign-in and registration.</>}
                        </p>
                    </div>
                </form>
            ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                        <p className="text-sm text-green-700">
                            {isZh ? <>📲 验证码已发送至 <strong className="font-mono">{phone}</strong></> : <>📲 Code sent to <strong className="font-mono">{phone}</strong></>}
                        </p>
                        <p className="text-xs text-green-600 mt-1">
                            {isZh ? '请查看短信并输入6位验证码' : 'Check your texts and enter the 6-digit code'}
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">
                            {isZh ? '验证码' : 'Verification Code'}
                        </label>
                        <div className="relative">
                            <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <input
                                type="text"
                                required
                                maxLength={6}
                                value={otpCode}
                                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                                placeholder="123456"
                                className="w-full pl-12 pr-4 py-4 rounded-xl border bg-muted/30 focus:border-primary focus:bg-background tracking-[0.5em] font-mono text-center text-xl outline-none"
                                autoFocus
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm border border-red-100 flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <Button
                        type="submit"
                        className="w-full py-6 font-bold text-lg rounded-xl btn-action"
                        disabled={loading || otpCode.length !== 6}
                    >
                        {loading ? (
                            <div className="flex items-center justify-center gap-2">
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                {isZh ? '验证中...' : 'Verifying...'}
                            </div>
                        ) : (
                            isZh ? '确认登录' : 'Confirm Sign In'
                        )}
                    </Button>

                    <div className="flex items-center justify-between pt-2">
                        <button
                            type="button"
                            onClick={() => {
                                setStep('SEND');
                                setOtpCode('');
                                setError(null);
                            }}
                            className="text-sm text-muted-foreground hover:text-primary transition-colors"
                        >
                            {isZh ? '← 返回修改手机号' : '← Back to edit phone number'}
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                if (timer === 0) {
                                    handleSendOtp(new Event('submit') as any);
                                }
                            }}
                            disabled={timer > 0 || loading}
                            className={`text-sm font-medium transition-colors ${
                                timer > 0 || loading
                                    ? 'text-muted-foreground cursor-not-allowed'
                                    : 'text-primary hover:underline'
                            }`}
                        >
                            {timer > 0 ? `${isZh ? '重新发送' : 'Resend'}(${timer}s)` : (isZh ? '重新发送' : 'Resend')}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};
