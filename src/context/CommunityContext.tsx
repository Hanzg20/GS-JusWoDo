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
    const { activeNodeId, setActiveNode, setRefCodes } = useConfigStore();
    const { setProviders } = useProviderStore();
    const [isLoading, setIsLoading] = React.useState(true);

    const { currentUser } = useAuthStore();

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
