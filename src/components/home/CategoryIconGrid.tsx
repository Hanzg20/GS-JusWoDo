import { useNavigate } from "react-router-dom";
import { useConfigStore } from "@/stores/configStore";
import { getIcon } from "@/lib/iconMapper";
import { motion } from "framer-motion";
import { MASCOT_BY_PILLAR } from "@/config/mascots";

// Fallback used only if ref_codes hasn't been migrated yet (no PILLAR rows) —
// keeps the homepage from breaking before the DB migration lands.
// Back to 3 pillars as of 2026-09-14 — see jwd_three_pillars memory. The
// 2026-09-06 expansion to 6 (splitting GOODS into Products/Secondhand and
// promoting Tasks/Rentals to full tiles) drifted from the founding "reject
// bloat" positioning and left 2 of the 6 tiles pointing at categories with
// zero real listings. Products now lives inside Services (both are
// merchant/professional offerings), Tasks inside Neighbors (matches the
// original "跑腿短工 folds under 邻里互助" decision), Rentals inside
// Secondhand (both are "share what you already own"). Each retired pillar's
// own route (/category/products, /category/task, /category/rental) still
// works — only the top-level homepage tile is gone; CategoryListing.tsx and
// Community.tsx expose sibling tabs so they stay reachable.
const FALLBACK_PILLARS = [
  { codeId: 'PILLAR_SERVICE', path: '/category/service', zhName: '本地服务', enName: 'Services', extraData: { icon: 'Wrench', bgColor: 'bg-orange-50 text-orange-600 border-orange-100', badgeColor: 'bg-orange-500', desc_zh: '保洁 / 维修 / 铲雪 / 接送 / 商户产品', desc_en: 'Cleaning, repairs, snow, rides & merchant products' } },
  { codeId: 'PILLAR_HELP', path: '/community', zhName: '邻里圈', enName: 'Neighbors', extraData: { icon: 'Users', bgColor: 'bg-emerald-50 text-emerald-600 border-emerald-100', badgeColor: 'bg-emerald-500', desc_zh: '求助 / 任务委托 / 推荐 / 资讯', desc_en: 'Ask, post a task, recommend, local news' } },
  { codeId: 'PILLAR_GOODS', path: '/category/secondhand', zhName: '闲置 & 租赁', enName: 'Marketplace', extraData: { icon: 'RefreshCw', bgColor: 'bg-purple-50 text-purple-600 border-purple-100', badgeColor: 'bg-purple-500', desc_zh: '闲置买卖 / 免费送 / 设备场地租赁', desc_en: 'Used items, giveaways & gear/space rentals' } },
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
          const mascot = MASCOT_BY_PILLAR[pillar.codeId];
          const path = extra.path || '/';
          const name = isZh ? pillar.zhName : (pillar.enName || pillar.zhName);
          const count = counts[pillar.codeId] || 0;

          return (
            <motion.button
              key={pillar.codeId}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate(path)}
              className="group flex flex-col items-center gap-2 py-3 rounded-2xl hover:bg-slate-50 transition-colors"
            >
              <div className="relative">
                <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105 group-active:scale-95 ${extra.bgColor || 'bg-slate-50 text-slate-600'}`}>
                  {mascot ? (
                    <img src={mascot.avatar} alt={mascot.name} className="w-14 h-14 sm:w-16 sm:h-16 object-contain" />
                  ) : (
                    <Icon className="w-8 h-8 sm:w-9 sm:h-9" strokeWidth={2} />
                  )}
                </div>
                {count > 0 && (
                  <span className={`absolute -top-1 -right-1 min-w-[20px] h-5 px-1 flex items-center justify-center text-[10px] font-black text-white rounded-full border-2 border-white ${extra.badgeColor || 'bg-slate-500'}`}>
                    {count}
                  </span>
                )}
              </div>

              <h3 className="text-sm sm:text-base font-black tracking-tight text-slate-900 group-hover:text-primary transition-colors">
                {name}
              </h3>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
