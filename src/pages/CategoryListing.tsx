import { useState, useEffect } from "react";
import SEO from "@/components/SEO";
import { useParams, useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useListingStore } from "@/stores/listingStore";
import { useAuthStore } from "@/stores/authStore";
import { useConfigStore } from "@/stores/configStore";
import { ListingCard } from "@/components/ListingCard";
import { SlidersHorizontal, ArrowDownWideNarrow, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const CategoryListing = () => {
    const { type } = useParams<{ type: string }>();
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q');
    const { listings, isLoading, searchListings } = useListingStore();
    const { currentUser } = useAuthStore();
    const { refCodes, language } = useConfigStore();
    const [isSmartSearch, setIsSmartSearch] = useState(true);

    useEffect(() => {
        const industry = identifyIndustry(type);
        searchListings({
            query: query || undefined,
            isSemantic: isSmartSearch && !!query,
            nodeId: currentUser?.nodeId || 'NODE_LEES',
            categoryId: type !== 'service' && type !== 'rental' && type !== 'consultation' && type !== 'goods' && type !== 'task' ? type : undefined,
            type: (type?.toUpperCase() as any) || undefined
        });
    }, [type, query, isSmartSearch]);

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

    const identifyIndustry = (type: string | undefined): string => {
        // ... (unchanged)
        if (!type) return 'all';
        if (type.startsWith('101')) return 'food';
        if (type.startsWith('102')) return 'service';
        if (type.startsWith('103')) return 'transport';
        if (type.startsWith('104')) return 'rental';
        if (type.startsWith('105')) return 'learning';
        if (type.startsWith('106')) return 'professional';
        return type.toLowerCase();
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
                        <Separator orientation="vertical" className="h-6 mx-1" />
                        <Button variant="outline" size="sm" className="rounded-full h-8">
                            <SlidersHorizontal className="w-3 h-3 mr-2" /> Filter
                        </Button>
                        <Button variant="outline" size="sm" className="rounded-full h-8">
                            Closest <ArrowDownWideNarrow className="w-3 h-3 ml-1" />
                        </Button>
                    </div>
                </div>
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
                ) : listings.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {listings.map(item => (
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
