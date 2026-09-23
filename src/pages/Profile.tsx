import { useEffect } from "react";
import SEO from "@/components/SEO";
import { useNavigate } from "react-router-dom";
import {
    MapPin, Package,
    CreditCard, Layout,
    UserCircle, ShieldCheck, HelpCircle, Languages,
    Bell, LogOut
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuthStore } from "@/stores/authStore";
import { useConfigStore } from "@/stores/configStore";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { setPostLoginRedirect } from "@/utils/postLoginRedirect";

// Sub-components
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { DashboardCards } from "@/components/profile/DashboardCards";
import { MenuLinks, MenuItem } from "@/components/profile/MenuLinks";
import { PAYMENTS_ENABLED } from "@/config/launchFlags";
import { promptLogin } from "@/components/common/LoginRequired";

const Profile = () => {
    const navigate = useNavigate();
    const { currentUser, logout } = useAuthStore();
    const { language } = useConfigStore();

    const isProvider = currentUser?.roles?.includes('PROVIDER');

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const gatePrivate = (path: string) => {
        if (!currentUser) {
            promptLogin(navigate, language === 'zh', undefined, path);
            return;
        }
        navigate(path);
    };

    const t = {
        logout: language === 'zh' ? '退出登录' : 'Sign Out',
        // Sections
        secTrade: language === 'zh' ? '买家管理' : 'Shopping',
        secAccount: language === 'zh' ? '帐号设置' : 'Account',
        secSystem: language === 'zh' ? '系统' : 'System',
        // Items
        orders: language === 'zh' ? '我的订单' : 'My Orders',
        listings: language === 'zh' ? '我的发布' : 'My Posts',
        wallet: language === 'zh' ? '金豆中心' : 'Wallet',
        address: language === 'zh' ? '收货地址' : 'Addresses',
        profile: language === 'zh' ? '基本资料' : 'Personal Info',
        verification: language === 'zh' ? '实名认证' : 'Verification',
        language: language === 'zh' ? '语言设置' : 'Language',
        help: language === 'zh' ? '帮助中心' : 'Help Center'
    };

    const menuGroups = [
        {
            title: t.secTrade,
            items: [
                { icon: Package, label: t.orders, onClick: () => gatePrivate('/orders') },
                { icon: Layout, label: t.listings, onClick: () => gatePrivate('/my-listings') },
                ...(PAYMENTS_ENABLED && currentUser ? [{ icon: CreditCard, label: t.wallet, onClick: () => gatePrivate('/wallet'), badge: currentUser.beansBalance }] : []),
                { icon: MapPin, label: t.address, onClick: () => gatePrivate('/addresses') },
            ]
        },
        {
            title: t.secAccount,
            items: [
                { icon: UserCircle, label: t.profile, onClick: () => gatePrivate('/settings/profile') },
                { icon: ShieldCheck, label: t.verification, onClick: () => gatePrivate('/verification') },
                { icon: Bell, label: language === 'zh' ? '消息通知' : 'Notifications', onClick: () => gatePrivate('/notifications') },
            ]
        },
        {
            title: t.secSystem,
            items: [
                { icon: Languages, label: t.language, path: '/settings/language' },
                { icon: HelpCircle, label: t.help, path: '/help' },
            ]
        }
    ];

    return (
        <div className="min-h-screen bg-[#F8F9FA] pb-24">
            <SEO title={t.profile} noindex />
            <Header />

            <div className="max-w-2xl mx-auto pt-6 px-4 space-y-6">

                {/* 1. Header with Staggered Animation */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    {!currentUser ? (
                        <div className="bg-white/80 backdrop-blur-md rounded-[32px] p-6 shadow-sm border border-black/5 flex items-center justify-between relative overflow-hidden">
                            <div className="flex items-center gap-4 relative z-10">
                                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border-2 border-white shadow-sm">
                                    <UserCircle className="w-10 h-10" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black tracking-tight">{language === 'zh' ? '未登录' : 'Guest'}</h2>
                                    <p className="text-xs text-muted-foreground font-medium mt-0.5">
                                        {language === 'zh' ? '登录后体验完整社区与管理功能' : 'Sign in to access all features'}
                                    </p>
                                </div>
                            </div>
                            <Button
                                className="rounded-2xl font-black text-sm px-5 h-11 shadow-md bg-primary hover:bg-primary/90 text-white"
                                onClick={() => {
                                    setPostLoginRedirect('/profile');
                                    navigate('/login');
                                }}
                            >
                                {language === 'zh' ? '立即登录' : 'Log In'}
                            </Button>
                        </div>
                    ) : (
                        <ProfileHeader currentUser={currentUser} isProvider={!!isProvider} />
                    )}
                </motion.div>

                {/* 2. Dashboard Cards (logged in only) */}
                {currentUser && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                    >
                        <DashboardCards currentUser={currentUser} isProvider={!!isProvider} />
                    </motion.div>
                )}

                {/* 3. Menu Groups */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    <MenuLinks groups={menuGroups} />
                </motion.div>

                {/* 4. Logout Button (logged in only) */}
                {currentUser && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                    >
                        <Button
                            variant="ghost"
                            className="w-full h-14 rounded-[28px] bg-red-50 text-red-500 font-black flex gap-3 hover:bg-red-100/70 shadow-sm"
                            onClick={handleLogout}
                        >
                            <LogOut className="w-5 h-5" />
                            {t.logout}
                        </Button>
                    </motion.div>
                )}
            </div>

            <Footer />
        </div>
    );
};

export default Profile;
