import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { MapPin, Navigation, Search, X, Loader2, Check, Target } from "lucide-react";
import { useLocation } from '@/hooks/useLocation';
import { cn } from '@/lib/utils';

// Fix Leaflet default marker icon
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

interface LocationData {
    lat: number;
    lng: number;
    address?: string;
    serviceRadiusKm?: number;
}

interface LocationPickerProps {
    value?: LocationData;
    onChange: (location: LocationData) => void;
    defaultCenter?: [number, number];
    className?: string;
    showRadiusSelector?: boolean;
    defaultRadius?: number;
}

// Custom marker icon
const selectedIcon = L.divIcon({
    html: `<div style="background-color: #10b981; width: 36px; height: 36px; border-radius: 50%; border: 4px solid white; display: flex; align-items: center; justify-content: center; color: white; box-shadow: 0 4px 10px rgba(0,0,0,0.3); animation: bounce 0.5s;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
           </div>`,
    className: 'location-picker-icon',
    iconSize: [36, 36],
    iconAnchor: [18, 36],
});

// Component to handle map clicks
const MapClickHandler = ({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) => {
    useMapEvents({
        click: (e) => {
            onLocationSelect(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
};

// Component to handle map centering
const MapCenterController = ({ center }: { center: [number, number] }) => {
    const map = useMap();
    useEffect(() => {
        map.setView(center, map.getZoom());
    }, [center, map]);
    return null;
};

const LocationPicker: React.FC<LocationPickerProps> = ({
    value,
    onChange,
    defaultCenter = [45.4215, -75.6972], // Ottawa center
    className,
    showRadiusSelector = false,
    defaultRadius = 10
}) => {
    const { coords, loading: locationLoading } = useLocation();
    const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(value || null);
    const [serviceRadius, setServiceRadius] = useState<number>(value?.serviceRadiusKm || defaultRadius);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [mapCenter, setMapCenter] = useState<[number, number]>(defaultCenter);
    const [showMap, setShowMap] = useState(false);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Initialize with user's current location
    useEffect(() => {
        if (coords && !value) {
            const currentLocation = {
                lat: coords.lat,
                lng: coords.lng,
                address: 'Current Location'
            };
            setMapCenter([coords.lat, coords.lng]);
            setSelectedLocation(currentLocation);
        }
    }, [coords, value]);

    // Update internal state when value prop changes
    useEffect(() => {
        if (value) {
            setSelectedLocation(value);
            setMapCenter([value.lat, value.lng]);
        }
    }, [value]);

    // Reverse geocoding to get address from coordinates
    const reverseGeocode = useCallback(async (lat: number, lng: number): Promise<string> => {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
            );
            const data = await response.json();
            return data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        } catch (error) {
            console.error('Reverse geocoding failed:', error);
            return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        }
    }, []);

    // Forward geocoding to get coordinates from address
    const forwardGeocode = useCallback(async (query: string): Promise<{ lat: number; lng: number; address: string } | null> => {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`
            );
            const data = await response.json();
            if (data && data.length > 0) {
                return {
                    lat: parseFloat(data[0].lat),
                    lng: parseFloat(data[0].lon),
                    address: data[0].display_name
                };
            }
            return null;
        } catch (error) {
            console.error('Forward geocoding failed:', error);
            return null;
        }
    }, []);

    const handleMapClick = useCallback(async (lat: number, lng: number) => {
        const address = await reverseGeocode(lat, lng);
        const locationData = {
            lat,
            lng,
            address,
            serviceRadiusKm: showRadiusSelector ? serviceRadius : undefined
        };
        setSelectedLocation(locationData);
        onChange(locationData);
    }, [reverseGeocode, showRadiusSelector, serviceRadius, onChange]);

    const handleRadiusChange = useCallback((newRadius: number) => {
        setServiceRadius(newRadius);
        if (selectedLocation) {
            const updatedLocation = {
                ...selectedLocation,
                serviceRadiusKm: newRadius
            };
            setSelectedLocation(updatedLocation);
            onChange(updatedLocation);
        }
    }, [selectedLocation, onChange]);

    const handleSearch = useCallback(async () => {
        if (!searchQuery.trim()) return;

        setIsSearching(true);
        const result = await forwardGeocode(searchQuery);
        setIsSearching(false);

        if (result) {
            setSelectedLocation(result);
            setMapCenter([result.lat, result.lng]);
            onChange(result);
            setShowMap(true);
        }
    }, [searchQuery, forwardGeocode, onChange]);

    // Debounced search
    useEffect(() => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        if (searchQuery.length > 3) {
            searchTimeoutRef.current = setTimeout(() => {
                handleSearch();
            }, 800);
        }

        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [searchQuery]);

    const handleUseCurrentLocation = () => {
        if (coords) {
            handleMapClick(coords.lat, coords.lng);
            setMapCenter([coords.lat, coords.lng]);
            setShowMap(true);
        }
    };

    return (
        <div className={cn("space-y-3", className)}>
            {/* Search Input */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setShowMap(true)}
                    placeholder="搜索地址或点击地图选择位置..."
                    className="pl-10 pr-10 h-12 rounded-xl"
                />
                {isSearching && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-primary" />
                )}
                {searchQuery && !isSearching && (
                    <button
                        onClick={() => {
                            setSearchQuery('');
                            setShowMap(false);
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2">
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleUseCurrentLocation}
                    disabled={locationLoading || !coords}
                    className="flex-1 rounded-xl"
                >
                    <Navigation className="w-4 h-4 mr-2" />
                    {locationLoading ? '定位中...' : '使用当前位置'}
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowMap(!showMap)}
                    className="rounded-xl"
                >
                    <MapPin className="w-4 h-4 mr-2" />
                    {showMap ? '隐藏' : '显示'}地图
                </Button>
            </div>

            {/* Service Radius Selector */}
            {showRadiusSelector && (
                <Card className="border-emerald-200 bg-emerald-50/50">
                    <CardContent className="p-4">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-semibold text-emerald-900 flex items-center gap-2">
                                    <Target className="w-4 h-4" />
                                    服务半径
                                </label>
                                <span className="text-lg font-bold text-emerald-600">
                                    {serviceRadius} km
                                </span>
                            </div>
                            <Slider
                                value={[serviceRadius]}
                                onValueChange={(value) => handleRadiusChange(value[0])}
                                min={1}
                                max={50}
                                step={1}
                                className="w-full"
                            />
                            <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
                                <span>1 km</span>
                                <span className="flex gap-1">
                                    {[5, 10, 20, 30].map(km => (
                                        <button
                                            key={km}
                                            onClick={() => handleRadiusChange(km)}
                                            className={cn(
                                                "px-2 py-0.5 rounded-full transition-all",
                                                serviceRadius === km
                                                    ? "bg-emerald-600 text-white"
                                                    : "bg-emerald-100 hover:bg-emerald-200 text-emerald-700"
                                            )}
                                        >
                                            {km}km
                                        </button>
                                    ))}
                                </span>
                                <span>50 km</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Selected Location Display */}
            {selectedLocation && (
                <Card className="border-primary/20 bg-primary/5">
                    <CardContent className="p-3">
                        <div className="flex items-start gap-2">
                            <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-primary mb-1">已选择位置</p>
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                    {selectedLocation.address || `${selectedLocation.lat.toFixed(4)}, ${selectedLocation.lng.toFixed(4)}`}
                                </p>
                                <p className="text-[10px] text-muted-foreground mt-1 font-mono">
                                    📍 {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Map View */}
            {showMap && (
                <div className="relative rounded-2xl overflow-hidden border-2 border-primary/20 shadow-lg">
                    <div className="h-[300px] md:h-[400px] w-full">
                        <MapContainer
                            center={mapCenter}
                            zoom={14}
                            className="h-full w-full"
                            style={{ height: '100%', width: '100%' }}
                        >
                            <TileLayer
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            />
                            <MapClickHandler onLocationSelect={handleMapClick} />
                            <MapCenterController center={mapCenter} />

                            {/* Selected location marker */}
                            {selectedLocation && (
                                <>
                                    <Marker
                                        position={[selectedLocation.lat, selectedLocation.lng]}
                                        icon={selectedIcon}
                                    />
                                    {/* Service radius circle */}
                                    {showRadiusSelector && (
                                        <Circle
                                            center={[selectedLocation.lat, selectedLocation.lng]}
                                            radius={serviceRadius * 1000} // Convert km to meters
                                            pathOptions={{
                                                color: '#10b981',
                                                fillColor: '#10b981',
                                                fillOpacity: 0.1,
                                                weight: 2,
                                                dashArray: '5, 10'
                                            }}
                                        />
                                    )}
                                </>
                            )}

                            {/* Current location marker (if different from selected) */}
                            {coords && (!selectedLocation ||
                                (Math.abs(coords.lat - selectedLocation.lat) > 0.0001 ||
                                    Math.abs(coords.lng - selectedLocation.lng) > 0.0001)) && (
                                    <Marker
                                        position={[coords.lat, coords.lng]}
                                        icon={L.divIcon({
                                            html: '<div class="w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow-lg animate-pulse"></div>',
                                            className: 'current-location-icon',
                                            iconSize: [12, 12],
                                            iconAnchor: [6, 6],
                                        })}
                                    />
                                )}
                        </MapContainer>
                    </div>

                    {/* Map Instruction Overlay */}
                    <div className="absolute top-3 left-3 right-3 bg-background/90 backdrop-blur-md rounded-xl p-3 shadow-lg border pointer-events-none">
                        <p className="text-xs font-semibold text-center text-muted-foreground">
                            👆 点击地图选择服务位置
                            {showRadiusSelector && selectedLocation && (
                                <span className="block mt-1 text-emerald-600">
                                    🎯 覆盖半径：{serviceRadius} km
                                </span>
                            )}
                        </p>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
            `}</style>
        </div>
    );
};

export default LocationPicker;
