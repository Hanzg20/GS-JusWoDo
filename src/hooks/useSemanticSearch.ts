import { useState, useEffect } from 'react';
import { repositoryFactory } from '@/services/repositories/factory';
import { ListingMaster } from '@/types/domain';
import { useCommunity } from '@/context/CommunityContext';
import { browseNodeId } from '@/stores/configStore';

interface SemanticSearchResult extends ListingMaster {
    similarity: number;
}

interface UseSemanticSearchOptions {
    enabled?: boolean;
    threshold?: number;
    limit?: number;
}

// This used to duplicate ListingRepository.search()'s isSemantic branch
// entirely — its own generate-embedding call, its own match_listings RPC
// call, its own keyword-search fallback — maintained completely separately
// from the "real" search path CategoryListing.tsx uses. Any fix to one
// (threshold tuning, fallback behavior) silently didn't apply to the other.
// Now this hook is just a thin debounce/loading-state wrapper around the
// same repository method everything else already calls.
export const useSemanticSearch = (
    query: string,
    options: UseSemanticSearchOptions = {}
) => {
    const {
        enabled = true,
        threshold = 0.7,
        limit = 10
    } = options;

    const { activeNodeId } = useCommunity();
    const [results, setResults] = useState<SemanticSearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!query || !enabled || query.length < 2) {
            setResults([]);
            return;
        }

        const controller = { cancelled: false };

        const runSearch = async () => {
            setLoading(true);
            setError(null);
            try {
                const listingRepo = repositoryFactory.getListingRepository();
                const data = await listingRepo.search({
                    query,
                    isSemantic: true,
                    nodeId: browseNodeId(activeNodeId),
                    limit,
                });
                if (!controller.cancelled) {
                    // search()'s isSemantic branch falls back to a plain
                    // keyword search internally on embedding failure — those
                    // rows won't carry a real `similarity`, so default to 0
                    // rather than leaving it undefined for this hook's callers.
                    setResults(data.map(item => ({ ...item, similarity: item.similarity ?? 0 })));
                }
            } catch (err) {
                if (!controller.cancelled) {
                    console.error('Semantic search error:', err);
                    setError(err as Error);
                    setResults([]);
                }
            } finally {
                if (!controller.cancelled) setLoading(false);
            }
        };

        const timeoutId = setTimeout(runSearch, 300);
        return () => {
            controller.cancelled = true;
            clearTimeout(timeoutId);
        };
    }, [query, enabled, threshold, limit, activeNodeId]);

    return {
        results,
        loading,
        error,
        isAISearch: results.some(r => r.similarity > 0)
    };
};
