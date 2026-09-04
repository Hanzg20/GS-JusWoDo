import { useNavigate } from "react-router-dom";
import { useConfigStore } from "@/stores/configStore";
import { ChevronRight } from "lucide-react";
import { getIcon } from "@/lib/iconMapper";
import { motion } from "framer-motion";

// Fallback used only if ref_codes hasn't been migrated yet (no PILLAR rows) —
// keeps the homepage from breaking before the DB migration lands.
const FALLBACK_PILLARS = [
  { codeId: 'PILLAR_SERVICE', path: '/category/service', zhName: '商户服务', enName: 'Local Services', extraData: { icon: 'Wrench', bgColor: 'bg-orange-50 text-orange-600 border-orange-100', badgeColor: 'bg-orange-500', desc_zh: '保洁 / 维修 / 铲雪 / 接送', desc_en: 'Cleaning, repairs, snow, rides' } },
  { codeId: 'PILLAR_HELP', path: '/community', zhName: '邻里互助', enName: 'Neighborhood Help', extraData: { icon: 'MessageSquareQuote', bgColor: 'bg-emerald-50 text-emerald-600 border-emerald-100', badgeColor: 'bg-emerald-500', desc_zh: '求助 / 跑腿短工 / 推荐 / 资讯', desc_en: 'Ask, errands, recommend' } },
  { codeId: 'PILLAR_GOODS', path: '/category/goods', zhName: '二手闲置', enName: 'Secondhand & Free', extraData: { icon: 'Gift', bgColor: 'bg-purple-50 text-purple-600 border-purple-100', badgeColor: 'bg-purple-500', desc_zh: '闲置买卖 / 免费送 / 物品转让', desc_en: 'Used items, free giveaways' } },
];

/**
 * Daangn-style 3 Core Category Grid Component
 * Driven by ref_codes (type='PILLAR') so pillars are config, not hardcoded —
 * see supabase/migrations/20260903_add_category_pillars.sql
 */
export function CategoryIconGrid({ counts = {} }: { counts?: Record<string, number> }) {
  const navigate = useNavigate();
  const { language, refCodes } = useConfigStore();
  const isZh = language === 'zh';

  const dbPillars = refCodes.filter(r => r.type === 'PILLAR');
  const pillars = dbPillars.length > 0
    ? [...dbPillars].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
    : FALLBACK_PILLARS;

  return (
    <div className="py-2 px-1">
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {pillars.map((pillar, idx) => {
          const extra = pillar.extraData || {};
          const Icon = getIcon(extra.icon);
          const path = extra.path || '/';
          const name = isZh ? pillar.zhName : (pillar.enName || pillar.zhName);
          const desc = isZh ? extra.desc_zh : extra.desc_en;
          const count = counts[pillar.codeId] || 0;

          return (
            <motion.button
              key={pillar.codeId}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              whileHover={{ y: -3, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(path)}
              className="group relative flex flex-col justify-between p-4 bg-white border border-slate-200/80 rounded-2xl shadow-2xs hover:shadow-md transition-all text-left"
            >
              <div className="flex items-start justify-between mb-2">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center border shadow-3xs transition-transform group-hover:scale-105 ${extra.bgColor || 'bg-slate-50 text-slate-600 border-slate-100'}`}>
                  <Icon className="w-5 h-5" strokeWidth={2.2} />
                </div>
                <div className="flex items-center gap-1">
                  {count > 0 && (
                    <span className={`text-[10px] font-black text-white px-2 py-0.5 rounded-full ${extra.badgeColor || 'bg-slate-500'}`}>
                      {count}
                    </span>
                  )}
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>

              <div>
                <h3 className="text-sm font-black tracking-tight text-slate-900 group-hover:text-primary transition-colors">
                  {name}
                </h3>
                <p className="text-[11px] font-medium text-slate-500 mt-0.5 line-clamp-1">
                  {desc}
                </p>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
