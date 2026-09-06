import { Achievement } from '@/types/gamification';
import { motion } from 'framer-motion';
import { Lock, Check, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useConfigStore } from '@/stores/configStore';

interface AchievementCardProps {
  achievement: Achievement;
  onClick?: () => void;
}

const rarityColors = {
  common: 'from-gray-500 to-gray-600',
  rare: 'from-blue-500 to-blue-600',
  epic: 'from-purple-500 to-purple-600',
  legendary: 'from-amber-500 to-amber-600'
};

const getRarityLabels = (language: 'zh' | 'en') => ({
  common: language === 'zh' ? '普通' : 'Common',
  rare: language === 'zh' ? '稀有' : 'Rare',
  epic: language === 'zh' ? '史诗' : 'Epic',
  legendary: language === 'zh' ? '传说' : 'Legendary'
});

const rarityBorders = {
  common: 'border-gray-400',
  rare: 'border-blue-400',
  epic: 'border-purple-400',
  legendary: 'border-amber-400'
};

export const AchievementCard = ({ achievement, onClick }: AchievementCardProps) => {
  const { language } = useConfigStore();
  const rarityLabels = getRarityLabels(language);
  const t = {
    progress: language === 'zh' ? '进度' : 'Progress',
    unlockedSuffix: language === 'zh' ? '解锁' : 'unlocked',
    reward: language === 'zh' ? '奖励:' : 'Reward:',
    titleLabel: language === 'zh' ? '称号:' : 'Title:',
  };
  const isUnlocked = achievement.unlocked || false;
  const progress = achievement.progress || 0;
  const progressPercent = Math.min((progress / achievement.requirement.target) * 100, 100);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: isUnlocked ? 1.05 : 1.02 }}
      onClick={onClick}
      className={`
        relative p-4 rounded-xl border-2 transition-all cursor-pointer
        ${isUnlocked ? rarityBorders[achievement.rarity] : 'border-muted'}
        ${isUnlocked ? 'bg-white shadow-md' : 'bg-muted/30'}
      `}
    >
      {/* 稀有度徽章 */}
      <div className="absolute top-2 right-2">
        <Badge
          variant="outline"
          className={`text-xs font-bold bg-gradient-to-r ${rarityColors[achievement.rarity]} text-white border-0`}
        >
          {rarityLabels[achievement.rarity]}
        </Badge>
      </div>

      {/* 图标 */}
      <div className="flex items-start gap-3 mb-3">
        <div
          className={`
            relative w-16 h-16 rounded-xl flex items-center justify-center text-3xl
            ${isUnlocked ? 'bg-gradient-to-br ' + rarityColors[achievement.rarity] : 'bg-muted'}
            transition-all
          `}
        >
          {isUnlocked ? (
            <>
              <span className="relative z-10">{achievement.icon}</span>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center"
              >
                <Check className="w-3 h-3 text-white" />
              </motion.div>
            </>
          ) : (
            <Lock className="w-6 h-6 text-muted-foreground" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h4 className={`font-bold text-sm mb-1 ${!isUnlocked && 'text-muted-foreground'}`}>
            {achievement.name}
          </h4>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {achievement.description}
          </p>
        </div>
      </div>

      {/* 进度条（未解锁时显示） */}
      {!isUnlocked && achievement.requirement.type === 'count' && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{t.progress}</span>
            <span className="font-medium">
              {progress} / {achievement.requirement.target}
            </span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              className={`h-full bg-gradient-to-r ${rarityColors[achievement.rarity]}`}
            />
          </div>
        </div>
      )}

      {/* 解锁时间 */}
      {isUnlocked && achievement.unlockedAt && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
          <Star className="w-3 h-3" />
          <span>
            {new Date(achievement.unlockedAt).toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US', {
              month: 'short',
              day: 'numeric'
            })}
            {' '}{t.unlockedSuffix}
          </span>
        </div>
      )}

      {/* 奖励 */}
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
        <span className="text-xs text-muted-foreground">{t.reward}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-primary">+{achievement.rewards.exp} EXP</span>
          {achievement.rewards.title && (
            <Badge variant="secondary" className="text-xs">
              {t.titleLabel} {achievement.rewards.title}
            </Badge>
          )}
        </div>
      </div>
    </motion.div>
  );
};
