import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { toast } from 'sonner';
import { RefCode } from '@/types/domain';
import { haversineMeters } from '@/lib/geo';

// Launch-phase call: pilot listing/post density is still thin enough that
// hard-filtering a feed down to one node (NODE_LEES et al) risks showing
// new users an empty page even when relevant content exists a few km away
// in another node — worse for a cold-start marketplace than showing
// something slightly farther away with its distance tag attached. Revisit
// once density grows per-node (flip to false, or make it conditional on a
// per-node listing count once that's worth the complexity).
//
// Only wraps the *read* side (call sites that filter a feed); activeNodeId
// itself is untouched, so publish/register flows still assign a real node —
// passing this sentinel there would silently corrupt data (a listing whose
// node_id nothing ever queries for again).
const SHOW_ALL_OTTAWA = true;

export function browseNodeId(nodeId: string): string | undefined {
    return SHOW_ALL_OTTAWA ? undefined : nodeId;
}

// Nearest known node must be within this radius for the area to count as
// "in service" — wide enough to cover Ottawa-Gatineau and surrounding rural
// fringes, tight enough to exclude Montreal (~190km) or Toronto (~400km).
// Exported since MapDiscovery.tsx's default search radius reuses it — the
// pilot's whole listing base fits inside one service area, so a map search
// should too, rather than defaulting to a few km that only covers whichever
// single neighborhood the viewer happens to be standing in.
export const SERVICE_AREA_RADIUS_METERS = 60000;

interface ConfigState {
    activeNodeId: string; // The selected Pilot Node (e.g. NODE_LEES)
    refCodes: RefCode[];
    language: 'en' | 'zh';
    isLanguageAutoDetected: boolean; // Track if language was auto-detected
    isLocationAutoDetected: boolean; // Track if we've already tried geolocation once
    locationDetectionSucceeded: boolean; // True only when detection found a real nearby node — see detectLocation()
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
            locationDetectionSucceeded: false,
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
                            set({ activeNodeId: nearest.codeId, isLocationAutoDetected: true, locationDetectionSucceeded: true });
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
