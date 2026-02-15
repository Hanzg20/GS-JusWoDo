import { HeartHandshake, Crown, Sparkles, Utensils, PlaneTakeoff, ArrowRight, Users, Star, Flame, Zap, Hand } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useConfigStore } from "@/stores/configStore";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

/**
 * 5大业务域入口卡片 - 前卫流行风格平铺设计
 * 灵感: 小红书/韩国카카오的现代卡片 + 渐变微光效果
 * i18n: 支持中英文切换
 */
interface BusinessDomain {
  id: string;
  icon: React.ReactNode;
  labelZh: string;
  labelEn: string;
  descriptionZh: string;
  descriptionEn: string;
  stats: { count: number; labelZh: string; labelEn: string };
  hotTagsZh: string[];
  hotTagsEn: string[];
  gradient: string;
  glowColor: string;
  iconBg: string;
  link: string;
  trending?: boolean;
}

const businessDomains: BusinessDomain[] = [
  {
    id: "1010000",
    icon: <HeartHandshake className="w-6 h-6" />,
    labelZh: "居家生活",
    labelEn: "Home & Life",
    descriptionZh: "保洁·维修·搬家·跑腿",
    descriptionEn: "Cleaning · Repair · Moving · Errands",
    stats: { count: 128, labelZh: "邻居在服务", labelEn: "neighbors serving" },
    hotTagsZh: ["深度保洁", "家电维修"],
    hotTagsEn: ["Deep Clean", "Appliance Repair"],
    gradient: "from-emerald-400 via-teal-400 to-cyan-400",
    glowColor: "rgba(16, 185, 129, 0.4)",
    iconBg: "bg-gradient-to-br from-emerald-500 to-teal-500",
    link: "/category/1010000",
    trending: true,
  },
  {
    id: "1020000",
    icon: <Crown className="w-6 h-6" />,
    labelZh: "专业美业",
    labelEn: "Pro & Beauty",
    descriptionZh: "持证电工·水工·美甲美睫",
    descriptionEn: "Licensed Electrician · Plumber · Nails",
    stats: { count: 45, labelZh: "认证专家", labelEn: "verified experts" },
    hotTagsZh: ["持证电工", "美甲到家"],
    hotTagsEn: ["Licensed Elec.", "Nails at Home"],
    gradient: "from-rose-400 via-pink-400 to-fuchsia-400",
    glowColor: "rgba(244, 63, 94, 0.4)",
    iconBg: "bg-gradient-to-br from-rose-500 to-pink-500",
    link: "/category/1020000",
  },
  {
    id: "1030000",
    icon: <Sparkles className="w-6 h-6" />,
    labelZh: "亲子教育",
    labelEn: "Kids & Wellness",
    descriptionZh: "家教辅导·宠物托管·健身私教",
    descriptionEn: "Tutoring · Pet Sitting · Personal Training",
    stats: { count: 86, labelZh: "家庭在用", labelEn: "families using" },
    hotTagsZh: ["钢琴陪练", "宠物寄养"],
    hotTagsEn: ["Piano Lessons", "Pet Boarding"],
    gradient: "from-violet-400 via-purple-400 to-indigo-400",
    glowColor: "rgba(139, 92, 246, 0.4)",
    iconBg: "bg-gradient-to-br from-violet-500 to-purple-500",
    link: "/category/1030000",
  },
  {
    id: "1040000",
    icon: <Utensils className="w-6 h-6" />,
    labelZh: "美食市集",
    labelEn: "Food & Market",
    descriptionZh: "私房菜·二手好物·工具租借",
    descriptionEn: "Home Cooking · Second-hand · Tool Rental",
    stats: { count: 234, labelZh: "件好物上新", labelEn: "items listed" },
    hotTagsZh: ["妈妈私房菜", "二手家具"],
    hotTagsEn: ["Home Cooking", "Used Furniture"],
    gradient: "from-amber-400 via-orange-400 to-red-400",
    glowColor: "rgba(251, 146, 60, 0.4)",
    iconBg: "bg-gradient-to-br from-amber-500 to-orange-500",
    link: "/category/1040000",
    trending: true,
  },
  {
    id: "1050000",
    icon: <PlaneTakeoff className="w-6 h-6" />,
    labelZh: "出行时令",
    labelEn: "Travel & Outdoor",
    descriptionZh: "铲雪·割草·机场接送·代驾",
    descriptionEn: "Snow Removal · Lawn · Airport · Driving",
    stats: { count: 52, labelZh: "邻居可帮忙", labelEn: "neighbors ready" },
    hotTagsZh: ["铲雪服务", "机场接机"],
    hotTagsEn: ["Snow Removal", "Airport Pickup"],
    gradient: "from-sky-400 via-blue-400 to-indigo-400",
    glowColor: "rgba(56, 189, 248, 0.4)",
    iconBg: "bg-gradient-to-br from-sky-500 to-blue-500",
    link: "/category/1050000",
  },
];

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.92 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 400, damping: 28 }
  }
};

const HeroSection = () => {
  const { language } = useConfigStore();
  const isZh = language === 'zh';

  // Real stats state with placeholders to avoid layout shift
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
    neighborsOnline: isZh ? '邻居在线' : 'neighbors online',
    todayTransactions: isZh ? '笔交易' : 'transactions',
    today: isZh ? '今日' : 'Today',
    avgRating: isZh ? '平均评分' : 'Avg Rating',
    hot: isZh ? '热门' : 'Hot',
  };

  return (
    <section className="py-5 px-4">
      {/* Greeting + Community Activity */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Hand className="w-6 h-6 text-amber-500" />
            <h2 className="text-xl font-bold text-foreground">
              {t.greeting}
            </h2>
          </div>
          {/* Community Online Indicator */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
            <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
            <span className="text-xs font-medium text-primary">
              <strong>{stats.usersCount}</strong> {t.neighborsOnline}
            </span>
          </div>
        </div>
        <p className="text-muted-foreground text-sm ml-8">
          {t.subtitle}
        </p>
      </motion.div>

      {/* 5 Business Domain Cards */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 gap-3"
      >
        {businessDomains.map((domain) => (
          <BusinessCard key={domain.id} domain={domain} language={language} hotLabel={t.hot} />
        ))}
      </motion.div>

      {/* Community Stats Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="mt-6 flex items-center justify-center gap-8 py-3 px-4 rounded-2xl bg-muted/50 border border-border/50"
      >
        <div className="flex items-center gap-2 text-sm">
          <Users className="w-4 h-4 text-primary" />
          <span className="text-muted-foreground">
            {t.today} <strong className="text-foreground">{stats.ordersCount.toLocaleString()}</strong> {t.todayTransactions}
          </span>
        </div>
        <div className="w-px h-4 bg-border" />
        <div className="flex items-center gap-2 text-sm">
          <Star className="w-4 h-4 text-amber-500" />
          <span className="text-muted-foreground">
            {t.avgRating} <strong className="text-foreground">{stats.avgRating}</strong>
          </span>
        </div>
      </motion.div>
    </section>
  );
};

/**
 * Business Domain Entry Card
 * Features: Gradient glow + i18n content + hot tags
 */
interface BusinessCardProps {
  domain: BusinessDomain;
  language: string;
  hotLabel: string;
}

const BusinessCard = ({ domain, language, hotLabel }: BusinessCardProps) => {
  const isZh = language === 'zh';
  const label = isZh ? domain.labelZh : domain.labelEn;
  const altLabel = isZh ? domain.labelEn : domain.labelZh;
  const description = isZh ? domain.descriptionZh : domain.descriptionEn;
  const hotTags = isZh ? domain.hotTagsZh : domain.hotTagsEn;
  const statsLabel = isZh ? domain.stats.labelZh : domain.stats.labelEn;

  return (
    <motion.div variants={cardVariants}>
      <Link
        to={domain.link}
        className="relative block overflow-hidden rounded-2xl border border-border/40 bg-card group cursor-pointer"
        style={{
          boxShadow: `0 4px 24px -4px ${domain.glowColor}`,
        }}
      >
        {/* Gradient glow background */}
        <div
          className={`absolute inset-0 bg-gradient-to-r ${domain.gradient} opacity-[0.08] group-hover:opacity-[0.15] transition-opacity duration-500`}
        />

        {/* Decorative glow orb */}
        <div
          className="absolute -right-8 -top-8 w-32 h-32 rounded-full blur-3xl opacity-30 group-hover:opacity-50 transition-opacity duration-500"
          style={{ background: `radial-gradient(circle, ${domain.glowColor} 0%, transparent 70%)` }}
        />

        <div className="relative z-10 p-4 flex items-center gap-4">
          {/* Icon */}
          <div className={`
            ${domain.iconBg} text-white w-14 h-14 rounded-2xl flex items-center justify-center
            shadow-lg group-hover:scale-105 transition-transform duration-300
          `}>
            {domain.icon}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Title row */}
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-foreground text-base">
                {label}
              </h3>
              <span className="text-xs text-muted-foreground">{altLabel}</span>
              {domain.trending && (
                <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-accent/10 text-accent text-[10px] font-medium">
                  <Flame className="w-3 h-3" />
                  {hotLabel}
                </span>
              )}
            </div>

            {/* Description */}
            <p className="text-sm text-muted-foreground mb-2 line-clamp-1">
              {description}
            </p>

            {/* Hot tags + stats */}
            <div className="flex items-center gap-2 flex-wrap">
              {hotTags.map((tag, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded-full bg-muted text-xs text-muted-foreground border border-border/50"
                >
                  {tag}
                </span>
              ))}
              <span className="flex items-center gap-1 text-xs text-primary font-medium ml-auto">
                <Zap className="w-3.5 h-3.5" />
                {domain.stats.count} {statsLabel}
              </span>
            </div>
          </div>

          {/* Arrow */}
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary transition-colors duration-300">
            <ArrowRight className="w-5 h-5 text-primary group-hover:text-primary-foreground transition-colors" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default HeroSection;
