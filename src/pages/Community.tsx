import { useState, useEffect } from "react";
import SEO from "@/components/SEO";
import { Plus, Search, X } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { LitePost } from "@/components/Community/LitePost";
import { MasonryGrid } from "@/components/Community/MasonryGrid";
import { PullToRefreshIndicator } from "@/components/Community/PullToRefresh";
import { useAuthStore } from "@/stores/authStore";
import { useCommunityPostStore } from "@/stores/communityPostStore";
import { useConfigStore } from "@/stores/configStore";
import { CommunityPostType } from "@/types/community";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { userRepository } from "@/services/repositories/supabase/UserRepository";
import { cn } from "@/lib/utils";

// Level-1 feed source, modeled on 小红书's 关注/发现/城市 top tabs
// (reference: rednote.png) — 探索/附近 map onto our existing
// city-wide/node-scoped scopes, 关注 is genuinely new: real posts from
// people the current user follows (see followingIds below), not a
// cosmetic label — user_followers/getFollowing() already existed and
// worked, just had zero UI reachable from Community before this.
type FeedMode = 'following' | 'explore' | 'nearby';

const Community = () => {
    const { posts, trendingTags, fetchFeed, fetchTrendingTags, loadMore, isLoading, hasMore } = useCommunityPostStore();
    const { currentUser } = useAuthStore();
    const { language } = useConfigStore();
    const [activeFilter, setActiveFilter] = useState<'all' | CommunityPostType>('all');
    const [selectedTag, setSelectedTag] = useState<string | null>(null);
    const [feedMode, setFeedMode] = useState<FeedMode>('explore');
    const [followingIds, setFollowingIds] = useState<string[] | null>(null);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchInput, setSearchInput] = useState('');

    useEffect(() => {
        fetchTrendingTags(6);
    }, [fetchTrendingTags]);

    // Only fetch the following list when that tab is actually selected —
    // most visits never touch it, no reason to look it up eagerly.
    useEffect(() => {
        if (feedMode !== 'following' || !currentUser?.id) return;
        userRepository.getFollowing(currentUser.id, 200).then(({ users }) => {
            setFollowingIds(users.map(u => u.id));
        }).catch(() => setFollowingIds([]));
    }, [feedMode, currentUser?.id]);

    useEffect(() => {
        if (feedMode === 'following' && !currentUser) return; // nothing to fetch, empty state handles it
        if (feedMode === 'following' && followingIds === null) return; // still loading the list

        const typeFilter = activeFilter === 'all' ? undefined : activeFilter;
        fetchFeed({
            postType: typeFilter,
            query: selectedTag || undefined,
            scope: feedMode === 'nearby' ? 'nearby' : 'city',
            nodeId: currentUser?.nodeId,
            authorIds: feedMode === 'following' ? (followingIds || []) : undefined,
        });
    }, [activeFilter, selectedTag, feedMode, followingIds, fetchFeed]);

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

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSelectedTag(searchInput.trim() || null);
    };

    const closeSearch = () => {
        setIsSearchOpen(false);
        setSearchInput('');
        setSelectedTag(null);
    };

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

            {/* Tab header, modeled directly on 小红书's 关注/发现/城市/搜索 top
                bar + per-tab sub-filter row (reference: rednote.png). No
                page title anywhere — plain text tabs only, bold + underline
                for the active one, no background pill/shadow. Sticky, same
                as RedNote's. */}
            <div className="bg-background/95 backdrop-blur-sm border-b border-border sticky top-0 z-30">
                {isSearchOpen ? (
                    <form onSubmit={handleSearchSubmit} className="max-w-7xl mx-auto px-3 sm:px-6 h-11 sm:h-12 flex items-center gap-2">
                        <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                        <input
                            autoFocus
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            placeholder={language === 'zh' ? '搜索邻里圈内容...' : 'Search Neighbors...'}
                            className="flex-1 bg-transparent outline-none text-sm sm:text-base"
                        />
                        <button type="button" onClick={closeSearch} className="text-muted-foreground shrink-0">
                            <X className="w-5 h-5" />
                        </button>
                    </form>
                ) : (
                    <div className="max-w-7xl mx-auto px-3 sm:px-6 flex items-center justify-between">
                        <div className="flex items-center gap-5 sm:gap-8 h-11 sm:h-12">
                            {([
                                { id: 'following', labelZh: '关注', labelEn: 'Following' },
                                { id: 'explore', labelZh: '探索', labelEn: 'Explore' },
                                { id: 'nearby', labelZh: '附近', labelEn: 'Nearby' },
                            ] as const).map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setFeedMode(tab.id)}
                                    className={`relative h-full text-[15px] sm:text-lg font-bold transition-colors ${feedMode === tab.id ? 'text-foreground' : 'text-muted-foreground/70'
                                        }`}
                                >
                                    {language === 'zh' ? tab.labelZh : tab.labelEn}
                                    {feedMode === tab.id && (
                                        <span className="absolute left-0 right-0 -bottom-px h-[3px] rounded-full bg-primary" />
                                    )}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setIsSearchOpen(true)}
                                className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-muted transition-colors text-foreground"
                            >
                                <Search className="w-4 h-4" />
                            </button>
                            {/* Compose entry — the mobile FAB (below) covers
                                phones; this covers desktop/tablet, which has
                                no other visible "new post" entry point here
                                since MobileBottomNav's Post tab is md:hidden
                                too. */}
                            <LitePost
                                onSuccess={() => fetchFeed({})}
                                trigger={
                                    <button className="hidden md:flex items-center justify-center w-8 h-8 rounded-full hover:bg-muted transition-colors text-foreground">
                                        <Plus className="w-5 h-5" />
                                    </button>
                                }
                            />
                        </div>
                    </div>
                )}

                {/* Level-2 sub-filters — post-type tabs plus, per your
                    "fold trending tags into the sub-menu instead of a
                    standalone section" call, the top few trending tags
                    appended as extra tabs (same treatment RedNote gives
                    topic tabs like 热点/美食 alongside its content-type
                    ones). */}
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
                            onClick={() => { setActiveFilter(filter.id as 'all' | CommunityPostType); setSelectedTag(null); }}
                            className={cn(
                                "relative h-full shrink-0 text-[13px] sm:text-sm transition-colors",
                                activeFilter === filter.id && !selectedTag ? 'font-bold text-foreground' : 'font-medium text-muted-foreground/70'
                            )}
                        >
                            {language === 'zh' ? filter.labelZh : filter.labelEn}
                            {activeFilter === filter.id && !selectedTag && (
                                <span className="absolute left-0 right-0 -bottom-px h-[2px] rounded-full bg-primary" />
                            )}
                        </button>
                    ))}

                    {trendingTags.length > 0 && (
                        <span className="text-border shrink-0">|</span>
                    )}
                    {trendingTags.slice(0, 6).map((t) => (
                        <button
                            key={t.tag}
                            onClick={() => setSelectedTag(selectedTag === t.tag ? null : t.tag)}
                            className={cn(
                                "relative h-full shrink-0 text-[13px] sm:text-sm transition-colors",
                                selectedTag === t.tag ? 'font-bold text-foreground' : 'font-medium text-muted-foreground/70'
                            )}
                        >
                            #{t.tag}
                            {selectedTag === t.tag && (
                                <span className="absolute left-0 right-0 -bottom-px h-[2px] rounded-full bg-primary" />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            <div className="max-w-7xl mx-auto py-3 sm:py-6 px-2.5 sm:px-6">
                {feedMode === 'following' && !currentUser ? (
                    <div className="text-center py-16">
                        <p className="text-sm text-muted-foreground">
                            {language === 'zh' ? '登录后查看你关注的邻居动态' : 'Log in to see posts from people you follow'}
                        </p>
                    </div>
                ) : feedMode === 'following' && followingIds?.length === 0 ? (
                    <div className="text-center py-16">
                        <p className="text-sm text-muted-foreground">
                            {language === 'zh' ? '你还没有关注任何邻居，去发现页看看吧' : "You're not following anyone yet — check out Explore"}
                        </p>
                    </div>
                ) : (
                    <>
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
                    </>
                )}
            </div>

            <Footer />

            {/* Mobile Floating Action Button */}
            <div className="fixed bottom-24 right-6 md:hidden z-50 animate-in zoom-in duration-500">
                <LitePost
                    onSuccess={() => fetchFeed({})}
                />
            </div>
        </div>
    );
};

export default Community;
