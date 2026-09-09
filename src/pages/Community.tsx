import { useState, useEffect } from "react";
import SEO from "@/components/SEO";
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
                title={language === 'zh' ? '邻里圈' : 'Neighbors'}
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

            {/* Tab header, closely modeled on 小红书's 关注/发现/城市 + sub-tab
                pattern (reference: rednote.png) — deliberately no page title
                anywhere here. Row 1 (附近/全城) is RedNote's "which source"
                tier (their 关注/发现/城市), row 2 (全部/邻里/活动/求助/公告) is
                RedNote's per-tab sub-filter tier (their 推荐/RED/热点/...) —
                both are plain text, bold + underline for the active one, no
                background pill/shadow. Sticky so it stays reachable while
                scrolling the feed, same as RedNote's. */}
            <div className="bg-background/95 backdrop-blur-sm border-b border-border sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-3 sm:px-6 flex items-center justify-between">
                    <div className="flex items-center gap-5 sm:gap-8 h-11 sm:h-13">
                        {([
                            { id: 'nearby', labelZh: '附近', labelEn: 'Nearby' },
                            { id: 'city', labelZh: '全城', labelEn: 'City' },
                        ] as const).map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setScope(tab.id)}
                                className={`relative h-full text-[15px] sm:text-lg font-bold transition-colors ${scope === tab.id ? 'text-foreground' : 'text-muted-foreground/70'
                                    }`}
                            >
                                {language === 'zh' ? tab.labelZh : tab.labelEn}
                                {scope === tab.id && (
                                    <span className="absolute left-0 right-0 -bottom-px h-[3px] rounded-full bg-primary" />
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Compose entry — the mobile FAB (below) covers phones;
                        this covers desktop/tablet, which has no other
                        visible "new post" entry point on this page since
                        MobileBottomNav's Post tab is md:hidden too. */}
                    <LitePost
                        onSuccess={() => fetchFeed({})}
                        trigger={
                            <button className="hidden md:flex items-center justify-center w-8 h-8 rounded-full hover:bg-muted transition-colors text-foreground">
                                <Plus className="w-5 h-5" />
                            </button>
                        }
                    />
                </div>

                <div className="max-w-7xl mx-auto px-3 sm:px-6 flex items-center gap-4 sm:gap-6 h-9 sm:h-10 overflow-x-auto scrollbar-hide">
                    {([
                        { id: 'all', labelZh: '全部', labelEn: 'All' },
                        { id: 'MOMENT', labelZh: '邻里', labelEn: 'Neighbors' },
                        { id: 'ACTION', labelZh: '活动', labelEn: 'Events' },
                        { id: 'HELP', labelZh: '求助', labelEn: 'Help' },
                        { id: 'NOTICE', labelZh: '公告', labelEn: 'Notices' },
                    ] as const).map((filter) => (
                        <button
                            key={filter.id}
                            onClick={() => setActiveFilter(filter.id as 'all' | CommunityPostType)}
                            className={`relative h-full shrink-0 text-[13px] sm:text-sm transition-colors ${activeFilter === filter.id ? 'font-bold text-foreground' : 'font-medium text-muted-foreground/70'
                                }`}
                        >
                            {language === 'zh' ? filter.labelZh : filter.labelEn}
                            {activeFilter === filter.id && (
                                <span className="absolute left-0 right-0 -bottom-px h-[2px] rounded-full bg-primary" />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            <div className="max-w-7xl mx-auto py-3 sm:py-6 px-2.5 sm:px-6">
                {/* 热门标签 — condensed inline strip, not a boxed card (RedNote
                    doesn't give trending tags their own card either) */}
                <div className="mb-3 sm:mb-6 relative">
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
                            className="absolute top-0 right-0 text-xs h-6 text-muted-foreground hover:text-primary"
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
