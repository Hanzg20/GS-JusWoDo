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

        // 创建聚类图层组
        const markerClusterGroup = L.markerClusterGroup({
            // 聚类配置
            maxClusterRadius: 80, // 聚类半径（像素）
            spiderfyOnMaxZoom: true, // 最大缩放时展开蜘蛛网
            showCoverageOnHover: false, // 悬停时不显示覆盖范围
            zoomToBoundsOnClick: true, // 点击聚类时缩放到边界
            disableClusteringAtZoom: 18, // 在此缩放级别禁用聚类

            // 自定义聚类图标
            iconCreateFunction: (cluster: any) => {
                const count = cluster.getChildCount();
                let size = 'small';
                let className = 'marker-cluster-small';

                if (count >= 10) {
                    size = 'medium';
                    className = 'marker-cluster-medium';
                }
                if (count >= 50) {
                    size = 'large';
                    className = 'marker-cluster-large';
                }

                return L.divIcon({
                    html: `<div><span>${count}</span></div>`,
                    className: `marker-cluster ${className}`,
                    iconSize: L.point(40, 40)
                });
            }
        });

        // 添加标记到聚类组
        markers.forEach((markerData) => {
            const marker = L.marker(markerData.position, {
                icon: markerData.icon
            });

            // 绑定弹出窗口
            if (typeof markerData.popup === 'string') {
                marker.bindPopup(markerData.popup);
            } else {
                marker.bindPopup(markerData.popup);
            }

            // 添加点击事件
            if (onMarkerClick) {
                marker.on('click', () => onMarkerClick(markerData.id));
            }

            markerClusterGroup.addLayer(marker);
        });

        // 将聚类组添加到地图
        map.addLayer(markerClusterGroup);

        // 清理函数
        return () => {
            map.removeLayer(markerClusterGroup);
        };
    }, [map, markers, onMarkerClick]);

    return null;
};

export default MarkerCluster;
