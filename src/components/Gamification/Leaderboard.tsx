import { useState, useEffect } from 'react';
import { LeaderboardEntry } from '@/types/gamification';
import { Trophy, TrendingUp, TrendingDown, Minus, Crown, Medal, Award } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { useConfigStore } from '@/stores/configStore';

interface LeaderboardProps {
  period?: 'weekly' | 'monthly' | 'alltime';
  onPeriodChange?: (period: 'weekly' | 'monthly' | 'alltime') => void;
  className?: string;
}

export const Leaderboard = ({
  period = 'weekly',
  onPeriodChange,
  className = ''
}: LeaderboardProps) => {
  const { language } = useConfigStore();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const t = {
    heading: language === 'zh' ? '社区排行榜' : 'Community Leaderboard',
    subheading: language === 'zh' ? '基于贡献度和活跃度' : 'Based on contribution and activity',
    weekly: language === 'zh' ? '本周' : 'Weekly',
    monthly: language === 'zh' ? '本月' : 'Monthly',
    alltime: language === 'zh' ? '总榜' : 'All-Time',
    achievementsCount: (n: number) => language === 'zh' ? `${n} 个成就` : `${n} achievements`,
    footerTip: language === 'zh' ? '排行榜每小时更新一次 • 继续努力提升排名！' : 'Leaderboard updates hourly • Keep going to climb the ranks!',
  };

  // 模拟数据加载
  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      // 模拟数据
      setLeaderboard([
        {
          rank: 1,
          userId: '1',
          userName: language === 'zh' ? '张三' : 'Alex Chen',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhang',
          score: 15680,
          level: 6,
          achievements: 28,
          badge: language === 'zh' ? '社区领袖' : 'Community Leader',
          trend: 'up'
        },
        {
          rank: 2,
          userId: '2',
          userName: language === 'zh' ? '李四' : 'Jordan Lee',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=li',
          score: 14520,
          level: 5,
          achievements: 24,
          badge: language === 'zh' ? '交易大师' : 'Trade Master',
          trend: 'stable'
        },
        {
          rank: 3,
          userId: '3',
          userName: language === 'zh' ? '王五' : 'Sam Wang',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wang',
          score: 13890,
          level: 5,
          achievements: 22,
          trend: 'down'
        },
        {
          rank: 4,
          userId: '4',
          userName: language === 'zh' ? '赵六' : 'Casey Zhao',
          score: 12340,
          level: 5,
          achievements: 20,
          trend: 'up'
        },
        {
          rank: 5,
          userId: '5',
          userName: language === 'zh' ? '孙七' : 'Riley Sun',
          score: 11200,
          level: 4,
          achievements: 18,
          trend: 'up'
        },
        {
          rank: 6,
          userId: '6',
          userName: language === 'zh' ? '周八' : 'Morgan Zhou',
          score: 10500,
          level: 4,
          achievements: 17,
          trend: 'stable'
        },
        {
          rank: 7,
          userId: '7',
          userName: language === 'zh' ? '吴九' : 'Jamie Wu',
          score: 9800,
          level: 4,
          achievements: 15,
          trend: 'down'
        },
        {
          rank: 8,
          userId: '8',
          userName: language === 'zh' ? '郑十' : 'Taylor Zheng',
          score: 9200,
          level: 4,
          achievements: 14,
          trend: 'up'
        },
        {
          rank: 9,
          userId: '9',
          userName: language === 'zh' ? '陈小明' : 'Xiaoming Chen',
          score: 8600,
          level: 3,
          achievements: 12,
          trend: 'stable'
        },
        {
          rank: 10,
          userId: '10',
          userName: language === 'zh' ? '林小红' : 'Xiaohong Lin',
          score: 8100,
          level: 3,
          achievements: 11,
          trend: 'up'
        }
      ]);
      setIsLoading(false);
    }, 800);
  }, [period, language]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-amber-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-orange-600" />;
      default:
        return <span className="font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  const getTrendIcon = (trend?: LeaderboardEntry['trend']) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      case 'stable':
        return <Minus className="w-4 h-4 text-muted-foreground" />;
      default:
        return null;
    }
  };

  const getRankBgColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-amber-50 to-amber-100 border-amber-300';
      case 2:
        return 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-300';
      case 3:
        return 'bg-gradient-to-r from-orange-50 to-orange-100 border-orange-300';
      default:
        return 'bg-white border-border';
    }
  };

  return (
    <div className={`bg-white rounded-2xl shadow-lg border ${className}`}>
      {/* 头部 */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg">{t.heading}</h3>
              <p className="text-xs text-muted-foreground">{t.subheading}</p>
            </div>
          </div>
        </div>

        {/* 周期选择 */}
        <div className="flex gap-2">
          {(['weekly', 'monthly', 'alltime'] as const).map((p) => (
            <button
              key={p}
              onClick={() => onPeriodChange?.(p)}
              className={`
                px-4 py-1.5 rounded-full text-sm font-semibold transition-all
                ${period === p
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }
              `}
            >
              {p === 'weekly' ? t.weekly : p === 'monthly' ? t.monthly : t.alltime}
            </button>
          ))}
        </div>
      </div>

      {/* 排行榜列表 */}
      <div className="p-4 space-y-2 max-h-[600px] overflow-y-auto">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
          ))
        ) : (
          leaderboard.map((entry, index) => (
            <motion.div
              key={entry.userId}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`
                flex items-center gap-3 p-3 rounded-lg border transition-all
                hover:shadow-md cursor-pointer
                ${getRankBgColor(entry.rank)}
              `}
            >
              {/* 排名 */}
              <div className="w-10 flex items-center justify-center">
                {getRankIcon(entry.rank)}
              </div>

              {/* 头像 */}
              <Avatar className="w-12 h-12 border-2 border-background">
                <AvatarImage src={entry.avatar} />
                <AvatarFallback>{entry.userName[0]}</AvatarFallback>
              </Avatar>

              {/* 用户信息 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm truncate">{entry.userName}</span>
                  {entry.badge && (
                    <Badge variant="secondary" className="text-xs">
                      {entry.badge}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>Lv.{entry.level}</span>
                  <span>•</span>
                  <span>{t.achievementsCount(entry.achievements)}</span>
                </div>
              </div>

              {/* 分数和趋势 */}
              <div className="text-right">
                <div className="font-bold text-primary text-sm">
                  {entry.score.toLocaleString()}
                </div>
                <div className="flex items-center justify-end gap-1 mt-1">
                  {getTrendIcon(entry.trend)}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* 底部提示 */}
      <div className="p-4 border-t border-border bg-muted/30 text-center">
        <p className="text-xs text-muted-foreground">
          {t.footerTip}
        </p>
      </div>
    </div>
  );
};
