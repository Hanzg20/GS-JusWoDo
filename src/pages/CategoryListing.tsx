import { useState, useEffect, useMemo } from "react";
import SEO from "@/components/SEO";
import { useParams, useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useListingStore } from "@/stores/listingStore";
import { useAuthStore } from "@/stores/authStore";
import { useConfigStore } from "@/stores/configStore";
import { ListingCard } from "@/components/ListingCard";
import { SlidersHorizontal, ArrowDownWideNarrow, Sparkles, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useEnrichedListings } from "@/hooks/useEnrichedListings";

type SortBy = 'newest' | 'rating' | 'reviews' | 'distance';

const CategoryListing = () => {
    const { type } = useParams<{ type: string }>();
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q');
    const { listings, isLoading, searchListings } = useListingStore();
    const { currentUser } = useAuthStore();
    const { refCodes, language } = useConfigStore();
    const [isSmartSearch, setIsSmartSearch] = useState(true);
    const [showFilters, setShowFilters] = useState(false);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(undefined);
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

    // Which pillar this listing type belongs to (via ref_codes PILLAR extra_data.path),
    // then the 细分类目 (CATEGORY-level) chips under it — see
    // supabase/migrations/20260903_add_category_pillars.sql
    const pillarCategories = useMemo(() => {
        const pillar = refCodes.find(r => r.type === 'PILLAR' && r.extraData?.path === `/category/${type}`);
        if (!pillar) return [];
        const industryIds = refCodes.filter(r => r.type === 'INDUSTRY' && r.parentId === pillar.codeId).map(i => i.codeId);
        return refCodes.filter(r => r.type === 'CATEGORY' && industryIds.includes(r.parentId || ''));
    }, [refCodes, type]);

    useEffect(() => {
        setSelectedCategoryId(undefined);
    }, [type]);

    useEffect(() => {
        searchListings({
            query: query || undefined,
            isSemantic: isSmartSearch && !!query,
            nodeId: currentUser?.nodeId || 'NODE_LEES',
            categoryId: selectedCategoryId,
            type: (type?.toUpperCase() as any) || undefined,
            sortBy
        });
    }, [type, query, isSmartSearch, selectedCategoryId, sortBy]);

    const getPageTitle = (type: string | undefined) => {
        // ... (unchanged)
        const refCode = refCodes.find(r => r.codeId === type || r.zhName === type || r.enName?.toLowerCase() === type?.toLowerCase());
        if (refCode) return language === 'zh' ? refCode.zhName : refCode.enName;

        switch (type?.toLowerCase()) {
            case 'service': return language === 'zh' ? '生活服务' : 'Life Services';
            case 'rental': return language === 'zh' ? '社区租赁' : 'Community Rental';
            case 'consultation': return language === 'zh' ? '专家咨询' : 'Expert Advice';
            case 'goods': return language === 'zh' ? '闲置物品' : 'Marketplace';
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
                <div className="container flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h1 className="text-xl font-bold flex items-center gap-2">
                        {getPageTitle(type)}
                        <span className="text-xs font-normal text-muted-foreground px-2 py-0.5 bg-muted rounded-full">
                            {listings.length} {language === 'zh' ? '个结果' : 'Results'}
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
                                <Sparkles className="w-3 h-3 mr-1" /> Smart Search
                            </Button>
                            <Button
                                variant={!isSmartSearch ? 'default' : 'ghost'}
                                size="sm"
                                className={`rounded-full h-8 ${!isSmartSearch ? 'shadow-sm' : ''}`}
                                onClick={() => setIsSmartSearch(false)}
                            >
                                Keyword
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
                            {isSmartSearch ? 'AI is analyzing your query...' : 'Searching...'}
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
                ) : sortedListings.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {sortedListings.map(item => (
                            <ListingCard key={item.id} item={item} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 text-muted-foreground">
                        <p className="text-lg">No {getPageTitle(type)} found yet</p>
                        <p className="text-sm">Try different keywords or enable Smart Search for better matches</p>
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
};

export default CategoryListing;
