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

    const [onlineCount, setOnlineCount] = useState(328);

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

    return (
        <div className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-primary/5 to-secondary/10 p-4 sm:p-5 rounded-2xl border border-primary/15 shadow-2xs">
            {/* Background Primary Decor */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3">
                {/* Left Title & Tagline */}
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

                {/* Right Quick Ottawa Neighborhood Pills */}
                <div className="flex flex-wrap items-center gap-1.5 shrink-0">
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
                            className="text-xs font-semibold px-2.5 py-1 bg-white/90 border border-slate-200/80 rounded-full text-slate-700 hover:bg-primary hover:text-white hover:border-primary transition-all shadow-3xs"
                        >
                            {tag.name}
                        </a>
                    ))}
                </div>
            </div>
        </div>
    );
}
