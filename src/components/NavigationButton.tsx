import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Navigation, MapPin, Car, Clock } from "lucide-react";
import { smartNavigate, openGoogleMaps, openAppleMaps, openWaze, getNavigationInfo } from "@/utils/navigation";
import { useLocation } from "@/hooks/useLocation";
import { toast } from "sonner";

interface NavigationButtonProps {
    latitude: number;
    longitude: number;
    address?: string;
    label?: string;
    variant?: 'default' | 'outline' | 'ghost';
    size?: 'default' | 'sm' | 'lg' | 'icon';
    className?: string;
    showDropdown?: boolean;
}

const NavigationButton: React.FC<NavigationButtonProps> = ({
    latitude,
    longitude,
    address,
    label,
    variant = 'default',
    size = 'default',
    className = '',
    showDropdown = true
}) => {
    const { coords } = useLocation();
    const [isOpen, setIsOpen] = useState(false);

    const navigationOptions = {
        latitude,
        longitude,
        address,
        label
    };

    const handleSmartNavigate = () => {
        smartNavigate(navigationOptions);
        toast.success('正在打开导航应用...', {
            description: address || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
        });
    };

    // 计算距离信息
    const navInfo = coords
        ? getNavigationInfo(coords.lat, coords.lng, latitude, longitude, 'zh')
        : null;

    // 如果不显示下拉菜单，使用简单按钮
    if (!showDropdown) {
        return (
            <Button
                variant={variant}
                size={size}
                className={className}
                onClick={handleSmartNavigate}
            >
                <Navigation className="w-4 h-4 mr-2" />
                导航
            </Button>
        );
    }

    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant={variant} size={size} className={className}>
                    <Navigation className="w-4 h-4 mr-2" />
                    导航
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
                {/* 距离信息 */}
                {navInfo && (
                    <>
                        <div className="px-3 py-2 text-xs">
                            <div className="flex items-center gap-2 mb-2">
                                <MapPin className="w-3 h-3 text-primary" />
                                <span className="font-semibold text-primary">
                                    {navInfo.distance.formatted}
                                </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                                <div className="flex items-center gap-1">
                                    <span>🚶</span>
                                    <span>{navInfo.walkingTime.formatted}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Car className="w-3 h-3" />
                                    <span>{navInfo.drivingTime.formatted}</span>
                                </div>
                            </div>
                        </div>
                        <DropdownMenuSeparator />
                    </>
                )}

                {/* 导航选项 */}
                <DropdownMenuItem
                    onClick={() => {
                        openGoogleMaps(navigationOptions);
                        setIsOpen(false);
                    }}
                    className="cursor-pointer"
                >
                    <div className="flex items-center gap-3">
                        <span className="text-lg">🗺️</span>
                        <div>
                            <p className="font-medium">Google Maps</p>
                            <p className="text-xs text-muted-foreground">使用Google地图导航</p>
                        </div>
                    </div>
                </DropdownMenuItem>

                <DropdownMenuItem
                    onClick={() => {
                        openAppleMaps(navigationOptions);
                        setIsOpen(false);
                    }}
                    className="cursor-pointer"
                >
                    <div className="flex items-center gap-3">
                        <span className="text-lg">🍎</span>
                        <div>
                            <p className="font-medium">Apple Maps</p>
                            <p className="text-xs text-muted-foreground">使用苹果地图导航</p>
                        </div>
                    </div>
                </DropdownMenuItem>

                <DropdownMenuItem
                    onClick={() => {
                        openWaze(navigationOptions);
                        setIsOpen(false);
                    }}
                    className="cursor-pointer"
                >
                    <div className="flex items-center gap-3">
                        <span className="text-lg">🚗</span>
                        <div>
                            <p className="font-medium">Waze</p>
                            <p className="text-xs text-muted-foreground">使用Waze实时路况导航</p>
                        </div>
                    </div>
                </DropdownMenuItem>

                {address && (
                    <>
                        <DropdownMenuSeparator />
                        <div className="px-3 py-2 text-xs text-muted-foreground">
                            <p className="font-medium mb-1">目的地地址：</p>
                            <p className="line-clamp-2">{address}</p>
                        </div>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default NavigationButton;
