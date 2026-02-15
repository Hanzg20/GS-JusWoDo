import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    ChevronLeft, ShieldCheck, Mail, Phone,
    UserCheck, Building, Verified, Info,
    AlertCircle, CheckCircle2, ArrowRight
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuthStore } from "@/stores/authStore";
import { useConfigStore } from "@/stores/configStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const Verification = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuthStore();
    const { language } = useConfigStore();

    const currentLevel = currentUser?.verificationLevel || 1;

    const t = {
        title: language === 'zh' ? '实名认证' : 'Verification Center',
        trustStatus: language === 'zh' ? '信任等级' : 'Trust Level',
        currentStatus: language === 'zh' ? '当前状态' : 'Current Status',
        verified: language === 'zh' ? '已验证' : 'Verified',
        pending: language === 'zh' ? '处理中' : 'Pending',
        notStarted: language === 'zh' ? '未开始' : 'Not Started',

        levels: [
            {
                level: 1,
                title: language === 'zh' ? '基础认证' : 'Basic Verification',
                desc: language === 'zh' ? '手机或邮箱已验证，可发布普通帖子' : 'Phone or email verified. Can post standard listings.',
                icon: Mail,
                requirements: language === 'zh' ? '注册即完成' : 'Completed at registration'
            },
            {
                level: 2,
                title: language === 'zh' ? '实名认证' : 'Real-name Verification',
                desc: language === 'zh' ? '验证身份证件或社区身份，提高信任度' : 'Verify ID or community status to increase trust.',
                icon: UserCheck,
                requirements: language === 'zh' ? '需提交证件照' : 'Requires ID submission'
            },
            {
                level: 3,
                title: language === 'zh' ? '专业认证' : 'Professional Verification',
                desc: language === 'zh' ? '验证专业执照，获得专属徽章和流量' : 'Verify licenses to get special badges and traffic.',
                icon: verifiedIcon,
                requirements: language === 'zh' ? '需提交专业资质' : 'Requires professional credentials'
            }
        ],
        benefits: language === 'zh' ? '认证权益' : 'Verification Benefits',
        benefitList: [
            language === 'zh' ? '更高的搜索排名' : 'Higher search ranking',
            language === 'zh' ? '专属信任徽章' : 'Exclusive trust badges',
            language === 'zh' ? '更快的提现处理' : 'Faster payout processing',
            language === 'zh' ? '发布更多类型的帖子' : 'Post more types of listings'
        ],
        ctaLevel2: language === 'zh' ? '去提交实名认证' : 'Submit ID Verification',
        ctaLevel3: language === 'zh' ? '去提交专业认证' : 'Submit Pro Credentials',
        footerNote: language === 'zh' ? '我们非常重视您的隐私，所有证件信息都经加密存储。' : 'We value your privacy. All ID information is encrypted and stored securely.'
    };

    // Helper for Level 3 icon to avoid name collision
    function verifiedIcon(props: any) { return <Verified {...props} /> }

    return (
        <div className="min-h-screen bg-[#F8F9FA]">
            <Header />

            <div className="container max-w-2xl py-8 px-4">
                <div className="flex items-center gap-4 mb-8">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate('/profile')}
                        className="rounded-full"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </Button>
                    <h1 className="text-2xl font-black">{t.title}</h1>
                </div>

                {/* Status Card */}
                <div className="bg-primary rounded-[32px] p-8 text-white mb-8 shadow-xl shadow-primary/20 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div className="relative z-10 text-center">
                        <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-white/30">
                            <ShieldCheck className="w-10 h-10" />
                        </div>
                        <p className="text-sm font-black uppercase tracking-[0.2em] opacity-80">{t.trustStatus}</p>
                        <h2 className="text-4xl font-black mt-1 mb-6 italic tracking-tighter">Level {currentLevel}</h2>

                        <div className="max-w-[200px] mx-auto space-y-2">
                            <Progress value={(currentLevel / 3) * 100} className="h-2 bg-white/20" />
                            <p className="text-[10px] font-bold text-white/60">
                                {currentLevel === 3 ? 'Maximum Trust Achieved' : `Progress to Level ${currentLevel + 1}`}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Verification Tiers */}
                <div className="space-y-4 mb-8">
                    {t.levels.map((lvl) => {
                        const isCompleted = currentLevel >= lvl.level;
                        const isCurrent = currentLevel + 1 === lvl.level;

                        return (
                            <Card
                                key={lvl.level}
                                className={`rounded-[28px] border-none shadow-sm transition-all ${isCompleted ? 'bg-white opacity-80' : isCurrent ? 'bg-white ring-2 ring-primary/20' : 'bg-slate-100 opacity-60'
                                    }`}
                            >
                                <CardContent className="p-6">
                                    <div className="flex items-start gap-4">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${isCompleted ? 'bg-green-50 text-green-500' : isCurrent ? 'bg-primary/10 text-primary' : 'bg-slate-200 text-slate-400'
                                            }`}>
                                            <lvl.icon className="w-6 h-6" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-1">
                                                <h3 className="font-black text-lg">{lvl.title}</h3>
                                                {isCompleted ? (
                                                    <span className="flex items-center gap-1 text-[10px] font-black uppercase text-green-500 bg-green-50 px-2 py-0.5 rounded-full">
                                                        <CheckCircle2 className="w-3 h-3" />
                                                        {t.verified}
                                                    </span>
                                                ) : isCurrent ? (
                                                    <span className="text-[10px] font-black uppercase text-primary animate-pulse">
                                                        {t.notStarted}
                                                    </span>
                                                ) : null}
                                            </div>
                                            <p className="text-sm text-muted-foreground leading-snug font-medium mb-3">
                                                {lvl.desc}
                                            </p>

                                            {isCurrent && (
                                                <Button
                                                    onClick={() => navigate(lvl.level === 2 ? '/verification/id' : '/become-provider')}
                                                    className="w-full h-10 rounded-xl bg-primary hover:bg-primary/90 font-black text-xs gap-2 group"
                                                >
                                                    {lvl.level === 2 ? t.ctaLevel2 : t.ctaLevel3}
                                                    <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                                                </Button>
                                            )}
                                            {lvl.level === 3 && (
                                                <div className="mt-3 mb-3 p-3 bg-amber-50 border border-amber-100 rounded-xl">
                                                    <p className="text-[10px] font-medium text-amber-800 leading-relaxed">
                                                        <Info className="w-3 h-3 inline mr-1 mb-0.5" />
                                                        {language === 'zh'
                                                            ? '注意：申请专业认证即代表您确认自己是独立承包商，需自行承担相关税务和保险责任。'
                                                            : 'Note: By applying, you acknowledge you are an independent contractor responsible for your own taxes and insurance.'}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {/* Benefits Section */}
                <div className="bg-white rounded-[32px] p-8 border border-black/5 shadow-sm mb-8">
                    <h3 className="text-[12px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                        <Verified className="w-3 h-3" />
                        {t.benefits}
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                        {t.benefitList.map((benefit, idx) => (
                            <div key={idx} className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-primary/40" />
                                <span className="text-sm font-bold text-slate-700">{benefit}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-3 justify-center text-muted-foreground opacity-50 px-4 text-center">
                    <Info className="w-4 h-4 shrink-0" />
                    <p className="text-[10px] font-bold leading-tight">
                        {t.footerNote}
                    </p>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default Verification;
