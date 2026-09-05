import { create } from 'zustand';
import { ListingMaster, ListingItem, ListingType } from '@/types/domain';
import { toast } from 'sonner';

interface ListingState {
    listings: ListingMaster[];
    listingItems: ListingItem[];
    isLoading: boolean;
    error: string | null;
    setListings: (listings: ListingMaster[]) => void;
    setListingItems: (items: ListingItem[]) => void;
    addListing: (listing: ListingMaster, items: ListingItem[]) => void;
    createListing: (listing: Omit<ListingMaster, 'id' | 'createdAt' | 'updatedAt'>, items: Omit<ListingItem, 'id' | 'createdAt' | 'updatedAt'>[]) => Promise<ListingMaster>;
    updateListing: (id: string, listing: Partial<ListingMaster>, items?: Partial<ListingItem>[]) => Promise<void>;
    deleteListing: (id: string) => Promise<void>;
    fetchListings: () => Promise<void>;
    searchListings: (options: { query?: string, isSemantic?: boolean, nodeId?: string, categoryId?: string, type?: ListingType, limit?: number, offset?: number, sortBy?: 'rating' | 'reviews' | 'newest' }) => Promise<void>;
    loadMoreListings: (options: { query?: string, isSemantic?: boolean, nodeId?: string, categoryId?: string, type?: ListingType, limit?: number, offset?: number, sortBy?: 'rating' | 'reviews' | 'newest' }) => Promise<void>;
    toggleItemAvailability: (itemId: string) => Promise<void>;
}

import { repositoryFactory } from '@/services/repositories/factory';

export const useListingStore = create<ListingState>((set, get) => ({
    listings: [],
    listingItems: [],
    isLoading: false,
    error: null,
    setListings: (listings) => set({ listings }),
    setListingItems: (listingItems) => set({ listingItems }),
    addListing: (listing, items) => set((state) => ({
        listings: [listing, ...state.listings],
        listingItems: [...items, ...state.listingItems]
    })),
    createListing: async (listingData, itemsData) => {
        set({ isLoading: true, error: null });
        try {
            const masterRepo = repositoryFactory.getListingRepository();
            const itemRepo = repositoryFactory.getListingItemRepository();

            const { useAuthStore } = await import('@/stores/authStore');
            const currentUser = useAuthStore.getState().currentUser;

            if (!currentUser) {
                throw new Error("Please log in to continue.");
            }

            let providerProfileId = currentUser.providerProfileId;

            // listing_masters.provider_id is a hard FK to provider_profiles,
            // so even a plain buyer posting a TASK or secondhand GOODS
            // listing needs one. Rather than forcing them through the
            // separate "Become a Provider" flow first, silently create the
            // same lightweight NEIGHBOR-identity profile the first time
            // they post something — without touching `roles`, so they keep
            // seeing the buyer category set (Task/Goods) afterwards, not
            // the provider's (Service/Goods). See conversation 2026-09-05.
            if (!providerProfileId) {
                const { supabase } = await import('@/lib/supabase');
                const { useConfigStore } = await import('@/stores/configStore');

                const node = useConfigStore.getState().refCodes.find(
                    r => r.type === 'NODE' && r.codeId === listingData.nodeId
                );
                const nodeExtra = node?.extraData || {};

                const providerRepo = repositoryFactory.getProviderRepository();
                const newProvider = await providerRepo.create({
                    userId: currentUser.id,
                    identity: 'NEIGHBOR',
                    businessNameZh: currentUser.name,
                    isVerified: false,
                    verificationLevel: 1,
                    badges: [],
                    stats: { totalOrders: 0, totalIncome: 0, averageRating: 0, reviewCount: 0 },
                    location: {
                        lat: nodeExtra.lat ?? 45.4215,
                        lng: nodeExtra.lng ?? -75.6972,
                        address: node?.zhName || node?.enName || 'Ottawa',
                        radiusKm: 10
                    },
                    isActive: true
                });

                const { error: userError } = await supabase
                    .from('user_profiles')
                    .update({ provider_profile_id: newProvider.id })
                    .eq('id', currentUser.id);
                if (userError) throw userError;

                useAuthStore.getState().updateUser({ providerProfileId: newProvider.id });
                providerProfileId = newProvider.id;
            }

            // 1. Create Master
            const master = await masterRepo.create({
                ...listingData,
                providerId: providerProfileId
            });

            // 2. Create Items (linked to master)
            const createdItems = await Promise.all(
                itemsData.map(item => itemRepo.create({ ...item, masterId: master.id }))
            );

            // 3. Update local state
            set((state) => ({
                listings: [master, ...state.listings],
                listingItems: [...createdItems, ...state.listingItems],
                isLoading: false
            }));
            return master;
        } catch (err: any) {
            console.error('Failed to create listing:', err);
            set({ error: err.message, isLoading: false });
            throw err;
        }
    },
    updateListing: async (id, listingData, itemsData) => {
        set({ isLoading: true, error: null });
        try {
            const masterRepo = repositoryFactory.getListingRepository();
            const itemRepo = repositoryFactory.getListingItemRepository();

            // 1. Update Master
            const updatedMaster = await masterRepo.update(id, listingData);

            // 2. Update Items (Simplified for pilot: replace all items if itemsData is provided)
            let updatedItems = [];
            if (itemsData && itemsData.length > 0) {
                // Get existing items
                const existingItems = await itemRepo.getByMaster(id);
                // Delete old items
                await Promise.all(existingItems.map(item => itemRepo.delete(item.id)));
                // Insert new items
                updatedItems = await Promise.all(
                    itemsData.map(item => itemRepo.create({ ...(item as any), masterId: id }))
                );
            }

            // 3. Update local state
            set((state) => ({
                listings: state.listings.map(l => l.id === id ? updatedMaster : l),
                listingItems: itemsData ? [
                    ...state.listingItems.filter(i => i.masterId !== id),
                    ...updatedItems
                ] : state.listingItems,
                isLoading: false
            }));
        } catch (err: any) {
            console.error('Failed to update listing:', err);
            set({ error: err.message, isLoading: false });
            throw err;
        }
    },
    deleteListing: async (id) => {
        set({ isLoading: true, error: null });
        try {
            const masterRepo = repositoryFactory.getListingRepository();
            const itemRepo = repositoryFactory.getListingItemRepository();

            // 1. Check for active orders
            // Note: In a real app we'd do this via API/RPC. For pilot, we check local orderStore.
            const { useOrderStore } = await import('@/stores/orderStore');
            const orders = useOrderStore.getState().orders;
            const activeOrders = orders.filter(o =>
                o.masterId === id &&
                ['PENDING', 'ACCEPTED', 'PAID', 'IN_PROGRESS'].includes(o.status)
            );

            if (activeOrders.length > 0) {
                throw new Error("Cannot delete: This service has active orders. Please cancel or complete them first.");
            }

            // 2. Delete Items first (if mapping doesn't have CASCADE)
            const items = await itemRepo.getByMaster(id);
            await Promise.all(items.map(i => itemRepo.delete(i.id)));

            // 3. Delete Master
            await masterRepo.delete(id);

            // 4. Update local state
            set((state) => ({
                listings: state.listings.filter(l => l.id !== id),
                listingItems: state.listingItems.filter(i => i.masterId !== id),
                isLoading: false
            }));
        } catch (err: any) {
            console.error('Failed to delete listing:', err);
            set({ error: err.message, isLoading: false });
            throw err;
        }
    },
    fetchListings: async () => {
        set({ isLoading: true, error: null });
        try {
            const repo = repositoryFactory.getListingRepository();
            const listings = await repo.getAll();
            set({ listings, isLoading: false });
        } catch (err: any) {
            set({ error: err.message, isLoading: false });
        }
    },
    searchListings: async (options) => {
        set({ isLoading: true, error: null });
        try {
            const repo = repositoryFactory.getListingRepository();
            const listings = await repo.search(options);
            set({ listings, isLoading: false });
        } catch (err: any) {
            set({ error: err.message, isLoading: false });
        }
    },
    loadMoreListings: async (options) => {
        set({ isLoading: true, error: null });
        try {
            const repo = repositoryFactory.getListingRepository();
            const newListings = await repo.search(options);
            set((state) => ({
                listings: [...state.listings, ...newListings],
                isLoading: false
            }));
        } catch (err: any) {
            set({ error: err.message, isLoading: false });
        }
    },

    toggleItemAvailability: async (itemId: string) => {
        const { listingItems } = get() as any;
        const item = listingItems.find((i: any) => i.id === itemId);
        if (!item) return;

        const newStatus = item.status === 'AVAILABLE' ? 'UNAVAILABLE' : 'AVAILABLE';

        try {
            const repo = repositoryFactory.getListingItemRepository();
            const updatedItem = await repo.update(itemId, { status: newStatus });

            set((state: any) => ({
                listingItems: state.listingItems.map((i: any) => i.id === itemId ? updatedItem : i)
            }));

            toast.success(newStatus === 'AVAILABLE' ? "已上线" : "已下架");
        } catch (err: any) {
            console.error('Failed to toggle item availability:', err);
            toast.error("操作失败");
        }
    }
}));

// Translation Helpers (Meituan Essence: Efficient & Direct)
export const getTranslation = (obj: any, fieldBase: string, lang: 'En' | 'Zh' = 'En') => {
    if (!obj) return '';
    const prioritized = lang === 'En' ? [`${fieldBase}En`, `${fieldBase}Zh`] : [`${fieldBase}Zh`, `${fieldBase}En`];
    return obj[prioritized[0]] || obj[prioritized[1]] || obj[fieldBase] || '';
};

export const formatMoney = (amount: number, currency: string = 'CAD') => {
    return new Intl.NumberFormat('en-CA', {
        style: 'currency',
        currency: currency,
    }).format(amount / 100);
};
