import { useNavigate } from "react-router-dom";
import { useConfigStore } from "@/stores/configStore";
import { ChevronRight } from "lucide-react";

interface CategoryMenuProps {
    onSelect?: (path: string) => void;
    onClose: () => void;
}

// Was a static, English-only, hand-maintained array (constants/categories.tsx)
// completely disconnected from the real ref_codes taxonomy everything else
// (CategoryIconGrid, CategoryListing) reads from — any new category (e.g.
// 汽车服务) never reached this menu, and it never adapted to `language`.
// Now reads the same live ref_codes data, grouped by pillar with each
// pillar's real INDUSTRY tier nested underneath (skipping the leaf CATEGORY
// tier — that level's own filter chips already live on the category page
// itself, see CategoryListing.tsx's pillarCategories).
const PILLARS: { pillarId: string; path: string }[] = [
    { pillarId: 'PILLAR_SERVICE', path: '/category/service' },
    { pillarId: 'PILLAR_HELP', path: '/community' },
    { pillarId: 'PILLAR_GOODS', path: '/category/secondhand' },
];

export function CategoryMenu({ onSelect, onClose }: CategoryMenuProps) {
    const navigate = useNavigate();
    const { language, refCodes } = useConfigStore();
    const isZh = language === 'zh';

    const handleClick = (path: string) => {
        if (onSelect) {
            onSelect(path);
        } else {
            navigate(path);
        }
        onClose();
    };

    return (
        <div className="absolute top-full left-0 mt-2 w-72 glass-card !bg-white rounded-2xl p-2 shadow-elevated z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-left">
            <div className="px-3 py-2 text-xs font-bold text-muted-foreground uppercase tracking-wider border-b border-border/10 mb-1">
                {isZh ? '全部分类' : 'All Categories'}
            </div>
            <div className="max-h-[420px] overflow-y-auto space-y-1 custom-scrollbar">
                {PILLARS.map(({ pillarId, path }) => {
                    const pillar = refCodes.find(r => r.type === 'PILLAR' && r.codeId === pillarId);
                    if (!pillar) return null;
                    const pillarName = isZh ? pillar.zhName : (pillar.enName || pillar.zhName);
                    const industries = refCodes
                        .filter(r => r.type === 'INDUSTRY' && r.parentId === pillarId)
                        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

                    return (
                        <div key={pillarId}>
                            <button
                                onClick={() => handleClick(path)}
                                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted/50 rounded-xl transition-colors group text-left"
                            >
                                <span className="flex-1 text-sm font-black text-foreground group-hover:text-primary transition-colors">
                                    {pillarName}
                                </span>
                                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-primary/50" />
                            </button>
                            {industries.length > 0 && (
                                <div className="pl-3 space-y-0.5 mb-1">
                                    {industries.map(industry => (
                                        <button
                                            key={industry.codeId}
                                            onClick={() => handleClick(path)}
                                            className="w-full flex items-center px-3 py-1.5 hover:bg-muted/50 rounded-lg transition-colors text-left"
                                        >
                                            <span className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                                                {isZh ? industry.zhName : (industry.enName || industry.zhName)}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
