import { BentoItem } from "./BentoItem";
import { SmartSearchBar } from "@/components/SmartSearchBar";
import { LocationSelector } from "@/components/home/LocationSelector";
import { Sparkles, Hand, Users, Star } from "lucide-react";
import { useConfigStore } from "@/stores/configStore";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

export function BentoHero() {
    const { language } = useConfigStore();
    const isZh = language === 'zh';

    // Stats state
    const [stats, setStats] = useState({
        usersCount: 328,
        ordersCount: 1256,
        avgRating: 4.9
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const { data, error } = await supabase.rpc('get_platform_stats');
                if (!error && data) {
                    setStats({
                        usersCount: data.usersCount || 328,
                        ordersCount: data.ordersCount || 1256,
                        avgRating: data.avgRating || 4.9
                    });
                }
            } catch (err) {
                console.error('Failed to fetch platform stats:', err);
            }
        };
        fetchStats();
    }, []);

    const t = {
        greeting: isZh ? 'Hi, 邻居!' : 'Hi, Neighbor!',
        subtitle: isZh ? '今天社区能帮你什么忙？' : 'How can the community help today?',
        neighborsOnline: isZh ? '邻居在线' : 'neighbors online',
    };

    return (
        <BentoItem colSpan={2} className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-white to-secondary/10 p-5 flex flex-col justify-between min-h-[190px] border border-primary/10 shadow-2xs">
            {/* Background Primary Decor */}
            <div className="absolute top-0 right-0 w-56 h-56 bg-gradient-to-br from-primary/10 via-purple-300/10 to-transparent rounded-full blur-3xl -translate-y-1/3 translate-x-1/3 pointer-events-none" />

            {/* Top Row: Location & Live Status */}
            <div className="flex items-center justify-between relative z-10">
                <LocationSelector />
                <div className="flex items-center gap-2 text-[10px] text-slate-600 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full border border-primary/10 shadow-2xs">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="font-black text-slate-800">{stats.usersCount}</span>
                    <span className="hidden sm:inline font-semibold text-slate-500">{isZh ? '邻居在线' : 'neighbors online'}</span>
                </div>
            </div>

            {/* Main Content: Headline & Subtitle */}
            <div className="flex-1 flex flex-col justify-center relative z-10 py-3">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-xl sm:text-2xl">📍</span>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight sm:text-3xl">
                            {isZh ? '渥太华JWD-社区生活服务平台' : 'Ottawa JWD Community Services'}
                        </h1>
                    </div>
                    <p className="text-slate-600 text-xs sm:text-sm font-semibold opacity-90 leading-tight mb-3">
                        {isZh ? '商户服务 · 邻里互助 · 二手闲置 · 靠谱生活帮助' : 'Local Pros · Community Q&A · Marketplace · Trusted Help'}
                    </p>

                    {/* Quick Ottawa Neighborhood Pills */}
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {[
                            { name: '📍 Kanata Lakes', query: 'Kanata' },
                            { name: '📍 Barrhaven', query: 'Barrhaven' },
                            { name: '📍 Nepean', query: 'Nepean' },
                            { name: '🧹 清洁维修', query: '清洁' },
                            { name: '❄️ 铲雪除草', query: '铲雪' },
                        ].map((tag) => (
                            <a
                                key={tag.query}
                                href={`/category/service?q=${encodeURIComponent(tag.query)}`}
                                className="text-xs font-semibold px-2.5 py-1 bg-white border border-slate-200/80 rounded-full text-slate-700 hover:bg-primary hover:text-white hover:border-primary transition-all shadow-3xs"
                            >
                                {tag.name}
                            </a>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Bottom Stats */}
            <div className="flex items-center gap-8 pt-3 border-t border-slate-200/40 relative z-10">
                <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    <div className="flex flex-col">
                        <span className="text-[9px] text-slate-400 uppercase tracking-widest font-black leading-none">Core Areas</span>
                        <span className="text-xs font-bold text-slate-800 mt-0.5">Kanata & Ottawa</span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-500" />
                    <div className="flex flex-col">
                        <span className="text-[9px] text-slate-400 uppercase tracking-widest font-black leading-none">Satisfaction</span>
                        <span className="text-xs font-bold text-slate-800 mt-0.5">{stats.avgRating} / 5.0</span>
                    </div>
                </div>
            </div>
        </BentoItem>
    );
}
