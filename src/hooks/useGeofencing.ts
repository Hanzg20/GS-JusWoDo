import { useState, useEffect, useCallback, useRef } from 'react';
import { calculateDistance } from '@/utils/navigation';
import { toast } from 'sonner';

export interface GeofenceRegion {
    id: string;
    latitude: number;
    longitude: number;
    radiusMeters: number;
    name?: string;
    onEnter?: (region: GeofenceRegion) => void;
    onExit?: (region: GeofenceRegion) => void;
}

interface GeofenceState {
    [key: string]: boolean; // region id -> isInside
}

interface UseGeofencingOptions {
    enabled?: boolean;
    checkInterval?: number; // 检查间隔（毫秒）
    showNotifications?: boolean; // 是否显示通知
}

/**
 * 地理围栏Hook
 *
 * 功能：
 * - 监控用户位置
 * - 检测进入/退出地理围栏
 * - 触发自定义回调或通知
 * - 支持多个地理围栏区域
 *
 * 使用示例：
 * ```typescript
 * const { addRegion, removeRegion, insideRegions } = useGeofencing({
 *   enabled: true,
 *   showNotifications: true
 * });
 *
 * useEffect(() => {
 *   addRegion({
 *     id: 'service-area-1',
 *     latitude: 45.4215,
 *     longitude: -75.6972,
 *     radiusMeters: 5000,
 *     name: 'Home Repair Service Area',
 *     onEnter: (region) => console.log('Entered:', region.name),
 *     onExit: (region) => console.log('Exited:', region.name)
 *   });
 * }, []);
 * ```
 */
export function useGeofencing(options: UseGeofencingOptions = {}) {
    const {
        enabled = true,
        checkInterval = 30000, // 默认30秒检查一次
        showNotifications = false
    } = options;

    const [regions, setRegions] = useState<Map<string, GeofenceRegion>>(new Map());
    const [geofenceState, setGeofenceState] = useState<GeofenceState>({});
    const [currentPosition, setCurrentPosition] = useState<GeolocationPosition | null>(null);
    const [locationError, setLocationError] = useState<string | null>(null);
    const watchIdRef = useRef<number | null>(null);
    const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // 添加地理围栏区域
    const addRegion = useCallback((region: GeofenceRegion) => {
        setRegions(prev => {
            const newMap = new Map(prev);
            newMap.set(region.id, region);
            return newMap;
        });
    }, []);

    // 移除地理围栏区域
    const removeRegion = useCallback((regionId: string) => {
        setRegions(prev => {
            const newMap = new Map(prev);
            newMap.delete(regionId);
            return newMap;
        });
        setGeofenceState(prev => {
            const newState = { ...prev };
            delete newState[regionId];
            return newState;
        });
    }, []);

    // 清空所有地理围栏
    const clearAllRegions = useCallback(() => {
        setRegions(new Map());
        setGeofenceState({});
    }, []);

    // 检查用户是否在某个区域内
    const checkRegion = useCallback((
        userLat: number,
        userLng: number,
        region: GeofenceRegion
    ): boolean => {
        const distance = calculateDistance(
            userLat,
            userLng,
            region.latitude,
            region.longitude
        );
        return distance <= region.radiusMeters;
    }, []);

    // 检查所有地理围栏
    const checkAllRegions = useCallback((position: GeolocationPosition) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;

        regions.forEach((region) => {
            const isInside = checkRegion(userLat, userLng, region);
            const wasInside = geofenceState[region.id] || false;

            // 状态改变时触发回调
            if (isInside && !wasInside) {
                // 进入区域
                console.log(`[Geofence] Entered region: ${region.name || region.id}`);

                if (showNotifications) {
                    toast.success('进入服务区域', {
                        description: region.name || `您已进入 ${region.radiusMeters / 1000}km 范围内`
                    });
                }

                region.onEnter?.(region);
            } else if (!isInside && wasInside) {
                // 离开区域
                console.log(`[Geofence] Exited region: ${region.name || region.id}`);

                if (showNotifications) {
                    toast.info('离开服务区域', {
                        description: region.name || `您已离开服务范围`
                    });
                }

                region.onExit?.(region);
            }

            // 更新状态
            if (isInside !== wasInside) {
                setGeofenceState(prev => ({
                    ...prev,
                    [region.id]: isInside
                }));
            }
        });
    }, [regions, geofenceState, checkRegion, showNotifications]);

    // 启动位置监控
    useEffect(() => {
        if (!enabled || typeof window === 'undefined' || !navigator.geolocation) {
            return;
        }

        // 请求位置权限并开始监控
        const startWatching = () => {
            watchIdRef.current = navigator.geolocation.watchPosition(
                (position) => {
                    setCurrentPosition(position);
                    setLocationError(null);
                    checkAllRegions(position);
                },
                (error) => {
                    console.error('[Geofence] Location error:', error);
                    setLocationError(error.message);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                }
            );
        };

        startWatching();

        // 定期检查（作为backup）
        checkIntervalRef.current = setInterval(() => {
            if (currentPosition) {
                checkAllRegions(currentPosition);
            }
        }, checkInterval);

        // 清理函数
        return () => {
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
            }
            if (checkIntervalRef.current) {
                clearInterval(checkIntervalRef.current);
            }
        };
    }, [enabled, checkInterval, checkAllRegions, currentPosition]);

    // 获取当前在哪些区域内
    const insideRegions = Array.from(regions.values()).filter(
        region => geofenceState[region.id]
    );

    // 手动触发检查
    const checkNow = useCallback(() => {
        if (currentPosition) {
            checkAllRegions(currentPosition);
        }
    }, [currentPosition, checkAllRegions]);

    return {
        addRegion,
        removeRegion,
        clearAllRegions,
        insideRegions,
        currentPosition,
        locationError,
        isLocationEnabled: enabled && !!currentPosition,
        checkNow
    };
}

/**
 * 简化版Hook - 用于单个服务区域监控
 */
export function useServiceAreaMonitor(
    serviceLat: number,
    serviceLng: number,
    radiusKm: number,
    serviceName?: string
) {
    const [isInArea, setIsInArea] = useState(false);
    const [distance, setDistance] = useState<number | null>(null);

    const { addRegion, insideRegions, currentPosition } = useGeofencing({
        enabled: true,
        showNotifications: true
    });

    useEffect(() => {
        addRegion({
            id: 'service-area',
            latitude: serviceLat,
            longitude: serviceLng,
            radiusMeters: radiusKm * 1000,
            name: serviceName,
            onEnter: () => setIsInArea(true),
            onExit: () => setIsInArea(false)
        });
    }, [serviceLat, serviceLng, radiusKm, serviceName, addRegion]);

    useEffect(() => {
        if (currentPosition) {
            const dist = calculateDistance(
                currentPosition.coords.latitude,
                currentPosition.coords.longitude,
                serviceLat,
                serviceLng
            );
            setDistance(dist);
        }
    }, [currentPosition, serviceLat, serviceLng]);

    return {
        isInArea,
        distance,
        insideRegions
    };
}
