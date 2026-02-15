import { useNavigate } from "react-router-dom";
import { Search, Star, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ListingMaster } from "@/types/domain";
import { useConfigStore } from "@/stores/configStore";

interface ListingsDrawerProps {
    listings: ListingMaster[];
    isOpen: boolean; // For mobile toggle
}

export function ListingsDrawer({ listings, isOpen }: ListingsDrawerProps) {
    const navigate = useNavigate();
    const { language } = useConfigStore();

    return (
        <div className={`
        absolute inset-0 z-[1005] bg-background md:static md:inset-auto md:z-auto md:w-80 md:h-auto md:bg-transparent
        transition-all duration-500 ease-out flex flex-col
        ${isOpen ? 'translate-y-0 opacity-100' : 'translate-y-full md:translate-y-0 opacity-0 md:opacity-100'}
        md:absolute md:top-20 md:right-4 md:bottom-20 md:bg-transparent md:pointer-events-none
    `}>
            <div className="flex-1 bg-background md:bg-background/95 md:backdrop-blur-xl md:border md:shadow-2xl md:rounded-3xl md:pointer-events-auto flex flex-col h-full overflow-hidden">
                {/* Mobile: Pull handle */}
                <div className="md:hidden pt-2 pb-1 flex justify-center">
                    <div className="w-12 h-1 rounded-full bg-muted-foreground/20"></div>
                </div>

                <div className="flex-1 flex flex-col overflow-hidden p-4 pt-2 md:pt-4">
                    <div className="flex items-center justify-between mb-4 px-2">
                        <h3 className="text-lg font-black tracking-tight">{language === 'zh' ? '推荐服务' : 'Recommended'}</h3>
                        <Badge className="bg-primary/10 text-primary border-none font-bold">{listings.length}</Badge>
                    </div>

                    {listings.length === 0 ? (
                        <div className="flex flex-col items-center justify-center flex-1 text-muted-foreground opacity-50">
                            <Search className="w-12 h-12 mb-2" />
                            <p className="text-sm font-bold">{language === 'zh' ? '该区域暂无服务' : 'No results in this area'}</p>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-y-auto space-y-3 pr-2 pb-24 md:pb-4 overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
                            {listings.slice(0, 50).map(listing => (
                                <div
                                    key={listing.id}
                                    className="p-3 bg-gradient-to-br from-muted/30 to-muted/20 rounded-2xl hover:from-muted/50 hover:to-muted/40 active:scale-98 transition-all duration-200 cursor-pointer group flex gap-3 border border-transparent hover:border-primary/20 shadow-sm hover:shadow-md"
                                    onClick={() => {
                                        navigate(`/service/${listing.id}`);
                                    }}
                                >
                                    <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 shadow-sm ring-1 ring-black/5">
                                        <img
                                            src={listing.images?.[0]}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                            alt=""
                                            loading="lazy"
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                                        <div className="flex justify-between items-start gap-2">
                                            <h4 className="font-bold text-sm truncate mb-0.5 group-hover:text-primary transition-colors">{language === 'zh' ? listing.titleZh : listing.titleEn}</h4>
                                            <Badge variant="outline" className="text-[10px] h-5 px-1.5 shrink-0 border-primary/20 bg-primary/5">{listing.type}</Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground line-clamp-1 mb-2">{language === 'zh' ? listing.descriptionZh : listing.descriptionEn}</p>
                                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold">
                                            <span className="text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                                                {listing.distanceMeters
                                                    ? (listing.distanceMeters > 1000
                                                        ? `${(listing.distanceMeters / 1000).toFixed(1)} km`
                                                        : `${Math.round(listing.distanceMeters)} m`)
                                                    : 'Nearby'}
                                            </span>
                                            <span className="flex items-center text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                                                <Star className="w-3 h-3 mr-0.5 fill-current" />
                                                {listing.rating}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
