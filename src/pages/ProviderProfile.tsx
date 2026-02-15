import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { repositoryFactory } from '@/services/repositories/factory';
import { ProviderProfile as ProviderProfileType, ListingMaster, Review } from '@/types/domain';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Sparkles, Box, Ticket } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useConfigStore } from '@/stores/configStore';
import { useAuthStore } from '@/stores/authStore';
import { ProviderInventoryDashboard } from '@/components/inventory/ProviderInventoryDashboard';
import { CouponManager } from '@/components/coupon';

// Sub-components
import { ProviderHero } from '@/components/provider-profile/ProviderHero';
import { ProviderServicesTab } from '@/components/provider-profile/ProviderServicesTab';
import { ProviderReviewsTab } from '@/components/provider-profile/ProviderReviewsTab';
import { ProviderAboutTab } from '@/components/provider-profile/ProviderAboutTab';

export default function ProviderProfile() {
    const { providerId } = useParams<{ providerId: string }>();
    const navigate = useNavigate();
    const { language } = useConfigStore();
    const { currentUser } = useAuthStore();

    const [provider, setProvider] = useState<ProviderProfileType | null>(null);
    const [providerAvatar, setProviderAvatar] = useState<string | undefined>(undefined);
    const [listings, setListings] = useState<ListingMaster[]>([]);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [searchParams] = useSearchParams();
    const initialTab = searchParams.get('tab') || 'services';
    const [activeTab, setActiveTab] = useState(initialTab);

    // Update tab if URL changes
    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab) setActiveTab(tab);
    }, [searchParams]);

    useEffect(() => {
        if (providerId) {
            loadProviderData();
        }
    }, [providerId]);

    const loadProviderData = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const providerRepo = repositoryFactory.getProviderRepository();
            const listingRepo = repositoryFactory.getListingRepository();
            const reviewRepo = repositoryFactory.getReviewRepository();

            // 1. Load provider profile
            const providerData = await providerRepo.getById(providerId!);
            if (!providerData) {
                setError(language === 'zh' ? '提供商未找到' : 'Provider not found');
                return;
            }
            setProvider(providerData);

            // 1.1 Fetch User Avatar
            const { data: userData } = await supabase
                .from('user_profiles')
                .select('avatar')
                .eq('id', providerData.userId)
                .single();

            if (userData) {
                setProviderAvatar(userData.avatar);
            }

            // 2. Load all provider's published services
            const allListings = await listingRepo.getAll();
            const providerListings = allListings.filter(
                l => l.providerId === providerId && l.status === 'PUBLISHED'
            );
            setListings(providerListings);

            // 3. Load cross-service reviews
            if (providerListings.length > 0) {
                const reviewsPromises = providerListings.map(listing =>
                    reviewRepo.getByListing(listing.id)
                );
                const reviewsNested = await Promise.all(reviewsPromises);
                const allReviews = reviewsNested.flat();
                setReviews(allReviews);
            }
        } catch (err) {
            console.error('Failed to load provider data:', err);
            setError(language === 'zh' ? '加载提供商信息失败' : 'Failed to load provider information');
        } finally {
            setIsLoading(false);
        }
    };

    const t = {
        tabServices: language === 'zh' ? '服务' : 'Services',
        tabReviews: language === 'zh' ? '评价' : 'Reviews',
        tabAbout: language === 'zh' ? '关于' : 'About',
        tabInventory: language === 'zh' ? '库存管理' : 'Inventory',
        coupons: language === 'zh' ? '优惠券' : 'Coupons',
        providerNotFound: language === 'zh' ? '提供商未找到' : 'Provider Not Found',
        backToHome: language === 'zh' ? '返回首页' : 'Back to Home',
        providerNotFoundDesc: language === 'zh' ? '您查找的提供商不存在。' : 'The provider you are looking for does not exist.',
    };

    const businessName = language === 'zh'
        ? (provider?.businessNameZh || provider?.businessNameEn)
        : (provider?.businessNameEn || provider?.businessNameZh);

    const description = language === 'zh'
        ? (provider?.descriptionZh || provider?.descriptionEn)
        : (provider?.descriptionEn || provider?.descriptionZh);

    const avgRating = reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

    const isOwner = currentUser && provider && currentUser.id === provider.userId;

    const handleContactProvider = () => {
        navigate('/chat', { state: { providerId } });
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background">
                <Header />
                <div className="container max-w-6xl py-20 text-center">
                    <div className="animate-pulse space-y-4">
                        <div className="h-32 bg-muted rounded-xl" />
                        <div className="h-64 bg-muted rounded-xl" />
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    if (error || !provider) {
        return (
            <div className="min-h-screen bg-background">
                <Header />
                <div className="container max-w-6xl py-20 text-center">
                    <Sparkles className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <h2 className="text-2xl font-bold mb-2">{t.providerNotFound}</h2>
                    <p className="text-muted-foreground mb-6">{error || t.providerNotFoundDesc}</p>
                    <Button onClick={() => navigate('/')}>{t.backToHome}</Button>
                </div>
                <Footer />
            </div>
        );
    }

    const joinedDate = new Date(provider.createdAt);
    const yearsActive = Math.max(1, new Date().getFullYear() - joinedDate.getFullYear());

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5">
            <Header />

            <div className="container max-w-6xl py-8">
                {/* Hero Section with Animation */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <ProviderHero
                        provider={provider}
                        businessName={businessName || 'Provider'}
                        description={description || ''}
                        avatarUrl={providerAvatar}
                        avgRating={avgRating}
                        reviewCount={reviews.length}
                        listingCount={listings.length}
                        yearsActive={yearsActive}
                        isOwner={!!isOwner}
                        onContact={handleContactProvider}
                        onEdit={() => navigate('/profile')}
                    />
                </motion.div>

                {/* Tabs Section */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className={`grid w-full ${isOwner ? 'grid-cols-5' : 'grid-cols-3'} max-w-xl mx-auto`}>
                        <TabsTrigger value="services">
                            {t.tabServices} ({listings.length})
                        </TabsTrigger>
                        <TabsTrigger value="reviews">
                            {t.tabReviews} ({reviews.length})
                        </TabsTrigger>
                        <TabsTrigger value="about">
                            {t.tabAbout}
                        </TabsTrigger>
                        {isOwner && (
                            <TabsTrigger value="inventory" className="gap-2">
                                <Box className="w-4 h-4" />
                                {t.tabInventory}
                            </TabsTrigger>
                        )}
                        {isOwner && (
                            <TabsTrigger value="coupons" className="gap-2">
                                <Ticket className="w-4 h-4" />
                                {t.coupons}
                            </TabsTrigger>
                        )}
                    </TabsList>

                    <TabsContent value="services" className="space-y-6">
                        <ProviderServicesTab listings={listings} />
                    </TabsContent>

                    <TabsContent value="reviews" className="space-y-6">
                        <ProviderReviewsTab reviews={reviews} listings={listings} />
                    </TabsContent>

                    <TabsContent value="about">
                        <ProviderAboutTab provider={provider} yearsActive={yearsActive} />
                    </TabsContent>

                    {isOwner && (
                        <TabsContent value="inventory">
                            <ProviderInventoryDashboard providerId={providerId!} />
                        </TabsContent>
                    )}

                    {isOwner && (
                        <TabsContent value="coupons">
                            <CouponManager
                                providerId={providerId!}
                                providerName={businessName || 'Provider'}
                                providerLogo={providerAvatar}
                            />
                        </TabsContent>
                    )}
                </Tabs>
            </div>

            <Footer />
        </div>
    );
}
