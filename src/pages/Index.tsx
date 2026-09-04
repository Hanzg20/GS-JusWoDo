import { useState, useEffect } from "react";
import SEO from "@/components/SEO";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useListingStore } from "@/stores/listingStore";
import { useCommunity } from "@/context/CommunityContext";
import { useConfigStore } from "@/stores/configStore";
import { useCommunityPostStore } from "@/stores/communityPostStore";
import { CategoryIconGrid } from "@/components/home/CategoryIconGrid";
import { MasonryGrid } from "@/components/Community/MasonryGrid";
import { ArrowRight, Sparkles, Flame, Wrench, Package, Camera, MessageSquareQuote } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { ListingCard } from "@/components/ListingCard";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { repositoryFactory } from "@/services/repositories/factory";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { BentoHero } from "@/components/home/BentoHero";

type TabType = 'all' | 'services' | 'goods' | 'rentals' | 'community';

const Index = () => {
  const navigate = useNavigate();
  const { listings, setListings } = useListingStore();
  const { activeNodeId } = useCommunity();
  const { refCodes, setRefCodes, language } = useConfigStore();
  const { posts: communityPosts, isLoading: isCommunityLoading, fetchFeed } = useCommunityPostStore();
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('all');

  const isZh = language === 'zh';

  // Localization Dictionary
  const t = {
    all: isZh ? '🔥 热门推荐' : '🔥 Trending',
    services: isZh ? '🧹 本地服务' : '🧹 Services',
    goods: isZh ? '🏷️ 邻里闲置' : '🏷️ Goods',
    rentals: isZh ? '📸 共享租赁' : '📸 Rentals',
    community: isZh ? '💬 邻里动态' : '💬 Neighbors',
    viewMore: isZh ? '查看更多' : 'View More',
    emptyTitle: isZh ? 'Ottawa & Kanata 社区建设中' : 'Community Under Construction',
    emptyDesc: isZh ? '欢迎发布第一条本地服务或需求帖' : 'Be the first to post a local service or need',
    beFirst: isZh ? '发布需求或服务' : 'Post a Need or Service',
  };

  // Load ref codes on mount
  useEffect(() => {
    const loadRefCodes = async () => {
      try {
        const refCodeRepo = repositoryFactory.getRefCodeRepository();
        const codes = await refCodeRepo.getAll();
        setRefCodes(codes);
      } catch (error) {
        console.error('Failed to load ref codes:', error);
      }
    };

    if (refCodes.length === 0) {
      loadRefCodes();
    }
  }, [refCodes.length, setRefCodes]);

  // Load listings for current node
  useEffect(() => {
    const loadNodeListings = async () => {
      setIsLoading(true);
      try {
        const listingRepo = repositoryFactory.getListingRepository();
        const nodeListings = await listingRepo.getByNode(activeNodeId);
        setListings(nodeListings);
      } catch (error) {
        console.error('Failed to load node listings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadNodeListings();
  }, [activeNodeId, setListings]);

  // Load community feed (real 邻里互助 content, separate from listings)
  useEffect(() => {
    fetchFeed({ nodeId: activeNodeId, scope: 'nearby' });
  }, [activeNodeId, fetchFeed]);

  // Filter listings by active tab
  const getFilteredListings = () => {
    switch (activeTab) {
      case 'services':
        return listings.filter(l => l.type === 'SERVICE');
      case 'goods':
        return listings.filter(l => l.type === 'GOODS');
      case 'rentals':
        return listings.filter(l => l.type === 'RENTAL');
      case 'all':
      default:
        return listings;
    }
  };

  const currentFilteredListings = getFilteredListings();

  // Hero carousel: top-rated real listings, not paid ad slots — the
  // differentiator vs. yellowducky.ca's pay-to-appear carousel is that
  // this ranks by actual rating/reviews.
  const featuredListings = [...listings]
    .filter(l => l.rating >= 4.5 && l.reviewCount > 0)
    .sort((a, b) => (b.rating - a.rating) || (b.reviewCount - a.reviewCount))
    .slice(0, 6);

  // Animation variants
  const sectionVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
  };

  const cardContainerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.05 } }
  };

  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  };

  const tabs: { id: TabType; label: string; icon: any }[] = [
    { id: 'all', label: t.all, icon: Flame },
    { id: 'services', label: t.services, icon: Wrench },
    { id: 'goods', label: t.goods, icon: Package },
    { id: 'rentals', label: t.rentals, icon: Camera },
    { id: 'community', label: t.community, icon: MessageSquareQuote },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5 pb-20">
      <SEO />
      <Header />

      {/* Streamlined Hero Header */}
      <div className="pt-3 pb-4 max-w-7xl mx-auto px-4 sm:px-6">
        <BentoHero featuredListings={featuredListings} />
      </div>

      <main className="container max-w-7xl px-4 sm:px-6 space-y-6 sm:space-y-8">
        {/* 3 Core Daangn Categories: 商户服务 / 邻里互助 / 二手闲置 */}
        <section>
          <CategoryIconGrid />
        </section>

        {/* Unified Tabbed Feed Section */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={sectionVariants}
          className="space-y-4"
        >
          {/* Feed Header with Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                    activeTab === tab.id
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* View More Link */}
            <Link
              to={activeTab === 'all' ? '/discover' : activeTab === 'community' ? '/community' : `/category/${activeTab}`}
              className="flex items-center gap-1 text-xs sm:text-sm font-bold text-primary hover:text-primary/80 transition-colors self-end sm:self-auto"
            >
              <span>{t.viewMore}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Feed Content */}
          <AnimatePresence mode="wait">
            {activeTab === 'community' ? (
              <motion.div key="community" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <MasonryGrid posts={communityPosts.slice(0, 9)} isLoading={isCommunityLoading} />
              </motion.div>
            ) : isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                {[...Array(8)].map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : currentFilteredListings.length > 0 ? (
              <motion.div
                key={activeTab}
                variants={cardContainerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4"
              >
                {currentFilteredListings.slice(0, 12).map((item) => (
                  <motion.div key={item.id} variants={cardVariants}>
                    <ListingCard item={item} />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12 bg-card rounded-2xl border border-border/50 p-6"
              >
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-lg font-bold mb-1">{t.emptyTitle}</h3>
                <p className="text-xs text-muted-foreground mb-4">{t.emptyDesc}</p>
                <button
                  onClick={() => navigate('/post-gig')}
                  className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold text-xs hover:shadow-md transition-all"
                >
                  {t.beFirst}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;