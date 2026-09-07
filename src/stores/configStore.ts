import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { RefCode } from '@/types/domain';

// Sentinel activeNodeId meaning "every node, not just one" — a real,
// user-selectable choice in NodePicker.tsx (shown as "Ottawa (All)"), and
// also the actual default a fresh visitor starts on (see activeNodeId
// below). Launch-phase call: pilot listing/post density is still thin
// enough that starting someone hard-scoped to one node (NODE_LEES et al)
// risked showing an empty page even when relevant content existed a few km
// away in another node — worse for a cold-start marketplace than showing
// something slightly farther away with its distance tag attached. Revisit
// once density grows per-node (change the default below to a real node, or
// make it conditional on a per-node listing count once that's worth the
// complexity) — picking a specific neighborhood already filters for real,
// this only concerns the starting point.
export const NODE_ALL = 'ALL';

export function browseNodeId(nodeId: string): string | undefined {
    return nodeId === NODE_ALL ? undefined : nodeId;
}

// The inverse case: publish/register flows need one real node_id to write,
// even when activeNodeId is currently NODE_ALL — writing the literal
// string "ALL" as a node_id would create a listing/profile nothing ever
// queries for again. Falls back to the same NODE_LEES default these flows
// already used before NODE_ALL existed.
export function writeNodeId(nodeId: string): string {
    return nodeId === NODE_ALL ? 'NODE_LEES' : nodeId;
}

// Wide enough to cover Ottawa-Gatineau and surrounding rural fringes, tight
// enough to exclude Montreal (~190km) or Toronto (~400km). Used by
// MapDiscovery.tsx as its default search radius — the pilot's whole listing
// base fits inside one service area, so a map search should too, rather
// than defaulting to a few km that only covers wherever the viewer is
// standing.
export const SERVICE_AREA_RADIUS_METERS = 60000;

interface ConfigState {
    activeNodeId: string; // The selected Pilot Node (e.g. NODE_LEES)
    refCodes: RefCode[];
    language: 'en' | 'zh';
    isLanguageAutoDetected: boolean; // Track if language was auto-detected
    setActiveNode: (nodeId: string) => void;
    setRefCodes: (codes: RefCode[]) => void;
    setLanguage: (lang: 'en' | 'zh') => void;
    initializeLanguage: () => void;
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
            activeNodeId: NODE_ALL, // Launch default — see NODE_ALL above
            refCodes: [],
            language: 'en', // Default language (will be auto-detected on first run)
            isLanguageAutoDetected: false,
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
        }),
        {
            name: 'gig-neighbor-config',
            partialize: (state) => ({
                language: state.language,
                activeNodeId: state.activeNodeId,
                isLanguageAutoDetected: state.isLanguageAutoDetected,
            }), // Persist language and location choice
        }
    )
);
