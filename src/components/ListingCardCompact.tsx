import { Link } from "react-router-dom";
import { Star, MapPin, TrendingUp, Sparkles } from "lucide-react";
import { ListingMaster } from "@/types/domain";
import { useListingStore } from "@/stores/listingStore";
import { useProviderStore } from "@/stores/providerStore";
import { useConfigStore } from "@/stores/configStore";
import { VerificationBadge } from "./ui/VerificationBadge";
import { Badge } from "./ui/badge";
import { motion } from "framer-motion";
import { useState } from "react";

export const ListingCardCompact = ({ item }: { item: ListingMaster }) => {
    const { listingItems } = useListingStore();
    const { getProviderById } = useProviderStore();
    const { refCodes, language } = useConfigStore();
    const [imageLoaded, setImageLoaded] = useState(false);

    const provider = getProviderById(item.providerId);
    const items = listingItems.filter(li => li.masterId === item.id);
    const nodeInfo = refCodes.find(r => r.codeId === item.nodeId);

    // Localization helper
    const getLocalized = (en?: string, zh?: string) => {
        return language === 'zh' ? (zh || en) : (en || zh);
    };

    // Find the starting price (lowest amount)
    const startingPrice = items.length > 0
        ? items.reduce((min, cur) => cur.pricing.price.amount < min.pricing.price.amount ? cur : min, items[0]).pricing.price
        : null;

    const displayTitle = getLocalized(item.titleEn, item.titleZh);
    const displayDesc = getLocalized(item.descriptionEn, item.descriptionZh);
    const displayBusinessName = provider ? getLocalized(provider.businessNameEn, provider.businessNameZh) : '';

    // Type configuration
    const getTypeConfig = () => {
        switch (item.type) {
            case 'RENTAL':
                return { badge: language === 'zh' ? '租' : 'Rent', color: 'bg-blue-500' };
            case 'CONSULTATION':
                return { badge: language === 'zh' ? '专' : 'Pro', color: 'bg-purple-500' };
            case 'GOODS':
                return { badge: language === 'zh' ? '物' : 'Good', color: 'bg-green-500' };
            default:
                return { badge: language === 'zh' ? '服' : 'Serv', color: 'bg-primary' };
        }
    };

    const typeConfig = getTypeConfig();

    return (
        <Link to={`/service/${item.id}`} className="group block">
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                whileHover={{ x: 4, transition: { duration: 0.2 } }}
                className="flex gap-3 p-3 rounded-2xl bg-card border border-border/50 hover:border-primary/40 hover:shadow-lg transition-all duration-300"
            >
                {/* Enhanced Compact Image */}
                <div className="relative w-28 h-28 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-muted to-muted/50">
                    {/* Loading skeleton */}
                    {!imageLoaded && (
                        <div className="absolute inset-0 bg-muted animate-pulse" />
                    )}

                    <img
                        src={item.images[0]}
                        alt={displayTitle}
                        onLoad={() => setImageLoaded(true)}
                        className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                    />

                    {/* Type Badge */}
                    <div className={`absolute top-2 right-2 ${typeConfig.color} text-white text-[10px] font-black px-2 py-0.5 rounded-lg shadow-md`}>
                        {typeConfig.badge}
                    </div>

                    {/* Hot Badge */}
                    {item.rating && item.rating > 4.5 && (
                        <div className="absolute bottom-2 left-2 bg-orange-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                            <TrendingUp className="w-2.5 h-2.5" />
                            {language === 'zh' ? '热' : 'Hot'}
                        </div>
                    )}

                    {/* Gradient overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>

                {/* Enhanced Info Section */}
                <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                    {/* Top: Title and Rating */}
                    <div>
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                            <h3 className="font-bold text-sm line-clamp-2 group-hover:text-primary transition-colors leading-tight flex-1">
                                {displayTitle}
                            </h3>
                            <div className="flex items-center gap-1 flex-shrink-0 bg-yellow-50 px-2 py-0.5 rounded-lg">
                                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                <span className="text-xs font-bold text-yellow-700">{item.rating}</span>
                            </div>
                        </div>

                        {/* Provider Info */}
                        {provider && (
                            <div className="flex items-center gap-1.5 mb-1">
                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${provider.identity === 'MERCHANT' ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'}`}>
                                    {provider.identity === 'MERCHANT' ? (language === 'zh' ? '商' : 'M') : (language === 'zh' ? '邻' : 'N')}
                                </span>
                                <span className="text-xs text-muted-foreground truncate font-medium">{displayBusinessName}</span>
                                {provider.isVerified && (
                                    <Sparkles className="w-3 h-3 text-primary" />
                                )}
                            </div>
                        )}
                    </div>

                    {/* Bottom: Description, Tags, and Price */}
                    <div>
                        <p className="text-xs text-muted-foreground line-clamp-1 mb-2 leading-relaxed">
                            {displayDesc}
                        </p>

                        <div className="flex items-center justify-between gap-2">
                            {/* Tags */}
                            <div className="flex items-center gap-1.5 flex-wrap">
                                {provider && (
                                    <VerificationBadge
                                        level={(provider.verificationLevel || 1) as 1 | 2 | 3 | 4 | 5}
                                        nodeName={nodeInfo?.enName || nodeInfo?.zhName}
                                        endorsementCount={provider.stats?.repeatRate ? Math.floor(provider.stats.repeatRate * 10) : 0}
                                    />
                                )}
                                <Badge variant="outline" className="text-[9px] px-1.5 py-0.5 border-muted-foreground/20">
                                    <MapPin className="w-2.5 h-2.5 mr-0.5" />
                                    {item.location.city}
                                </Badge>
                            </div>

                            {/* Price */}
                            {startingPrice && (
                                <div className="flex flex-col items-end flex-shrink-0">
                                    <span className="text-[9px] text-muted-foreground uppercase tracking-wide">
                                        {language === 'zh' ? '起' : 'From'}
                                    </span>
                                    <span className="text-primary font-black text-base leading-none bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                                        {startingPrice.formatted}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Subtle accent border on hover */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${typeConfig.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-l-2xl`} />
            </motion.div>
        </Link>
    );
};


