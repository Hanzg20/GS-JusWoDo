import { create } from 'zustand';
import { User } from '@/types/domain';
import { supabase, onAuthStateChange } from '@/lib/supabase';

interface AuthState {
    currentUser: User | null;
    isLoading: boolean;
    login: (user: User) => void;
    logout: () => void;
    updateUser: (updates: Partial<User>) => void;
    refreshBalance: () => Promise<void>;
    initializeAuth: (forcedSession?: any) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    currentUser: null,
    isLoading: true,

    login: (user: User) => {
        set({ currentUser: user, isLoading: false });
    },

    logout: async () => {
        // Sign out from Supabase
        try {
            await supabase.auth.signOut();
        } catch (error) {
            console.error('Error signing out from Supabase:', error);
        }

        set({ currentUser: null, isLoading: false });
    },

    updateUser: (updates: Partial<User>) => {
        const currentUser = get().currentUser;
        if (currentUser) {
            set({ currentUser: { ...currentUser, ...updates } });
        }
    },

    refreshBalance: async () => {
        const currentUser = get().currentUser;
        if (!currentUser) return;

        try {
            const { data, error } = await supabase
                .from('user_profiles')
                .select('beans_balance')
                .eq('id', currentUser.id)
                .single();

            if (!error && data) {
                set({ currentUser: { ...currentUser, beansBalance: data.beans_balance } });
            }
        } catch (error) {
            console.error('Error refreshing balance:', error);
        }
    },

    initializeAuth: async (forcedSession?: any) => {
        set({ isLoading: true });

        try {
            // Use forced session if provided, otherwise get from Supabase
            const { data: { session } } = forcedSession ? { data: { session: forcedSession } } : await supabase.auth.getSession();

            if (session?.user) {
                // Fetch user profile from database
                let { data: profile, error } = await supabase
                    .from('user_profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .maybeSingle();

                // If profile doesn't exist, create it (for phone/OAuth login)
                if (!profile && !error) {
                    console.log('📝 Creating user_profiles for new user:', session.user.id);

                    // Generate default name
                    let defaultName = 'Neighbor';
                    if (session.user.user_metadata?.name || session.user.user_metadata?.full_name) {
                        defaultName = session.user.user_metadata.name || session.user.user_metadata.full_name;
                    } else if (session.user.email) {
                        defaultName = session.user.email.split('@')[0];
                    } else if (session.user.phone) {
                        defaultName = `User_${session.user.phone.slice(-4)}`;
                    }

                    // Create user_profiles
                    const { data: newProfile, error: insertError } = await supabase
                        .from('user_profiles')
                        .insert({
                            id: session.user.id,
                            email: session.user.email || null,
                            phone: session.user.phone || null,
                            name: defaultName,
                            node_id: 'NODE_LEES',
                            avatar: session.user.user_metadata?.avatar_url ||
                                session.user.user_metadata?.picture ||
                                `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.user.id}`,
                            roles: ['BUYER'],
                            beans_balance: 100 // Welcome Bonus
                        })
                        .select()
                        .single();

                    if (insertError) {
                        console.error('❌ Error creating user profile:', insertError);
                        set({ currentUser: null, isLoading: false });
                        return;
                    }

                    profile = newProfile;
                    console.log('✅ Successfully created user_profiles for:', session.user.id);
                } else if (error) {
                    console.error('❌ Error fetching user profile:', error);
                    set({ currentUser: null, isLoading: false });
                    return;
                }

                if (!profile) {
                    set({ currentUser: null, isLoading: false });
                    return;
                }

                // Map database profile to User type
                const user: User = {
                    id: profile.id,
                    email: profile.email,
                    name: profile.name,
                    avatar: profile.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.id}`,
                    phone: profile.phone,
                    bio: profile.bio,
                    settings: profile.settings,
                    roles: profile.roles || ['BUYER'],
                    permissions: profile.permissions || [],
                    joinedDate: profile.created_at,
                    beansBalance: profile.beans_balance || 0,
                    providerProfileId: profile.provider_profile_id,
                    isVerifiedProvider: !!profile.provider_profile_id,
                    nodeId: profile.node_id
                };

                // Sync language from profile to config store if present
                if (user.settings?.language) {
                    const { language, setLanguage } = await import('@/stores/configStore').then(m => m.useConfigStore.getState());
                    if (language !== user.settings?.language) {
                        console.log(`[Auth] Syncing language from profile: ${user.settings?.language}`);
                        setLanguage(user.settings?.language);
                    }
                }

                set({ currentUser: user, isLoading: false });
            } else {
                // If no session from Supabase, we are logged out
                set({ currentUser: null, isLoading: false });
            }
        } catch (error) {
            console.error('Error initializing auth:', error);
            set({ currentUser: null, isLoading: false });
        }
    },
}));

// Subscribe to Supabase auth state changes
onAuthStateChange(async (session) => {
    const store = useAuthStore.getState();

    if (session?.user) {
        // User logged in - initialize/refresh auth state
        await store.initializeAuth();
    } else {
        // User logged out - clear state
        if (store.currentUser) {
            store.logout();
        }
    }
});

// Auto-initialize on app load
if (typeof window !== 'undefined') {
    useAuthStore.getState().initializeAuth();
}
