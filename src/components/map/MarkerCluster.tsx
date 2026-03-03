import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

interface MarkerData {
    id: string;
    position: [number, number];
    icon: L.DivIcon;
    popup: string | HTMLElement;
}

interface MarkerClusterProps {
    markers: MarkerData[];
    onMarkerClick?: (markerId: string) => void;
}

/**
 * 地图标记聚类组件
 *
 * 使用Leaflet MarkerCluster插件实现密集标记的聚类显示
 *
 * 功能：
 * - 自动聚类密集区域的标记
 * - 点击聚类显示包含的标记数量
 * - 缩放时自动展开聚类
 * - 性能优化：支持上千个标记
 */
const MarkerCluster: React.FC<MarkerClusterProps> = ({ markers, onMarkerClick }) => {
    const map = useMap();

    useEffect(() => {
        if (!map) return;

        const markerClusterGroup = L.markerClusterGroup({
            maxClusterRadius: 80,
            spiderfyOnMaxZoom: true,
            showCoverageOnHover: false,
            zoomToBoundsOnClick: true,
            disableClusteringAtZoom: 18,
            iconCreateFunction: (cluster: any) => {
                const count = cluster.getChildCount();
                let className = 'marker-cluster-small';

                if (count >= 10) className = 'marker-cluster-medium';
                if (count >= 50) className = 'marker-cluster-large';

                return L.divIcon({
                    html: `<div><span>${count}</span></div>`,
                    className: `marker-cluster ${className}`,
                    iconSize: L.point(40, 40)
                });
            }
        });

        const leafletMarkers = markers.map((markerData) => {
            const marker = L.marker(markerData.position, {
                icon: markerData.icon
            });

            if (markerData.popup) {
                marker.bindPopup(markerData.popup);
            }

            if (onMarkerClick) {
                marker.on('click', () => onMarkerClick(markerData.id));
            }

            return marker;
        });

        markerClusterGroup.addLayers(leafletMarkers);
        map.addLayer(markerClusterGroup);

        return () => {
            markerClusterGroup.clearLayers();
            map.removeLayer(markerClusterGroup);
        };
    }, [map, markers, onMarkerClick]);

    return null;
};

export default MarkerCluster;
