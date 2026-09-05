import { Bell, User, PlusCircle, Globe, Search } from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "./ui/button";
import { useAuthStore } from "@/stores/authStore";
import { useMessageStore } from "@/stores/messageStore";
import { useConfigStore } from "@/stores/configStore";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "./ui/dropdown-menu";
import { SmartSearchBar } from "./SmartSearchBar";
import { NodePicker } from "./NodePicker";

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // BentoHero already renders a full search bar on the homepage —
  // don't duplicate it here, only show Header's search on other pages.
  const isHomepage = location.pathname === '/';
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const { currentUser, isLoading } = useAuthStore();
  const { totalUnreadCount, loadUnreadCount } = useMessageStore();
  const { language, setLanguage } = useConfigStore();

  // Load unread count on mount and when user changes
  useEffect(() => {
    if (currentUser?.id) {
      loadUnreadCount(currentUser.id);
    }
  }, [currentUser?.id, loadUnreadCount]);

  // Ordinary neighbors post lightweight community content (LitePost);
  // providers get routed straight into the structured service/listing
  // flow instead — see conversation 2026-09-05 on the two posting entry
  // points ("Post Need/Service" was previously wired to LitePost for
  // everyone regardless of role, so a provider clicking it could never
  // actually create a bookable service).
  const isProvider = currentUser?.roles?.includes('PROVIDER');

  // Localized text dictionary
  const t = {
    postBuyer: language === 'zh' ? '发个动态' : 'Post Update',
    postProvider: language === 'zh' ? '发布服务/商品' : 'Post Service/Listing',
    brandName: language === 'zh' ? '渥帮 JWD' : 'JWD Ottawa',
  };

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-border/10 shadow-sm">
      <div className="container flex items-center justify-between h-16 px-4 max-w-7xl mx-auto gap-4">
        {/* Logo & Location */}
        <div className="flex items-center gap-3 shrink-0">
          <Link to="/" className="flex items-center gap-2.5 focus:scale-95 transition-transform">
            <img src="/logo.png" alt="渥帮 JWD Logo" className="w-9 h-9 rounded-xl object-cover shadow-sm" />
            <div className="flex flex-col">
              <h1 className="text-base font-black tracking-tight text-slate-900 leading-none">{t.brandName}</h1>
              <span className="text-[10px] font-semibold text-primary/80 tracking-wide mt-0.5">Ottawa & Kanata</span>
            </div>
          </Link>

          {/* Community node picker — District > Node, see NodePicker.tsx
              (not to be confused with LocationPicker.tsx, the map/pin-drop
              component used by the publish flow) */}
          <NodePicker className="hidden sm:flex" />
        </div>

        {/* Desktop Search Bar */}
        {!isHomepage && (
          <div className="hidden md:block flex-1 max-w-lg mx-auto">
            <SmartSearchBar isCompact />
          </div>
        )}

        {/* Navigation Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Central Post Action — always the structured Publish.tsx flow,
              which already narrows its category choices by role (buyer:
              Task; provider: Service/Goods). LitePost (lightweight
              community content) stays scoped to the Community page's own
              post button, not this one. */}
          <Button
            size="sm"
            className="rounded-full h-9 px-4 font-bold text-xs gap-1.5 shadow-sm bg-primary text-white hover:bg-primary/90 hidden sm:flex"
            onClick={() => navigate('/post-gig')}
          >
            <PlusCircle className="w-4 h-4" /> {isProvider ? t.postProvider : t.postBuyer}
          </Button>

          {/* Mobile Search Toggle — not on homepage, BentoHero already has a search bar there */}
          {!isHomepage && (
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden rounded-full w-9 h-9"
              onClick={() => setShowMobileSearch(!showMobileSearch)}
            >
              <Search className="w-4 h-4 text-muted-foreground" />
            </Button>
          )}

          {/* Messages Notification Bell */}
          <Button
            variant="ghost"
            size="icon"
            className="relative rounded-full w-9 h-9"
            onClick={() => navigate('/messages')}
          >
            <Bell className="w-4.5 h-4.5 text-slate-600" />
            {totalUnreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center shadow-md border-2 border-white animate-pulse">
                {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
              </span>
            )}
          </Button>

          {/* Language Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full w-9 h-9">
                <Globe className="w-4.5 h-4.5 text-slate-600" />
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

          {/* User Profile Avatar */}
          <button
            onClick={() => navigate(currentUser ? '/profile' : '/login')}
            className="relative overflow-hidden w-9 h-9 rounded-full border border-border/20 focus:scale-95 transition-transform"
          >
            {isLoading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-muted">
                <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : currentUser ? (
              <img src={currentUser.avatar} alt="User Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary">
                <User className="w-4 h-4" />
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Search Overlay */}
      {showMobileSearch && (
        <div className="md:hidden px-4 pb-3 animate-in slide-in-from-top-2">
          <SmartSearchBar isCompact />
        </div>
      )}
    </header>
  );
};

export default Header;
