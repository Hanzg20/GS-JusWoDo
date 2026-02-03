import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import MobileBottomNav from "./components/MobileBottomNav";
import Index from "./pages/Index";
import ServiceDetail from "./pages/ServiceDetail";
import PostGig from "./pages/PostGig";
import PublishService from "./pages/provider/PublishService";
import Publish from "./pages/Publish";
import Profile from "./pages/Profile";
import CategoryListing from "./pages/CategoryListing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Chat from "./pages/Chat";
import Orders from "./pages/Orders";
import OrderDetail from "./pages/OrderDetail";
import Cart from "./pages/Cart";
import Community from "./pages/Community";
import CommunityPostDetail from "./pages/CommunityPostDetail";
import UserProfile from "./pages/UserProfile";
import MyListings from "./pages/MyListings";
import ProviderDashboard from "./pages/ProviderDashboard";
import ReviewSubmission from "./pages/ReviewSubmission";
import ProviderProfile from "./pages/ProviderProfile";
import BecomeProvider from "./pages/BecomeProvider";
import About from "./pages/About";
import PersonalProfile from "./pages/PersonalProfile";
import LanguageSettings from "./pages/LanguageSettings";
import Wallet from "./pages/Wallet";
import Addresses from "./pages/Addresses";
import Checkout from "./pages/Checkout";
import QuickScanCheckout from "./pages/QuickScanCheckout";
import PaymentSuccess from "./pages/PaymentSuccess";
import MapDiscovery from "./pages/MapDiscovery";
import ComingSoon from "./pages/ComingSoon";
import NotFound from "./pages/NotFound";
import { CommunityProvider } from "./context/CommunityContext";
import { useConfigStore } from "./stores/configStore";
import { PWAInstallPrompt } from "./components/PWAInstallPrompt";

const queryClient = new QueryClient();

const App = () => {
  const { initializeLanguage } = useConfigStore();

  // Initialize language on first run
  useEffect(() => {
    initializeLanguage();
  }, [initializeLanguage]);

  // 🚀 App Initializing...
  // console.log('   - Supabase URL Set:', !!import.meta.env.VITE_SUPABASE_URL);
  // console.log('   - Use Mock Data:', import.meta.env.VITE_USE_MOCK_DATA);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <CommunityProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/service/:id" element={<ServiceDetail />} />
              <Route path="/post-gig" element={<Publish />} />
              <Route path="/publish" element={<Publish />} />
              <Route path="/provider/publish-service" element={<Publish />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/category/:type" element={<CategoryListing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/messages" element={<Chat />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/orders/:id" element={<OrderDetail />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/community" element={<Community />} />
              <Route path="/community/:id" element={<CommunityPostDetail />} />
              <Route path="/user/:userId" element={<UserProfile />} />
              <Route path="/my-listings" element={<MyListings />} />
              <Route path="/provider/dashboard" element={<ProviderDashboard />} />
              <Route path="/provider/publish-service" element={<PublishService />} />
              <Route path="/provider/orders" element={<Orders />} />
              <Route path="/review/:id" element={<ReviewSubmission />} />
              <Route path="/provider/:providerId" element={<ProviderProfile />} />
              <Route path="/become-provider" element={<BecomeProvider />} />
              <Route path="/about" element={<About />} />
              <Route path="/settings/profile" element={<PersonalProfile />} />
              <Route path="/settings/language" element={<LanguageSettings />} />
              <Route path="/wallet" element={<Wallet />} />
              <Route path="/addresses" element={<Addresses />} />
              <Route path="/scan/:id" element={<QuickScanCheckout />} />
              <Route path="/payment-success" element={<PaymentSuccess />} />
              <Route path="/discover" element={<MapDiscovery />} />
              <Route path="/user/:userId/followers" element={<ComingSoon />} />
              <Route path="/user/:userId/following" element={<ComingSoon />} />
              <Route path="/notifications" element={<ComingSoon />} />
              <Route path="/settings" element={<PersonalProfile />} />
              <Route path="/help" element={<ComingSoon />} />
              <Route path="/verification" element={<ComingSoon />} />
              <Route path="/favorites" element={<ComingSoon />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <MobileBottomNav />
            <PWAInstallPrompt />
          </CommunityProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};


export default App;
