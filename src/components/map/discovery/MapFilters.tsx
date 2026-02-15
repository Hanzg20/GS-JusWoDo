import { Button } from "@/components/ui/button";
import { ListingType } from "@/types/domain";
import { useConfigStore } from "@/stores/configStore";

interface MapFiltersProps {
    activeType: ListingType | 'ALL';
    onTypeChange: (type: ListingType | 'ALL') => void;
}

export function MapFilters({ activeType, onTypeChange }: MapFiltersProps) {
    const { language } = useConfigStore();

    const types = ['ALL', 'GOODS', 'SERVICE', 'TASK', 'RENTAL'] as const;

    return (
        <div className="absolute top-4 left-0 right-0 z-[1000] px-4 flex justify-center pointer-events-none">
            <div className="bg-background/80 backdrop-blur-md border shadow-lg rounded-full px-2 py-1 flex gap-1 pointer-events-auto">
                {types.map(type => (
                    <Button
                        key={type}
                        variant={activeType === type ? 'default' : 'ghost'}
                        size="sm"
                        className="rounded-full h-8 text-xs px-3 transition-all"
                        onClick={() => onTypeChange(type)}
                    >
                        {type === 'ALL' ? (language === 'zh' ? '全域' : 'All') : type}
                    </Button>
                ))}
            </div>
        </div>
    );
}
