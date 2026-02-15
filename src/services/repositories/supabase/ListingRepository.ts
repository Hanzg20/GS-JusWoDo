import { supabase } from '@/lib/supabase';
import { ListingMaster, ListingType } from '@/types/domain';
import { IListingRepository } from '../interfaces';

export class SupabaseListingRepository implements IListingRepository {
    private mapFromDb(row: any): ListingMaster {
        return {
            id: row.id,
            providerId: row.provider_id,
            titleZh: row.title_zh,
            titleEn: row.title_en,
            descriptionZh: row.description_zh,
            descriptionEn: row.description_en,
            images: row.images || [],
            mediaUrl: row.media_url,

            // New JSONB fields
            attributes: row.attributes || {},
            metadata: row.metadata || {},

            // 真言相关字段
            type: row.type as ListingType,
            categoryId: row.category_id,
            nodeId: row.node_id, // New
            tags: row.tags || [],
            status: row.status as any,
            location: {
                fullAddress: row.location_address,
                coordinates: row.latitude && row.longitude ? {
                    lat: row.latitude,
                    lng: row.longitude
                } : undefined
            },
            rating: Number(row.rating),
            reviewCount: row.review_count,
            isPromoted: row.is_promoted,
            distanceMeters: row.distance_meters, // New: from PostGIS search
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };
    }

    private mapToDb(listing: Partial<ListingMaster>): any {
        const dbRow: any = {
            provider_id: listing.providerId,
            title_zh: listing.titleZh,
            title_en: listing.titleEn,
            description_zh: listing.descriptionZh,
            description_en: listing.descriptionEn,
            images: listing.images,
            media_url: listing.mediaUrl,
            type: listing.type,
            category_id: listing.categoryId,
            node_id: listing.nodeId, // New
            tags: listing.tags,
            status: listing.status,
            location_address: listing.location?.fullAddress,
            latitude: listing.location?.coordinates?.lat,
            longitude: listing.location?.coordinates?.lng,
            rating: listing.rating,
            review_count: listing.reviewCount,
            is_promoted: listing.isPromoted,
            attributes: listing.attributes,
            metadata: listing.metadata,
        };

        // Remove undefined fields
        return Object.fromEntries(Object.entries(dbRow).filter(([_, v]) => v !== undefined));
    }

    async getAll(): Promise<ListingMaster[]> {
        const { data, error } = await supabase
            .from('listing_masters')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return (data || []).map(this.mapFromDb);
    }

    async getById(id: string): Promise<ListingMaster | null> {
        const { data, error } = await supabase
            .from('listing_masters')
            .select('*')
            .eq('id', id)
            .single();

        if (error) return null;
        return this.mapFromDb(data);
    }

    async getByCategory(categoryId: string): Promise<ListingMaster[]> {
        const { data, error } = await supabase
            .from('listing_masters')
            .select('*')
            .eq('category_id', categoryId)
            .eq('status', 'PUBLISHED')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return (data || []).map(this.mapFromDb);
    }

    async getByNode(nodeId: string): Promise<ListingMaster[]> {
        const { data, error } = await supabase
            .from('listing_masters')
            .select('*')
            .eq('node_id', nodeId)
            .eq('status', 'PUBLISHED')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return (data || []).map(this.mapFromDb);
    }

    async getByProvider(providerId: string): Promise<ListingMaster[]> {
        const { data, error } = await supabase
            .from('listing_masters')
            .select('*')
            .eq('provider_id', providerId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return (data || []).map(this.mapFromDb);
    }

    async search(options: {
        query?: string,
        nodeId?: string,
        categoryId?: string,
        type?: ListingType,
        isSemantic?: boolean,
        lat?: number,
        lng?: number,
        radius?: number
    }): Promise<ListingMaster[]> {
        if (options.isSemantic && options.query) {
            // 1. Generate embedding using Edge Function for the query string
            const { data: embeddingData, error: embeddingError } = await supabase.functions.invoke('generate-embedding', {
                body: { text: options.query }
            });

            if (embeddingError) {
                console.error('Embedding generation failed, falling back to keyword search:', embeddingError);
                return this.search({ ...options, isSemantic: false });
            }

            // 2. Similarity search using the UNIFIED pgvector RPC
            const { data, error } = await supabase.rpc('match_listings', {
                query_embedding: embeddingData.embedding,
                match_threshold: 0.3,
                match_count: 50,
                filter_node_id: options.nodeId,
                filter_category_id: options.categoryId,
                filter_type: options.type
            });

            if (error) throw error;
            return (data || []).map(this.mapFromDb);
        } else if (options.lat !== undefined && options.lng !== undefined && options.radius !== undefined) {
            // Geographic radius search using PostGIS RPC
            const { data, error } = await supabase.rpc('match_listings_by_radius', {
                p_lat: options.lat,
                p_lng: options.lng,
                p_radius_meters: options.radius,
                p_type: options.type,
                p_category_id: options.categoryId,
                p_match_count: 100
            });

            if (error) throw error;
            return (data || []).map(this.mapFromDb);
        } else {
            // Traditional keyword search
            let qb = supabase.from('listing_masters').select('*').eq('status', 'PUBLISHED');

            if (options.query) {
                // ILIKE search across title and description
                qb = qb.or(`title_zh.ilike.%${options.query}%,title_en.ilike.%${options.query}%,description_zh.ilike.%${options.query}%,description_en.ilike.%${options.query}%`);
            }

            if (options.nodeId) qb = qb.eq('node_id', options.nodeId);

            if (options.categoryId) {
                if (options.categoryId.endsWith('0000')) {
                    const prefix = options.categoryId.substring(0, 3);
                    qb = qb.like('category_id', `${prefix}%`);
                } else {
                    qb = qb.eq('category_id', options.categoryId);
                }
            }

            if (options.type) qb = qb.eq('type', options.type);

            const { data, error } = await qb.order('created_at', { ascending: false });

            if (error) throw error;
            return (data || []).map(this.mapFromDb);
        }
    }

    async create(listing: Omit<ListingMaster, 'id' | 'createdAt' | 'updatedAt'>): Promise<ListingMaster> {
        // Embeddings are now handled server-side via Supabase Webhooks
        const dbRow = this.mapToDb(listing);

        const { data, error } = await supabase
            .from('listing_masters')
            .insert(dbRow)
            .select()
            .single();

        if (error) throw error;
        return this.mapFromDb(data);
    }

    async update(id: string, data: Partial<ListingMaster>): Promise<ListingMaster> {
        // Embeddings are now handled server-side via Supabase Webhooks
        const dbRow = this.mapToDb(data);

        const { data: updatedData, error } = await supabase
            .from('listing_masters')
            .update(dbRow)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return this.mapFromDb(updatedData);
    }

    async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('listing_masters')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
}
