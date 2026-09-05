import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { toast } from 'sonner';
import { RefCode } from '@/types/domain';
import { haversineMeters } from '@/lib/geo';

// Nearest known node must be within this radius for the area to count as
// "in service" — wide enough to cover Ottawa-Gatineau and surrounding rural
// fringes, tight enough to exclude Montreal (~190km) or Toronto (~400km).
const SERVICE_AREA_RADIUS_METERS = 60000;

interface ConfigState {
    activeNodeId: string; // The selected Pilot Node (e.g. NODE_LEES)
    refCodes: RefCode[];
    language: 'en' | 'zh';
    isLanguageAutoDetected: boolean; // Track if language was auto-detected
    isLocationAutoDetected: boolean; // Track if we've already tried geolocation once
    setActiveNode: (nodeId: string) => void;
    setRefCodes: (codes: RefCode[]) => void;
    setLanguage: (lang: 'en' | 'zh') => void;
    initializeLanguage: () => void;
    detectLocation: () => void;
}

// Detect browser language
const detectBrowserLanguage = (): 'en' | 'zh' => {
    // Get browser language(s)
    const browserLang = navigator.language || (navigator as any).userLanguage;

    console.log('[Language Detection] Browser language:', browserLang);
    console.log('[Language Detection] All languages:', navigator.languages);

    // Check if Chinese
    if (browserLang.toLowerCase().startsWith('zh')) {
        console.log('[Language Detection] Detected Chinese, setting to zh');
        return 'zh';
    }

    // Default to English
    console.log('[Language Detection] Detected non-Chinese, setting to en');
    return 'en';
};

export const useConfigStore = create<ConfigState>()(
    persist(
        (set, get) => ({
            activeNodeId: 'NODE_LEES', // Default to Lees for Phase 1
            refCodes: [],
            language: 'en', // Default language (will be auto-detected on first run)
            isLanguageAutoDetected: false,
            isLocationAutoDetected: false,
            setActiveNode: (nodeId) => set({ activeNodeId: nodeId }),
            setRefCodes: (codes) => set({ refCodes: codes }),
            setLanguage: (lang) => set({ language: lang, isLanguageAutoDetected: true }),
            initializeLanguage: () => {
                const state = get();
                // Only auto-detect if language has never been set by user
                if (!state.isLanguageAutoDetected) {
                    const detectedLang = detectBrowserLanguage();
                    console.log('[Language Detection] First run, setting language to:', detectedLang);
                    set({ language: detectedLang, isLanguageAutoDetected: true });
                } else {
                    console.log('[Language Detection] Language already set, keeping:', state.language);
                }
            },
            detectLocation: () => {
                const state = get();
                // Only run once ever — a returning visitor's activeNodeId is
                // theirs to keep, whether it came from this or from a manual pick.
                if (state.isLocationAutoDetected) return;

                if (!navigator.geolocation) {
                    set({ isLocationAutoDetected: true });
                    return;
                }

                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const { latitude, longitude } = position.coords;
                        const isZh = get().language === 'zh';
                        const nodes = get().refCodes.filter(
                            r => r.type === 'NODE' && r.extraData?.lat != null && r.extraData?.lng != null
                        );

                        let nearest: RefCode | null = null;
                        let nearestDistance = Infinity;
                        for (const node of nodes) {
                            const d = haversineMeters(latitude, longitude, node.extraData.lat, node.extraData.lng);
                            if (d < nearestDistance) {
                                nearestDistance = d;
                                nearest = node;
                            }
                        }

                        if (nearest && nearestDistance <= SERVICE_AREA_RADIUS_METERS) {
                            set({ activeNodeId: nearest.codeId, isLocationAutoDetected: true });
                            // Neighborhood name is always English — see NodePicker.tsx.
                            const label = nearest.enName || nearest.zhName;
                            toast.success(isZh ? `已为您定位到「${label}」` : `Located you in ${label}`);
                        } else {
                            set({ isLocationAutoDetected: true });
                            toast.info(
                                isZh
                                    ? '该地区暂未开通服务，您可以在页面顶部手动选择所在社区'
                                    : "This area isn't in our service zone yet — pick your community manually at the top of the page"
                            );
                        }
                    },
                    () => {
                        // Permission denied / unavailable / timed out — stay on the
                        // default node and don't nag; they can still pick manually.
                        set({ isLocationAutoDetected: true });
                    },
                    { timeout: 8000, maximumAge: 60 * 60 * 1000 }
                );
            },
        }),
        {
            name: 'gig-neighbor-config',
            partialize: (state) => ({
                language: state.language,
                activeNodeId: state.activeNodeId,
                isLanguageAutoDetected: state.isLanguageAutoDetected,
                isLocationAutoDetected: state.isLocationAutoDetected,
            }), // Persist language, location, and both detection flags
        }
    )
);
