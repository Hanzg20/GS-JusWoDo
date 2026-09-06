import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    TrendingUp, Package, Star, DollarSign, Clock,
    ExternalLink, ArrowDownToLine, ArrowUpToLine, Edit, Trash2, Plus, MoreVertical, MessageSquare, Tag, Layout, Rocket, Eye
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useListingStore } from "@/stores/listingStore";
import { useAuthStore } from "@/stores/authStore";
import { useOrderStore } from "@/stores/orderStore";
import { useProviderStore } from "@/stores/providerStore";
import { repositoryFactory } from "@/services/repositories/factory";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

const MyListings = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuthStore();
    const { listings, listingItems, fetchListings, deleteListing, updateListing, updateItemStatus } = useListingStore();
    const { orders } = useOrderStore();
    const { providers } = useProviderStore();
    // Business vs Handyman badge on SERVICE listings needs provider.identity,
    // which the User object doesn't carry and the providers store often
    // hasn't loaded here (see the comment on profileId below) — fetched
    // directly instead. NEIGHBOR-identity providers can still hold the
    // PROVIDER role (BecomeProvider.tsx lets a handyman pick either
    // identity), so isProvider alone can't stand in for this.
    const [myIdentity, setMyIdentity] = useState<'NEIGHBOR' | 'MERCHANT' | null>(null);

    useEffect(() => {
        fetchListings();
    }, []);

    useEffect(() => {
        if (!currentUser?.providerProfileId) return;
        repositoryFactory.getProviderRepository().getById(currentUser.providerProfileId)
            .then(profile => setMyIdentity(profile?.identity || null))
            .catch(err => console.error('Failed to load provider identity:', err));
    }, [currentUser?.providerProfileId]);

    if (!currentUser) {
        navigate('/login');
        return null;
    }

    // Use the providerProfileId directly from the authenticated user session.
    // This is more reliable than searching the 'providers' store which might not be loaded.
    const profileId = currentUser.providerProfileId || currentUser.id;
    const isProvider = currentUser.roles?.includes('PROVIDER');

    // Filter listings where this user is the "Provider/Poster"
    const myListings = listings.filter(l => l.providerId === profileId);

    // Pro hub (this page + ProviderDashboard) is a separate, professional-only
    // surface from the homepage's Post button — not a menu that offers both.
    // A provider's "Create New" picks among the three professional listing
    // types (reusing the existing SERVICE/GOODS/RENTAL field configs, routed
    // via Publish.tsx's ?type= deep link); the casual Sell Items/Post a Task
    // flow lives only behind the homepage Post button (see 2026-09-05
    // clarification), for buyer and provider alike.
    const renderCreateNewButton = (
        buttonProps: { variant?: 'default' | 'outline'; className: string; children: React.ReactNode }
    ) => {
        if (!isProvider) {
            return (
                <Button onClick={() => navigate('/post-gig')} variant={buttonProps.variant} className={buttonProps.className}>
                    {buttonProps.children}
                </Button>
            );
        }
        return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant={buttonProps.variant} className={buttonProps.className}>
                        {buttonProps.children}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => navigate('/publish?type=SERVICE')}>Service</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/publish?type=GOODS&pro=1')}>Goods</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/publish?type=RENTAL')}>Rental</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        );
    };

    const getListingStats = (listingId: string) => {
        const items = listingItems.filter(i => i.masterId === listingId);
        const listingOrders = orders.filter(o => o.masterId === listingId);
        const totalRevenue = listingOrders.reduce((sum, o) => sum + o.pricing.total.amount, 0);

        return {
            itemCount: items.length,
            orderCount: listingOrders.length,
            revenue: totalRevenue,
            views: Math.floor(Math.random() * 200) + 20 // Mock data
        };
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("确定要删除这条发布吗？此操作不可撤销。")) {
            return;
        }

        try {
            await deleteListing(id);
            toast.success("已成功删除");
        } catch (err: any) {
            toast.error(err.message || "删除失败");
        }
    };

    const handleToggleStatus = async (id: string, currentStatus: string) => {
        const nextStatus = currentStatus === 'PUBLISHED' ? 'ARCHIVED' : 'PUBLISHED';
        try {
            await updateListing(id, { status: nextStatus as any });
            toast.success(nextStatus === 'PUBLISHED' ? "已重新上架" : "已下架");
        } catch (err: any) {
            toast.error(err.message || "操作失败");
        }
    };

    // Matches ListingCard.tsx's badge split — Products vs Secondhand by
    // which form created the listing (attributes.goodsTier), not a single
    // generic "Good" for all of GOODS.
    const getTypeBadge = (listing: { type: string; attributes?: any }) => {
        switch (listing.type) {
            case 'TASK': return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none font-black text-[10px] uppercase tracking-tighter">Demand</Badge>;
            case 'GOODS': return listing.attributes?.goodsTier === 'PRODUCT'
                ? <Badge className="bg-sky-100 text-sky-700 hover:bg-sky-100 border-none font-black text-[10px] uppercase tracking-tighter">Product</Badge>
                : <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 border-none font-black text-[10px] uppercase tracking-tighter">Secondhand</Badge>;
            case 'RENTAL': return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 border-none font-black text-[10px] uppercase tracking-tighter">Rental</Badge>;
            case 'SERVICE':
                // Every listing here is mine, so myIdentity (fetched once
                // above) applies to all of them — same signal as
                // ListingCard.tsx's Business/Handyman split.
                return myIdentity === 'MERCHANT'
                    ? <Badge className="bg-primary/10 text-primary hover:bg-primary/10 border-none font-black text-[10px] uppercase tracking-tighter">Business</Badge>
                    : <Badge className="bg-teal-100 text-teal-700 hover:bg-teal-100 border-none font-black text-[10px] uppercase tracking-tighter">Handyman</Badge>;
            default: return <Badge className="bg-primary/10 text-primary hover:bg-primary/10 border-none font-black text-[10px] uppercase tracking-tighter">Service</Badge>;
        }
    };

    return (
        <div className="min-h-screen bg-background pb-20">
            <Header />

            <div className="container max-w-5xl py-8 px-4">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-foreground tracking-tight mb-2">My Posts <span className="text-primary">.</span></h1>
                        <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
                            Manage your {myListings.length} active listings & demands
                        </p>
                    </div>
                    {renderCreateNewButton({
                        className: "btn-action gap-2 h-12 px-6 rounded-2xl shadow-warm",
                        children: <><Plus className="w-5 h-5" /> Create New</>
                    })}
                </div>

                {/* Grid Overlay */}
                <div className="grid gap-6">
                    {myListings.length === 0 ? (
                        <div className="text-center py-24 card-warm border-dashed border-2 border-muted bg-transparent">
                            <Layout className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
                            <p className="text-lg font-black text-muted-foreground mb-6">No posts found yet</p>
                            {renderCreateNewButton({
                                variant: "outline",
                                className: "rounded-xl font-bold",
                                children: isProvider ? "Add your first listing" : "Post your first task or item"
                            })}
                        </div>
                    ) : (
                        myListings.map((listing) => {
                            const stats = getListingStats(listing.id);
                            const items = listingItems.filter(i => i.masterId === listing.id);
                            const firstItem = items[0];

                            return (
                                <div key={listing.id} className="card-warm overflow-hidden hover:shadow-xl transition-all duration-300 border-none group">
                                    <div className="flex flex-col md:flex-row gap-6">
                                        {/* Image Gallery Mockup */}
                                        <div className="relative w-full md:w-48 h-48 flex-shrink-0">
                                            <img
                                                src={listing.images[0]}
                                                alt={listing.titleZh}
                                                className="w-full h-full object-cover rounded-2xl group-hover:scale-105 transition-transform duration-500"
                                            />
                                            <div className="absolute top-3 left-3">
                                                {getTypeBadge(listing)}
                                            </div>
                                        </div>

                                        {/* Content Area */}
                                        <div className="flex-1 min-w-0 pr-4 py-2">
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <div className="flex items-center gap-2">
                                                            {getTypeBadge(listing)}
                                                            {listing.status === 'ARCHIVED' && (
                                                                <Badge variant="outline" className="bg-muted/50 text-muted-foreground border-muted font-black text-[10px] uppercase tracking-tighter">
                                                                    Offline
                                                                </Badge>
                                                            )}
                                                            {/* Set from My Orders > I'm Selling > Mark as Completed on a
                                                                GOODS order — see orderStore.ts's updateOrderStatus. */}
                                                            {firstItem?.status === 'SOLD' && (
                                                                <Badge className="bg-slate-800 text-white hover:bg-slate-800 border-none font-black text-[10px] uppercase tracking-tighter">
                                                                    Sold
                                                                </Badge>
                                                            )}
                                                            {firstItem?.status === 'PENDING' && (
                                                                <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-none font-black text-[10px] uppercase tracking-tighter">
                                                                    Pending
                                                                </Badge>
                                                            )}
                                                            <span className="text-[10px] font-black text-muted-foreground uppercase opacity-50"># {listing.id.slice(0, 8)}</span>
                                                        </div>
                                                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                                                            <Clock className="w-3 h-3" /> Just now
                                                        </span>
                                                        <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                                                        <span className="text-[10px] font-black text-primary uppercase tracking-widest">
                                                            {listing.status}
                                                        </span>
                                                    </div>
                                                    <h3 className="text-xl font-black text-foreground tracking-tight line-clamp-1 mb-1 group-hover:text-primary transition-colors">
                                                        {listing.titleEn || listing.titleZh}
                                                    </h3>
                                                    <p className="text-sm font-medium text-muted-foreground/80 line-clamp-2 leading-relaxed">
                                                        {listing.descriptionEn || listing.descriptionZh}
                                                    </p>
                                                </div>

                                                <div className="flex items-center gap-2 shrink-0">
                                                    {/* Direct sold/pending control — not every sale goes through
                                                        an in-app order (e.g. agreed off-platform after a chat),
                                                        so this can't only live behind My Orders > I'm Selling. */}
                                                    {/* Secondhand only, not a merchant's Product catalog —
                                                        those restock and use their own stock field, they
                                                        don't have a one-off "sold" state. */}
                                                    {listing.type === 'GOODS' && (listing as any).attributes?.goodsTier !== 'PRODUCT' && firstItem && (
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button
                                                                    variant="outline"
                                                                    size="icon"
                                                                    className="rounded-xl w-10 h-10 border-muted hover:bg-primary/5 hover:border-primary/30 transition-all duration-300"
                                                                    title="标记售出状态"
                                                                >
                                                                    <Tag className="w-4 h-4 text-muted-foreground" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem onClick={() => updateItemStatus(firstItem.id, 'AVAILABLE')}>Available</DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => updateItemStatus(firstItem.id, 'PENDING')}>Pending</DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => updateItemStatus(firstItem.id, 'SOLD')}>Sold</DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    )}
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        className={`rounded-xl w-10 h-10 border-muted transition-all duration-300 ${listing.status === 'ARCHIVED' ? 'bg-orange-50 border-orange-200 hover:bg-orange-100' : 'hover:bg-primary/5 hover:border-primary/30'}`}
                                                        onClick={() => handleToggleStatus(listing.id, listing.status)}
                                                        title={listing.status === 'PUBLISHED' ? '下架 (邻居不可见)' : '重新上架'}
                                                    >
                                                        {listing.status === 'PUBLISHED' ? (
                                                            <ArrowDownToLine className="w-4 h-4 text-orange-600" />
                                                        ) : (
                                                            <Rocket className="w-4 h-4 text-green-600" />
                                                        )}
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        className="rounded-xl w-10 h-10 border-muted hover:bg-primary/5 hover:border-primary/30 transition-all duration-300"
                                                        onClick={() => navigate(`/service/${listing.id}`)}
                                                        title="查看预览"
                                                    >
                                                        <ExternalLink className="w-4 h-4 text-muted-foreground" />
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        className="rounded-xl w-10 h-10 border-muted hover:bg-primary/5 hover:border-primary/30 transition-all duration-300"
                                                        onClick={() => navigate(`/publish?id=${listing.id}`)}
                                                        title="修改内容"
                                                    >
                                                        <Edit className="w-4 h-4 text-muted-foreground" />
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        className="rounded-xl w-10 h-10 border-red-100 hover:bg-red-50 hover:border-red-200 group/delete transition-all duration-300"
                                                        onClick={() => handleDelete(listing.id)}
                                                        title="删除发布"
                                                    >
                                                        <Trash2 className="w-4 h-4 text-red-500 group-hover/delete:scale-110 transition-transform" />
                                                    </Button>
                                                </div>
                                            </div>

                                            {/* Attributes / Price */}
                                            <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-muted/50">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[11px] font-black text-muted-foreground uppercase tracking-tighter">Price / Budget:</span>
                                                    <span className="text-lg font-black text-primary">
                                                        ${firstItem ? firstItem.pricing.price.amount / 100 : '0'}
                                                    </span>
                                                    <span className="text-[9px] font-black text-muted-foreground uppercase opacity-50">/{firstItem?.pricing.unit || 'job'}</span>
                                                </div>

                                                <div className="h-4 w-px bg-muted mx-2 hidden md:block" />

                                                <div className="flex items-center gap-4">
                                                    <div className="flex items-center gap-1">
                                                        <MessageSquare className="w-4 h-4 text-muted-foreground/50" />
                                                        <span className="text-sm font-black text-foreground">{stats.orderCount}</span>
                                                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Offers</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Eye className="w-4 h-4 text-muted-foreground/50" />
                                                        <span className="text-sm font-black text-foreground">{stats.views}</span>
                                                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Views</span>
                                                    </div>
                                                </div>

                                                {listing.type === 'TASK' && stats.orderCount > 0 && (
                                                    <Button
                                                        size="sm"
                                                        className="ml-auto bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] uppercase tracking-widest rounded-xl px-4"
                                                        onClick={() => navigate(`/orders?masterId=${listing.id}`)}
                                                    >
                                                        Review Offers
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default MyListings;
