import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, useLocation } from "react-router-dom";
import { HelmetProvider } from 'react-helmet-async';
import MobileBottomNav from "./components/MobileBottomNav";
import SEO from "./components/SEO";
import { CommunityProvider } from "./context/CommunityContext";
import { useConfigStore } from "./stores/configStore";
import { useAuthStore } from "./stores/authStore";
import { PWAInstallPrompt } from "./components/PWAInstallPrompt";
import { AnimatedRoutes } from "./components/AnimatedRoutes";
import { configWxShare, isWeChatBrowser } from "./lib/wechatShare";
import { startSilentWeChatCheck } from "./lib/wechatAuth";
import { PresenceTracker } from "./components/PresenceTracker";

const queryClient = new QueryClient();

// Separate from App() because it needs useLocation(), which only works
// inside <BrowserRouter>.
const SilentWeChatLogin = () => {
  const location = useLocation();
  const { currentUser, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isWeChatBrowser()) return;
    if (isLoading || currentUser) return;
    // Never fire from the callback page itself — it's already mid-flight
    // handling its own redirect back from WeChat.
    if (location.pathname === '/auth/wechat/callback') return;
    startSilentWeChatCheck();
  }, [isLoading, currentUser, location.pathname]);

  return null;
};

const App = () => {
  const { initializeLanguage, language } = useConfigStore();

  // Initialize language on first run
  useEffect(() => {
    initializeLanguage();
  }, [initializeLanguage]);

  // Browser tab title is owned entirely by SEO.tsx (react-helmet-async) —
  // a <title> set here directly on document.title used to fight it: since
  // this effect only reran on language change (not on navigation), it
  // would stomp a page's own <SEO title="..."/> (e.g. ServiceDetail.tsx's
  // "{listing name} | $price") back to this generic string the moment the
  // user switched languages, even while deep on that page.

  // WeChat in-app browser: run wx.config once on the entry URL so the
  // "..." menu gets stripped down to just the two share actions we drive
  // ourselves (see WECHAT_MENU_ITEMS_TO_HIDE) on every page, not only the
  // ones that set their own richer share card. Pages like
  // CommunityPostDetail call configWxShare again with post-specific data —
  // that second call reuses the already-loaded SDK and just overrides the
  // share title/desc/image, it doesn't undo the hidden menu items.
  useEffect(() => {
    if (!isWeChatBrowser()) return;
    configWxShare({
      title: document.title,
      description: language === 'zh'
        ? '渥太华 & Kanata 本地社区服务平台'
        : 'Ottawa & Kanata local community services platform',
      imageUrl: `${window.location.origin}/logo.png`,
      url: window.location.href
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <SEO /> {/* Default Global SEO - moved inside Router */}
            <SilentWeChatLogin />
            <PresenceTracker />
            <CommunityProvider>
              <AnimatedRoutes />
              <MobileBottomNav />
              <PWAInstallPrompt />
            </CommunityProvider>
          </BrowserRouter>
        </TooltipProvider>
      </HelmetProvider>
    </QueryClientProvider>
  );
};

export default App;
