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
        <BentoItem colSpan={2} className="relative overflow-hidden bg-gradient-to-br from-blue-50/50 via-white to-purple-50/50 p-5 flex flex-col justify-between min-h-[180px]">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-primary/5 to-accent/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

            {/* Top Row: Location & Live Status */}
            <div className="flex items-center justify-between relative z-10">
                <LocationSelector />
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground bg-white/50 backdrop-blur-sm px-2.5 py-1 rounded-full border border-black/5 shadow-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="font-black text-emerald-600">{stats.usersCount}</span>
                    <span className="hidden sm:inline font-bold uppercase tracking-tighter opacity-70">{t.neighborsOnline}</span>
                </div>
            </div>

            {/* Main Content: Greeting (Compressed) */}
            <div className="flex-1 flex flex-col justify-center relative z-10 py-2">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <div className="flex items-center gap-2 mb-1">
                        <div className="p-1.5 bg-amber-100 rounded-xl">
                            <Hand className="w-5 h-5 text-amber-500 animate-wave" />
                        </div>
                        <h1 className="text-2xl font-black text-foreground tracking-tight sm:text-3xl">
                            {t.greeting}
                        </h1>
                    </div>
                    <p className="text-muted-foreground text-sm font-bold opacity-80 leading-tight">
                        {t.subtitle}
                    </p>
                </motion.div>
            </div>

            {/* Bottom Stats (Compact) */}
            <div className="flex items-center gap-8 pt-3 border-t border-black/5 relative z-10">
                <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary/70" />
                    <div className="flex flex-col">
                        <span className="text-[9px] text-muted-foreground uppercase tracking-widest font-black opacity-60 leading-none">Transactions</span>
                        <span className="text-sm font-black text-slate-800 mt-0.5">{stats.ordersCount.toLocaleString()}</span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-500" />
                    <div className="flex flex-col">
                        <span className="text-[9px] text-muted-foreground uppercase tracking-widest font-black opacity-60 leading-none">Satisfaction</span>
                        <span className="text-sm font-black text-slate-800 mt-0.5">{stats.avgRating} / 5.0</span>
                    </div>
                </div>
            </div>
        </BentoItem>
    );
}
