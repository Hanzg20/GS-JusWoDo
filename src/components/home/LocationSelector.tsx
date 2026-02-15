import { ChevronDown, MapPin, Navigation } from "lucide-react";
import { useCommunity } from "@/context/CommunityContext";
import { useConfigStore } from "@/stores/configStore";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * Location Selector Component
 * Displays current community node and allows switching
 */
export function LocationSelector() {
  const { activeNodeId, setActiveNode } = useCommunity();
  const { refCodes, language } = useConfigStore();
  const [isOpen, setIsOpen] = useState(false);

  // Get current node info
  const currentNode = refCodes.find(r => r.codeId === activeNodeId);
  // Respect language setting
  const displayName = language === 'zh'
    ? (currentNode?.zhName || currentNode?.enName || '当前社区')
    : (currentNode?.enName || currentNode?.zhName || 'Community');

  // Get all nodes (Handle potential type drift: COMMUNITY vs COMMUNITY_NODE vs NODE)
  const nodes = refCodes.filter(r => {
    const type = r.type as string;
    return type === 'NODE' || type === 'COMMUNITY_NODE' || type.startsWith('COMMUNITY');
  });

  const handleNodeChange = (nodeId: string) => {
    setActiveNode(nodeId);
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger className="flex items-center gap-2 px-0 py-2 group cursor-pointer outline-none">
        <div className="w-7 h-7 sm:w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300">
          <MapPin className="w-3.5 h-3.5 sm:w-4 h-4" />
        </div>
        <div className="flex flex-col items-start">
          <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-muted-foreground/60 leading-none mb-1">
            {language === 'zh' ? '当前社区' : 'Community'}
          </span>
          <div className="flex items-center gap-1">
            <span className="font-extrabold text-sm sm:text-base tracking-normal text-slate-800 group-hover:text-primary transition-colors leading-none">
              {displayName}
            </span>
            <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64 rounded-2xl p-2 shadow-2xl border-border/10">
        <DropdownMenuItem
          onClick={() => {/* Implement GPS detection logic */ }}
          className="flex items-center gap-3 py-3 px-4 text-primary font-bold hover:bg-primary/5 transition-colors cursor-pointer rounded-xl mb-1"
        >
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Navigation className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm">{language === 'zh' ? '使用当前位置' : 'Current Location'}</span>
            <span className="text-[10px] opacity-60 font-medium">GPS / {language === 'zh' ? '自动定位' : 'Auto-detect'}</span>
          </div>
        </DropdownMenuItem>

        <div className="h-px bg-border/50 my-1 mx-2" />

        {nodes.length > 0 ? (
          nodes.map((node) => (
            <DropdownMenuItem
              key={node.codeId}
              onClick={() => handleNodeChange(node.codeId)}
              className={activeNodeId === node.codeId ? 'bg-primary/10 font-semibold' : ''}
            >
              {language === 'zh' ? (node.zhName || node.enName) : (node.enName || node.zhName)}
            </DropdownMenuItem>
          ))
        ) : (
          <DropdownMenuItem disabled>
            {language === 'zh' ? '暂无社区' : 'No communities available'}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
