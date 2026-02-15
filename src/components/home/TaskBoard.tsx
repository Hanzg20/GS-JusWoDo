import { motion } from "framer-motion";
import { Lock, MapPin, Clock, Coins, ChevronRight, AlertCircle, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { useConfigStore } from "@/stores/configStore";

/**
 * Task Board Component
 * 附近任务看板 - 展示买家发布的需求
 *
 * 权限逻辑：
 * - 所有用户可以看到任务列表
 * - 仅已认证的 Provider 可以提交报价
 * - 未认证用户点击接单时显示引导弹窗
 */

interface Task {
  id: string;
  title: string;
  reward: {
    beans: number;
    cash: number; // CAD cents
  };
  poster: {
    name: string;
    verified: boolean;
  };
  distance: string;
  deadline: string;
  urgent?: boolean;
}

// Mock data - TODO: 从 Supabase 加载
const mockTasks: Task[] = [
  {
    id: "1",
    title: "需要有人帮忙铲雪 - 车道 + 人行道",
    reward: { beans: 50, cash: 2500 }, // $25.00
    poster: { name: "Mrs. Chen", verified: true },
    distance: "0.8km",
    deadline: "Today 6pm",
    urgent: true,
  },
  {
    id: "2",
    title: "搬家帮手 - 搬运家具上二楼",
    reward: { beans: 100, cash: 6000 }, // $60.00
    poster: { name: "David L.", verified: true },
    distance: "1.2km",
    deadline: "Tomorrow 2pm",
  },
  {
    id: "3",
    title: "寻找会修理割草机的邻居",
    reward: { beans: 30, cash: 3500 }, // $35.00
    poster: { name: "Emma R.", verified: false },
    distance: "2.1km",
    deadline: "This weekend",
  },
  {
    id: "4",
    title: "接送孩子 - 放学到家 (Lees Station 到 Riverside)",
    reward: { beans: 20, cash: 1500 }, // $15.00
    poster: { name: "Tom W.", verified: true },
    distance: "0.5km",
    deadline: "Every weekday 3:30pm",
  },
];

export function TaskBoard() {
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();
  const { language } = useConfigStore();

  // TODO: 从 user_profiles 读取 kyc_status 和 role
  const isVerifiedProvider = false; // Placeholder

  const handleTaskClick = (taskId: string) => {
    if (isVerifiedProvider) {
      navigate(`/task/${taskId}`);
    } else {
      // TODO: 显示认证引导弹窗
      alert(language === 'zh'
        ? "请先完成能人认证再接单。点击确定了解详情。"
        : "Become a verified provider to accept tasks. Click OK to learn more.");
      navigate("/become-provider");
    }
  };

  const t = {
    title: language === 'zh' ? '附近任务' : 'Nearby Tasks',
    subtitle: language === 'zh' ? '帮助邻居，赚取奖励' : 'Help a neighbor and earn rewards',
    viewAll: language === 'zh' ? '查看全部' : 'View All',
  };

  return (
    <section className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black flex items-center gap-2 sm:gap-3 bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
            💰 {t.title}
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            {t.subtitle}
          </p>
        </div>
        <button
          onClick={() => navigate("/tasks")}
          className="group flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-semibold text-primary hover:text-primary/80 transition-colors flex-shrink-0"
        >
          <span className="hidden sm:inline">{t.viewAll}</span>
          <span className="sm:hidden">{language === 'zh' ? '全部' : 'All'}</span>
          <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* Task Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        {mockTasks.map((task, index) => (
          <TaskCard
            key={task.id}
            task={task}
            isVerifiedProvider={isVerifiedProvider}
            onClick={() => handleTaskClick(task.id)}
            delay={index * 0.1}
          />
        ))}
      </div>
    </section>
  );
}

interface TaskCardProps {
  task: Task;
  isVerifiedProvider: boolean;
  onClick: () => void;
  delay: number;
}

function TaskCard({ task, isVerifiedProvider, onClick, delay }: TaskCardProps) {
  const { language } = useConfigStore();

  const t = {
    urgent: language === 'zh' ? '紧急' : 'Urgent',
    reward: language === 'zh' ? '奖励' : 'REWARD',
    beans: language === 'zh' ? '豆币' : 'Beans',
    verified: language === 'zh' ? '认证邻居' : 'Verified Neighbor',
    newUser: language === 'zh' ? '新用户' : 'New to JUSTWEDO',
    submitQuote: language === 'zh' ? '提交报价' : 'Submit Quote',
    verifyToAccept: language === 'zh' ? '认证后接单' : 'Verify to Accept',
    providersOnly: language === 'zh' ? '仅限认证服务商' : 'Verified Providers Only',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, boxShadow: "0 20px 40px -12px rgba(0, 0, 0, 0.1)" }}
      transition={{ delay, duration: 0.4, ease: "easeOut" }}
      onClick={onClick}
      className="relative bg-card rounded-2xl overflow-hidden border border-border/40 hover:border-primary/20 transition-all duration-300 group cursor-pointer"
    >
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted/20 opacity-50" />

      {/* Hover glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Content */}
      <div className="relative z-10 p-5 sm:p-6">
        {/* Top Row: Title + Badge */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <h3 className="font-bold text-base sm:text-lg text-foreground leading-snug line-clamp-2 flex-1 group-hover:text-primary transition-colors duration-300">
            {task.title}
          </h3>

          {/* Verification Badge - Always visible */}
          {!isVerifiedProvider && (
            <div className="flex-shrink-0 bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-semibold flex items-center gap-1 whitespace-nowrap">
              <Zap className="w-3 h-3" />
              <span>{t.providersOnly}</span>
            </div>
          )}
        </div>

        {/* Meta Info Row */}
        <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-muted-foreground/70" />
            <span className="font-medium">{task.distance}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-muted-foreground/70" />
            <span className="font-medium">{task.deadline}</span>
          </div>
        </div>

        {/* Poster Info */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center text-primary-foreground text-sm font-bold shadow-md">
            {task.poster.name.charAt(0)}
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">
              {task.poster.name}
            </p>
            {task.poster.verified ? (
              <span className="text-xs text-primary font-medium flex items-center gap-1">
                <span className="text-primary">✓</span> {t.verified}
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">{t.newUser}</span>
            )}
          </div>
        </div>

        {/* Reward + CTA Row */}
        <div className="flex items-end justify-between gap-4 pt-4 border-t border-border/50">
          {/* Reward Section */}
          <div>
            <p className="text-[10px] sm:text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-2">
              {t.reward}
            </p>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-500/10 px-2.5 py-1.5 rounded-lg border border-amber-200/50 dark:border-amber-500/20">
                <Coins className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-bold text-amber-600 dark:text-amber-400">{task.reward.beans}</span>
                <span className="text-xs text-amber-600/70 dark:text-amber-400/70">{t.beans}</span>
              </div>
              <span className="text-muted-foreground font-bold text-lg">+</span>
              <span className="text-xl sm:text-2xl font-black text-primary">
                ${(task.reward.cash / 100).toFixed(0)}
              </span>
            </div>
          </div>

          {/* CTA Button */}
          {isVerifiedProvider ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-shrink-0 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-1.5 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300"
            >
              {t.submitQuote}
              <ChevronRight className="w-4 h-4" />
            </motion.button>
          ) : (
            <button className="flex-shrink-0 bg-muted/80 text-muted-foreground px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-1.5 border border-border/50 hover:bg-muted transition-colors duration-200">
              <Lock className="w-3.5 h-3.5" />
              {t.verifyToAccept}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
