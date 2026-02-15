import { useNavigate } from "react-router-dom";
import { useConfigStore } from "@/stores/configStore";
import { getIcon } from "@/lib/iconMapper";
import {
  HeartHandshake,
  Crown,
  Sparkles,
  Utensils,
  PlaneTakeoff,
  MoreHorizontal
} from "lucide-react";
import { motion } from "framer-motion";

/**
 * Category Icon Grid Component
 * Displays main service categories in a professional, space-efficient layout.
 * Optimized for mobile with horizontal scroll and desktop with an elegant grid.
 */
export function CategoryIconGrid({ counts = {} }: { counts?: Record<string, number> }) {
  const navigate = useNavigate();
  const { language } = useConfigStore();

  // Optimized category list (Industry level + Popular Subcategories for high density)
  const categories = [
    {
      id: '1010000',
      nameZh: '居家生活',
      nameEn: 'Home Help',
      icon: HeartHandshake,
      color: '#059669',
      subZh: '日常维保',
      subEn: 'Maintenance'
    },
    {
      id: '1020000',
      nameZh: '专业美业',
      nameEn: 'Licensed',
      icon: Crown,
      color: '#dc2626',
      subZh: '持证达人',
      subEn: 'Certified'
    },
    {
      id: '1030000',
      nameZh: '育儿健康',
      nameEn: 'Kids/Care',
      icon: Sparkles,
      color: '#7c3aed',
      subZh: '身心教育',
      subEn: 'Wellness'
    },
    {
      id: '1040000',
      nameZh: '美食市集',
      nameEn: 'Market',
      icon: Utensils,
      color: '#d97706',
      subZh: '社区寻味',
      subEn: 'Local Eats'
    },
    {
      id: '1050000',
      nameZh: '出行时令',
      nameEn: 'Travel',
      icon: PlaneTakeoff,
      color: '#2563eb',
      subZh: '机场接送',
      subEn: 'Transit'
    },
    {
      id: '1010100', // Subcategory: Cleaning
      nameZh: '居家清洁',
      nameEn: 'Cleaning',
      icon: Sparkles,
      color: '#06b6d4',
      subZh: '专业保洁',
      subEn: 'Housework'
    },
    {
      id: '1010400', // Subcategory: Handyman
      nameZh: '居家维修',
      nameEn: 'Repairs',
      icon: Crown, // Using Crown for professional repairs
      color: '#475569',
      subZh: '水电木工',
      subEn: 'Handyman'
    }
  ];

  const handleCategoryClick = (id: string) => {
    navigate(`/category/${id}`);
  };

  return (
    <div className="relative pt-2 pb-6 px-4 overflow-hidden">
      {/* Container with horizontal scroll on mobile, flex grid on desktop */}
      <div
        className="flex lg:flex-wrap lg:justify-center gap-3 md:gap-6 overflow-x-auto lg:overflow-x-visible pb-4 no-scrollbar -mx-4 px-4 mask-fade-right lg:mask-none"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {categories.map((category, index) => {
          const Icon = category.icon;
          const count = counts[category.id] || 0;

          return (
            <motion.button
              key={category.id + index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => handleCategoryClick(category.id)}
              className="flex-shrink-0 w-[85px] sm:w-[100px] flex flex-col items-center gap-2 group cursor-pointer scroll-snap-align-start"
            >
              {/* Icon Container */}
              <div className="relative w-14 h-14 md:w-16 md:h-16 flex items-center justify-center">
                <div
                  className="absolute inset-0 rounded-[22px] bg-white border border-slate-100 shadow-sm transition-all duration-300 group-hover:shadow-md group-hover:border-primary/20"
                />
                <div
                  className="absolute inset-0 rounded-[22px] opacity-0 group-hover:opacity-[0.08] transition-opacity duration-300"
                  style={{ backgroundColor: category.color }}
                />

                {/* Count Badge (标号) */}
                {count > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 bg-red-500 text-white min-w-[20px] h-5 rounded-full px-1.5 flex items-center justify-center text-[10px] font-black z-20 shadow-sm border-2 border-white"
                  >
                    {count > 99 ? '99+' : count}
                  </motion.div>
                )}

                {/* Status Dot (Subtle indicator) */}
                {count === 0 && (
                  <div
                    className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full opacity-30 group-hover:opacity-100 transition-opacity"
                    style={{ backgroundColor: category.color }}
                  />
                )}

                <Icon
                  className="w-6 h-6 md:w-7 md:h-7 relative z-10 transition-transform duration-300 group-hover:scale-110"
                  style={{ color: category.color }}
                  strokeWidth={2.2}
                />
              </div>

              {/* Labels */}
              <div className="text-center">
                <p className="text-[12px] md:text-sm font-black text-slate-800 tracking-tight group-hover:text-primary transition-colors truncate w-full">
                  {language === 'zh' ? category.nameZh : category.nameEn}
                </p>
                <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5 opacity-70 group-hover:opacity-100 transition-opacity truncate w-full">
                  {language === 'zh' ? category.subZh : category.subEn}
                </p>
              </div>
            </motion.button>
          );
        })}

        {/* More Button */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: (categories.length) * 0.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => navigate('/category/service')}
          className="flex-shrink-0 w-[85px] sm:w-[100px] flex flex-col items-center gap-2 group cursor-pointer"
        >
          <div className="relative w-14 h-14 flex items-center justify-center">
            <div className="absolute inset-0 rounded-[22px] bg-slate-50 border border-slate-100 border-dashed" />
            <MoreHorizontal className="w-6 h-6 text-slate-400 group-hover:text-primary transition-colors" />
          </div>
          <div className="text-center">
            <p className="text-[12px] font-black text-slate-400">
              {language === 'zh' ? '全部' : 'More'}
            </p>
          </div>
        </motion.button>
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .mask-fade-right {
          mask-image: linear-gradient(to right, black 85%, transparent 100%);
        }
        .scroll-snap-align-start {
          scroll-snap-align: start;
        }
      `}</style>
    </div>
  );
}
