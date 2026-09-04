import { useNavigate } from "react-router-dom";
import { useConfigStore } from "@/stores/configStore";
import {
  Wrench,
  MessageSquareQuote,
  Gift,
  ChevronRight
} from "lucide-react";
import { motion } from "framer-motion";

/**
 * Daangn-style 3 Core Category Grid Component
 * JWD's 3 pillars: 商户服务 / 邻里互助 / 二手闲置 — no 4th catch-all category
 */
export function CategoryIconGrid({ counts = {} }: { counts?: Record<string, number> }) {
  const navigate = useNavigate();
  const { language } = useConfigStore();
  const isZh = language === 'zh';

  const categories = [
    {
      id: 'service',
      path: '/category/service',
      name: isZh ? '商户与本地服务' : 'Local Pros & Services',
      desc: isZh ? '保洁 / 维修 / 铲雪 / 接送' : 'Cleaning, repairs, snow, rides',
      icon: Wrench,
      bgColor: 'bg-orange-50 text-orange-600 border-orange-100',
      badgeColor: 'bg-orange-500',
    },
    {
      id: 'community',
      path: '/community',
      name: isZh ? '邻里互助' : 'Neighborhood Help',
      desc: isZh ? '求助 / 跑腿短工 / 推荐 / 资讯' : 'Ask, errands, recommend',
      icon: MessageSquareQuote,
      bgColor: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      badgeColor: 'bg-emerald-500',
    },
    {
      id: 'goods',
      path: '/category/goods',
      name: isZh ? '二手闲置与赠送' : 'Market & Free Share',
      desc: isZh ? '闲置买卖 / 免费送 / 物品转让' : 'Used items, free giveaways',
      icon: Gift,
      bgColor: 'bg-purple-50 text-purple-600 border-purple-100',
      badgeColor: 'bg-purple-500',
    },
  ];

  return (
    <div className="py-2 px-1">
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {categories.map((cat, idx) => {
          const Icon = cat.icon;
          const count = counts[cat.id] || 0;

          return (
            <motion.button
              key={cat.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              whileHover={{ y: -3, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(cat.path)}
              className="group relative flex flex-col justify-between p-4 bg-white border border-slate-200/80 rounded-2xl shadow-2xs hover:shadow-md transition-all text-left"
            >
              <div className="flex items-start justify-between mb-2">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center border shadow-3xs transition-transform group-hover:scale-105 ${cat.bgColor}`}>
                  <Icon className="w-5 h-5" strokeWidth={2.2} />
                </div>
                <div className="flex items-center gap-1">
                  {count > 0 && (
                    <span className={`text-[10px] font-black text-white px-2 py-0.5 rounded-full ${cat.badgeColor}`}>
                      {count}
                    </span>
                  )}
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>

              <div>
                <h3 className="text-sm font-black tracking-tight text-slate-900 group-hover:text-primary transition-colors">
                  {cat.name}
                </h3>
                <p className="text-[11px] font-medium text-slate-500 mt-0.5 line-clamp-1">
                  {cat.desc}
                </p>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
