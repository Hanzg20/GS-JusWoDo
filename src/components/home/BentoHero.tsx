import { SmartSearchBar } from "@/components/SmartSearchBar";
import { useConfigStore } from "@/stores/configStore";
import { supabase } from "@/lib/supabase";
import { useEffect, useState, useRef } from "react";
import { Star } from "lucide-react";
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
        <div className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-primary/5 to-secondary/10 p-4 sm:p-5 rounded-2xl border border-primary/15 shadow-2xs">
            {/* Background Primary Decor */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

            <div className="relative z-10 space-y-3">
                {/* Search */}
                <SmartSearchBar />

                {/* Featured (top-rated, not paid) listings carousel */}
                {featuredListings.length > 0 && (
                    <Carousel setApi={setApi} opts={{ loop: true }} className="w-full">
                        <CarouselContent className="-ml-2">
                            {featuredListings.map((item) => (
                                <CarouselItem key={item.id} className="pl-2 basis-1/2 sm:basis-1/3 md:basis-1/4">
                                    <Link
                                        to={`/service/${item.id}`}
                                        className="group flex items-center gap-2 bg-white/80 hover:bg-white border border-white/60 rounded-xl p-1.5 pr-2.5 shadow-3xs transition-colors"
                                    >
                                        <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-muted">
                                            {item.images?.[0] && (
                                                <img src={item.images[0]} alt="" className="w-full h-full object-cover" />
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold text-slate-800 truncate group-hover:text-primary transition-colors">
                                                {isZh ? item.titleZh : (item.titleEn || item.titleZh)}
                                            </p>
                                            <div className="flex items-center gap-1 text-[10px] text-slate-500">
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

                {/* Greeting & Pills */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="text-xl">📍</span>
                            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                                {isZh ? '渥太华JWD - 社区生活服务平台' : 'Ottawa JWD Community Services'}
                            </h1>
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-600 bg-white/90 backdrop-blur-sm px-2.5 py-0.5 rounded-full border border-primary/10 shadow-3xs ml-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="font-bold text-slate-800">{onlineCount}</span>
                                <span className="hidden sm:inline text-slate-500 font-medium">{isZh ? '邻居在线' : 'online'}</span>
                            </div>
                        </div>
                        <p className="text-slate-600 text-xs font-medium">
                            {isZh ? '商户服务 · 邻里问答 · 二手闲置 · 靠谱生活帮助 (Kanata & Ottawa)' : 'Local Pros · Community Q&A · Marketplace · Trusted Help'}
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                        {[
                            { name: '📍 Kanata Lakes', query: 'Kanata' },
                            { name: '📍 Barrhaven', query: 'Barrhaven' },
                            { name: '📍 Nepean', query: 'Nepean' },
                            { name: '🧹 清洁维修', query: '清洁' },
                            { name: '❄️ 铲雪除草', query: '铲雪' },
                        ].map((tag) => (
                            <Link
                                key={tag.query}
                                to={`/category/service?q=${encodeURIComponent(tag.query)}`}
                                className="text-xs font-semibold px-2.5 py-1 bg-white/90 border border-slate-200/80 rounded-full text-slate-700 hover:bg-primary hover:text-white hover:border-primary transition-all shadow-3xs"
                            >
                                {tag.name}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
