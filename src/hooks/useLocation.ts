import { useState, useEffect } from 'react';

interface LocationState {
    coords: {
        lat: number;
        lng: number;
    } | null;
    loading: boolean;
    error: string | null;
}

export const useLocation = () => {
    const [state, setState] = useState<LocationState>({
        coords: null,
        loading: true,
        error: null,
    });

    useEffect(() => {
        if (!navigator.geolocation) {
            setState(prev => ({ ...prev, loading: false, error: 'Geolocation is not supported by your browser' }));
            return;
        }

        const onSuccess = (position: GeolocationPosition) => {
            setState({
                coords: {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                },
                loading: false,
                error: null,
            });
        };

        const onError = (error: GeolocationPositionError) => {
            setState(prev => ({
                ...prev,
                loading: false,
                error: error.message,
            }));
        };

        navigator.geolocation.getCurrentPosition(onSuccess, onError, {
            enableHighAccuracy: false, // More reliable for desktop/IP-based location
            timeout: 15000, // 15 seconds
            maximumAge: 0,
        });
    }, []);

    return state;
};
