import { lazy, Suspense } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { PageTransition } from "./PageTransition";
import { Loading } from "./Loading";

// Critical Path (Static Import)
import Index from "../pages/Index";

// Lazy Loaded Routes
const ServiceDetail = lazy(() => import("../pages/ServiceDetail"));
const Publish = lazy(() => import("../pages/Publish"));
const Profile = lazy(() => import("../pages/Profile"));
const CategoryListing = lazy(() => import("../pages/CategoryListing"));
const Login = lazy(() => import("../pages/Login"));
const Register = lazy(() => import("../pages/Register"));
const ForgotPassword = lazy(() => import("../pages/ForgotPassword"));
const ResetPassword = lazy(() => import("../pages/ResetPassword"));
const Chat = lazy(() => import("../pages/Chat"));
const Orders = lazy(() => import("../pages/Orders"));
const OrderDetail = lazy(() => import("../pages/OrderDetail"));
const Cart = lazy(() => import("../pages/Cart"));
const Community = lazy(() => import("../pages/Community"));
const CommunityPostDetail = lazy(() => import("../pages/CommunityPostDetail"));
const UserProfile = lazy(() => import("../pages/UserProfile"));
const MyListings = lazy(() => import("../pages/MyListings"));
const ProviderDashboard = lazy(() => import("../pages/ProviderDashboard"));
const PublishService = lazy(() => import("../pages/provider/PublishService"));
const ReviewSubmission = lazy(() => import("../pages/ReviewSubmission"));
const ProviderProfile = lazy(() => import("../pages/ProviderProfile"));
const BecomeProvider = lazy(() => import("../pages/BecomeProvider"));
const About = lazy(() => import("../pages/About"));
const PersonalProfile = lazy(() => import("../pages/PersonalProfile"));
const LanguageSettings = lazy(() => import("../pages/LanguageSettings"));
const Wallet = lazy(() => import("../pages/Wallet"));
const Addresses = lazy(() => import("../pages/Addresses"));
const QuickScanCheckout = lazy(() => import("../pages/QuickScanCheckout"));
const PaymentSuccess = lazy(() => import("../pages/PaymentSuccess"));
const MapDiscovery = lazy(() => import("../pages/MapDiscovery"));
const Verification = lazy(() => import("../pages/Verification"));
const Notifications = lazy(() => import("../pages/Notifications"));
const HelpCenter = lazy(() => import("../pages/HelpCenter"));
const NotFound = lazy(() => import("../pages/NotFound"));
const Contact = lazy(() => import("../pages/Contact"));
const Privacy = lazy(() => import("../pages/legal/Privacy"));
const Terms = lazy(() => import("../pages/legal/Terms"));
const ComingSoon = lazy(() => import("../pages/ComingSoon"));
const Checkout = lazy(() => import("../pages/Checkout"));

export const AnimatedRoutes = () => {
    const location = useLocation();

    return (
        <Suspense fallback={<Loading />}>
            <AnimatePresence mode="wait">
                <Routes location={location} key={location.pathname}>
                    <Route path="/" element={<PageTransition><Index /></PageTransition>} />
                    <Route path="/service/:id" element={<PageTransition><ServiceDetail /></PageTransition>} />
                    <Route path="/post-gig" element={<PageTransition><Publish /></PageTransition>} />
                    <Route path="/publish" element={<PageTransition><Publish /></PageTransition>} />
                    <Route path="/provider/publish-service" element={<PageTransition><PublishService /></PageTransition>} />
                    <Route path="/profile" element={<PageTransition><Profile /></PageTransition>} />
                    <Route path="/category/:type" element={<PageTransition><CategoryListing /></PageTransition>} />
                    <Route path="/search" element={<PageTransition><CategoryListing /></PageTransition>} />
                    <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
                    <Route path="/register" element={<PageTransition><Register /></PageTransition>} />
                    <Route path="/forgot-password" element={<PageTransition><ForgotPassword /></PageTransition>} />
                    <Route path="/reset-password" element={<PageTransition><ResetPassword /></PageTransition>} />
                    <Route path="/chat" element={<PageTransition><Chat /></PageTransition>} />
                    <Route path="/messages" element={<PageTransition><Chat /></PageTransition>} />
                    <Route path="/orders" element={<PageTransition><Orders /></PageTransition>} />
                    <Route path="/orders/:id" element={<PageTransition><OrderDetail /></PageTransition>} />
                    <Route path="/checkout" element={<PageTransition><Checkout /></PageTransition>} />
                    <Route path="/cart" element={<PageTransition><Cart /></PageTransition>} />
                    <Route path="/community" element={<PageTransition><Community /></PageTransition>} />
                    <Route path="/community/:id" element={<PageTransition><CommunityPostDetail /></PageTransition>} />
                    <Route path="/user/:userId" element={<PageTransition><UserProfile /></PageTransition>} />
                    <Route path="/my-listings" element={<PageTransition><MyListings /></PageTransition>} />
                    <Route path="/provider/dashboard" element={<PageTransition><ProviderDashboard /></PageTransition>} />
                    <Route path="/provider/orders" element={<PageTransition><Orders /></PageTransition>} />
                    <Route path="/review/:id" element={<PageTransition><ReviewSubmission /></PageTransition>} />
                    <Route path="/provider/:providerId" element={<PageTransition><ProviderProfile /></PageTransition>} />
                    <Route path="/become-provider" element={<PageTransition><BecomeProvider /></PageTransition>} />
                    <Route path="/about" element={<PageTransition><About /></PageTransition>} />
                    <Route path="/settings/profile" element={<PageTransition><PersonalProfile /></PageTransition>} />
                    <Route path="/settings/language" element={<PageTransition><LanguageSettings /></PageTransition>} />
                    <Route path="/wallet" element={<PageTransition><Wallet /></PageTransition>} />
                    <Route path="/addresses" element={<PageTransition><Addresses /></PageTransition>} />
                    <Route path="/scan/:id" element={<PageTransition><QuickScanCheckout /></PageTransition>} />
                    <Route path="/payment-success" element={<PageTransition><PaymentSuccess /></PageTransition>} />
                    <Route path="/discover" element={<PageTransition><MapDiscovery /></PageTransition>} />
                    <Route path="/user/:userId/followers" element={<PageTransition><ComingSoon /></PageTransition>} />
                    <Route path="/user/:userId/following" element={<PageTransition><ComingSoon /></PageTransition>} />
                    <Route path="/notifications" element={<PageTransition><Notifications /></PageTransition>} />
                    <Route path="/settings" element={<PageTransition><PersonalProfile /></PageTransition>} />
                    <Route path="/help" element={<PageTransition><HelpCenter /></PageTransition>} />
                    <Route path="/contact" element={<PageTransition><Contact /></PageTransition>} />
                    <Route path="/legal/privacy" element={<PageTransition><Privacy /></PageTransition>} />
                    <Route path="/legal/terms" element={<PageTransition><Terms /></PageTransition>} />
                    <Route path="/verification" element={<PageTransition><Verification /></PageTransition>} />
                    <Route path="/favorites" element={<PageTransition><ComingSoon /></PageTransition>} />
                    <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
                </Routes>
            </AnimatePresence>
        </Suspense>
    );
};
