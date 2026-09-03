import { useState, useEffect } from "react";
import SEO from "@/components/SEO";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useListingStore } from "@/stores/listingStore";
import { useAuthStore } from "@/stores/authStore";
import { useCommunity } from "@/context/CommunityContext";
import { useConfigStore } from "@/stores/configStore";
import { TodayStories } from "@/components/home/TodayStories";
import { CategoryIconGrid } from "@/components/home/CategoryIconGrid";
import { PopularInCommunity } from "@/components/home/PopularInCommunity";
import { LocationSelector } from "@/components/home/LocationSelector";
import { PromoBanner } from "@/components/home/PromoBanner";
import { TaskBoard } from "@/components/home/TaskBoard";
import { ArrowLeft, ArrowRight, Sparkles, TrendingUp, Clock, MapPin } from "lucide-react";
import { SmartSearchBar } from "@/components/SmartSearchBar";
import { Link, useNavigate } from "react-router-dom";
import { ListingMaster } from "@/types/domain";
import { ListingCard } from "@/components/ListingCard";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { repositoryFactory } from "@/services/repositories/factory";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { Badge } from "@/components/ui/badge";

// Bento Components
import { BentoGrid } from "@/components/home/BentoGrid";
import { BentoHero } from "@/components/home/BentoHero";
import { BentoProfile } from "@/components/home/BentoProfile";
import { BentoPromo } from "@/components/home/BentoPromo";
import { StoriesSection } from "@/components/home/StoriesSection";

const Index = () => {
  const navigate = useNavigate();
  const { listings, setListings } = useListingStore();
  const { currentUser } = useAuthStore();
  const { activeNodeId } = useCommunity();
  const { refCodes, setRefCodes, language } = useConfigStore();
  const [isLoading, setIsLoading] = useState(true);

  // Localization Dictionary
  const t = {
    currentCommunity: language === 'zh' ? '当前社区' : 'Current Community',
    aiSearch: language === 'zh' ? '搜索' : 'Search',
    pulse: language === 'zh' ? '社区动态' : 'Community Updates',
    liveUpdates: language === 'zh' ? '实时更新' : 'Live Updates',
    marketTitle: language === 'zh' ? '邻里好物与闲置' : 'Community Goods',
    marketDesc: language === 'zh' ? 'Ottawa & Kanata 本地闲置转让与物品分享' : 'Local items and neighborhood sharing in Ottawa & Kanata',
    viewAll: language === 'zh' ? '查看全部' : 'View All',
    serviceTitle: language === 'zh' ? 'Ottawa & Kanata 本地服务' : 'Ottawa & Kanata Services',
    serviceDesc: language === 'zh' ? '家政清洁、房屋维修、铲雪除草、宠物接送等邻里靠谱帮助' : 'Cleaning, handyman, snow removal, pet care & trusted local help',
    rentalTitle: language === 'zh' ? '共享租赁' : 'Rentals',
    rentalDesc: language === 'zh' ? '以租代买，省钱更环保' : 'Rent tools & equipment locally',
    emptyTitle: language === 'zh' ? 'Ottawa & Kanata 社区建设中' : 'Community Under Construction',
    emptyDesc: language === 'zh' ? '欢迎发布第一条本地服务或需求帖' : 'Be the first to post a local service or need',
    beFirst: language === 'zh' ? '发布需求或服务' : 'Post a Need or Service',
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
        console.log(`📦 Loaded ${nodeListings.length} listings for node ${activeNodeId}`);
        setListings(nodeListings);
      } catch (error) {
        console.error('Failed to load node listings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadNodeListings();
  }, [activeNodeId, setListings]);

  // Filter listings by type
  const services = listings.filter(l => l.type === 'SERVICE');
  const rentals = listings.filter(l => l.type === 'RENTAL');
  const goods = listings.filter(l => l.type === 'GOODS');
  const tasks = listings.filter(l => l.type === 'TASK');

  // Get nearby hot services (top 10 by rating)
  const nearbyHotServices = [...services, ...rentals]
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, 10);

  // Section animation variants
  const sectionVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  const cardContainerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1
      }
    }
  };

  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.4,
        ease: "easeOut"
      }
    }
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5 pb-20">
      <SEO /> {/* Default Homepage SEO */}
      <Header />

      {/* Daangn-style Hero Area */}
      <div className="pt-4 pb-6 bg-gradient-to-b from-primary/5 via-background to-background">
        <BentoGrid>
          {/* Main Hero: Headline & Location Pills */}
          <BentoHero />

          {/* Profile & Promo (1x1 each) */}
          <BentoProfile />
          <BentoPromo />

          {/* Full Width Stories (4x1) */}
          <StoriesSection />
        </BentoGrid>
      </div>

      <main className="container max-w-7xl px-4 sm:px-6 space-y-8 sm:space-y-12">
        {/* 4 Core Daangn-style Categories */}
        <section className="pt-2">
          <CategoryIconGrid />
        </section>

        {/* Popular In Community - Hot Ottawa Services */}
        {nearbyHotServices.length > 0 && (
          <motion.section
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={sectionVariants}
            className="py-1"
          >
            <PopularInCommunity listings={nearbyHotServices} />
          </motion.section>
        )}



        {/* Task Board with gradient background */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={sectionVariants}
          className="relative py-1"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-orange-50/50 to-yellow-50/50 rounded-3xl blur-3xl opacity-30" />
          <div className="relative">
            <TaskBoard />
          </div>
        </motion.section>

        {/* Goods Section with loading state */}
        {(goods.length > 0 || isLoading) && (
          <motion.section
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={sectionVariants}
          >
            <div className="flex items-center justify-between mb-6 sm:mb-8">
              <div className="flex items-center gap-3 sm:gap-4 p-1">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center text-2xl shadow-sm border border-orange-200/50">
                  🍪
                </div>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground flex items-center gap-2">
                    {t.marketTitle}
                    <Sparkles className="w-5 h-5 text-orange-400" />
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground font-medium">{t.marketDesc}</p>
                </div>
              </div>
              <Link
                to="/category/goods"
                className="group flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-semibold text-primary hover:text-primary/80 transition-colors flex-shrink-0"
              >
                <span className="hidden sm:inline">{t.viewAll}</span>
                <span className="sm:hidden">{language === 'zh' ? '全部' : 'All'}</span>
                <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            <AnimatePresence mode="wait">
              {isLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                  {[...Array(8)].map((_, i) => (
                    <SkeletonCard key={i} />
                  ))}
                </div>
              ) : (
                <motion.div
                  variants={cardContainerVariants}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4"
                >
                  {goods.slice(0, 8).map(item => (
                    <motion.div key={item.id} variants={cardVariants}>
                      <ListingCard item={item} />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.section>
        )}

        {/* Services Section with enhanced grid */}
        {(services.length > 0 || isLoading) && (
          <motion.section
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={sectionVariants}
          >
            <div className="flex items-center justify-between mb-6 sm:mb-8">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent flex items-center gap-2 sm:gap-3">
                  🧹 {t.serviceTitle}
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">{t.serviceDesc}</p>
              </div>
              <Link
                to="/category/service"
                className="group flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-semibold text-primary hover:text-primary/80 transition-colors flex-shrink-0"
              >
                <span className="hidden sm:inline">{t.viewAll}</span>
                <span className="sm:hidden">{language === 'zh' ? '全部' : 'All'}</span>
                <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            <AnimatePresence mode="wait">
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                  {[...Array(6)].map((_, i) => (
                    <SkeletonCard key={i} />
                  ))}
                </div>
              ) : (
                <motion.div
                  variants={cardContainerVariants}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6"
                >
                  {services.slice(0, 6).map(item => (
                    <motion.div key={item.id} variants={cardVariants}>
                      <ListingCard item={item} />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.section>
        )}

        {/* Rental Section with card animations */}
        {(rentals.length > 0 || isLoading) && (
          <motion.section
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={sectionVariants}
          >
            <div className="flex items-center justify-between mb-6 sm:mb-8">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center gap-2 sm:gap-3">
                  📸 {t.rentalTitle}
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">{t.rentalDesc}</p>
              </div>
              <Link
                to="/category/rental"
                className="group flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-semibold text-primary hover:text-primary/80 transition-colors flex-shrink-0"
              >
                <span className="hidden sm:inline">{t.viewAll}</span>
                <span className="sm:hidden">{language === 'zh' ? '全部' : 'All'}</span>
                <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            <AnimatePresence mode="wait">
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                  {[...Array(6)].map((_, i) => (
                    <SkeletonCard key={i} />
                  ))}
                </div>
              ) : (
                <motion.div
                  variants={cardContainerVariants}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6"
                >
                  {rentals.slice(0, 6).map(item => (
                    <motion.div key={item.id} variants={cardVariants}>
                      <ListingCard item={item} />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.section>
        )}

        {/* Empty State when no listings */}
        {!isLoading && listings.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
              <Sparkles className="w-16 h-16 text-primary/50" />
            </div>
            <h3 className="text-2xl font-bold mb-2">{t.emptyTitle}</h3>
            <p className="text-muted-foreground mb-6">{t.emptyDesc}</p>
            <button
              onClick={() => navigate('/post-gig')}
              className="px-6 py-3 bg-gradient-to-r from-primary to-primary/80 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
            >
              {t.beFirst}
            </button>
          </motion.div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Index;