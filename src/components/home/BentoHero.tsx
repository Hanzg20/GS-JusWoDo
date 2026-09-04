import { SmartSearchBar } from "@/components/SmartSearchBar";
import { useConfigStore } from "@/stores/configStore";
import { supabase } from "@/lib/supabase";
import { useEffect, useState, useRef } from "react";
import { Star, Map } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ListingMaster } from "@/types/domain";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    type CarouselApi,
} from "@/components/ui/carousel";

interface BentoHeroProps {
    featuredListings?: ListingMaster[];
}

export function BentoHero({ featuredListings = [] }: BentoHeroProps) {
    const { language } = useConfigStore();
    const isZh = language === 'zh';

    const [onlineCount, setOnlineCount] = useState(328);
    const [api, setApi] = useState<CarouselApi>();
    const autoplayRef = useRef<ReturnType<typeof setInterval>>();

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const { data, error } = await supabase.rpc('get_platform_stats');
                if (!error && data?.usersCount) {
                    setOnlineCount(data.usersCount);
                }
            } catch (err) {
                console.error('Failed to fetch platform stats:', err);
            }
        };
        fetchStats();
    }, []);

    // Lightweight autoplay (no extra embla plugin dependency) — pauses
    // when there's nothing to rotate through.
    useEffect(() => {
        if (!api || featuredListings.length < 2) return;

        autoplayRef.current = setInterval(() => {
            if (api.canScrollNext()) {
                api.scrollNext();
            } else {
                api.scrollTo(0);
            }
        }, 6000);

        return () => clearInterval(autoplayRef.current);
    }, [api, featuredListings.length]);

    return (
        <div className="relative bg-gradient-to-r from-primary/10 via-primary/5 to-secondary/10 p-4 sm:p-5 rounded-2xl border border-primary/15 shadow-2xs">
            {/* Background Primary Decor — clipped in its own layer so it doesn't
                force overflow:hidden on the card (that used to clip the search
                bar's category dropdown too). */}
            <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
            </div>

            <div className="relative z-10 space-y-3">
                {/* Search + Map — centered as one group, map button sits right against Search.
                    relative z-20 forces this whole row (incl. the category dropdown inside
                    SmartSearchBar) onto its own stacking layer above the carousel below —
                    without it, the carousel's slide transform creates its own stacking
                    context that painted over the dropdown despite the dropdown's z-50. */}
                <div className="relative z-20 flex items-center gap-2 max-w-2xl mx-auto">
                    <div className="flex-1 min-w-0">
                        <SmartSearchBar />
                    </div>
                    <Link
                        to="/discover"
                        title={isZh ? '地图发现' : 'Map Discovery'}
                        className="shrink-0 w-10 h-10 rounded-xl bg-white/90 border border-slate-200/80 flex items-center justify-center text-slate-600 hover:bg-primary hover:text-white hover:border-primary transition-all shadow-3xs"
                    >
                        <Map className="w-4 h-4" />
                    </Link>
                </div>

                {/* Quick search pills — Karrot-style trending keywords (location is
                    already handled by the Ottawa/Kanata selector in Header, so this
                    row stays single-purpose: what to search, not where). */}
                <div className="flex flex-wrap items-center justify-center gap-1.5">
                    {(isZh
                        ? [{ name: '🧹 家政清洁', query: '家政清洁' }, { name: '❄️ 除雪服务', query: '除雪服务' }, { name: '🌱 草坪护理', query: '草坪护理' }, { name: '🐾 宠物看护', query: '宠物看护' }, { name: '📚 家教辅导', query: '家教辅导' }]
                        : [{ name: '🧹 House Cleaning', query: 'House Cleaning' }, { name: '❄️ Snow Removal', query: 'Snow Removal' }, { name: '🌱 Lawn Care', query: 'Lawn Care' }, { name: '🐾 Pet Sitting', query: 'Pet Sitting' }, { name: '📚 Tutoring', query: 'Tutoring' }]
                    ).map((tag) => (
                        <Link
                            key={tag.query}
                            to={`/category/service?q=${encodeURIComponent(tag.query)}`}
                            className="text-xs font-semibold px-2.5 py-1 bg-white/90 border border-slate-200/80 rounded-full text-slate-700 hover:bg-primary hover:text-white hover:border-primary transition-all shadow-3xs"
                        >
                            {tag.name}
                        </Link>
                    ))}
                </div>

                {/* Featured (top-rated, not paid) listings carousel */}
                {featuredListings.length > 0 && (
                    <Carousel setApi={setApi} opts={{ loop: true }} className="w-full">
                        <CarouselContent className="-ml-2">
                            {featuredListings.map((item) => (
                                <CarouselItem key={item.id} className="pl-2 basis-2/5 sm:basis-1/4 md:basis-1/5">
                                    <Link
                                        to={`/service/${item.id}`}
                                        className="group block bg-white hover:shadow-md border border-white/60 rounded-xl overflow-hidden shadow-3xs transition-all"
                                    >
                                        <div className="aspect-[4/3] bg-muted overflow-hidden">
                                            {item.images?.[0] ? (
                                                <img
                                                    src={item.images[0]}
                                                    alt=""
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-primary/10 to-secondary/10" />
                                            )}
                                        </div>
                                        <div className="p-2">
                                            <p className="text-xs font-bold text-slate-800 truncate group-hover:text-primary transition-colors">
                                                {isZh ? item.titleZh : (item.titleEn || item.titleZh)}
                                            </p>
                                            <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-0.5">
                                                <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                                                <span className="font-semibold">{item.rating.toFixed(1)}</span>
                                                <span>({item.reviewCount})</span>
                                            </div>
                                        </div>
                                    </Link>
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                    </Carousel>
                )}

                {/* Brand + online count — kept short, no redundant tagline
                    (the 3 pillar cards below already say what JWD does) */}
                <div className="flex items-center gap-2">
                    <span className="text-base">📍</span>
                    <h1 className="text-sm font-black text-slate-900 tracking-tight">
                        {isZh ? '渥太华 JWD' : 'Ottawa JWD'}
                    </h1>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-600 bg-white/90 backdrop-blur-sm px-2.5 py-0.5 rounded-full border border-primary/10 shadow-3xs">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="font-bold text-slate-800">{onlineCount}</span>
                        <span className="text-slate-500 font-medium">{isZh ? '邻居在线' : 'online'}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
