import { useState } from 'react';
import { useMap, useMapEvents } from 'react-leaflet';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { useConfigStore } from '@/stores/configStore';
import L from 'leaflet';

interface MapControllerProps {
    onSearchArea: (map: L.Map) => void;
}

export function MapController({ onSearchArea }: MapControllerProps) {
    const map = useMap();
    const [moved, setMoved] = useState(false);
    const { language } = useConfigStore();

    useMapEvents({
        moveend: () => setMoved(true),
        zoomend: () => setMoved(true),
    });

    return (
        <div className="absolute bottom-10 left-0 right-0 z-[1000] flex justify-center pointer-events-none">
            {moved && (
                <Button
                    className="rounded-full shadow-2xl pointer-events-auto bg-primary text-primary-foreground hover:scale-105 transition-transform gap-2 px-6 h-12 text-base font-bold animate-in fade-in slide-in-from-bottom-4"
                    onClick={() => {
                        onSearchArea(map);
                        setMoved(false);
                    }}
                >
                    <Search className="w-5 h-5" />
                    {language === 'zh' ? '搜索此区域' : 'Search this area'}
                </Button>
            )}
        </div>
    );
}
