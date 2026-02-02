import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { RefCode } from '@/types/domain';

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
            activeNodeId: 'NODE_LEES', // Default to Lees for Phase 1
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
                isLanguageAutoDetected: state.isLanguageAutoDetected
            }), // Persist language, location, and detection flag
        }
    )
);
