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
import { useConfigStore } from "@/stores/configStore";
import { toast } from "sonner";

const BecomeProvider = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuthStore();
    const { upgradeToProvider } = useProviderStore();
    const { refCodes, activeNodeId } = useConfigStore();

    const [step, setStep] = useState<'intro' | 'form'>('intro');
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        identity: 'NEIGHBOR' as 'NEIGHBOR' | 'MERCHANT',
        nameZh: '',
        nameEn: '',
    });

    useEffect(() => {
        if (currentUser) {
            setFormData(prev => ({
                ...prev,
                nameZh: currentUser.name || '',
            }));
        }
    }, [currentUser]);

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
            // Use the neighbor's community node as a real starting location
            // (was previously hardcoded to lat:0,lng:0 — see
            // supabase/migrations/20260904_add_node_coordinates.sql for the
            // node coordinates this now reads from). Providers can refine
            // their exact address later from their dashboard.
            const node = refCodes.find(r => r.type === 'NODE' && r.codeId === (currentUser.nodeId || activeNodeId));
            const nodeExtra = node?.extraData || {};

            await upgradeToProvider(currentUser.id, {
                identity: formData.identity,
                nameZh: formData.nameZh,
                nameEn: formData.nameEn,
                location: {
                    lat: nodeExtra.lat ?? 45.4215,
                    lng: nodeExtra.lng ?? -75.6972,
                    address: node?.zhName || node?.enName || 'Ottawa',
                    radiusKm: 10
                }
            });

            toast.success("Welcome to the Provider Community! 🎉");
            navigate('/provider/dashboard');
        } catch (error) {
            console.error(error);
            toast.error("Failed to upgrade account. Please try again.");
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
                            <span className="font-black uppercase tracking-widest text-xs">Back</span>
                        </button>

                        <div className="text-center mb-16">
                            <div className="w-20 h-20 bg-primary/10 rounded-[32px] flex items-center justify-center mx-auto mb-6">
                                <Store className="w-10 h-10 text-primary" />
                            </div>
                            <h1 className="text-5xl font-black tracking-tighter mb-4 leading-none">
                                Become a <span className="text-primary text-glow">Provider</span>
                            </h1>
                            <p className="text-xl text-muted-foreground font-medium max-w-2xl mx-auto">
                                Join the neighborhood economy. Offer services, rent out items, or sell goods.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-6 mb-12">
                            {[
                                { icon: Zap, title: "Quick Setup", desc: "Create your profile in 2 minutes." },
                                { icon: Shield, title: "Trusted", desc: "Gain trust with identity verification." },
                                { icon: Store, title: "Your Rules", desc: "Set your own prices and schedule." },
                            ].map((f, i) => (
                                <div key={i} className="p-6 rounded-2xl bg-card border shadow-sm text-center">
                                    <f.icon className="w-8 h-8 mx-auto mb-4 text-primary" />
                                    <h3 className="font-bold mb-2">{f.title}</h3>
                                    <p className="text-sm text-muted-foreground">{f.desc}</p>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-center">
                            <Button
                                onClick={handleStart}
                                size="lg"
                                className="h-14 px-10 text-lg rounded-2xl font-black shadow-glow"
                            >
                                {currentUser ? "Upgrade My Account" : "Sign Up as Provider"}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="max-w-xl mx-auto animate-in fade-in zoom-in-95 duration-300">
                        <div className="mb-8">
                            <h2 className="text-3xl font-black tracking-tight mb-2">Setup Profile</h2>
                            <p className="text-muted-foreground">Tell us how you want to appear to neighbors.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div
                                    onClick={() => setFormData(d => ({ ...d, identity: 'NEIGHBOR' }))}
                                    className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${formData.identity === 'NEIGHBOR' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                                >
                                    <User className="w-6 h-6 mb-2 text-primary" />
                                    <div className="font-bold">Neighbor</div>
                                    <div className="text-xs text-muted-foreground">Individual providing services</div>
                                </div>
                                <div
                                    onClick={() => setFormData(d => ({ ...d, identity: 'MERCHANT' }))}
                                    className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${formData.identity === 'MERCHANT' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                                >
                                    <Building2 className="w-6 h-6 mb-2 text-primary" />
                                    <div className="font-bold">Business</div>
                                    <div className="text-xs text-muted-foreground">Professional entity or shop</div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Display Name (Chinese/Primary)</Label>
                                <Input
                                    required
                                    value={formData.nameZh}
                                    onChange={e => setFormData(d => ({ ...d, nameZh: e.target.value }))}
                                    placeholder="e.g. Grandma Wang's Dumplings"
                                    className="h-12 text-lg"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Display Name (English - Optional)</Label>
                                <Input
                                    value={formData.nameEn}
                                    onChange={e => setFormData(d => ({ ...d, nameEn: e.target.value }))}
                                    placeholder="e.g. Wang's Authentic Snacks"
                                    className="h-12"
                                />
                            </div>

                            <Button
                                type="submit"
                                disabled={submitting}
                                className="w-full h-14 text-lg font-black rounded-xl shadow-glow mt-8"
                            >
                                {submitting ? "Setting up..." : "Complete Setup"}
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
