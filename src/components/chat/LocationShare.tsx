import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MapPin, Loader2, Navigation } from "lucide-react";
import { useLocation } from "@/hooks/useLocation";

interface LocationShareProps {
    onLocationShare: (location: { lat: number; lng: number; address?: string }) => void;
}

export function LocationShare({ onLocationShare }: LocationShareProps) {
    const { coords, loading, error, getCurrentLocation } = useLocation();
    const [gettingLocation, setGettingLocation] = useState(false);
    const [address, setAddress] = useState<string>('');

    const handleGetLocation = async () => {
        setGettingLocation(true);
        try {
            await getCurrentLocation();

            if (coords) {
                // Reverse geocode to get address
                try {
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lng}`,
                        {
                            headers: {
                                'User-Agent': 'GigNeighbor/1.0'
                            }
                        }
                    );
                    const data = await response.json();
                    setAddress(data.display_name || '');
                } catch (err) {
                    console.error('Error reverse geocoding:', err);
                }
            }
        } catch (err) {
            console.error('Error getting location:', err);
        } finally {
            setGettingLocation(false);
        }
    };

    const handleShareLocation = () => {
        if (coords) {
            onLocationShare({
                lat: coords.lat,
                lng: coords.lng,
                address: address || `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`
            });
        }
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-6 px-2 rounded-full border-muted text-[9px] font-bold opacity-80 hover:opacity-100">
                    <MapPin className="w-3 h-3 mr-1" /> 位置
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 rounded-2xl" align="start">
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <Navigation className="w-4 h-4 text-primary" />
                        <h4 className="font-bold text-sm">分享位置</h4>
                    </div>

                    {!coords && !loading ? (
                        <div className="text-center py-6">
                            <MapPin className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                            <p className="text-xs text-muted-foreground mb-4">
                                点击下方按钮获取您的当前位置
                            </p>
                            <Button
                                size="sm"
                                className="rounded-xl gap-2"
                                onClick={handleGetLocation}
                                disabled={gettingLocation}
                            >
                                {gettingLocation ? (
                                    <>
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                        定位中...
                                    </>
                                ) : (
                                    <>
                                        <Navigation className="w-3 h-3" />
                                        获取当前位置
                                    </>
                                )}
                            </Button>
                        </div>
                    ) : coords ? (
                        <div className="space-y-3">
                            {/* Mini Map Preview */}
                            <div className="relative h-32 bg-muted rounded-xl overflow-hidden border border-border/50">
                                <img
                                    src={`https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/pin-s+3b82f6(${coords.lng},${coords.lat})/${coords.lng},${coords.lat},14,0/320x128@2x?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw`}
                                    alt="Location preview"
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        // Fallback to OSM static map
                                        e.currentTarget.src = `https://staticmap.openstreetmap.de/staticmap.php?center=${coords.lat},${coords.lng}&zoom=14&size=320x128&markers=${coords.lat},${coords.lng},red-pushpin`;
                                    }}
                                />
                                <div className="absolute bottom-2 left-2 right-2 bg-background/80 backdrop-blur-sm rounded-lg p-2">
                                    <p className="text-[10px] font-bold text-foreground line-clamp-2">
                                        {address || '正在获取地址...'}
                                    </p>
                                </div>
                            </div>

                            {/* Coordinates */}
                            <div className="bg-muted/30 rounded-lg p-2">
                                <p className="text-[10px] text-muted-foreground text-center font-mono">
                                    {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
                                </p>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    className="flex-1 h-8 rounded-xl font-bold"
                                    onClick={handleShareLocation}
                                >
                                    发送位置
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 px-3 rounded-xl"
                                    onClick={handleGetLocation}
                                    disabled={gettingLocation}
                                >
                                    {gettingLocation ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                        '刷新'
                                    )}
                                </Button>
                            </div>
                        </div>
                    ) : error ? (
                        <div className="text-center py-6">
                            <p className="text-xs text-destructive mb-3">
                                无法获取位置信息
                            </p>
                            <p className="text-[10px] text-muted-foreground mb-4">
                                请确保您已授予位置权限
                            </p>
                            <Button
                                variant="outline"
                                size="sm"
                                className="rounded-xl"
                                onClick={handleGetLocation}
                            >
                                重试
                            </Button>
                        </div>
                    ) : (
                        <div className="text-center py-6">
                            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
                            <p className="text-xs text-muted-foreground">定位中...</p>
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
