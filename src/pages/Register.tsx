import { useState } from "react";
import { User as UserIcon, Mail, ArrowRight, Building2, CheckCircle2, Lock, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const Register = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [nodeId, setNodeId] = useState("NODE_LEES");
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

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
                toast.error("该邮箱已注册，请直接登录");
                navigate('/login');
                return;
            }

            setSuccess(true);
            toast.success("注册成功！请检查邮箱进行验证");
        } catch (err: any) {
            const msg = err.message.includes('rate_limit') ? '操作太频繁，请稍后再试' :
                err.message.includes('already registered') ? '该邮箱已注册，请直接登录' :
                    "注册失败，请检查网络后重试";
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
                        <h2 className="text-2xl font-bold">注册成功！</h2>
                        <p className="text-muted-foreground">
                            我们已向 <span className="font-semibold text-foreground">{email}</span> 发送了确认邮件。
                            请点击邮件中的链接完成验证后即可登录。
                        </p>
                    </div>
                    <Button
                        className="w-full py-6 font-bold text-lg rounded-xl btn-action"
                        onClick={() => navigate('/login')}
                    >
                        立刻去登录 <ArrowRight className="ml-2 w-5 h-5" />
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
                    <h1 className="text-2xl font-extrabold text-white">加入 JUSTWEDO</h1>
                    <p className="opacity-80 text-sm text-white">邻里互助，从这里开始</p>
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
                                placeholder="电子邮箱"
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
                                placeholder="你的昵称"
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
                                placeholder="设置登录密码"
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
                                placeholder="确认你的密码"
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
                        {loading ? '正在注册...' : '立即注册'}
                    </Button>

                    <p className="text-center text-sm text-muted-foreground">
                        已有账号？
                        <Link to="/login" className="text-primary font-bold hover:underline ml-1">直接登录</Link>
                    </p>

                    <div className="flex items-start gap-2 pt-2">
                        <input
                            type="checkbox"
                            required
                            id="tos-consent"
                            className="mt-1 w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <label htmlFor="tos-consent" className="text-xs text-muted-foreground leading-tight opacity-80 select-none cursor-pointer">
                            我已阅读并同意 <Link to="/legal/terms" target="_blank" className="underline font-bold hover:text-primary" onClick={(e) => e.stopPropagation()}>服务条款</Link> 与 <Link to="/legal/privacy" target="_blank" className="underline font-bold hover:text-primary" onClick={(e) => e.stopPropagation()}>隐私政策</Link>，并理解平台仅作为信息中介。
                            <br /><span className="text-[10px] opacity-70">I agree to the <Link to="/legal/terms" target="_blank" className="underline hover:text-primary" onClick={(e) => e.stopPropagation()}>Terms</Link> & <Link to="/legal/privacy" target="_blank" className="underline hover:text-primary" onClick={(e) => e.stopPropagation()}>Privacy Policy</Link> and acknowledge the platform acts as an intermediary.</span>
                        </label>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Register;
