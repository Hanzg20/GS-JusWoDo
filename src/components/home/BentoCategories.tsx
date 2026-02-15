import { BentoItem } from "./BentoItem";
import { HeartHandshake, Crown, Sparkles, Utensils, PlaneTakeoff, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useConfigStore } from "@/stores/configStore";

interface BusinessDomain {
    id: string;
    icon: React.ReactNode;
    labelZh: string;
    labelEn: string;
    color: string;
    bg: string;
    link: string;
}

const businessDomains: BusinessDomain[] = [
    {
        id: "1010000",
        icon: <HeartHandshake className="w-5 h-5" />,
        labelZh: "居家生活",
        labelEn: "Home & Life",
        color: "text-emerald-600",
        bg: "bg-emerald-50",
        link: "/category/1010000",
    },
    {
        id: "1040000",
        icon: <Utensils className="w-5 h-5" />,
        labelZh: "美食市集",
        labelEn: "Food & Market",
        color: "text-amber-600",
        bg: "bg-amber-50",
        link: "/category/1040000",
    },
    {
        id: "1020000",
        icon: <Crown className="w-5 h-5" />,
        labelZh: "专业美业",
        labelEn: "Pro & Beauty",
        color: "text-rose-600",
        bg: "bg-rose-50",
        link: "/category/1020000",
    },
    {
        id: "1030000",
        icon: <Sparkles className="w-5 h-5" />,
        labelZh: "亲子教育",
        labelEn: "Kids & Wellness",
        color: "text-violet-600",
        bg: "bg-violet-50",
        link: "/category/1030000",
    },
    {
        id: "1050000",
        icon: <PlaneTakeoff className="w-5 h-5" />,
        labelZh: "出行时令",
        labelEn: "Travel & Outdoor",
        color: "text-sky-600",
        bg: "bg-sky-50",
        link: "/category/1050000",
    },
];

export function BentoCategories() {
    const { language } = useConfigStore();
    const isZh = language === 'zh';

    const t = {
        title: isZh ? '热门分类' : 'Categories',
        viewAll: isZh ? '全部分类' : 'View All',
    };

    return (
        <BentoItem colSpan={1} rowSpan={2} title={t.title} className="p-4 flex flex-col">
            <div className="flex-1 flex flex-col justify-center gap-2 mt-2">
                {businessDomains.map((domain) => (
                    <Link
                        key={domain.id}
                        to={domain.link}
                        className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors group"
                    >
                        <div className={`w-10 h-10 rounded-lg ${domain.bg} ${domain.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                            {domain.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                            <span className="block text-sm font-bold text-foreground">
                                {isZh ? domain.labelZh : domain.labelEn}
                            </span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-primary transition-colors" />
                    </Link>
                ))}
            </div>

            <Link
                to="/categories"
                className="mt-2 text-xs font-bold text-center text-muted-foreground hover:text-primary transition-colors py-2 border-t border-gray-100"
            >
                {t.viewAll}
            </Link>
        </BentoItem>
    );
}
