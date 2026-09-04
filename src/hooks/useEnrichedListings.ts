import { useEffect, useMemo } from 'react';
import { useListingStore } from '@/stores/listingStore';
import { useConfigStore } from '@/stores/configStore';
import { useAuthStore } from '@/stores/authStore';
import { repositoryFactory } from '@/services/repositories/factory';
import { ListingMaster } from '@/types/domain';

// Straight-line distance in meters — good enough for "closest first" sorting
// at this scale, no PostGIS round trip needed.
export function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number) {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Shared by every page that renders a grid of ListingCards (Index.tsx,
 * CategoryListing.tsx, ...): fetches the listingItems those cards need for
 * price/deposit (a page rendering many listings never did this before —
 * only a single listing's own detail page fetched its items, so cards
 * elsewhere silently fell back to "Get Quote"), and attaches a distance to
 * each listing.
 *
 * Distance uses precise GPS when `preciseLocation` is provided (e.g. the
 * neighbor picked "Closest to Me"), otherwise falls back to their
 * community node's center so a distance can be shown without prompting for
 * location — `distanceApprox` on the result tells the UI which case it is.
 */
export function useEnrichedListings(
    listings: ListingMaster[],
    preciseLocation?: { lat: number; lng: number } | null
) {
    const { listingItems, setListingItems } = useListingStore();
    const { refCodes, activeNodeId } = useConfigStore();
    const { currentUser } = useAuthStore();

    useEffect(() => {
        const masterIds = listings.map(l => l.id);
        const missingIds = masterIds.filter(id => !listingItems.some(li => li.masterId === id));
        if (missingIds.length === 0) return;

        repositoryFactory.getListingItemRepository().getByMasters(missingIds)
            .then(newItems => {
                setListingItems([...listingItems.filter(li => !missingIds.includes(li.masterId)), ...newItems]);
            })
            .catch(err => console.error('Failed to load listing items for cards:', err));
        // Only re-run when the set of listings changes, not on every
        // listingItems update this effect itself causes.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [listings]);

    const nodeLocation = useMemo(() => {
        const nodeId = currentUser?.nodeId || activeNodeId;
        const node = refCodes.find(r => r.type === 'NODE' && r.codeId === nodeId);
        const extra = node?.extraData;
        return extra?.lat && extra?.lng ? { lat: extra.lat, lng: extra.lng } : null;
    }, [refCodes, currentUser?.nodeId, activeNodeId]);

    const referenceLocation = preciseLocation || nodeLocation;
    const isPreciseDistance = !!preciseLocation;

    const enrichedListings = useMemo(() => {
        if (!referenceLocation) return listings;
        return listings.map(l => {
            const coords = l.location?.coordinates;
            const distanceMeters = coords
                ? haversineMeters(referenceLocation.lat, referenceLocation.lng, coords.lat, coords.lng)
                : undefined;
            return { ...l, distanceMeters, distanceApprox: !isPreciseDistance };
        });
    }, [listings, referenceLocation, isPreciseDistance]);

    return enrichedListings;
}
