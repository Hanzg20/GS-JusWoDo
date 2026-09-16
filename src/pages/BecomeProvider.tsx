import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Store, Shield, Zap, Check, ArrowLeft, Building2, User } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/stores/authStore";
import { useProviderStore } from "@/stores/providerStore";
import { useConfigStore, writeNodeId } from "@/stores/configStore";
import { NodePicker } from "@/components/NodePicker";
import { toast } from "sonner";

const BecomeProvider = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuthStore();
    const { upgradeToProvider } = useProviderStore();
    const { refCodes, activeNodeId, language } = useConfigStore();
    const isZh = language === 'zh';

    const [step, setStep] = useState<'intro' | 'form'>('intro');
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        identity: 'NEIGHBOR' as 'NEIGHBOR' | 'MERCHANT',
        nameZh: '',
        nameEn: '',
        nodeId: '',
    });

    useEffect(() => {
        if (currentUser) {
            setFormData(prev => ({
                ...prev,
                nameZh: currentUser.name || '',
                nodeId: prev.nodeId || currentUser.nodeId || writeNodeId(activeNodeId),
            }));
        }
    }, [currentUser, activeNodeId]);

    // If already a provider, redirect
    useEffect(() => {
        if (currentUser?.isVerifiedProvider) {
            navigate('/provider/dashboard');
        }
    }, [currentUser, navigate]);

    const handleStart = () => {
        if (!currentUser) {
            navigate('/register?role=PROVIDER');
        } else {
            setStep('form');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;

        setSubmitting(true);
        try {
            // Location now comes from the neighborhood the provider actually
            // picked in the form below (was previously hardcoded to
            // lat:0,lng:0, then silently guessed from their account's node —
            // see supabase/migrations/20260904_add_node_coordinates.sql /
            // 20260904_add_node_districts.sql for the tree this reads from).
            const node = refCodes.find(r => r.type === 'NODE' && r.codeId === formData.nodeId);
            const nodeExtra = node?.extraData || {};

            await upgradeToProvider(currentUser.id, {
                identity: formData.identity,
                nameZh: formData.nameZh,
                nameEn: formData.nameEn,
                location: {
                    lat: nodeExtra.lat ?? 45.4215,
                    lng: nodeExtra.lng ?? -75.6972,
                    address: node?.enName || node?.zhName || 'Ottawa',
                    radiusKm: 10
                }
            });

            toast.success(isZh ? "欢迎加入服务商社区！🎉" : "Welcome to the Provider Community! 🎉");
            navigate('/provider/dashboard');
        } catch (error) {
            console.error(error);
            toast.error(isZh ? "账号升级失败，请重试。" : "Failed to upgrade account. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Header />

            <main className="flex-1 container max-w-4xl py-12 px-4">
                {step === 'intro' ? (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <button
                            onClick={() => navigate(-1)}
                            className="flex items-center text-muted-foreground hover:text-foreground mb-8 group transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
                            <span className="font-black uppercase tracking-widest text-xs">{isZh ? '返回' : 'Back'}</span>
                        </button>

                        <div className="text-center mb-16">
                            <div className="w-20 h-20 bg-primary/10 rounded-[32px] flex items-center justify-center mx-auto mb-6">
                                <Store className="w-10 h-10 text-primary" />
                            </div>
                            <h1 className="text-5xl font-black tracking-tighter mb-4 leading-none">
                                {isZh ? <>成为<span className="text-primary text-glow">服务商</span></> : <>Become a <span className="text-primary text-glow">Provider</span></>}
                            </h1>
                            <p className="text-xl text-muted-foreground font-medium max-w-2xl mx-auto">
                                {isZh ? '加入邻里经济，提供服务、出租物品或出售闲置。' : 'Join the neighborhood economy. Offer services, rent out items, or sell goods.'}
                            </p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-6 mb-12">
                            {[
                                { icon: Zap, titleZh: "快速设置", descZh: "2分钟创建你的档案。", titleEn: "Quick Setup", descEn: "Create your profile in 2 minutes." },
                                { icon: Shield, titleZh: "值得信赖", descZh: "通过身份认证获得信任。", titleEn: "Trusted", descEn: "Gain trust with identity verification." },
                                { icon: Store, titleZh: "自主定价", descZh: "自己定价格和排期。", titleEn: "Your Rules", descEn: "Set your own prices and schedule." },
                            ].map((f, i) => (
                                <div key={i} className="p-6 rounded-2xl bg-card border shadow-sm text-center">
                                    <f.icon className="w-8 h-8 mx-auto mb-4 text-primary" />
                                    <h3 className="font-bold mb-2">{isZh ? f.titleZh : f.titleEn}</h3>
                                    <p className="text-sm text-muted-foreground">{isZh ? f.descZh : f.descEn}</p>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-center">
                            <Button
                                onClick={handleStart}
                                size="lg"
                                className="h-14 px-10 text-lg rounded-2xl font-black shadow-glow"
                            >
                                {currentUser ? (isZh ? "升级我的账号" : "Upgrade My Account") : (isZh ? "注册成为服务商" : "Sign Up as Provider")}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="max-w-xl mx-auto animate-in fade-in zoom-in-95 duration-300">
                        <div className="mb-8">
                            <h2 className="text-3xl font-black tracking-tight mb-2">{isZh ? '设置档案' : 'Setup Profile'}</h2>
                            <p className="text-muted-foreground">{isZh ? '告诉我们你想以什么身份呈现给邻居。' : 'Tell us how you want to appear to neighbors.'}</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div
                                    onClick={() => setFormData(d => ({ ...d, identity: 'NEIGHBOR' }))}
                                    className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${formData.identity === 'NEIGHBOR' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                                >
                                    <User className="w-6 h-6 mb-2 text-primary" />
                                    <div className="font-bold">{isZh ? '邻居' : 'Neighbor'}</div>
                                    <div className="text-xs text-muted-foreground">{isZh ? '个人提供服务' : 'Individual providing services'}</div>
                                </div>
                                <div
                                    onClick={() => setFormData(d => ({ ...d, identity: 'MERCHANT' }))}
                                    className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${formData.identity === 'MERCHANT' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                                >
                                    <Building2 className="w-6 h-6 mb-2 text-primary" />
                                    <div className="font-bold">{isZh ? '商家' : 'Business'}</div>
                                    <div className="text-xs text-muted-foreground">{isZh ? '专业机构或店铺' : 'Professional entity or shop'}</div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>{isZh ? '展示名称（中文/主要）' : 'Display Name (Chinese/Primary)'}</Label>
                                <Input
                                    required
                                    value={formData.nameZh}
                                    onChange={e => setFormData(d => ({ ...d, nameZh: e.target.value }))}
                                    placeholder={isZh ? "例如：王姐水饺" : "e.g. Grandma Wang's Dumplings"}
                                    className="h-12 text-lg"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>{isZh ? '展示名称（英文-可选）' : 'Display Name (English - Optional)'}</Label>
                                <Input
                                    value={formData.nameEn}
                                    onChange={e => setFormData(d => ({ ...d, nameEn: e.target.value }))}
                                    placeholder={isZh ? "例如：Wang's Authentic Snacks" : "e.g. Wang's Authentic Snacks"}
                                    className="h-12"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>{isZh ? '所在社区' : 'Neighborhood'}</Label>
                                <NodePicker
                                    value={formData.nodeId}
                                    onChange={nodeId => setFormData(d => ({ ...d, nodeId }))}
                                    className="w-full h-12 justify-between !rounded-xl border-border"
                                />
                            </div>

                            <Button
                                type="submit"
                                disabled={submitting}
                                className="w-full h-14 text-lg font-black rounded-xl shadow-glow mt-8"
                            >
                                {submitting ? (isZh ? "设置中..." : "Setting up...") : (isZh ? "完成设置" : "Complete Setup")}
                            </Button>
                        </form>
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
};

export default BecomeProvider;
