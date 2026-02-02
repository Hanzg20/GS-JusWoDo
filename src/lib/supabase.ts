import { createClient } from '@supabase/supabase-js';

// Define configuration
const getSupabaseConfig = () => {
    const hostname = typeof window !== 'undefined' ? window.location.hostname : '';

    // PROD Environment
    if (hostname === 'justwedo.com' || hostname === 'www.justwedo.com') {
        const url = import.meta.env.VITE_SUPABASE_URL_PROD;
        const key = import.meta.env.VITE_SUPABASE_ANON_KEY_PROD;
        if (url && key) {
            console.log('🚀 Supabase: Connected to PRODUCTION');
            return { url, key };
        }
    }

    // TEST/DEV Environment (Default)
    // Used for hh.jinbean.com, localhost, and fallback
    const url = import.meta.env.VITE_SUPABASE_URL_TEST || import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY_TEST || import.meta.env.VITE_SUPABASE_ANON_KEY;

    console.log('🧪 Supabase: Connected to TEST/DEV');
    return { url, key };
};

const { url: supabaseUrl, key: supabaseAnonKey } = getSupabaseConfig();

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
    }
});

// Helper: Check if using mock data
export const isUsingMockData = () => {
    return import.meta.env.VITE_USE_MOCK_DATA === 'true' || !supabaseUrl;
};

// Helper: Get current user session
export const getCurrentSession = async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
        console.error('Error getting session:', error);
        return null;
    }
    return session;
};

// Helper: Sign in with email OTP
export const signInWithEmail = async (email: string) => {
    const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
            emailRedirectTo: window.location.origin,
        },
    });

    if (error) throw error;
    return data;
};

// Helper: Sign out
export const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
};

// Helper: Subscribe to auth state changes
export const onAuthStateChange = (callback: (session: any) => void) => {
    return supabase.auth.onAuthStateChange((_event, session) => {
        callback(session);
    });
};

// Helper to check connection
export const testConnection = async () => {
    try {
        const { data, error } = await supabase.from('ref_codes').select('count');
        if (error) throw error;
        console.log('✅ Supabase connected successfully');
        return true;
    } catch (error) {
        console.error('❌ Supabase connection failed:', error);
        return false;
    }
};
