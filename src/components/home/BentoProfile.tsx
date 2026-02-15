import { BentoItem } from "./BentoItem";
import { useAuthStore } from "@/stores/authStore";
import { useConfigStore } from "@/stores/configStore";
import { Link } from "react-router-dom";
import { User, CreditCard, ChevronRight, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BentoProfile() {
    const { currentUser } = useAuthStore();
    const { language } = useConfigStore();
    const isZh = language === 'zh';

    const t = {
        welcome: isZh ? '欢迎回来' : 'Welcome Back',
        login: isZh ? '登录 / 注册' : 'Login / Sign up',
        loginDesc: isZh ? '开启您的邻里生活' : 'Start your neighborhood journey',
        wallet: isZh ? '钱包' : 'Wallet',
        profile: isZh ? '个人中心' : 'Profile',
    };

    if (!currentUser) {
        return (
            <BentoItem colSpan={1} className="p-5 flex flex-col justify-center items-center text-center bg-primary/5 border-primary/10">
                <div className="w-16 h-16 rounded-full bg-white border-4 border-white shadow-sm flex items-center justify-center mb-3">
                    <User className="w-8 h-8 text-primary/50" />
                </div>
                <h3 className="font-bold text-lg mb-1">{t.login}</h3>
                <p className="text-xs text-muted-foreground mb-4">{t.loginDesc}</p>
                <Link to="/login" className="w-full">
                    <Button className="w-full rounded-xl bg-primary shadow-lg shadow-primary/20">
                        {t.login}
                    </Button>
                </Link>
            </BentoItem>
        );
    }

    return (
        <BentoItem colSpan={1} className="p-5 flex flex-col justify-between bg-gradient-to-b from-white to-gray-50">
            <div className="flex items-center gap-3">
                <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-12 h-12 rounded-full border-2 border-white shadow-sm"
                />
                <div>
                    <p className="text-xs text-muted-foreground font-medium">{t.welcome}</p>
                    <p className="font-bold text-foreground text-sm line-clamp-1">{currentUser.name}</p>
                </div>
            </div>

            <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm mt-2">
                <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                        <CreditCard className="w-3 h-3" /> {t.wallet}
                    </span>
                    <span className="text-sm font-black text-foreground">{currentUser.beansBalance || 0}</span>
                </div>
                <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-2/3 rounded-full" />
                </div>
            </div>

            <Link to="/profile">
                <Button variant="ghost" className="w-full justify-between text-xs font-bold hover:bg-white hover:shadow-sm">
                    {t.profile}
                    <ChevronRight className="w-3 h-3" />
                </Button>
            </Link>
        </BentoItem>
    );
}
