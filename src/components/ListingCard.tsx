import { Link } from "react-router-dom";
import { Star, MapPin, Tag, TrendingUp, Heart, Sparkles, Layers } from "lucide-react";
import { ListingMaster } from "@/types/domain";
import { useListingStore } from "@/stores/listingStore";
import { useProviderStore } from "@/stores/providerStore";
import { useConfigStore } from "@/stores/configStore";
import { VerificationBadge } from "./ui/VerificationBadge";
import { Badge } from "./ui/badge";
import { motion } from "framer-motion";
import { useState } from "react";

export const ListingCard = ({ item }: { item: ListingMaster & { similarity?: number } }) => {
    const { listingItems } = useListingStore();
    const { getProviderById } = useProviderStore();
    const { refCodes, language } = useConfigStore();
    const [isFavorited, setIsFavorited] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);

    const provider = getProviderById(item.providerId);
    const items = listingItems.filter(li => li.masterId === item.id);
    const nodeInfo = refCodes.find(r => r.codeId === item.nodeId);

    // Helper for localized text
    const getLocalized = (en?: string, zh?: string) => {
        return language === 'zh' ? (zh || en) : (en || zh);
    };

    const displayTitle = getLocalized(item.titleEn, item.titleZh);
    const displayDesc = getLocalized(item.descriptionEn, item.descriptionZh);
    const displayBusinessName = provider ? getLocalized(provider.businessNameEn, provider.businessNameZh) : '';
    const displayNodeName = nodeInfo ? getLocalized(nodeInfo.enName, nodeInfo.zhName) : undefined;

    // Find the starting price (lowest amount)
    const startingPrice = items.length > 0
        ? items.reduce((min, cur) => cur.pricing.price.amount < min.pricing.price.amount ? cur : min, items[0]).pricing.price
        : null;

    // Type-based styling
    const getTypeConfig = () => {
        switch (item.type) {
            case 'RENTAL':
                return {
                    badge: language === 'zh' ? '租赁' : 'Rental',
                    bgClass: 'bg-gradient-to-br from-blue-500 to-blue-600',
                    glowClass: 'group-hover:shadow-blue-500/20'
                };
            case 'CONSULTATION':
                return {
                    badge: language === 'zh' ? '专家' : 'Expert',
                    bgClass: 'bg-gradient-to-br from-purple-500 to-purple-600',
                    glowClass: 'group-hover:shadow-purple-500/20'
                };
            case 'GOODS':
                return {
                    badge: language === 'zh' ? '集市' : 'Market',
                    bgClass: 'bg-gradient-to-br from-green-500 to-green-600',
                    glowClass: 'group-hover:shadow-green-500/20'
                };
            default:
                return {
                    badge: language === 'zh' ? '服务' : 'Service',
                    bgClass: 'bg-gradient-to-br from-primary to-primary/80',
                    glowClass: 'group-hover:shadow-primary/20'
                };
        }
    };

    const typeConfig = getTypeConfig();

    return (
        <Link to={`/service/${item.id}`} className="group block h-full">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
                className={`relative bg-card rounded-2xl overflow-hidden h-full border border-border/50 transition-all duration-300 hover:border-primary/30 hover:shadow-xl ${typeConfig.glowClass}`}
            >
                {/* Image Section with Enhanced Overlays */}
                <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-muted to-muted/50">
                    {/* Skeleton loader */}
                    {!imageLoaded && (
                        <div className="absolute inset-0 bg-gradient-to-br from-muted via-muted/80 to-muted animate-pulse" />
                    )}

                    <img
                        src={item.images[0]}
                        alt={displayTitle}
                        onLoad={() => setImageLoaded(true)}
                        loading="lazy"
                        className={`w-full h-full object-cover group-hover:scale-110 transition-all duration-700 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                    />

                    {/* Gradient Overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    {/* Rating Badge */}
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="absolute top-3 right-3 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg"
                    >
                        <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                        <span className="text-foreground">{item.rating}</span>
                    </motion.div>

                    <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className={`absolute top-3 left-3 ${typeConfig.bgClass} text-white px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wide shadow-lg backdrop-blur-sm`}
                    >
                        {typeConfig.badge}
                    </motion.div>

                    {/* Multiple Images Indicator */}
                    {item.images.length > 1 && (
                        <div className="absolute top-3 right-14 bg-black/50 backdrop-blur-md text-white p-1.5 rounded-lg shadow-sm z-10">
                            <Layers className="w-3.5 h-3.5" />
                        </div>
                    )}

                    {/* Favorite Button */}
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            setIsFavorited(!isFavorited);
                        }}
                        className="absolute bottom-3 right-3 w-9 h-9 bg-white/95 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 active:scale-95"
                    >
                        <Heart className={`w-4 h-4 transition-all ${isFavorited ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} />
                    </button>

                    {/* AI Similarity Badge - 优先级最高 */}
                    {item.similarity && item.similarity > 0.75 && (
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="absolute bottom-3 left-3 bg-gradient-to-r from-primary to-primary/80 text-white px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 shadow-lg backdrop-blur-sm"
                        >
                            <Sparkles className="w-3 h-3 animate-pulse" />
                            {language === 'zh' ? '高度匹配' : 'High Match'}
                            <span className="ml-0.5 text-[10px] opacity-90">
                                {Math.round(item.similarity * 100)}%
                            </span>
                        </motion.div>
                    )}

                    {/* Trending indicator if rating > 4.5 (只在没有相似度徽章时显示) */}
                    {item.rating && item.rating > 4.5 && (!item.similarity || item.similarity <= 0.75) && (
                        <div className="absolute bottom-3 left-3 bg-orange-500/95 text-white px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-lg backdrop-blur-sm">
                            <TrendingUp className="w-3 h-3" />
                            {language === 'zh' ? '热门' : 'Hot'}
                        </div>
                    )}
                </div>
                {/* Content Section - Compact for Mobile */}
                <div className="p-3 sm:p-5 flex flex-col h-full">
                    {/* Title - Strict truncation for symmetry */}
                    <div className="mb-2 sm:mb-3 h-[2.8rem] sm:h-[3.2rem] overflow-hidden">
                        <h3 className="font-extrabold text-sm sm:text-lg line-clamp-2 group-hover:text-primary transition-colors leading-[1.3]">
                            {displayTitle}
                        </h3>
                    </div>

                    {/* Provider Info - Single line */}
                    {provider && (
                        <div className="flex items-center gap-1.5 mb-2 sm:mb-3">
                            <div className={`shrink-0 px-1.5 py-0.5 rounded-md text-[9px] font-black border ${provider.identity === 'MERCHANT'
                                ? 'bg-blue-50/50 text-blue-600 border-blue-100'
                                : 'bg-green-50/50 text-green-600 border-green-100'
                                }`}>
                                {provider.identity === 'MERCHANT'
                                    ? (language === 'zh' ? '商' : 'M')
                                    : (language === 'zh' ? '邻' : 'N')}
                            </div>
                            <span className="text-[10px] sm:text-xs font-bold text-muted-foreground/60 truncate">
                                {displayBusinessName}
                            </span>
                        </div>
                    )}

                    {/* Description - Strict 2-line clamp + fixed height for desktop symmetry */}
                    <div className="hidden sm:block mb-4 h-[2.5rem] overflow-hidden">
                        <p className="text-xs text-muted-foreground/80 line-clamp-2 leading-relaxed">
                            {displayDesc}
                        </p>
                    </div>

                    {/* Footer: Price Focus */}
                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-border/40">
                        <div className="flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground/70 font-bold bg-muted/20 px-2 py-0.5 rounded-full">
                            <MapPin className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-primary/50" />
                            <span className="truncate max-w-[60px] sm:max-w-none font-extrabold">{item.location.city}</span>
                            {item.distanceMeters !== undefined && (
                                <span className="ml-1 text-primary/60">
                                    {(item.distanceMeters / 1000).toFixed(1)}km
                                </span>
                            )}
                        </div>

                        <div className="flex items-baseline gap-0.5">
                            {startingPrice ? (
                                <>
                                    <span className="text-[10px] text-primary/60 font-black">{language === 'zh' ? '¥' : '$'}</span>
                                    <span className="text-primary font-black text-base sm:text-xl leading-none">
                                        {(startingPrice.amount / 100).toFixed(0)}
                                    </span>
                                </>
                            ) : (
                                <span className="text-muted-foreground text-[10px] font-black italic opacity-60">
                                    {language === 'zh' ? '议价' : 'Quote'}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Bottom Accent Line */}
                <div className={`h-1 w-full ${typeConfig.bgClass} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
            </motion.div>
        </Link>
    );
};
