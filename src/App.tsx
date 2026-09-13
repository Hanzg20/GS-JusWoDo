import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, useLocation, useNavigate } from "react-router-dom";
import { HelmetProvider } from 'react-helmet-async';
import MobileBottomNav from "./components/MobileBottomNav";
import SEO from "./components/SEO";
import { CommunityProvider } from "./context/CommunityContext";
import { useConfigStore } from "./stores/configStore";
import { useAuthStore } from "./stores/authStore";
import { PWAInstallPrompt } from "./components/PWAInstallPrompt";
import { AnimatedRoutes } from "./components/AnimatedRoutes";
import { configWxShare, isWeChatBrowser, isWeChatMiniProgramWebview } from "./lib/wechatShare";
import { startSilentWeChatCheck } from "./lib/wechatAuth";
import { PresenceTracker } from "./components/PresenceTracker";
import { findNearestNode } from "./utils/navigation";
import { consumePostLoginRedirect } from "./utils/postLoginRedirect";
import { supabase } from "./lib/supabase";

const queryClient = new QueryClient();

// The Mini Program's web-view can't call wx.getLocation() itself (that's a
// native API only the outer mini-program shell has) — its wrapper page
// calls it and passes the result in here via ?geo_lat=&geo_lng=. A regular
// browser has no reason to ever set these, so this is effectively a
// mini-program-only bridge, not a general auto-geolocation feature.
const GeoNodeAutoSelect = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { refCodes, setActiveNode } = useConfigStore();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const lat = parseFloat(params.get('geo_lat') || '');
    const lng = parseFloat(params.get('geo_lng') || '');
    if (Number.isNaN(lat) || Number.isNaN(lng)) return;
    // Every NODE ref_code carries real lat/lng — wait for them to load
    // rather than silently doing nothing on a cold start.
    if (refCodes.length === 0) return;

    const nearest = findNearestNode(lat, lng, refCodes);
    if (nearest) {
      setActiveNode(nearest.codeId);
    }

    // Strip geo_lat/geo_lng once consumed so they don't linger in the URL
    // (shared links, back/forward history) past this one auto-select.
    params.delete('geo_lat');
    params.delete('geo_lng');
    const newSearch = params.toString();
    navigate({ pathname: location.pathname, search: newSearch ? `?${newSearch}` : '' }, { replace: true });
  }, [location.search, refCodes, navigate, setActiveNode]);

  return null;
};

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
    // Inside the Mini Program's web-view this redirect targets justwedo.com,
    // which isn't on the web-view's 业务域名 whitelist (only fdrl.jhtsoft.cn
    // is) — it would break the page with WeChat's native "无法打开该页面"
    // error instead of silently logging anyone in. Skip it there; the site
    // is still fully browsable, just without silent auto-login for now.
    if (isWeChatMiniProgramWebview()) return;
    startSilentWeChatCheck();
  }, [isLoading, currentUser, location.pathname]);

  return null;
};

// Consumes ?mp_token= — set by the Mini Program wrapper's app.js when its
// silent wx.login() check (wechat-miniprogram-login, createIfMissing:false)
// recognized a returning WeChat identity. Mirrors WeChatCallback.tsx's
// verifyOtp redemption; the session then picks up automatically through
// authStore.ts's existing onAuthStateChange subscription. No-op for a
// regular browser visitor, since nothing on the web side ever sets this param.
const MiniProgramTokenConsumer = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tokenHash = params.get('mp_token');
    if (!tokenHash) return;

    params.delete('mp_token');
    const newSearch = params.toString();
    navigate({ pathname: location.pathname, search: newSearch ? `?${newSearch}` : '' }, { replace: true });

    supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'email' }).catch((err) => {
      console.error('Mini Program silent login failed', err);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  return null;
};

// Login.tsx (and every other login-gated page) always navigates to '/' on
// success. This watches for currentUser going from null -> set and, only if
// some page stashed a return path first (via setPostLoginRedirect), sends
// the visitor there instead — runs after Login.tsx's own navigate('/'),
// so its navigate() call is the one that wins.
const PostLoginRedirect = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();

  useEffect(() => {
    if (!currentUser) return;
    const target = consumePostLoginRedirect();
    if (target) navigate(target, { replace: true });
  }, [currentUser, navigate]);

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
            <MiniProgramTokenConsumer />
            <GeoNodeAutoSelect />
            <PostLoginRedirect />
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
