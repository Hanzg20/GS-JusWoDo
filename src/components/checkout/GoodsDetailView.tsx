import { ListingMaster, ListingItem, User, ProviderProfile } from "@/types/domain";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MessageCircle, ShoppingBag, Truck, ShieldCheck, MapPin, Share2, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { useState } from "react";
import { getTranslation } from "@/stores/listingStore";
import { useConfigStore } from "@/stores/configStore";
import { ShareSheet } from "@/components/common/ShareSheet";
import { MediaEmbed } from "@/components/Community/MediaEmbed";
import { PAYMENTS_ENABLED } from "@/config/launchFlags";

interface GoodsDetailViewProps {
    master: ListingMaster;
    item: ListingItem;
    items?: ListingItem[]; // Added for variants
    provider: User | ProviderProfile; // Support both types
    onBuy: () => void;
    onChat: () => void;
    onSelect?: (item: ListingItem) => void; // Added for selection
}

export const GoodsDetailView = ({ master, item, items = [], provider, onBuy, onChat, onSelect }: GoodsDetailViewProps) => {
    const [currentImage, setCurrentImage] = useState(0);
    const { language } = useConfigStore();

    const t = {
        back: language === 'zh' ? '返回' : 'Back',
        verified: language === 'zh' ? '认证' : 'Verified',
        delivery: language === 'zh' ? '配送方式' : 'Delivery',
        meetup: language === 'zh' ? '当面交易' : 'Meetup',
        shipping: language === 'zh' ? '快递邮寄' : 'Shipping',
        condition: language === 'zh' ? '成色' : 'Condition',
        brand: language === 'zh' ? '品牌' : 'Brand',
        chat: language === 'zh' ? '联系卖家' : 'Chat',
        buyNow: PAYMENTS_ENABLED ? (language === 'zh' ? '立即购买' : 'Buy Now') : (language === 'zh' ? '联系购买' : 'Chat to Buy'),
        postedBy: language === 'zh' ? '发布者' : 'Posted by',
        location: language === 'zh' ? '位置' : 'Location',
        selectOption: language === 'zh' ? '选择规格' : 'Select Option',
        share: language === 'zh' ? '分享' : 'Share',
    };

    const nextImage = () => setCurrentImage((prev) => (prev + 1) % master.images.length);
    const prevImage = () => setCurrentImage((prev) => (prev - 1 + master.images.length) % master.images.length);

    return (
        <div className="min-h-screen bg-background pb-32">
            {/* Mobile-first Header with Carousel */}
            <div className="relative h-96 bg-muted overflow-hidden">
                <img
                    src={master.images[currentImage]}
                    alt={getTranslation(master, 'title')}
                    className="w-full h-full object-cover transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-black/20" />

                {/* Top Actions */}
                <div className="absolute top-0 left-0 right-0 p-4 flex justify-between z-10">
                    <Link to="/" className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-xl">
                        <ArrowLeft className="w-5 h-5 text-white" />
                    </Link>
                    <ShareSheet
                        title={getTranslation(master, 'title')}
                        content={getTranslation(master, 'description')}
                        imageUrl={master.images[currentImage]}
                        authorName={
                            // Duck typing check for ProviderProfile vs User
                            (provider && 'businessNameEn' in provider)
                                ? (provider.businessNameEn || provider.businessNameZh || t.postedBy)
                                : (provider?.name || 'Neighbor')
                        }
                        authorAvatar={provider?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${provider?.id || 'default'}`}
                        trigger={
                            <button className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-xl">
                                <Share2 className="w-5 h-5 text-white" />
                            </button>
                        }
                    />
                </div>

                {/* Carousel Navigation */}
                {master.images.length > 1 && (
                    <>
                        <button onClick={prevImage} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center hover:bg-black/50 transition-all z-10">
                            <ChevronLeft className="w-6 h-6 text-white" />
                        </button>
                        <button onClick={nextImage} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center hover:bg-black/50 transition-all z-10">
                            <ChevronRight className="w-6 h-6 text-white" />
                        </button>

                        {/* Image Indicators */}
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 px-3 py-1.5 bg-black/30 backdrop-blur-md rounded-full border border-white/10 z-10">
                            {master.images.map((_, i) => (
                                <div
                                    key={i}
                                    onClick={() => setCurrentImage(i)}
                                    className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${i === currentImage ? 'w-4 bg-white' : 'w-1.5 bg-white/50'}`}
                                />
                            ))}
                        </div>
                    </>
                )}
            </div>

            <div className="container max-w-lg -mt-6 relative z-10">
                <div className="card-warm p-6 mb-4 shadow-elevated">
                    <div className="flex items-start justify-between mb-2">
                        <div>
                            <h1 className="text-2xl font-black text-foreground">{getTranslation(master, 'title')}</h1>
                            <p className="text-2xl font-black text-primary mt-1">
                                ${item.pricing.price.amount / 100}
                            </p>
                        </div>
                        <div className="flex flex-col gap-1 items-end">
                            {/* Only show condition if explicitly set */}
                            {item.attributes?.condition && (
                                <Badge variant="outline" className="border-primary text-primary font-bold">
                                    {t.condition}: {item.attributes.condition}
                                </Badge>
                            )}
                            {item.attributes?.brand && (
                                <Badge variant="secondary" className="font-bold">
                                    {item.attributes.brand}
                                </Badge>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
                        <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {master.location.fullAddress?.split(',')[0] || t.location}
                        </div>
                        <div className="flex items-center gap-1">
                            <Truck className="w-3 h-3" />
                            {t.meetup}
                        </div>
                    </div>

                    {/* Variant Selector */}
                    {items && items.length > 1 && onSelect && (
                        <div className="mb-6">
                            <h3 className="text-sm font-bold mb-3 text-muted-foreground uppercase tracking-wide">{t.selectOption}</h3>
                            <div className="grid gap-2">
                                {items.map((variant) => (
                                    <div
                                        key={variant.id}
                                        onClick={() => onSelect(variant)}
                                        className={`flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all ${item.id === variant.id
                                            ? 'border-primary bg-primary/5 shadow-sm'
                                            : 'border-transparent bg-muted/50 hover:bg-muted'
                                            }`}
                                    >
                                        <div>
                                            <p className={`font-bold text-sm ${item.id === variant.id ? 'text-primary' : ''}`}>
                                                {getTranslation(variant, 'name')}
                                            </p>
                                            {variant.descriptionEn && (
                                                <p className="text-xs text-muted-foreground line-clamp-1">
                                                    {getTranslation(variant, 'description')}
                                                </p>
                                            )}
                                        </div>
                                        <div className="font-black text-foreground">
                                            ${variant.pricing.price.amount / 100}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Media Embed */}
                    {master.mediaUrl && (
                        <div className="mb-6">
                            <MediaEmbed content={master.mediaUrl} />
                        </div>
                    )}

                    <p className="text-sm font-medium text-muted-foreground leading-relaxed mb-6">
                        {getTranslation(master, 'description')}
                    </p>

                    <Link to={`/provider/${provider?.id || master.providerId}`} className="flex items-center gap-3 p-3 bg-muted/50 rounded-2xl hover:bg-muted transition-colors cursor-pointer">
                        <div className="w-10 h-10 rounded-full bg-background border flex items-center justify-center overflow-hidden">
                            <img src={provider?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${provider?.id || 'unknown'}`} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1">
                            <p className="text-xs font-bold text-muted-foreground uppercase">{t.postedBy}</p>
                            <p className="font-black text-foreground">
                                {(provider && 'businessNameEn' in provider)
                                    ? (provider.businessNameEn || provider.businessNameZh || 'Neighbor')
                                    : (provider?.name || 'Neighbor')}
                            </p>
                        </div>
                    </Link>
                </div>
            </div>

            {/* Fixed Bottom Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 p-4 glass-sticky-bar border-t border-border/10 z-50">
                <div className="container max-w-lg flex gap-3">
                    <Button variant="outline" size="lg" className="flex-1 rounded-2xl font-bold gap-2" onClick={onChat}>
                        <MessageCircle className="w-5 h-5 text-primary" />
                        {t.chat}
                    </Button>

                    <Button size="lg" className="flex-[2] rounded-2xl font-black shadow-warm bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 border-none" onClick={() => {
                        console.log('🛒 [GoodsDetailView] Buying item:', item.id, item.nameEn);
                        onBuy();
                    }}>
                        <ShoppingBag className="w-5 h-5 mr-2" />
                        {t.buyNow}
                    </Button>
                </div>
            </div>
        </div>
    );
};
