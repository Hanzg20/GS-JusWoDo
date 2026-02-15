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
  const { initializeLanguage } = useConfigStore();

  // Initialize language on first run
  useEffect(() => {
    initializeLanguage();
  }, [initializeLanguage]);

  return (
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <TooltipProvider>
          <SEO /> {/* Default Global SEO */}
          <Toaster />
          <Sonner />
          <BrowserRouter>
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
