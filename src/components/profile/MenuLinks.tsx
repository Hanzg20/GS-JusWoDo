import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";

interface MenuItem {
    icon: any;
    label: string;
    path: string;
    badge?: number | string;
}

interface MenuGroup {
    title: string;
    items: MenuItem[];
}

interface MenuLinksProps {
    groups: MenuGroup[];
}

export function MenuLinks({ groups }: MenuLinksProps) {
    const navigate = useNavigate();

    return (
        <div className="space-y-6">
            {groups.map((group, idx) => (
                <div key={idx} className="space-y-3">
                    <h3 className="px-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none">
                        {group.title}
                    </h3>
                    <div className="bg-white rounded-[28px] overflow-hidden border border-black/5 shadow-sm">
                        {group.items.map((item, itemIdx) => (
                            <button
                                key={itemIdx}
                                onClick={() => navigate(item.path)}
                                className="w-full flex items-center gap-4 px-6 py-4 hover:bg-black/5 transition-colors border-b last:border-none border-black/[0.03] group"
                            >
                                <div className="w-8 h-8 rounded-xl bg-muted/50 flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                                    <item.icon className="w-4 h-4" />
                                </div>
                                <span className="flex-1 text-left font-bold text-sm">{item.label}</span>
                                {item.badge !== undefined && (
                                    <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full mr-2">
                                        {item.badge}
                                    </span>
                                )}
                                <ChevronRight className="w-4 h-4 text-muted-foreground/20" />
                            </button>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
