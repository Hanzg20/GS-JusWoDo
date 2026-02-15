import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ListingMaster } from '@/types/domain';
import { useCommunity } from '@/context/CommunityContext';

interface SemanticSearchResult extends ListingMaster {
    similarity: number;
}

interface UseSemanticSearchOptions {
    enabled?: boolean;
    threshold?: number;
    limit?: number;
}

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

        const searchWithAI = async () => {
            setLoading(true);
            setError(null);

            try {
                // Step 1: Get query embedding from Edge Function
                const { data: embeddingData, error: embeddingError } = await supabase.functions.invoke(
                    'generate-embedding',
                    {
                        body: { text: query }
                    }
                );

                if (embeddingError) {
                    throw new Error(`Embedding generation failed: ${embeddingError.message}`);
                }

                const queryEmbedding = embeddingData.embedding;

                // Step 2: Perform vector similarity search
                const { data: searchResults, error: searchError } = await supabase.rpc(
                    'match_listings',
                    {
                        query_embedding: queryEmbedding,
                        match_threshold: threshold,
                        match_count: limit,
                        filter_node_id: activeNodeId
                    }
                );

                if (searchError) {
                    throw new Error(`Search failed: ${searchError.message}`);
                }

                setResults(searchResults || []);
            } catch (err) {
                console.error('Semantic search error:', err);
                setError(err as Error);

                // Fallback to text-based search
                performTextSearch(query);
            } finally {
                setLoading(false);
            }
        };

        // Debounce search
        const timeoutId = setTimeout(searchWithAI, 300);
        return () => clearTimeout(timeoutId);
    }, [query, enabled, threshold, limit, activeNodeId]);

    const performTextSearch = async (searchQuery: string) => {
        try {
            const { data, error: textSearchError } = await supabase
                .from('listing_masters')
                .select('*')
                .or(`title_zh.ilike.%${searchQuery}%,title_en.ilike.%${searchQuery}%,description_zh.ilike.%${searchQuery}%`)
                .eq('status', 'PUBLISHED')
                .eq('node_id', activeNodeId)
                .limit(limit);

            if (!textSearchError && data) {
                // Map DB results to domain objects if needed, though they match mostly
                setResults(data.map(item => ({
                    ...item,
                    titleZh: item.title_zh,
                    titleEn: item.title_en,
                    descriptionZh: item.description_zh,
                    descriptionEn: item.description_en,
                    providerId: item.provider_id,
                    categoryId: item.category_id,
                    nodeId: item.node_id,
                    similarity: 0.5
                })));
            }
        } catch (err) {
            console.error('Text search fallback failed:', err);
        }
    };

    return {
        results,
        loading,
        error,
        isAISearch: results.some(r => r.similarity > 0)
    };
};
