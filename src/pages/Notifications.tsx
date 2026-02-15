import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    ChevronLeft, Bell, BellOff, Info,
    Trash2, CheckCheck, Gift, ShoppingBag,
    MessageSquare, ShieldCheck, Star,
    Settings, Clock
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuthStore } from "@/stores/authStore";
import { useConfigStore } from "@/stores/configStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Notification {
    id: string;
    type: 'SYSTEM' | 'TRANSACTION' | 'COMMUNITY' | 'PROMOTION';
    title: string;
    content: string;
    isRead: boolean;
    createdAt: string;
    actionPath?: string;
}

const Notifications = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuthStore();
    const { language } = useConfigStore();

    // Mock notifications for now, as we don't have a dedicated DB table yet
    const [notifications, setNotifications] = useState<Notification[]>([
        {
            id: '1',
            type: 'SYSTEM',
            title: language === 'zh' ? '欢迎来到渥帮 JWD' : 'Welcome to JWD',
            content: language === 'zh' ? '感谢加入渥太华最大的互助社区！您可以开始发布您的第一个帖子了。' : 'Thank you for joining Ottawa\'s largest mutual aid community! You can start posting your first listing now.',
            isRead: false,
            createdAt: new Date().toISOString(),
            actionPath: '/publish'
        },
        {
            id: '2',
            type: 'TRANSACTION',
            title: language === 'zh' ? '获得新人奖励' : 'Welcome Bonus Received',
            content: language === 'zh' ? '祝贺！您已获得 100 金豆奖励。' : 'Congratulations! You have received 100 JinBeans as a welcome bonus.',
            isRead: true,
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            actionPath: '/wallet'
        },
        {
            id: '3',
            type: 'COMMUNITY',
            title: language === 'zh' ? '实名认证建议' : 'Verification Recommended',
            content: language === 'zh' ? '完成实名认证，可以获得更多邻居的信任。' : 'Complete your ID verification to win more trust from neighbors.',
            isRead: false,
            createdAt: new Date(Date.now() - 172800000).toISOString(),
            actionPath: '/verification'
        }
    ]);

    const t = {
        title: language === 'zh' ? '消息通知' : 'Notifications',
        markAllRead: language === 'zh' ? '全部已读' : 'Mark all read',
        empty: language === 'zh' ? '暂无消息' : 'No notifications',
        tabs: {
            all: language === 'zh' ? '全部' : 'All',
            system: language === 'zh' ? '系统' : 'System',
            trades: language === 'zh' ? '交易' : 'Trades',
            community: language === 'zh' ? '邻里' : 'Community',
        },
        delete: language === 'zh' ? '删除' : 'Delete',
        view: language === 'zh' ? '查看' : 'View'
    };

    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    };

    const deleteNotification = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const getTypeIcon = (type: Notification['type']) => {
        switch (type) {
            case 'SYSTEM': return <ShieldCheck className="w-4 h-4 text-blue-500" />;
            case 'TRANSACTION': return <ShoppingBag className="w-4 h-4 text-amber-500" />;
            case 'COMMUNITY': return <MessageSquare className="w-4 h-4 text-green-500" />;
            case 'PROMOTION': return <Star className="w-4 h-4 text-purple-500" />;
        }
    };

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="min-h-screen bg-[#F8F9FA]">
            <Header />

            <div className="container max-w-2xl py-8 px-4">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
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
                    {notifications.some(n => !n.isRead) && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={markAllAsRead}
                            className="text-xs font-bold text-primary hover:bg-primary/5 rounded-full px-4"
                        >
                            <CheckCheck className="w-4 h-4 mr-2" />
                            {t.markAllRead}
                        </Button>
                    )}
                </div>

                <Tabs defaultValue="all" className="space-y-6">
                    <TabsList className="bg-white/50 p-1 rounded-2xl border border-black/5 w-full h-12">
                        <TabsTrigger value="all" className="flex-1 rounded-xl font-bold text-xs">{t.tabs.all}</TabsTrigger>
                        <TabsTrigger value="system" className="flex-1 rounded-xl font-bold text-xs">{t.tabs.system}</TabsTrigger>
                        <TabsTrigger value="trades" className="flex-1 rounded-xl font-bold text-xs">{t.tabs.trades}</TabsTrigger>
                        <TabsTrigger value="community" className="flex-1 rounded-xl font-bold text-xs">{t.tabs.community}</TabsTrigger>
                    </TabsList>

                    <TabsContent value="all" className="space-y-3">
                        {notifications.length > 0 ? (
                            notifications.map(n => (
                                <div
                                    key={n.id}
                                    onClick={() => n.actionPath && navigate(n.actionPath)}
                                    className={`group relative bg-white p-5 rounded-[28px] border border-black/5 shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden ${!n.isRead ? 'ring-1 ring-primary/10' : ''}`}
                                >
                                    {!n.isRead && (
                                        <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                                    )}
                                    <div className="flex gap-4">
                                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${!n.isRead ? 'bg-primary/10' : 'bg-slate-50'
                                            }`}>
                                            {getTypeIcon(n.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-1">
                                                <h3 className={`text-sm font-black truncate ${!n.isRead ? 'text-slate-900' : 'text-slate-500'}`}>
                                                    {n.title}
                                                </h3>
                                                <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap ml-2">
                                                    {formatTime(n.createdAt)}
                                                </span>
                                            </div>
                                            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                                                {n.content}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Action Reveal on Hover */}
                                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={(e) => deleteNotification(n.id, e)}
                                            className="w-8 h-8 rounded-full bg-white shadow-sm border text-red-400 hover:text-red-500 hover:bg-red-50"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </Button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-20 flex flex-col items-center justify-center text-center opacity-30">
                                <BellOff className="w-16 h-16 mb-4" />
                                <p className="font-black italic">{t.empty}</p>
                            </div>
                        )}
                    </TabsContent>

                    {/* Simplified for other filter tabs for demo */}
                    <TabsContent value="system">
                        <div className="py-20 flex flex-col items-center justify-center text-center opacity-30">
                            <Clock className="w-16 h-16 mb-4" />
                            <p className="font-black italic">Coming to V5.1</p>
                        </div>
                    </TabsContent>
                </Tabs>

                <div className="mt-12 p-6 rounded-[32px] bg-slate-100 border border-dashed border-slate-300 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-slate-400">
                        <Settings className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{language === 'zh' ? '偏好设置' : 'Preferences'}</p>
                        <p className="text-xs font-bold text-slate-600">{language === 'zh' ? '管理您的推送与邮件通知' : 'Manage your push and email alerts'}</p>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default Notifications;
