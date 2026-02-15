import { useNavigate } from "react-router-dom";
import { CreditCard, Milestone, Star } from "lucide-react";
import { useConfigStore } from "@/stores/configStore";

interface DashboardCardsProps {
    currentUser: any;
    isProvider: boolean;
}

export function DashboardCards({ currentUser, isProvider }: DashboardCardsProps) {
    const navigate = useNavigate();
    const { language } = useConfigStore();

    const t = {
        walletTitle: language === 'zh' ? '金豆余额' : 'JinBean Balance',
        topUp: language === 'zh' ? '充值' : 'Top up',
        workplace: language === 'zh' ? '服务工作台' : 'Workplace',
        proHub: language === 'zh' ? '工作台' : 'Pro Hub',
        viewStats: language === 'zh' ? '查看数据' : 'View Stats',
        becomePro: language === 'zh' ? '成为服务商' : 'Become a Pro',
        verifyNow: language === 'zh' ? '去认证' : 'Verify Now',
        earnBeans: language === 'zh' ? '赚取金豆' : 'Earn Beans',
    };

    return (
        <div className="grid grid-cols-2 gap-4">
            {/* Wallet Card */}
            <div
                className="bg-gradient-to-br from-amber-500 to-orange-600 p-5 rounded-[28px] text-white shadow-lg shadow-orange-500/20 active:scale-95 transition-all cursor-pointer group relative overflow-hidden"
                onClick={() => navigate('/wallet')}
            >
                <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-5 -mt-5 blur-xl group-hover:bg-white/20 transition-all" />

                <p className="text-[10px] font-black uppercase tracking-widest opacity-80 relative z-10">{t.walletTitle}</p>
                <p className="text-3xl font-black mt-2 leading-none tracking-tight relative z-10">{currentUser.beansBalance}</p>
                <div className="mt-4 flex items-center justify-between relative z-10">
                    <span className="text-[10px] font-bold bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full group-hover:bg-white/30 transition-all">{t.topUp}</span>
                    <CreditCard className="w-5 h-5 opacity-60" />
                </div>
            </div>

            {/* Workplace / Become Pro Card */}
            {isProvider ? (
                <div
                    className="bg-white p-5 rounded-[28px] border border-black/5 shadow-sm active:scale-95 transition-all cursor-pointer flex flex-col justify-between group hover:shadow-md"
                    onClick={() => navigate('/provider/dashboard')}
                >
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t.workplace}</p>
                        <p className="text-base font-black text-foreground mt-1 tracking-tight group-hover:text-primary transition-colors">{t.proHub}</p>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-primary bg-primary/5 px-2 py-0.5 rounded-full">{t.viewStats}</span>
                        <Milestone className="w-4 h-4 text-primary" />
                    </div>
                </div>
            ) : (
                <div
                    className="bg-white p-5 rounded-[28px] border border-black/5 shadow-sm active:scale-95 transition-all cursor-pointer flex flex-col justify-between group hover:shadow-md"
                    onClick={() => navigate('/become-provider')}
                >
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t.becomePro}</p>
                        <p className="text-base font-black text-foreground mt-1 tracking-tight group-hover:text-amber-600 transition-colors">{t.verifyNow}</p>
                    </div>
                    <div className="flex items-center justify-between text-amber-600">
                        <span className="text-[10px] font-bold">{t.earnBeans}</span>
                        <Star className="w-4 h-4 fill-amber-600 text-amber-600" />
                    </div>
                </div>
            )}
        </div>
    );
}
