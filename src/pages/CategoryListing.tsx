import { useState, useEffect, useMemo, useRef } from "react";
import SEO from "@/components/SEO";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useListingStore } from "@/stores/listingStore";
import { useAuthStore } from "@/stores/authStore";
import { useConfigStore, browseNodeId } from "@/stores/configStore";
import { ListingCard } from "@/components/ListingCard";
import { SlidersHorizontal, ArrowDownWideNarrow, Sparkles, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useEnrichedListings } from "@/hooks/useEnrichedListings";
import { cn } from "@/lib/utils";
import { MASCOT_BY_TYPE } from "@/config/mascots";

type SortBy = 'newest' | 'rating' | 'reviews' | 'distance';

// Products and Rentals lost their own homepage pillar tile in the
// 2026-09-14 3-pillar consolidation (folded into Services and Secondhand
// respectively — see jwd_three_pillars memory) but their /category/:type
// pages still work exactly as before; these sibling tabs are the only way
// left to reach them.
const SIBLING_GROUPS: Record<string, { path: string; labelZh: string; labelEn: string }[]> = {
    service: [
        { path: '/category/service', labelZh: '本地服务', labelEn: 'Services' },
        { path: '/category/products', labelZh: '产品', labelEn: 'Products' },
    ],
    products: [
        { path: '/category/service', labelZh: '本地服务', labelEn: 'Services' },
        { path: '/category/products', labelZh: '产品', labelEn: 'Products' },
    ],
    secondhand: [
        { path: '/category/secondhand', labelZh: '闲置市场', labelEn: 'Secondhand' },
        { path: '/category/rental', labelZh: '租赁', labelEn: 'Rentals' },
    ],
    rental: [
        { path: '/category/secondhand', labelZh: '闲置市场', labelEn: 'Secondhand' },
        { path: '/category/rental', labelZh: '租赁', labelEn: 'Rentals' },
    ],
};

const CategoryListing = () => {
    const { type } = useParams<{ type: string }>();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q');
    const { listings, isLoading, searchListings } = useListingStore();
    const { currentUser } = useAuthStore();
    const { refCodes, language, activeNodeId } = useConfigStore();
    const [isSmartSearch, setIsSmartSearch] = useState(true);
    const [showFilters, setShowFilters] = useState(false);
    // Deep-link support: a link (e.g. the search bar's category dropdown)
    // can jump straight to a specific industry or category via
    // ?industryId=/?categoryId=, not just land on the pillar page and make
    // the visitor pick it again.
    const [selectedIndustryId, setSelectedIndustryId] = useState<string | undefined>(
        searchParams.get('industryId') || undefined
    );
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(
        searchParams.get('categoryId') || undefined
    );
    const [sortBy, setSortBy] = useState<SortBy>('newest');
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

    const sortLabels: Record<SortBy, string> = {
        newest: language === 'zh' ? '最新发布' : 'Newest',
        rating: language === 'zh' ? '评分最高' : 'Highest Rated',
        reviews: language === 'zh' ? '评论最多' : 'Most Reviewed',
        distance: language === 'zh' ? '离我最近' : 'Closest to Me',
    };

    // Only ask for location when the user actually picks "Closest to Me" —
    // never on page load.
    const handleSelectSort = (key: SortBy) => {
        if (key === 'distance' && !userLocation) {
            if (!navigator.geolocation) {
                toast.error(language === 'zh' ? '此设备不支持定位' : 'Location is not supported on this device');
                return;
            }
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                    setSortBy('distance');
                },
                () => {
                    toast.error(language === 'zh' ? '需要定位权限才能按距离排序' : 'Location permission is needed to sort by distance');
                },
                { timeout: 8000 }
            );
            return;
        }
        setSortBy(key);
    };

    // Fetches listingItems (price/deposit) for whatever's currently showing
    // and attaches distance — precise once GPS is granted via "Closest to
    // Me", otherwise approximated from the neighbor's community node so a
    // distance can always be shown without prompting for location upfront.
    const enrichedListings = useEnrichedListings(listings, userLocation);

    // Only reorder by distance once the neighbor actually picked that sort
    // — the rest of the time the backend's own order (newest/rating/etc)
    // stands, distance is just shown for context.
    const sortedListings = useMemo(() => {
        if (sortBy !== 'distance') return enrichedListings;
        return [...enrichedListings].sort((a, b) => (a.distanceMeters ?? Infinity) - (b.distanceMeters ?? Infinity));
    }, [enrichedListings, sortBy]);

    // Which pillar this listing type belongs to. Matching by extra_data.path
    // (the old approach) broke once Products/Rentals lost their own active
    // pillar row in the 2026-09-14 3-pillar consolidation — their pillar is
    // now reached via a sibling type's path, not their own. Map explicitly
    // instead.
    const TYPE_TO_PILLAR: Record<string, string> = {
        service: 'PILLAR_SERVICE', products: 'PILLAR_SERVICE',
        secondhand: 'PILLAR_GOODS', rental: 'PILLAR_GOODS',
        task: 'PILLAR_HELP',
    };

    // 二级分类 (INDUSTRY tier) — always-visible tabs, styled like
    // Community.tsx's level-2 filter row. Empty for pillars/types with no
    // INDUSTRY rows yet (e.g. Tasks has none — lives on Community.tsx
    // instead).
    const pillarIndustries = useMemo(() => {
        // Products shares Services' pillar (for the sibling tabs / page
        // title) but not its industry taxonomy — 居家清洁/电工/宠物寄养 etc.
        // are service-specific and don't describe any real Products
        // listing, so showing them there would just be filters that always
        // return empty.
        if (type?.toLowerCase() === 'products') return [];
        const pillarId = TYPE_TO_PILLAR[type?.toLowerCase() || ''];
        if (!pillarId) return [];
        return refCodes
            .filter(r => r.type === 'INDUSTRY' && r.parentId === pillarId)
            .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    }, [refCodes, type]);

    // 三级分类 (CATEGORY tier) under the selected industry — the finer
    // "筛选" chips. Scoped to the selected industry once one is picked;
    // otherwise every category under the pillar (unchanged behavior for
    // pillars with no industry tier of their own).
    const pillarCategories = useMemo(() => {
        if (type?.toLowerCase() === 'products') return [];
        const pillarId = TYPE_TO_PILLAR[type?.toLowerCase() || ''];
        if (!pillarId) return [];
        const industryIds = selectedIndustryId
            ? [selectedIndustryId]
            : refCodes.filter(r => r.type === 'INDUSTRY' && r.parentId === pillarId).map(i => i.codeId);
        return refCodes.filter(r => r.type === 'CATEGORY' && industryIds.includes(r.parentId || ''));
    }, [refCodes, type, selectedIndustryId]);

    // Picking an industry tab should visibly narrow results right away,
    // not just narrow which finer "筛选" chips are offered — otherwise
    // tapping an industry looks like it did nothing until the visitor also
    // opens the filter panel and picks a specific category. Server-side
    // search only takes one categoryId, so once a specific category is
    // picked (below) that's already precise via the server; an
    // industry-only selection filters client-side across all of that
    // industry's categories instead.
    const visibleListings = useMemo(() => {
        if (!selectedIndustryId || selectedCategoryId) return sortedListings;
        const categoryIds = new Set(pillarCategories.map(c => c.codeId));
        return sortedListings.filter(item => categoryIds.has(item.categoryId));
    }, [sortedListings, selectedIndustryId, selectedCategoryId, pillarCategories]);

    // Skip the reset on mount — otherwise it immediately wipes out the
    // ?categoryId= deep-link initial state above. Only clear the filters
    // when `type` genuinely changes later in the same SPA session (e.g.
    // navigating from Services to Marketplace via the sibling tabs).
    const isFirstTypeRender = useRef(true);
    useEffect(() => {
        if (isFirstTypeRender.current) {
            isFirstTypeRender.current = false;
            return;
        }
        setSelectedCategoryId(undefined);
        setSelectedIndustryId(undefined);
    }, [type]);

    // A deep-linked categoryId arrives without its parent industry — derive
    // it once refCodes are loaded so the industry tab highlights correctly
    // too, not just the category filter chip.
    useEffect(() => {
        if (selectedCategoryId && !selectedIndustryId) {
            const cat = refCodes.find(r => r.codeId === selectedCategoryId);
            if (cat?.parentId) setSelectedIndustryId(cat.parentId);
        }
    }, [selectedCategoryId, selectedIndustryId, refCodes]);

    // Picking a different category/industry from the search bar's dropdown
    // (CategoryMenu.tsx) navigates to the same /category/:type route with a
    // new ?categoryId=/?industryId= — since the pathname doesn't change,
    // this component never remounts, so the lazy useState initializers
    // above (which only ever run once, on first mount) silently kept
    // showing the OLD filter until a hard reload. Re-sync whenever the
    // URL's categoryId/industryId actually changes — but not on every
    // searchParams change (e.g. typing a ?q= search), which would wipe out
    // a category picked locally via the in-page filter chips (those only
    // call setSelectedCategoryId directly, they don't touch the URL).
    const urlCategoryId = searchParams.get('categoryId') || undefined;
    const urlIndustryId = searchParams.get('industryId') || undefined;
    useEffect(() => {
        setSelectedCategoryId(urlCategoryId);
        setSelectedIndustryId(urlIndustryId);
         
    }, [urlCategoryId, urlIndustryId]);

    // "products" and "secondhand" are both really GOODS underneath — split
    // by which form created the listing (see 2026-09-06), not a real type
    // of their own. Every other segment maps straight to its ListingType.
    const resolvedType = type === 'products' || type === 'secondhand' ? 'GOODS' : (type?.toUpperCase() as any) || undefined;
    const goodsTier = type === 'products' ? 'PRODUCT' : type === 'secondhand' ? 'SECONDHAND' : undefined;

    const siblingTabs = SIBLING_GROUPS[type?.toLowerCase() || ''];

    useEffect(() => {
        searchListings({
            query: query || undefined,
            isSemantic: isSmartSearch && !!query,
            nodeId: browseNodeId(currentUser?.nodeId || activeNodeId),
            categoryId: selectedCategoryId,
            type: resolvedType,
            goodsTier,
            sortBy
        });
    }, [type, query, isSmartSearch, selectedCategoryId, sortBy, currentUser?.nodeId, activeNodeId]);

    const getPageTitle = (type: string | undefined) => {
        // ... (unchanged)
        const refCode = refCodes.find(r => r.codeId === type || r.zhName === type || r.enName?.toLowerCase() === type?.toLowerCase());
        if (refCode) return language === 'zh' ? refCode.zhName : refCode.enName;

        switch (type?.toLowerCase()) {
            case 'service': return language === 'zh' ? '生活服务' : 'Life Services';
            case 'rental': return language === 'zh' ? '社区租赁' : 'Community Rental';
            case 'consultation': return language === 'zh' ? '专家咨询' : 'Expert Advice';
            case 'goods': return language === 'zh' ? '闲置物品' : 'Marketplace';
            case 'products': return language === 'zh' ? '产品' : 'Products';
            case 'secondhand': return language === 'zh' ? '闲置市场' : 'Secondhand Market';
            case 'task': return language === 'zh' ? '社区任务' : 'Local Tasks';
            default: return language === 'zh' ? '发现' : 'Explore All';
        }
    };

    return (
        <div className="min-h-screen bg-background pb-20">
            <SEO title={getPageTitle(type)} />
            <Header />

            {/* Search Header */}
            <div className="bg-card border-b border-border py-4 sticky top-16 z-40">
                {siblingTabs && (
                    <div className="container flex items-center gap-2 mb-3">
                        {siblingTabs.map((tab) => {
                            const isActive = tab.path === `/category/${type?.toLowerCase()}`;
                            return (
                                <button
                                    key={tab.path}
                                    onClick={() => navigate(tab.path)}
                                    className={`px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                                        isActive
                                            ? 'bg-primary text-primary-foreground shadow-sm'
                                            : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                                    }`}
                                >
                                    {language === 'zh' ? tab.labelZh : tab.labelEn}
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* 二级分类 (INDUSTRY tier) — always-visible tabs, same
                    treatment as Community.tsx's level-2 filter row (small
                    text, bold + underline for the active one, horizontal
                    scroll). Data-driven per pillar via ref_codes, so this
                    row is different on every pillar and empty where no
                    INDUSTRY rows exist yet (e.g. Tasks). */}
                {pillarIndustries.length > 0 && (
                    <div className="container flex items-center gap-4 sm:gap-6 h-9 sm:h-10 overflow-x-auto scrollbar-hide mb-1">
                        <button
                            onClick={() => setSelectedIndustryId(undefined)}
                            className={cn(
                                "relative h-full shrink-0 text-[13px] sm:text-sm transition-colors",
                                !selectedIndustryId ? 'font-bold text-foreground' : 'font-medium text-muted-foreground/70'
                            )}
                        >
                            {language === 'zh' ? '全部' : 'All'}
                            {!selectedIndustryId && (
                                <span className="absolute left-0 right-0 -bottom-px h-[2px] rounded-full bg-primary" />
                            )}
                        </button>
                        {pillarIndustries.map((industry) => (
                            <button
                                key={industry.codeId}
                                onClick={() => { setSelectedIndustryId(industry.codeId); setSelectedCategoryId(undefined); }}
                                className={cn(
                                    "relative h-full shrink-0 text-[13px] sm:text-sm transition-colors",
                                    selectedIndustryId === industry.codeId ? 'font-bold text-foreground' : 'font-medium text-muted-foreground/70'
                                )}
                            >
                                {language === 'zh' ? industry.zhName : (industry.enName || industry.zhName)}
                                {selectedIndustryId === industry.codeId && (
                                    <span className="absolute left-0 right-0 -bottom-px h-[2px] rounded-full bg-primary" />
                                )}
                            </button>
                        ))}
                    </div>
                )}

                <div className="container flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h1 className="text-xl font-bold flex items-center gap-2">
                        {getPageTitle(type)}
                        <span className="text-xs font-normal text-muted-foreground px-2 py-0.5 bg-muted rounded-full">
                            {visibleListings.length} {language === 'zh' ? '个结果' : 'Results'}
                        </span>
                    </h1>

                    <div className="flex gap-2 overflow-x-auto pb-1 items-center">
                        <div className={`p-1 rounded-full flex gap-1 ${isSmartSearch ? 'bg-primary/10 border-primary/20' : 'bg-muted'} border transition-all`}>
                            <Button
                                variant={isSmartSearch ? 'default' : 'ghost'}
                                size="sm"
                                className={`rounded-full h-8 ${isSmartSearch ? 'shadow-sm' : ''}`}
                                onClick={() => setIsSmartSearch(true)}
                            >
                                <Sparkles className="w-3 h-3 mr-1" /> {language === 'zh' ? '智能搜索' : 'Smart Search'}
                            </Button>
                            <Button
                                variant={!isSmartSearch ? 'default' : 'ghost'}
                                size="sm"
                                className={`rounded-full h-8 ${!isSmartSearch ? 'shadow-sm' : ''}`}
                                onClick={() => setIsSmartSearch(false)}
                            >
                                {language === 'zh' ? '关键词' : 'Keyword'}
                            </Button>
                        </div>
                        {pillarCategories.length > 0 && (
                            <>
                                <Separator orientation="vertical" className="h-6 mx-1" />
                                <Button
                                    variant={showFilters || selectedCategoryId ? 'default' : 'outline'}
                                    size="sm"
                                    className="rounded-full h-8"
                                    onClick={() => setShowFilters(v => !v)}
                                >
                                    <SlidersHorizontal className="w-3 h-3 mr-2" />
                                    {language === 'zh' ? '筛选' : 'Filter'}
                                    {selectedCategoryId && ' · 1'}
                                </Button>
                            </>
                        )}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="rounded-full h-8">
                                    {sortLabels[sortBy]} <ArrowDownWideNarrow className="w-3 h-3 ml-1" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                {(Object.keys(sortLabels) as SortBy[]).map((key) => (
                                    <DropdownMenuItem key={key} onClick={() => handleSelectSort(key)}>
                                        {sortLabels[key]} {sortBy === key && '✓'}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* Sub-category filter chips — 细分类目, from ref_codes CATEGORY tier */}
                {showFilters && pillarCategories.length > 0 && (
                    <div className="container flex flex-wrap gap-2 pt-3">
                        {selectedCategoryId && (
                            <button
                                onClick={() => setSelectedCategoryId(undefined)}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-muted text-muted-foreground hover:bg-muted/70 transition-colors"
                            >
                                {language === 'zh' ? '清除' : 'Clear'} <X className="w-3 h-3" />
                            </button>
                        )}
                        {pillarCategories.map(cat => (
                            <button
                                key={cat.codeId}
                                onClick={() => setSelectedCategoryId(cat.codeId === selectedCategoryId ? undefined : cat.codeId)}
                                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                                    selectedCategoryId === cat.codeId
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted/60 text-muted-foreground hover:bg-muted'
                                }`}
                            >
                                {language === 'zh' ? cat.zhName : (cat.enName || cat.zhName)}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <main className="container py-8">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <Loader2 className="w-10 h-10 text-primary animate-spin" />
                        <p className="text-muted-foreground animate-pulse">
                            {isSmartSearch
                                ? (language === 'zh' ? 'AI 正在分析你的搜索…' : 'AI is analyzing your query...')
                                : (language === 'zh' ? '搜索中…' : 'Searching...')}
                        </p>
                    </div>
                ) : type?.toLowerCase() === 'task' && !currentUser?.isVerifiedProvider ? (
                    <div className="card-warm p-10 flex flex-col items-center text-center gap-4 bg-gray-100/30 border-dashed border-2 border-gray-200">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm">
                            <SlidersHorizontal className="w-8 h-8 text-muted-foreground/30" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold">Access Restricted</h3>
                            <p className="text-muted-foreground mt-2 max-w-sm">Local tasks are only visible to verified neighbors. Please complete your profile verification to join.</p>
                        </div>
                        <Button className="btn-action rounded-full px-10">Verify Now</Button>
                    </div>
                ) : visibleListings.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {visibleListings.map(item => (
                            <ListingCard key={item.id} item={item} />
                        ))}
                    </div>
                ) : (
                    (() => {
                        const mascot = MASCOT_BY_TYPE[type?.toLowerCase() as keyof typeof MASCOT_BY_TYPE];
                        if (!mascot) {
                            return (
                                <div className="text-center py-20 text-muted-foreground">
                                    <p className="text-lg">
                                        {language === 'zh' ? `暂时还没有${getPageTitle(type)}` : `No ${getPageTitle(type)} found yet`}
                                    </p>
                                    <p className="text-sm">
                                        {language === 'zh' ? '换个关键词试试，或开启智能搜索获得更精准的结果' : 'Try different keywords or enable Smart Search for better matches'}
                                    </p>
                                </div>
                            );
                        }
                        const message = (language === 'zh' ? mascot.emptyStateZh : mascot.emptyStateEn)
                            .replace('{title}', getPageTitle(type) || '');
                        return (
                            <div className="text-center py-20 text-muted-foreground">
                                <img src={mascot.avatar} alt={mascot.name} className="w-20 h-20 mx-auto mb-4 rounded-full bg-muted/40" />
                                <p className="text-base font-medium max-w-xs mx-auto">{message}</p>
                            </div>
                        );
                    })()
                )}
            </main>

            <Footer />
        </div>
    );
};

export default CategoryListing;
