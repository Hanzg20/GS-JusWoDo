/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_SUPABASE_URL: string
    readonly VITE_SUPABASE_ANON_KEY: string
    readonly VITE_USE_MOCK_DATA: string

    // Multi-environment specific
    readonly VITE_SUPABASE_URL_PROD: string
    readonly VITE_SUPABASE_ANON_KEY_PROD: string
    readonly VITE_SUPABASE_URL_TEST: string
    readonly VITE_SUPABASE_ANON_KEY_TEST: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
