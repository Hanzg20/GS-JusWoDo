import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { HelmetProvider } from 'react-helmet-async';
import MobileBottomNav from "./components/MobileBottomNav";
import SEO from "./components/SEO";
import { CommunityProvider } from "./context/CommunityContext";
import { useConfigStore } from "./stores/configStore";
import { PWAInstallPrompt } from "./components/PWAInstallPrompt";
import { AnimatedRoutes } from "./components/AnimatedRoutes";

const queryClient = new QueryClient();

const App = () => {
  const { initializeLanguage, language } = useConfigStore();

  // Initialize language on first run
  useEffect(() => {
    initializeLanguage();
  }, [initializeLanguage]);

  // Update document title based on language
  useEffect(() => {
    const titles = {
      zh: '渥帮 JWD - 渥太华本地互助社区',
      en: 'JWD - Get Things Done Together'
    };
    document.title = titles[language];
  }, [language]);

  return (
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <SEO /> {/* Default Global SEO - moved inside Router */}
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
