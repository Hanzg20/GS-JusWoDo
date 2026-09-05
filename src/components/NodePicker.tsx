import { MapPin, ChevronDown, Check } from "lucide-react";
import { useConfigStore } from "@/stores/configStore";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface NodePickerProps {
    className?: string;
    // Controlled mode (e.g. a form's own nodeId field) — when provided,
    // selecting a node calls onChange instead of mutating the global
    // activeNodeId. Omit both to get the default global header behavior.
    value?: string;
    onChange?: (nodeId: string) => void;
}

// District -> community-Node picker, grouped so 37 neighborhoods stay
// usable instead of one flat 37-item dropdown — see
// supabase/migrations/20260904_add_node_districts.sql
//
// Not to be confused with LocationPicker.tsx, which is an unrelated,
// pre-existing map/pin-drop component (lat/lng + address) used by
// FormFieldRenderer.tsx and PublishService.tsx.
// Location/neighborhood names are always shown in English regardless of
// the app's language setting — Ottawa-area place names ("Barrhaven",
// "ByWard Market") don't have meaningful Chinese equivalents, and the
// zh_name for a few of the original nodes just duplicated the English name
// in parentheses (e.g. "渥太华-巴尔黑文 (Barrhaven)"), which read as
// redundant once shown next to itself.
export function NodePicker({ className = "", value, onChange }: NodePickerProps) {
    const { refCodes, activeNodeId, setActiveNode, language } = useConfigStore();
    const isZh = language === 'zh';
    const selectedNodeId = value !== undefined ? value : activeNodeId;
    const handleSelect = (nodeId: string) => (onChange ? onChange(nodeId) : setActiveNode(nodeId));

    const districts = refCodes
        .filter(r => r.type === 'DISTRICT')
        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

    const nodesByDistrict = (districtId: string) =>
        refCodes
            .filter(r => r.type === 'NODE' && r.parentId === districtId)
            .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

    const currentNode = refCodes.find(r => r.type === 'NODE' && r.codeId === selectedNodeId);
    const currentLabel = currentNode
        ? (currentNode.enName || currentNode.zhName)
        : (isZh ? '选择社区' : 'Select Area');

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    className={`flex items-center gap-1.5 px-3 py-1 bg-primary/5 border border-primary/10 rounded-full text-xs font-semibold text-primary hover:bg-primary/10 transition-colors ${className}`}
                >
                    <MapPin className="w-3.5 h-3.5 text-primary" />
                    <span className="truncate max-w-[140px]">{currentLabel}</span>
                    <ChevronDown className="w-3 h-3 text-primary/60" />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="max-h-96 w-64 overflow-y-auto rounded-2xl border-border/10">
                {districts.map((district, idx) => {
                    const nodes = nodesByDistrict(district.codeId);
                    if (nodes.length === 0) return null;
                    return (
                        <div key={district.codeId}>
                            {idx > 0 && <DropdownMenuSeparator />}
                            <DropdownMenuLabel className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">
                                {district.enName || district.zhName}
                            </DropdownMenuLabel>
                            {nodes.map(node => (
                                <DropdownMenuItem
                                    key={node.codeId}
                                    className="text-xs font-semibold flex items-center justify-between pl-6 ml-2 border-l border-border/40"
                                    onClick={() => handleSelect(node.codeId)}
                                >
                                    {node.enName || node.zhName}
                                    {selectedNodeId === node.codeId && <Check className="w-3.5 h-3.5 text-primary" />}
                                </DropdownMenuItem>
                            ))}
                        </div>
                    );
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
