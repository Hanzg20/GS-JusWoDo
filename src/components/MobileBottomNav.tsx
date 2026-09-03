import { useNavigate, useLocation } from "react-router-dom";
import { Home, MessageSquare, User, PlusSquare, Store, MessageSquareQuote } from "lucide-react";
import { cn } from "@/lib/utils";
import { useConfigStore } from "@/stores/configStore";
import { useMessageStore } from "@/stores/messageStore";
import { useAuthStore } from "@/stores/authStore";
import { useEffect } from "react";

export default function MobileBottomNav() {
    const navigate = useNavigate();
    const location = useLocation();
    const language = useConfigStore(state => state.language);
    const { currentUser } = useAuthStore();
    const { totalUnreadCount, loadConversations, loadUnreadCount } = useMessageStore();

    // Load conversations to get unread count on mount
    useEffect(() => {
        if (currentUser?.id) {
            loadConversations(currentUser.id);
        }
    }, [currentUser?.id, loadConversations]);

    // Poll for unread count updates every 30 seconds
    useEffect(() => {
        if (!currentUser?.id) return;

        const interval = setInterval(() => {
            loadUnreadCount(currentUser.id);
        }, 30000); // Update every 30 seconds

        return () => clearInterval(interval);
    }, [currentUser?.id, loadUnreadCount]);

    // Refresh unread count when navigating away from messages page
    useEffect(() => {
        if (currentUser?.id && location.pathname !== '/messages' && location.pathname !== '/chat') {
            loadUnreadCount(currentUser.id);
        }
    }, [location.pathname, currentUser?.id, loadUnreadCount]);

    // Hide on specific pages
    if (
        location.pathname.startsWith("/scan") ||
        location.pathname.startsWith("/service/") ||
        location.pathname.startsWith("/community/") ||
        location.pathname === "/checkout" ||
        location.pathname === "/payment-success" ||
        location.pathname.startsWith("/chat/")
    ) {
        return null;
    }

    const navItems = [
        {
            icon: Home,
            label: language === 'zh' ? '首页' : 'Home',
            path: "/",
        },
        {
            icon: MessageSquareQuote,
            label: language === 'zh' ? '邻里互助' : 'Community',
            path: "/community",
        },
        {
            icon: PlusSquare,
            label: language === 'zh' ? '发布' : 'Post',
            path: "/publish", // Changed to central publish page
        },
        {
            icon: MessageSquare,
            label: language === 'zh' ? '消息' : 'Messages',
            path: "/chat", // Confirmed route
        },
        {
            icon: User,
            label: language === 'zh' ? '我' : 'Me',
            path: "/profile", // Confirmed route
        },
    ];


    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 pb-[env(safe-area-inset-bottom)]">
            <div className="flex justify-around items-center h-14">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));

                    return (
                        <button
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            className="relative flex-1 flex flex-col items-center justify-center h-full space-y-0.5 active:bg-gray-50 transition-colors"
                        >
                            <item.icon
                                strokeWidth={isActive ? 2.5 : 2}
                                className={cn(
                                    "w-6 h-6 transition-colors duration-200",
                                    isActive ? "text-primary" : "text-gray-400"
                                )}
                            />
                            <span
                                className={cn(
                                    "text-[10px] font-medium transition-colors duration-200",
                                    isActive ? "text-primary" : "text-gray-400"
                                )}
                            >
                                {item.label}
                            </span>
                            {/* Notification badge for messages */}
                            {item.path === "/chat" && totalUnreadCount > 0 && (
                                <span className="absolute top-1 right-6 min-w-[18px] h-[18px] px-1 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center shadow-lg border-2 border-white animate-pulse">
                                    {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
