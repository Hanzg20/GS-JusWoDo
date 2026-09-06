import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useConfigStore } from '@/stores/configStore';
import { useAuthStore } from '@/stores/authStore';
import { useProviderStore } from '@/stores/providerStore';
import { repositoryFactory } from '@/services/repositories/factory';

interface CommunityContextType {
    activeNodeId: string;
    setActiveNode: (nodeId: string) => void;
    isLoading: boolean;
}

const CommunityContext = createContext<CommunityContextType | undefined>(undefined);

export const CommunityProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { activeNodeId, setActiveNode, setRefCodes, detectLocation, locationDetectionSucceeded } = useConfigStore();
    const { setProviders } = useProviderStore();
    const [isLoading, setIsLoading] = React.useState(true);

    const { currentUser, isLoading: isAuthLoading, updateUser } = useAuthStore();

    useEffect(() => {
        // Initialize RefCodes and Nodes on startup
        const initConfig = async () => {
            try {
                const repo = repositoryFactory.getRefCodeRepository();
                const codes = await repo.getAll();
                setRefCodes(codes);
            } catch (error) {
                console.error('Failed to initialize community config:', error);
            } finally {
                setIsLoading(false);
            }
        };

        initConfig();
    }, [setRefCodes]);

    // Nothing anywhere ever called setProviders() before this — the store
    // existed but was permanently empty, so every ListingCard.tsx's
    // getProviderById() lookup silently returned undefined (Business vs
    // Handyman always fell through to Handyman, the "M/N" identity badge
    // and business name line under a card's title never rendered at all).
    // Fine to fetch everything at this scale; revisit if the provider count
    // grows enough to matter.
    useEffect(() => {
        repositoryFactory.getProviderRepository().getAll()
            .then(setProviders)
            .catch(error => console.error('Failed to load providers:', error));
    }, [setProviders]);

    // Sync active node with user profile on login
    useEffect(() => {
        if (currentUser?.nodeId) {
            setActiveNode(currentUser.nodeId);
        }
    }, [currentUser, setActiveNode]);

    // First-visit geolocation: once refCodes (node coordinates) are loaded and
    // we know whether this person already has a home node on their profile,
    // try to place them automatically. detectLocation() no-ops after the
    // first attempt (tracked via the persisted isLocationAutoDetected flag)
    // and never overrides a node the user or their profile already set.
    useEffect(() => {
        if (isLoading || isAuthLoading) return;
        if (currentUser?.nodeId) return;
        detectLocation();
    }, [isLoading, isAuthLoading, currentUser, detectLocation]);

    // detectLocation() above only sets local state — a signed-in user whose
    // profile still has no node (fresh signup, see handle_new_oauth_user())
    // needs a genuine detection result written back to user_profiles.node_id,
    // or it's lost the moment they reload / log in elsewhere. Gated on
    // locationDetectionSucceeded (not just isLocationAutoDetected) so a
    // denied/unavailable/out-of-area result — which leaves activeNodeId at
    // whatever ambient default was already showing — never gets written as
    // if it were a real answer; leaving node_id null lets them try again
    // later or pick manually, without reintroducing the fake-default bug.
    useEffect(() => {
        if (!currentUser || currentUser.nodeId) return;
        if (!locationDetectionSucceeded) return;

        repositoryFactory.getAuthRepository()
            .updateProfile(currentUser.id, { nodeId: activeNodeId })
            .then(updated => updateUser(updated))
            .catch(err => console.error('Failed to persist detected node to profile:', err));
    }, [currentUser, locationDetectionSucceeded, activeNodeId, updateUser]);

    return (
        <CommunityContext.Provider value={{ activeNodeId, setActiveNode, isLoading }}>
            {children}
        </CommunityContext.Provider>
    );
};

export const useCommunity = () => {
    const context = useContext(CommunityContext);
    if (context === undefined) {
        throw new Error('useCommunity must be used within a CommunityProvider');
    }
    return context;
};
