import { useState, useEffect } from "react";
import SEO from "@/components/SEO";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { LitePost } from "@/components/Community/LitePost";
import { MasonryGrid } from "@/components/Community/MasonryGrid";
import { PullToRefreshIndicator } from "@/components/Community/PullToRefresh";
import { TrendingTags } from "@/components/Community/TrendingTags";
import { useAuthStore } from "@/stores/authStore";
import { useCommunityPostStore } from "@/stores/communityPostStore";
import { useConfigStore } from "@/stores/configStore";
import { CommunityPostType } from "@/types/community";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";

const Community = () => {
    const { posts, fetchFeed, loadMore, isLoading, hasMore } = useCommunityPostStore();
    const { currentUser } = useAuthStore();
    const { language } = useConfigStore();
    const [activeFilter, setActiveFilter] = useState<'all' | CommunityPostType>('all');
    const [selectedTag, setSelectedTag] = useState<string | null>(null);
    const [scope, setScope] = useState<'nearby' | 'city'>('city');

    // DEBUG: Check user node
    useEffect(() => {
        console.log('Community: User State', {
            id: currentUser?.id,
            nodeId: currentUser?.nodeId,
            scope
        });
    }, [currentUser, scope]);

    useEffect(() => {
        const typeFilter = activeFilter === 'all' ? undefined : activeFilter;
        fetchFeed({
            postType: typeFilter,
            query: selectedTag || undefined,
            scope: scope,
            nodeId: currentUser?.nodeId
        });
    }, [activeFilter, selectedTag, scope, fetchFeed]);

    // 下拉刷新
    const handleRefresh = async () => {
        const typeFilter = activeFilter === 'all' ? undefined : activeFilter;
        await fetchFeed({ postType: typeFilter });
    };

    const pullToRefresh = usePullToRefresh({
        onRefresh: handleRefresh,
        threshold: 80,
        enabled: true,
    });

    // 无限滚动
    const handleLoadMore = async () => {
        const typeFilter = activeFilter === 'all' ? undefined : activeFilter;
        await loadMore({ postType: typeFilter });
    };

    const infiniteScroll = useInfiniteScroll({
        onLoadMore: handleLoadMore,
        hasMore,
        isLoading,
        threshold: 400,
        enabled: true,
    });



    return (
        <div className="min-h-screen bg-background" ref={pullToRefresh.containerRef}>
            <SEO
                title={language === 'zh' ? '社区动态' : 'Community Feed'}
                description={language === 'zh' ? '看看邻居们都在聊什么 - 渥太华本地社区动态' : 'See what neighbors are talking about - Ottawa local community feed'}
            />
            {/* 下拉刷新指示器 */}
            <PullToRefreshIndicator
                pullDistance={pullToRefresh.pullDistance}
                isRefreshing={pullToRefresh.isRefreshing}
                shouldRefresh={pullToRefresh.shouldRefresh}
                progress={pullToRefresh.progress}
            />

            <Header />

            {/* Enhanced Hero Header with Mesh Gradient */}
            <div className="relative overflow-hidden bg-background border-b border-border shadow-sm">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/10 rounded-full blur-[100px] animate-pulse" />
                    <div className="absolute top-0 right-0 w-80 h-80 bg-accent/5 rounded-full blur-[80px]" />
                </div>

                <div className="container relative max-w-7xl py-6 sm:py-8 px-4">
                    <div className="flex flex-row items-center gap-3 sm:gap-8 overflow-hidden">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5 }}
                            className="shrink-0"
                        >
                            <div className="flex items-center gap-2 mb-1">
                                <h1 className="text-2xl sm:text-4xl font-black tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                                    {language === 'zh' ? '真言' : 'JustTalk'}
                                </h1>
                                <span className="text-lg sm:text-2xl">💬</span>
                            </div>
                            <span className="hidden sm:inline-block text-[10px] sm:text-xs font-bold text-primary uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                                {language === 'zh' ? '邻里事，随心说' : 'Neighborhood Stories'}
                            </span>
                        </motion.div>

                        {/* Quick Post Box - Force Side-by-Side */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2 }}
                            className="flex-1 max-w-xl"
                        >
                            <div className="card-warm p-2 sm:p-2.5 flex items-center gap-2 sm:gap-3 bg-white/40 backdrop-blur-md border border-white/20 shadow-sm rounded-2xl group hover:bg-white/60 transition-all duration-300">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm shrink-0">
                                    {currentUser?.avatar ? (
                                        <img src={currentUser.avatar} className="w-full h-full object-cover" alt="Avatar" />
                                    ) : (
                                        <span className="text-primary font-bold text-xs">{currentUser?.name?.charAt(0) || '👋'}</span>
                                    )}
                                </div>
                                <LitePost
                                    onSuccess={() => fetchFeed({})}
                                    trigger={
                                        <div className="flex-1 bg-white/50 group-hover:bg-white/80 transition-all rounded-xl py-2 px-3 sm:px-5 text-muted-foreground font-medium cursor-pointer text-[11px] sm:text-sm truncate">
                                            {language === 'zh' ? '来聊聊今天发生了什么...' : 'What\'s happening...'}
                                        </div>
                                    }
                                />
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>

            <div className="container max-w-7xl py-8 px-4">
                {/* Filters & Radius Toggle */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    {/* Intent Filters */}
                    <div className="flex items-center gap-2.5 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                        <button
                            onClick={() => setActiveFilter('all')}
                            className={`px-5 py-2.5 rounded-2xl font-bold text-sm whitespace-nowrap transition-all duration-300 border ${activeFilter === 'all'
                                ? 'bg-primary text-primary-foreground border-primary shadow-md scale-105'
                                : 'bg-white/50 backdrop-blur-sm text-muted-foreground border-border/50 hover:bg-white hover:border-primary/30'
                                }`}
                        >
                            {language === 'zh' ? '⭐ 全部' : '⭐ All'}
                        </button>
                        {[
                            { id: 'MOMENT', labelZh: '🏘️ 邻里', labelEn: '🏘️ Neighbors' },
                            { id: 'ACTION', labelZh: '🤝 参加', labelEn: '🤝 Events' },
                            { id: 'HELP', labelZh: '🆘 求助', labelEn: '🆘 Help' },
                            { id: 'NOTICE', labelZh: '📢 公告', labelEn: '📢 Notices' }
                        ].map((filter) => (
                            <button
                                key={filter.id}
                                onClick={() => setActiveFilter(filter.id as CommunityPostType)}
                                className={`px-5 py-2.5 rounded-2xl font-bold text-sm whitespace-nowrap transition-all duration-300 border ${activeFilter === filter.id
                                    ? 'bg-primary text-primary-foreground border-primary shadow-md scale-105'
                                    : 'bg-white/50 backdrop-blur-sm text-muted-foreground border-border/50 hover:bg-white hover:border-primary/30'
                                    }`}
                            >
                                {language === 'zh' ? filter.labelZh : filter.labelEn}
                            </button>
                        ))}
                    </div>

                    {/* Radius Toggle - Proximity Intent */}
                    <div className="flex p-1 bg-muted/30 rounded-xl border border-border/50">
                        <button
                            onClick={() => setScope('nearby')}
                            className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${scope === 'nearby'
                                ? 'bg-white text-primary shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            {language === 'zh' ? '📍 附近' : '📍 Nearby'}
                        </button>
                        <button
                            onClick={() => setScope('city')}
                            className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${scope === 'city'
                                ? 'bg-white text-primary shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            {language === 'zh' ? '🏙️ 全城' : '🏙️ City'}
                        </button>
                    </div>
                </div>

                {/* 热门标签 */}
                <div className="mb-8 bg-white rounded-2xl p-6 shadow-sm border border-border/50 relative">
                    <TrendingTags
                        onTagClick={(tag) => {
                            setSelectedTag(tag);
                        }}
                        maxTags={12}
                    />
                    {selectedTag && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="absolute top-2 right-2 text-xs h-7 text-muted-foreground hover:text-primary"
                            onClick={() => setSelectedTag(null)}
                        >
                            {language === 'zh' ? '清除筛选' : 'Clear Filter'}
                        </Button>
                    )}
                </div>

                {/* Posts Feed - Masonry Grid */}
                <MasonryGrid posts={posts} isLoading={isLoading} />

                {/* 无限滚动触发器 */}
                <div ref={infiniteScroll.observerTarget} className="w-full h-20 flex items-center justify-center">
                    {isLoading && hasMore && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            <span className="text-sm font-medium">{language === 'zh' ? '加载更多...' : 'Loading more...'}</span>
                        </div>
                    )}
                    {!hasMore && posts.length > 0 && (
                        <p className="text-sm text-muted-foreground">{language === 'zh' ? '没有更多内容了' : 'No more content'}</p>
                    )}
                </div>
            </div>

            <Footer />

            {/* Mobile Floating Action Button */}
            <div className="fixed bottom-24 right-6 md:hidden z-50 animate-in zoom-in duration-500">
                <LitePost
                    onSuccess={() => fetchFeed({})}
                />
            </div>
        </div >
    );
};

export default Community;
