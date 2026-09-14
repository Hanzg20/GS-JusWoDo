import { useState, useEffect, useMemo } from "react";
import SEO from "@/components/SEO";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useListingStore } from "@/stores/listingStore";
import { useCommunity } from "@/context/CommunityContext";
import { useConfigStore, browseNodeId } from "@/stores/configStore";
import { CategoryIconGrid } from "@/components/home/CategoryIconGrid";
import { ArrowRight, Sparkles } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { ListingCard } from "@/components/ListingCard";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { repositoryFactory } from "@/services/repositories/factory";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { BentoHero } from "@/components/home/BentoHero";
import { useEnrichedListings } from "@/hooks/useEnrichedListings";

const Index = () => {
  const navigate = useNavigate();
  const { listings, setListings } = useListingStore();
  const { activeNodeId } = useCommunity();
  const { refCodes, setRefCodes, language } = useConfigStore();
  const [isLoading, setIsLoading] = useState(true);

  const isZh = language === 'zh';

  // Localization Dictionary
  const t = {
    all: isZh ? '🔥 热门推荐' : '🔥 Trending',
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
        const nodeListings = await listingRepo.getByNode(browseNodeId(activeNodeId));
        setListings(nodeListings);
      } catch (error) {
        console.error('Failed to load node listings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadNodeListings();
  }, [activeNodeId, setListings]);

  // 综合排序 ("comprehensive" ranking, the standard Chinese e-commerce
  // default sort — Taobao/JD/Pinduoduo all default here rather than pure
  // "newest" or "top-rated") — blends recency + rating + review count into
  // one score instead of the previous plain insertion-order slice, which
  // wasn't really "trending" at all. Weighted toward recency for now since
  // real reviews are still rare platform-wide (see the review-system audit
  // and the 2026-09-13 submission-bug fix) — unrated listings get a neutral
  // baseline so a brand-new listing isn't buried under 0-review ones.
  const trendingScore = (l: typeof listings[number]) => {
    const ageDays = (Date.now() - new Date(l.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    const recencyScore = Math.max(0, 30 - ageDays) / 30; // full marks under 1 day old, 0 past 30 days
    const qualityScore = l.reviewCount > 0 ? l.rating / 5 : 0.6;
    const reviewBoost = Math.min(l.reviewCount, 10) / 10;
    return recencyScore * 0.5 + qualityScore * 0.35 + reviewBoost * 0.15;
  };

  // Same enrichment CategoryListing.tsx uses: fetches the pricing these
  // cards need (never loaded on this page before) and attaches an
  // approximate distance from the neighbor's community node. No more
  // per-pillar tab filtering here — CategoryIconGrid above already routes
  // to each pillar's own page, which now has real 二级分类 (industry-tier)
  // browsing of its own (see 2026-09-14 pillar consolidation); this section
  // is a blended "what's trending right now" preview across every pillar.
  const visibleFeedListings = useMemo(
    () => [...listings].sort((a, b) => trendingScore(b) - trendingScore(a)).slice(0, 12),
    [listings]
  );
  const enrichedFeedListings = useEnrichedListings(visibleFeedListings);

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

        {/* Trending feed — a flat preview, no tab switcher. It used to
            duplicate CategoryIconGrid's own 3 pillars one section down;
            that pillar is already reachable up there, and each pillar's
            own page now has real 二级分类 browsing (see the 2026-09-14
            pillar consolidation), so this is just "what's trending now". */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={sectionVariants}
          className="space-y-4"
        >
          {/* Feed Header */}
          <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-3">
            <h2 className="text-sm sm:text-base font-bold">{t.all}</h2>

            {/* View More Link */}
            <Link
              to="/discover"
              className="flex items-center gap-1 text-xs sm:text-sm font-bold text-primary hover:text-primary/80 transition-colors"
            >
              <span>{t.viewMore}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Feed Content */}
          <AnimatePresence mode="wait">
            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                {[...Array(8)].map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : enrichedFeedListings.length > 0 ? (
              <motion.div
                key="trending"
                variants={cardContainerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4"
              >
                {enrichedFeedListings.map((item) => (
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