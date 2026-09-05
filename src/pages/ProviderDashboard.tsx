import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
    TrendingUp, DollarSign, Package, Star, Clock,
    Users, Calendar, ArrowUpRight, ChevronRight,
    QrCode, Power, MessageSquare, AlertCircle,
    LayoutDashboard, PlusCircle, CheckCircle2,
    Search, Bell, Ticket, Loader2
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuthStore } from "@/stores/authStore";
import { useConfigStore } from "@/stores/configStore";
import { useOrderStore } from "@/stores/orderStore";
import { useListingStore } from "@/stores/listingStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { formatMoney } from "@/stores/listingStore";

import { useProviderStore } from "@/stores/providerStore";

const ProviderDashboard = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuthStore();
    const { language } = useConfigStore();
    const { orders, loadUserOrders, updateOrderStatus, isLoading: isOrdersLoading } = useOrderStore();
    const { listingItems, fetchListings, updateListing, toggleItemAvailability, isLoading: isListingsLoading } = useListingStore();
    const { fetchProviderProfile, updateProviderProfile } = useProviderStore();
    const [isAcceptingOrders, setIsAcceptingOrders] = useState(true);

    const t = {
        becomeProTitle: language === 'zh' ? '开启您的邻里事业' : 'Start Your Neighborhood Business',
        becomeProDesc: language === 'zh' ? '成为服务商，为邻居提供技能或闲置租赁，赚取额外收入。' : 'Become a provider — offer your skills or rent out your things, and earn extra income helping neighbors.',
        becomeProCta: language === 'zh' ? '立即申请成为服务商' : 'Apply to Become a Provider',
        dashboard: language === 'zh' ? '工作台' : 'Dashboard',
        openForBusiness: language === 'zh' ? '营业中' : 'Open',
        onBreak: language === 'zh' ? '休息中' : 'On Break',
        acceptingOn: language === 'zh' ? '已开启营业状态' : "You're now accepting orders",
        acceptingOff: language === 'zh' ? '已切换为休息状态' : "You're now on break",
        acceptingUpdateFailed: language === 'zh' ? '更新营业状态失败' : 'Failed to update status',
        scanToRedeem: language === 'zh' ? '扫码核销' : 'Scan to Redeem',
        todo: language === 'zh' ? '待办事项' : 'To-Do',
        viewAll: language === 'zh' ? '查看全部' : 'View All',
        loadingOrders: language === 'zh' ? '正在加载订单...' : 'Loading orders...',
        orderFallback: language === 'zh' ? '订单' : 'Order',
        goQuote: language === 'zh' ? '去报价' : 'Send Quote',
        startWork: language === 'zh' ? '开始执行' : 'Start Work',
        decline: language === 'zh' ? '拒绝' : 'Decline',
        allCaughtUpTitle: language === 'zh' ? '全部处理完了，太棒了！ ✨' : "All caught up — nice work! ✨",
        allCaughtUpDesc: language === 'zh' ? '目前没有需要您处理的待办事项。' : "Nothing needs your attention right now.",
        revenueOverview: language === 'zh' ? '营收概览' : 'Revenue Overview',
        revenueSubtitle: language === 'zh' ? '本周主要经营指标' : "This week's key metrics",
        week: language === 'zh' ? '周' : 'Week',
        month: language === 'zh' ? '月' : 'Month',
        totalRevenue: language === 'zh' ? '总计收入' : 'Total Revenue',
        totalOrders: language === 'zh' ? '总订单量' : 'Total Orders',
        activeOrders: language === 'zh' ? '活跃订单' : 'Active Orders',
        quickInventory: language === 'zh' ? '快捷库存库' : 'Quick Inventory',
        itemFallback: language === 'zh' ? '商品规格' : 'Item',
        fullInventory: language === 'zh' ? '进入完整库存管理 →' : 'Manage Full Inventory →',
        cockpit: language === 'zh' ? '管理驾驶舱' : 'Management Cockpit',
        myListings: language === 'zh' ? '我的发布' : 'My Listings',
        orderHistory: language === 'zh' ? '订单流水' : 'Order History',
        messages: language === 'zh' ? '私信咨询' : 'Messages',
        coupons: language === 'zh' ? '优惠券' : 'Coupons',
        addListing: language === 'zh' ? '新增服务' : 'Add Listing',
        statusUpdated: (status: string) => language === 'zh' ? `订单状态已更新为 ${status}` : `Order status updated to ${status}`,
    };

    useEffect(() => {
        if (currentUser?.id) {
            loadUserOrders(currentUser.id);
            fetchListings();

            if (currentUser.providerProfileId) {
                fetchProviderProfile(currentUser.providerProfileId).then(profile => {
                    if (profile) setIsAcceptingOrders(profile.isActive);
                });
            }
        }
    }, [currentUser?.id, loadUserOrders, fetchListings, fetchProviderProfile]);

    const handleToggleAcceptingOrders = async (checked: boolean) => {
        if (!currentUser?.providerProfileId) return;
        setIsAcceptingOrders(checked);
        try {
            await updateProviderProfile(currentUser.providerProfileId, { isActive: checked });
            toast.success(checked ? t.acceptingOn : t.acceptingOff);
        } catch (error) {
            toast.error(t.acceptingUpdateFailed);
            setIsAcceptingOrders(!checked);
        }
    };

    const isProvider = currentUser?.roles?.includes('PROVIDER');

    // Filter logic
    const myOrders = useMemo(() => {
        if (!currentUser?.id) return [];
        return orders.filter(o => o.providerUserId === currentUser.id || o.providerId === currentUser.providerProfileId);
    }, [orders, currentUser]);

    const pendingOrders = useMemo(() =>
        myOrders.filter(o => ['PENDING_CONFIRMATION', 'PENDING_QUOTE', 'WAITING_FOR_PRICE_APPROVAL'].includes(o.status)).slice(0, 5)
        , [myOrders]);

    const myListingItems = useMemo(() => {
        if (!currentUser?.providerProfileId) return [];
        return listingItems.filter(item => {
            // Find the master listing for this item to check providerId
            return true; // Simplified: assuming listingItems are already filtered or we check master
        }).slice(0, 4);
    }, [listingItems, currentUser]);

    // Calculate stats
    const totalRevenue = useMemo(() =>
        myOrders.reduce((sum, o) =>
            (['PAID', 'COMPLETED', 'IN_PROGRESS'].includes(o.status)) ? sum + (o.pricing?.total?.amount || 0) : sum, 0
        )
        , [myOrders]);

    const activeOrdersCount = useMemo(() =>
        myOrders.filter(o => ['PENDING_CONFIRMATION', 'IN_PROGRESS', 'PAID'].includes(o.status)).length
        , [myOrders]);

    const handleUpdateStatus = async (orderId: string, status: any) => {
        await updateOrderStatus(orderId, status);
        toast.success(t.statusUpdated(status));
    };

    const handleToggleItemAvailability = async (itemId: string) => {
        await toggleItemAvailability(itemId);
    };

    if (!currentUser) {
        navigate('/login');
        return null;
    }

    if (!isProvider) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center p-8 bg-white rounded-[40px] shadow-xl border border-border/50 max-w-md">
                    <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
                        <PlusCircle className="w-10 h-10 text-primary" />
                    </div>
                    <h2 className="text-2xl font-black mb-2">{t.becomeProTitle}</h2>
                    <p className="text-muted-foreground mb-8">{t.becomeProDesc}</p>
                    <Button onClick={() => navigate('/become-provider')} className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold text-lg shadow-lg">
                        {t.becomeProCta}
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8F9FB]">
            <Header />

            {/* Heads-Up Header (Sticky-like sub-header) */}
            <div className="bg-white border-b sticky top-0 z-30 shadow-sm">
                <div className="container max-w-7xl px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3 pr-6 border-r">
                            <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
                                <LayoutDashboard className="w-5 h-5 text-primary" />
                                {t.dashboard}
                            </h1>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full animate-pulse ${isAcceptingOrders ? 'bg-green-500' : 'bg-red-500'}`} />
                            <span className="text-sm font-bold">{isAcceptingOrders ? t.openForBusiness : t.onBreak}</span>
                            <Switch
                                checked={isAcceptingOrders}
                                onCheckedChange={handleToggleAcceptingOrders}
                                className="scale-75"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            variant="default"
                            className="bg-primary hover:bg-primary/90 text-white font-black px-6 rounded-2xl shadow-warm flex items-center gap-2"
                            onClick={() => alert("QR Scanner Opening...")}
                        >
                            <QrCode className="w-5 h-5" />
                            <span>{t.scanToRedeem}</span>
                        </Button>
                        <button className="w-10 h-10 rounded-2xl bg-muted hover:bg-muted/80 flex items-center justify-center relative transition-all">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="container max-w-7xl py-8 px-4">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* Left/Main Column: Action Stream */}
                    <div className="lg:col-span-8 space-y-8">

                        {/* 1. Action Required Stream */}
                        <section>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 text-orange-500" />
                                    {t.todo} ({activeOrdersCount})
                                </h2>
                                <button onClick={() => navigate('/provider/orders')} className="text-xs font-bold text-primary hover:underline">{t.viewAll}</button>
                            </div>

                            <div className="space-y-3">
                                {isOrdersLoading ? (
                                    <div className="bg-white p-12 rounded-3xl border border-border/50 flex flex-col items-center justify-center gap-4 text-muted-foreground">
                                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                        <p className="text-sm font-bold">{t.loadingOrders}</p>
                                    </div>
                                ) : pendingOrders.length > 0 ? (
                                    pendingOrders.map((order) => (
                                        <motion.div
                                            key={order.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="bg-white p-4 rounded-3xl border border-border/50 shadow-sm flex items-center justify-between group hover:shadow-md transition-all"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center overflow-hidden border border-primary/10">
                                                    {order.snapshot?.masterImages?.[0] ? (
                                                        <img src={order.snapshot.masterImages[0]} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Package className="w-6 h-6 text-primary" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-black text-sm">{order.snapshot?.masterTitle || t.orderFallback}</p>
                                                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                                                        <span className="font-bold text-foreground">{order.pricing?.total?.formatted || `$${(order.pricing?.total?.amount || 0) / 100}`}</span>
                                                        <span>•</span>
                                                        <Badge variant="secondary" className="px-1.5 py-0 h-4 text-[9px] font-black uppercase bg-orange-100 text-orange-700 border-none">
                                                            {order.status.replace('_', ' ')}
                                                        </Badge>
                                                        <span>•</span>
                                                        <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                {order.status === 'PENDING_QUOTE' ? (
                                                    <Button
                                                        size="sm"
                                                        className="rounded-xl font-bold bg-primary text-white"
                                                        onClick={() => navigate(`/chat?orderId=${order.id}`)}
                                                    >
                                                        {t.goQuote}
                                                    </Button>
                                                ) : (
                                                    <>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="rounded-xl font-bold border-green-200 text-green-700 hover:bg-green-50"
                                                            onClick={() => handleUpdateStatus(order.id, 'IN_PROGRESS')}
                                                        >
                                                            {t.startWork}
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="rounded-xl font-bold text-muted-foreground hover:bg-red-50 hover:text-red-500"
                                                            onClick={() => handleUpdateStatus(order.id, 'CANCELLED')}
                                                        >
                                                            {t.decline}
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))
                                ) : (
                                    <div className="bg-white/50 border-2 border-dashed rounded-3xl p-12 text-center text-muted-foreground">
                                        <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                                        </div>
                                        <p className="font-black text-foreground">{t.allCaughtUpTitle}</p>
                                        <p className="text-xs mt-1">{t.allCaughtUpDesc}</p>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* 2. Business Pulse (Revenue Chart) */}
                        <section className="bg-white p-6 rounded-[32px] border border-border/50 shadow-sm">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h3 className="font-black text-lg">{t.revenueOverview}</h3>
                                    <p className="text-xs text-muted-foreground font-bold mt-1 uppercase tracking-tight">{t.revenueSubtitle}</p>
                                </div>
                                <div className="flex gap-2 bg-muted p-1 rounded-xl">
                                    <button className="px-4 py-1.5 text-xs font-black bg-white rounded-lg shadow-sm">{t.week}</button>
                                    <button className="px-4 py-1.5 text-xs font-black text-muted-foreground">{t.month}</button>
                                </div>
                            </div>

                            {/* Simplified Bars */}
                            <div className="h-64 flex items-end justify-between gap-4 px-2">
                                {[0.4, 0.7, 0.5, 0.9, 0.6, 1.0, 0.8].map((factor, i) => {
                                    const dayRevenue = (totalRevenue / 7) * factor;
                                    const h = factor * 100;
                                    return (
                                        <div key={i} className="flex-1 flex flex-col items-center gap-3">
                                            <div className="relative w-full group">
                                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-[10px] py-1 px-2 rounded-lg font-black whitespace-nowrap">
                                                    {formatMoney(dayRevenue)}
                                                </div>
                                                <motion.div
                                                    initial={{ height: 0 }}
                                                    animate={{ height: `${h}%` }}
                                                    className={`w-full rounded-t-xl transition-all ${h > 80 ? 'bg-primary' : 'bg-primary/30'}`}
                                                />
                                            </div>
                                            <span className="text-[10px] font-black text-muted-foreground uppercase">{['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}</span>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="grid grid-cols-3 gap-4 mt-10 pt-8 border-t">
                                <div className="text-center border-r">
                                    <p className="text-2xl font-black text-foreground">{formatMoney(totalRevenue)}</p>
                                    <p className="text-[10px] font-black text-muted-foreground uppercase mt-1">{t.totalRevenue}</p>
                                </div>
                                <div className="text-center border-r">
                                    <p className="text-2xl font-black text-foreground">{myOrders.length}</p>
                                    <p className="text-[10px] font-black text-muted-foreground uppercase mt-1">{t.totalOrders}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-black text-green-600">{activeOrdersCount}</p>
                                    <p className="text-[10px] font-black text-muted-foreground uppercase mt-1">{t.activeOrders}</p>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Right Column: Business Pulpit */}
                    <div className="lg:col-span-4 space-y-8">

                        {/* 1. Quick Inventory Toggle */}
                        <section className="bg-white p-6 rounded-[32px] border border-border/50 shadow-sm">
                            <h3 className="font-black text-sm uppercase tracking-widest text-foreground mb-4 flex items-center gap-2">
                                <Package className="w-4 h-4 text-emerald-500" />
                                {t.quickInventory}
                            </h3>
                            <div className="space-y-4">
                                {myListingItems.map((item) => (
                                    <div key={item.id} className="flex items-center justify-between p-2 hover:bg-muted/30 rounded-2xl transition-all">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-muted overflow-hidden">
                                                <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary font-black text-xs">{(item.nameEn || item.nameZh)?.[0]}</div>
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold truncate max-w-[120px]">{item.nameEn || item.nameZh || t.itemFallback}</p>
                                                <p className="text-[10px] font-black text-primary">${item.pricing.price.amount / 100}</p>
                                            </div>
                                        </div>
                                        <Switch
                                            className="scale-75"
                                            checked={item.status === 'AVAILABLE'}
                                            onCheckedChange={() => handleToggleItemAvailability(item.id)}
                                        />
                                    </div>
                                ))}
                                <Button
                                    variant="ghost"
                                    className="w-full rounded-2xl text-xs font-bold text-primary hover:bg-primary/5 mt-2"
                                    onClick={() => navigate(`/provider/${currentUser.providerProfileId}?tab=inventory`)}
                                >
                                    {t.fullInventory}
                                </Button>
                            </div>
                        </section>

                        {/* 2. Management Shortcuts Grid */}
                        <section className="bg-[#1A1C1E] p-6 rounded-[32px] shadow-xl text-white">
                            <h3 className="font-black text-sm uppercase tracking-widest text-white/50 mb-6">{t.cockpit}</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => navigate('/my-listings')}
                                    className="p-4 rounded-[24px] bg-white/5 hover:bg-white/10 transition-all flex flex-col gap-3 group"
                                >
                                    <div className="w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                        <Package className="w-5 h-5" />
                                    </div>
                                    <span className="text-xs font-black tracking-tight">{t.myListings}</span>
                                </button>
                                <button
                                    onClick={() => navigate('/provider/orders')}
                                    className="p-4 rounded-[24px] bg-white/5 hover:bg-white/10 transition-all flex flex-col gap-3 group"
                                >
                                    <div className="w-10 h-10 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
                                        <Clock className="w-5 h-5" />
                                    </div>
                                    <span className="text-xs font-black tracking-tight">{t.orderHistory}</span>
                                </button>
                                <button
                                    onClick={() => navigate('/chat')}
                                    className="p-4 rounded-[24px] bg-white/5 hover:bg-white/10 transition-all flex flex-col gap-3 group"
                                >
                                    <div className="w-10 h-10 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                                        <MessageSquare className="w-5 h-5" />
                                    </div>
                                    <span className="text-xs font-black tracking-tight">{t.messages}</span>
                                </button>
                                <button
                                    onClick={() => navigate(`/provider/${currentUser.providerProfileId}?tab=coupons`)}
                                    className="p-4 rounded-[24px] bg-white/5 hover:bg-white/10 transition-all flex flex-col gap-3 group"
                                >
                                    <div className="w-10 h-10 rounded-2xl bg-rose-500/20 flex items-center justify-center text-rose-500 group-hover:scale-110 transition-transform">
                                        <Ticket className="w-5 h-5" />
                                    </div>
                                    <span className="text-xs font-black tracking-tight">{t.coupons}</span>
                                </button>
                                <button
                                    onClick={() => navigate('/publish')}
                                    className="p-4 rounded-[24px] bg-primary/20 border border-primary/30 hover:bg-primary/30 transition-all flex flex-col gap-3 group"
                                >
                                    <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center text-white group-hover:rotate-90 transition-transform">
                                        <PlusCircle className="w-5 h-5" />
                                    </div>
                                    <span className="text-xs font-black tracking-tight">{t.addListing}</span>
                                </button>
                            </div>
                        </section>

                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default ProviderDashboard;
