/**
 * 路线导航工具
 *
 * 集成Google Maps、Apple Maps和其他导航应用
 */

interface NavigationOptions {
    latitude: number;
    longitude: number;
    address?: string;
    label?: string;
}

/**
 * 检测用户设备和操作系统
 */
function detectPlatform(): 'ios' | 'android' | 'desktop' {
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;

    // iOS detection
    if (/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream) {
        return 'ios';
    }

    // Android detection
    if (/android/i.test(userAgent)) {
        return 'android';
    }

    return 'desktop';
}

/**
 * 打开Apple Maps导航
 */
export function openAppleMaps(options: NavigationOptions): void {
    const { latitude, longitude, label } = options;
    const url = `http://maps.apple.com/?daddr=${latitude},${longitude}&dirflg=d${label ? `&q=${encodeURIComponent(label)}` : ''}`;
    window.open(url, '_blank');
}

/**
 * 打开Google Maps导航
 */
export function openGoogleMaps(options: NavigationOptions): void {
    const { latitude, longitude, address, label } = options;

    const destination = address
        ? encodeURIComponent(address)
        : `${latitude},${longitude}`;

    const url = `https://www.google.com/maps/dir/?api=1&destination=${destination}${label ? `&destination_place_id=${encodeURIComponent(label)}` : ''}`;
    window.open(url, '_blank');
}

/**
 * 打开Waze导航 (适用于Android和iOS)
 */
export function openWaze(options: NavigationOptions): void {
    const { latitude, longitude } = options;
    const url = `https://waze.com/ul?ll=${latitude},${longitude}&navigate=yes`;
    window.open(url, '_blank');
}

/**
 * 智能导航 - 根据设备自动选择最佳导航应用
 */
export function smartNavigate(options: NavigationOptions): void {
    const platform = detectPlatform();

    switch (platform) {
        case 'ios':
            // iOS优先使用Apple Maps
            openAppleMaps(options);
            break;

        case 'android':
            // Android优先使用Google Maps
            openGoogleMaps(options);
            break;

        case 'desktop':
        default:
            // 桌面端使用Google Maps
            openGoogleMaps(options);
            break;
    }
}

/**
 * 显示导航选择菜单
 * 返回一个Promise，用户选择后resolve
 */
export function showNavigationMenu(options: NavigationOptions): Promise<void> {
    return new Promise((resolve) => {
        const platform = detectPlatform();

        // 创建选项列表
        const navigationOptions: Array<{
            name: string;
            icon: string;
            action: () => void;
        }> = [];

        // Google Maps (所有平台都可用)
        navigationOptions.push({
            name: 'Google Maps',
            icon: '🗺️',
            action: () => openGoogleMaps(options)
        });

        // Apple Maps (iOS优先)
        if (platform === 'ios') {
            navigationOptions.unshift({
                name: 'Apple Maps',
                icon: '🍎',
                action: () => openAppleMaps(options)
            });
        }

        // Waze (移动端)
        if (platform === 'ios' || platform === 'android') {
            navigationOptions.push({
                name: 'Waze',
                icon: '🚗',
                action: () => openWaze(options)
            });
        }

        // 如果只有一个选项，直接打开
        if (navigationOptions.length === 1) {
            navigationOptions[0].action();
            resolve();
            return;
        }

        // 显示选择菜单（这里返回选项，由UI组件处理）
        // 实际实现中，您可以使用toast或modal来显示选项
        console.log('Available navigation options:', navigationOptions);
        resolve();
    });
}

/**
 * 计算两点之间的距离（使用Haversine公式）
 * 返回距离（单位：米）
 */
export function calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
): number {
    const R = 6371e3; // 地球半径（米）
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lng2 - lng1) * Math.PI) / 180;

    const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

/**
 * 格式化距离显示
 */
export function formatDistance(meters: number, language: 'zh' | 'en' = 'zh'): string {
    if (meters < 1000) {
        return language === 'zh' ? `${Math.round(meters)} 米` : `${Math.round(meters)} m`;
    } else {
        const km = (meters / 1000).toFixed(1);
        return language === 'zh' ? `${km} 公里` : `${km} km`;
    }
}

/**
 * 获取估算的步行时间（假设速度5km/h）
 */
export function getWalkingTime(meters: number): number {
    const speedKmh = 5;
    const speedMs = (speedKmh * 1000) / 3600;
    return Math.round(meters / speedMs / 60); // 返回分钟数
}

/**
 * 获取估算的驾车时间（假设速度40km/h城市道路）
 */
export function getDrivingTime(meters: number): number {
    const speedKmh = 40;
    const speedMs = (speedKmh * 1000) / 3600;
    return Math.round(meters / speedMs / 60); // 返回分钟数
}

/**
 * 格式化时间显示
 */
export function formatTime(minutes: number, language: 'zh' | 'en' = 'zh'): string {
    if (minutes < 60) {
        return language === 'zh' ? `${minutes} 分钟` : `${minutes} min`;
    } else {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (language === 'zh') {
            return mins > 0 ? `${hours} 小时 ${mins} 分钟` : `${hours} 小时`;
        } else {
            return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
        }
    }
}

/**
 * 导出完整的导航信息
 */
export interface NavigationInfo {
    distance: {
        meters: number;
        formatted: string;
    };
    walkingTime: {
        minutes: number;
        formatted: string;
    };
    drivingTime: {
        minutes: number;
        formatted: string;
    };
}

/**
 * 获取完整的导航信息
 */
export function getNavigationInfo(
    fromLat: number,
    fromLng: number,
    toLat: number,
    toLng: number,
    language: 'zh' | 'en' = 'zh'
): NavigationInfo {
    const distanceMeters = calculateDistance(fromLat, fromLng, toLat, toLng);
    const walkingMinutes = getWalkingTime(distanceMeters);
    const drivingMinutes = getDrivingTime(distanceMeters);

    return {
        distance: {
            meters: distanceMeters,
            formatted: formatDistance(distanceMeters, language)
        },
        walkingTime: {
            minutes: walkingMinutes,
            formatted: formatTime(walkingMinutes, language)
        },
        drivingTime: {
            minutes: drivingMinutes,
            formatted: formatTime(drivingMinutes, language)
        }
    };
}
