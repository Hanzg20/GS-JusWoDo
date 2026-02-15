import { useState, useEffect, useCallback } from 'react';
import SEO from '@/components/SEO';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import MarkerCluster from '@/components/map/MarkerCluster';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Loader2, MapPin, Filter, Star, X } from 'lucide-react';
import { useLocation } from '@/hooks/useLocation';
import { repositoryFactory } from '@/services/repositories/factory';
import { ListingMaster, ListingType } from '@/types/domain';
import { useConfigStore } from '@/stores/configStore';
import { toast } from 'sonner';
import L from 'leaflet';
import { renderToString } from 'react-dom/server';

// Sub-components
import { MapFilters } from '@/components/map/discovery/MapFilters';
import { MapController } from '@/components/map/discovery/MapController';
import { ListingsDrawer } from '@/components/map/discovery/ListingsDrawer';

// Fix Leaflet marker icons
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Custom Icons for different types
const getIcon = (type: ListingType) => {
    let color = '#3b82f6'; // Default blue
    if (type === 'GOODS') color = '#10b981'; // Green
    if (type === 'TASK') color = '#f59e0b'; // Orange
    if (type === 'RENTAL') color = '#8b5cf6'; // Purple

    return L.divIcon({
        html: `<div style="background-color: ${color}; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; color: white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
               </div>`,
        className: 'custom-div-icon',
        iconSize: [30, 30],
        iconAnchor: [15, 30],
    });
};

// Helper to render popup content as HTML string for clustering
const getPopupHtml = (listing: ListingMaster, language: string) => {
    return renderToString(
        <Card className="border-0 shadow-none overflow-hidden w-[220px]">
            <div className="relative h-24 overflow-hidden">
                <img
                    src={listing.images?.[0] || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4'}
                    alt={listing.titleZh}
                    className="w-full h-full object-cover"
                />
                <Badge className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm text-foreground border-0 text-[10px] h-5">
                    {listing.type}
                </Badge>
            </div>
            <div className="p-3">
                <h4 className="font-bold text-sm line-clamp-1 mb-0.5">
                    {language === 'zh' ? listing.titleZh : listing.titleEn}
                </h4>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-2">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span className="font-bold text-amber-600">{listing.rating}</span>
                </div>
                <div className="text-[10px] font-black text-primary mb-2 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {listing.distanceMeters
                        ? (listing.distanceMeters > 1000
                            ? `${(listing.distanceMeters / 1000).toFixed(1)} km`
                            : `${Math.round(listing.distanceMeters)} m`)
                        : (language === 'zh' ? '就在附近' : 'Nearby')}
                </div>
                <div className="w-full py-1.5 text-center bg-primary text-white rounded-lg text-xs font-bold cursor-pointer">
                    {language === 'zh' ? '查看详情' : 'View Details'}
                </div>
            </div>
        </Card>
    );
};

const MapDiscovery = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { language } = useConfigStore();
    const { coords, loading: locLoading, error: locError } = useLocation();

    const [listings, setListings] = useState<ListingMaster[]>([]);
    const [loading, setLoading] = useState(false);
    const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
    const [activeType, setActiveType] = useState<ListingType | 'ALL'>('ALL');
    const [viewMode, setViewMode] = useState<'MAP' | 'LIST'>('MAP');

    const searchQuery = searchParams.get('q');
    const searchCategory = searchParams.get('category');

    const fetchListings = useCallback(async (lat: number, lng: number, radius: number = 5000) => {
        setLoading(true);
        try {
            const repo = repositoryFactory.getListingRepository();

            // Build search options
            const options: any = {
                lat,
                lng,
                radius,
                type: activeType === 'ALL' ? undefined : activeType as ListingType
            };

            // Add text search if present
            if (searchQuery) {
                options.query = searchQuery;
            }

            // Add category filter if present
            if (searchCategory) {
                options.categoryId = searchCategory;
            }

            const results = await repo.search(options);
            setListings(results);
        } catch (error) {
            console.error("Error fetching map listings:", error);
        } finally {
            setLoading(false);
        }
    }, [activeType, searchQuery, searchCategory]);

    const OTTAWA_CENTER: [number, number] = [45.4215, -75.6972];

    useEffect(() => {
        if (coords) {
            setMapCenter([coords.lat, coords.lng]);
            fetchListings(coords.lat, coords.lng);
        } else if (locError) {
            console.warn("Location error, falling back to Ottawa center:", locError);
            toast.error(language === 'zh' ? '无法获取您的位置，已切换至渥太华中心' : 'Could not get your location, falling back to Ottawa center');
            setMapCenter(OTTAWA_CENTER);
            fetchListings(OTTAWA_CENTER[0], OTTAWA_CENTER[1]);
        } else if (!coords && !locLoading && !locError) {
            // Fallback if no location yet (e.g. strict privacy but no error)
            // Or initial load
            // setMapCenter(OTTAWA_CENTER);
            // fetchListings(OTTAWA_CENTER[0], OTTAWA_CENTER[1]);
        }
    }, [coords, locError, fetchListings, language]);

    const handleSearchArea = (map: L.Map) => {
        const center = map.getCenter();
        const bounds = map.getBounds();
        const northEast = bounds.getNorthEast();
        const radius = Math.round(center.distanceTo(northEast));
        fetchListings(center.lat, center.lng, radius);
    };

    const clearSearch = () => {
        setSearchParams({});
    };

    const clusterMarkers = listings
        .filter(l => l.location?.coordinates)
        .map(listing => ({
            id: listing.id,
            position: [listing.location!.coordinates!.lat, listing.location!.coordinates!.lng] as [number, number],
            icon: getIcon(listing.type),
            popup: getPopupHtml(listing, language)
        }));

    if (locLoading) return (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)] bg-muted/20">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">{language === 'zh' ? '正在获取您的位置...' : 'Locating you...'}</p>
        </div>
    );

    return (
        <div className="h-[calc(100vh-64px)] relative flex flex-col overflow-hidden">
            <SEO
                title={searchQuery ? `${searchQuery} - ${language === 'zh' ? '地图搜索' : 'Map Search'}` : (language === 'zh' ? '发现服务' : 'Discover Local Services')}
                description={language === 'zh' ? '在地图上探索附近的优质服务和邻里互助。' : 'Explore trusted local services and neighbors on the map.'}
            />
            {/* Search Banner */}
            {(searchQuery || searchCategory) && (
                <div className="absolute top-16 left-0 right-0 z-[990] px-4 flex justify-center pointer-events-none">
                    <div className="bg-primary text-primary-foreground text-xs font-bold px-4 py-2 rounded-full shadow-lg flex items-center gap-2 pointer-events-auto animate-in slide-in-from-top-2">
                        <span>
                            {language === 'zh' ? '搜索结果: ' : 'Showing results for: '}
                            <span className="opacity-90">
                                {searchQuery && `"${searchQuery}"`}
                                {searchQuery && searchCategory && ' + '}
                                {searchCategory && (language === 'zh' ? '指定分类' : 'Category')}
                            </span>
                        </span>
                        <button onClick={clearSearch} className="hover:bg-primary-foreground/20 rounded-full p-0.5">
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                </div>
            )}

            {/* Filter Bar */}
            <MapFilters activeType={activeType} onTypeChange={setActiveType} />

            {/* Map Container */}
            <div className={`flex-1 w-full relative transition-all duration-300 ${viewMode === 'LIST' ? 'opacity-0 md:opacity-100 pointer-events-none md:pointer-events-auto scale-95 md:scale-100' : 'opacity-100 scale-100'}`}>
                {mapCenter && (
                    <MapContainer
                        center={mapCenter}
                        zoom={14}
                        className="h-full w-full"
                        style={{ height: '100%', width: '100%' }}
                        zoomControl={false}
                        touchZoom={true}
                        doubleClickZoom={true}
                        scrollWheelZoom={true}
                        dragging={true}
                    >
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            maxZoom={19}
                            minZoom={10}
                        />

                        {/* Search in this area button */}
                        <MapController onSearchArea={handleSearchArea} />

                        {/* User Location Marker */}
                        {coords && (
                            <Marker
                                position={[coords.lat, coords.lng]}
                                icon={L.divIcon({
                                    html: '<div class="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg animate-pulse"></div>',
                                    className: 'user-location-icon'
                                })}
                            >
                                <Popup>
                                    <div className="text-xs font-bold">{language === 'zh' ? '您在这里' : 'You are here'}</div>
                                </Popup>
                            </Marker>
                        )}

                        {/* Clusters */}
                        <MarkerCluster
                            markers={clusterMarkers}
                            onMarkerClick={(id) => {
                                console.log('Marker clicked:', id);
                            }}
                        />
                    </MapContainer>
                )}

                {loading && (
                    <div className="absolute top-20 right-4 z-[1000] bg-background/80 backdrop-blur-md rounded-lg p-2 shadow-lg flex items-center gap-2 border">
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        <span className="text-xs font-medium">{language === 'zh' ? '正在加载...' : 'Loading...'}</span>
                    </div>
                )}
            </div>

            {/* List Toggle Button (Floating) - Enhanced for mobile */}
            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-[1010] md:hidden safe-area-bottom">
                <Button
                    size="lg"
                    className="rounded-full shadow-2xl px-8 py-6 font-black tracking-widest bg-gradient-to-r from-foreground to-foreground/90 text-background hover:from-foreground/90 hover:to-foreground/80 transition-all duration-300 hover:scale-110 active:scale-95 border-4 border-background"
                    onClick={() => setViewMode(prev => prev === 'MAP' ? 'LIST' : 'MAP')}
                >
                    {viewMode === 'MAP' ? (
                        <span className="flex items-center gap-2">
                            <Filter className="w-5 h-5" /> {language === 'zh' ? '查看列表' : 'View List'}
                        </span>
                    ) : (
                        <span className="flex items-center gap-2">
                            <MapPin className="w-5 h-5" /> {language === 'zh' ? '返回地图' : 'Back to Map'}
                        </span>
                    )}
                </Button>
            </div>

            {/* Listings Drawer (Overlay/Sidebar) */}
            <ListingsDrawer listings={listings} isOpen={viewMode === 'LIST'} />
        </div>
    );
};

export default MapDiscovery;
