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
        subtitle: isZh ? '今天社区能帮你什么忙？' : 'How can the community help you today?',
        aiSearch: isZh ? 'AI 搜索' : 'AI Search',
        neighborsOnline: isZh ? '邻居在线' : 'neighbors online',
        liveUpdates: isZh ? '实时更新' : 'Live Updates',
    };

    return (
        <BentoItem colSpan={2} rowSpan={2} className="relative overflow-hidden bg-gradient-to-br from-blue-50/50 via-white to-purple-50/50 p-6 flex flex-col justify-between min-h-[320px]">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/5 to-accent/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

            {/* Top Row: Location & Live Status */}
            <div className="flex items-center justify-between relative z-10">
                <LocationSelector />
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-white/50 backdrop-blur-sm px-3 py-1 rounded-full border border-black/5 shadow-sm">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="font-medium text-emerald-600">{stats.usersCount}</span>
                    <span className="hidden sm:inline">{t.neighborsOnline}</span>
                </div>
            </div>

            {/* Main Content: Greeting & Search */}
            <div className="flex-1 flex flex-col justify-center space-y-6 relative z-10 my-4">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <div className="flex items-center gap-2 mb-2">
                        <Hand className="w-6 h-6 text-amber-500 animate-wave" />
                        <h1 className="text-3xl font-black text-foreground tracking-tight">
                            {t.greeting}
                        </h1>
                    </div>
                    <p className="text-muted-foreground text-lg ml-8 font-medium">
                        {t.subtitle}
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="relative"
                >
                    <SmartSearchBar />
                    <div className="absolute -top-3 right-0">
                        <Badge variant="secondary" className="px-2 py-0.5 bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20 backdrop-blur-md">
                            <Sparkles className="w-3 h-3 mr-1 text-primary" />
                            {t.aiSearch}
                        </Badge>
                    </div>
                </motion.div>
            </div>

            {/* Bottom Stats */}
            <div className="flex items-center gap-6 pt-4 border-t border-black/5 relative z-10">
                <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary/70" />
                    <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Transactions</span>
                        <span className="text-sm font-black">{stats.ordersCount.toLocaleString()}</span>
                    </div>
                </div>
                <div className="w-px h-8 bg-black/5" />
                <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-500/80" />
                    <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Satisfaction</span>
                        <span className="text-sm font-black">{stats.avgRating} / 5.0</span>
                    </div>
                </div>
            </div>
        </BentoItem>
    );
}
