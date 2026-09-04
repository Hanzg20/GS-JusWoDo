import { useNavigate } from "react-router-dom";
import { mainCategories } from "@/constants/categories";
import { useConfigStore } from "@/stores/configStore";
import { ChevronRight } from "lucide-react";

interface CategoryMenuProps {
    onSelect?: (categoryId: string) => void;
    onClose: () => void;
}

export function CategoryMenu({ onSelect, onClose }: CategoryMenuProps) {
    const navigate = useNavigate();
    const { language } = useConfigStore();

    const handleCategoryClick = (id: string | undefined) => {
        if (!id) return;

        if (onSelect) {
            onSelect(id);
        } else {
            // Default behavior: navigate to category page
            navigate(`/category/${id}`);
        }
        onClose();
    };

    return (
        <div className="absolute top-full left-0 mt-2 w-64 glass-card !bg-white rounded-2xl p-2 shadow-elevated z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-left">
            <div className="px-3 py-2 text-xs font-bold text-muted-foreground uppercase tracking-wider border-b border-border/10 mb-1">
                {language === 'zh' ? '全部分类' : 'All Categories'}
            </div>
            <div className="max-h-[400px] overflow-y-auto space-y-0.5 custom-scrollbar">
                {mainCategories.map((category) => (
                    <button
                        key={category.label}
                        onClick={() => handleCategoryClick(category.id)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 rounded-xl transition-colors group text-left"
                    >
                        <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-110"
                            style={{ backgroundColor: category.color || '#6b7280' }}
                        >
                            {React.cloneElement(category.icon as React.ReactElement, { className: "w-4 h-4" })}
                        </div>
                        <span className="flex-1 text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                            {category.label}
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-primary/50" />
                    </button>
                ))}
            </div>
        </div>
    );
}

import React from "react";
