import { motion } from "framer-motion";
import { Users, Zap, Star, Heart } from "lucide-react";
import { useState, useEffect } from "react";
import { repositoryFactory } from "@/services/repositories/factory";
import { useCommunity } from "@/context/CommunityContext";
import { browseNodeId } from "@/stores/configStore";

/**
 * Community Highlights Bar
 * 紧凑的社区动态横幅 - 增强社区温度感和活跃度展示
 * 设计灵感：当귤马켓的实时社区指标
 *
 * Data Source: Supabase (real-time stats)
 * Update Frequency: Every 5 minutes
 */
interface HighlightStat {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
  bgColor: string;
}

export function CommunityHighlights() {
  const { activeNodeId } = useCommunity();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<HighlightStat[]>([
    {
      icon: Users,
      label: "new neighbors this week",
      value: "...",
      color: "#10b981",
      bgColor: "#10b98120",
    },
    {
      icon: Zap,
      label: "tasks completed today",
      value: "...",
      color: "#f59e0b",
      bgColor: "#f59e0b20",
    },
    {
      icon: Star,
      label: "avg community rating",
      value: "...",
      color: "#eab308",
      bgColor: "#eab30820",
    },
    {
      icon: Heart,
      label: "neighbors helped each other",
      value: "...",
      color: "#ec4899",
      bgColor: "#ec489920",
    },
  ]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const statsRepo = repositoryFactory.getCommunityStatsRepository();
        const data = await statsRepo.getStats(browseNodeId(activeNodeId));

        setStats([
          {
            icon: Users,
            label: "new neighbors this week",
            value: data.newNeighborsThisWeek,
            color: "#10b981",
            bgColor: "#10b98120",
          },
          {
            icon: Zap,
            label: "tasks completed today",
            value: data.tasksCompletedToday,
            color: "#f59e0b",
            bgColor: "#f59e0b20",
          },
          {
            icon: Star,
            label: "avg community rating",
            value: data.avgCommunityRating,
            color: "#eab308",
            bgColor: "#eab30820",
          },
          {
            icon: Heart,
            label: "neighbors helped each other",
            value: data.neighborsHelped,
            color: "#ec4899",
            bgColor: "#ec489920",
          },
        ]);
      } catch (error) {
        console.error("Failed to fetch community stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();

    // Refresh every 5 minutes
    const interval = setInterval(fetchStats, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [activeNodeId]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.5 }}
      className="px-4 py-3 mb-4"
    >
      <div className="bg-gradient-to-r from-emerald-50 via-cyan-50 to-blue-50 rounded-2xl shadow-sm border border-border/30 overflow-hidden">
        <div className="px-4 py-3">
          {/* Desktop: 横向显示所有指标 */}
          <div className="hidden md:flex items-center justify-between gap-6">
            {stats.map((stat, index) => (
              <StatItem key={index} stat={stat} />
            ))}
          </div>

          {/* Mobile: 横向滚动 */}
          <div className="md:hidden flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory">
            {stats.map((stat, index) => (
              <div key={index} className="snap-start flex-shrink-0">
                <StatItem stat={stat} compact />
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

interface StatItemProps {
  stat: HighlightStat;
  compact?: boolean;
}

function StatItem({ stat, compact = false }: StatItemProps) {
  const Icon = stat.icon;

  return (
    <div className={`flex items-center gap-2 ${compact ? "min-w-[200px]" : ""}`}>
      {/* Icon */}
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: stat.bgColor }}
      >
        <Icon className="w-4 h-4" style={{ color: stat.color }} />
      </div>

      {/* Text */}
      <div className="flex items-baseline gap-1.5">
        <motion.span
          className="text-lg font-black text-foreground"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.5, type: "spring" }}
          style={{ color: stat.color }}
        >
          {stat.value}
        </motion.span>
        <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">
          {stat.label}
        </span>
      </div>
    </div>
  );
}
