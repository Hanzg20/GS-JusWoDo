import { Bell, User, Menu, PlusCircle, MessageCircle, Globe, MapPin } from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { useAuthStore } from "@/stores/authStore";
import { useCommunity } from "@/context/CommunityContext";
import { BeanBalance } from "./beans/BeanBalance";
import { useMessageStore } from "@/stores/messageStore";
import { useConfigStore } from "@/stores/configStore";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "./ui/dropdown-menu";
import { LitePost } from "./Community/LitePost";

const Header = () => {
  const navigate = useNavigate();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const { currentUser, isLoading } = useAuthStore();
  const { activeNodeId } = useCommunity();
  const { totalUnreadCount, loadUnreadCount } = useMessageStore();
  const { language, setLanguage } = useConfigStore();

  // Load unread count on mount and when user changes
  useEffect(() => {
    if (currentUser?.id) {
      loadUnreadCount(currentUser.id);
    }
  }, [currentUser?.id, loadUnreadCount]);

  // Localized text dictionary
  const t = {
    discover: language === 'zh' ? '发现' : 'Discover',
    map: language === 'zh' ? '地图' : 'Map',
    community: language === 'zh' ? '邻里' : 'Neighbors',
    orders: language === 'zh' ? '订单' : 'Orders',
    myPosts: language === 'zh' ? '我的发布' : 'My Posts',
    chat: language === 'zh' ? '消息' : 'Chat',
    post: language === 'zh' ? '说一下' : 'Post',
    postSomething: language === 'zh' ? '发布需求' : 'Post Something',
    myProfile: language === 'zh' ? '我的主页' : 'My Profile',
    wait: language === 'zh' ? '稍候...' : 'Wait...',
    me: language === 'zh' ? '我' : 'Me',
    join: language === 'zh' ? '登录' : 'Join',
    neighborly: language === 'zh' ? '让生活更轻松' : 'Make Life Easier',
    becomeProvider: language === 'zh' ? '能人入驻' : 'Become a Pro',
    proHub: language === 'zh' ? '达人中心' : 'Pro Hub',
    brandName: language === 'zh' ? '渥帮' : 'JUSTWEDO',
  };

  const isProvider = currentUser?.roles?.includes('PROVIDER');

  return (
    <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-border/5">
      <div className="container flex items-center justify-between h-14 px-4 max-w-7xl mx-auto">
        {/* Logo & Node */}
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 focus:scale-95 transition-transform">
            <img src="/logo.png" alt="Logo" className="w-8 h-8 rounded-xl object-cover shadow-sm" />
            <div className="flex flex-col">
              <h1 className="text-lg font-black tracking-tighter text-gradient leading-none">{t.brandName}</h1>
              <p className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground leading-none mt-1">
                {t.neighborly}
              </p>
            </div>
          </Link>

          <div className="h-4 w-px bg-border/20 hidden sm:block" />

          <button className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-muted/40 rounded-full hover:bg-muted transition-colors">
            <MapPin className="w-3 h-3 text-primary" />
            <span className="text-[10px] font-black uppercase tracking-widest">{activeNodeId || 'Kanata Lakes'}</span>
          </button>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-6">
          {[
            { label: t.discover, path: '/' },
            { label: t.community, path: '/community' },
            { label: t.map, path: '/discover' },
            ...(isProvider ? [{ label: t.proHub, path: '/provider/dashboard' }] : []),
          ].map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors relative group"
            >
              {item.label}
              <div className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2">
            <LitePost
              trigger={
                <Button variant="ghost" size="sm" className="rounded-full h-9 px-4 font-black text-xs uppercase tracking-widest gap-2">
                  <PlusCircle className="w-4 h-4" /> {t.post}
                </Button>
              }
            />
            {currentUser && <BeanBalance showLabel={false} size="sm" />}
          </div>

          {/* Mobile Map Icon */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden rounded-full w-9 h-9"
            onClick={() => navigate('/discover')}
          >
            <MapPin className="w-4 h-4 text-muted-foreground" />
          </Button>

          {/* Notification Bell Icon with Badge (Desktop only) */}
          <Button
            variant="ghost"
            size="icon"
            className="relative rounded-full w-9 h-9 hidden md:flex"
            onClick={() => navigate('/messages')}
          >
            <Bell className="w-4 h-4 text-muted-foreground" />
            {totalUnreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center shadow-lg border-2 border-white animate-pulse">
                {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
              </span>
            )}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full w-9 h-9">
                <Globe className="w-4 h-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-2xl border-border/10">
              <DropdownMenuItem className="font-bold text-xs" onClick={() => setLanguage('en')}>
                English {language === 'en' && '✓'}
              </DropdownMenuItem>
              <DropdownMenuItem className="font-bold text-xs" onClick={() => setLanguage('zh')}>
                中文 {language === 'zh' && '✓'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <button
            onClick={() => navigate(currentUser ? '/profile' : '/login')}
            className="relative overflow-hidden w-9 h-9 rounded-full border border-border/10 focus:scale-90 transition-transform"
          >
            {isLoading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-muted">
                <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : currentUser ? (
              <img src={currentUser.avatar} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary">
                <User className="w-4 h-4" />
              </div>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
