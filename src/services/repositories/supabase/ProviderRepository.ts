import { supabase } from '@/lib/supabase';
import { ProviderProfile, ProviderIdentity } from '@/types/domain';
import { IProviderRepository } from '../interfaces';

export class SupabaseProviderRepository implements IProviderRepository {
    private mapFromView(row: any): ProviderProfile {
        return {
            id: row.id,
            userId: row.user_id,
            businessNameZh: row.business_name_zh,
            businessNameEn: row.business_name_en,
            descriptionZh: row.description_zh,
            descriptionEn: row.description_en,
            avatar: row.user_avatar, // From View
            identity: row.identity as ProviderIdentity,
            isVerified: row.is_verified,
            verificationLevel: row.verification_level || 1,
            badges: row.badges || [],
            stats: {
                totalOrders: row.stats?.total_orders || 0,
                averageRating: row.stats?.average_rating || 0,
                totalIncome: row.stats?.total_income || 0,
                reviewCount: row.stats?.review_count || 0,
            },
            location: row.location_address ? {
                lat: 0, // View simplified
                lng: 0,
                address: row.location_address,
                radiusKm: row.service_radius_km || 5,
            } : { lat: 0, lng: 0, address: '', radiusKm: 5 },
            // The view selects p.status (text), not an is_active column —
            // this always read as false before, since row.is_active never
            // existed on the row at all.
            isActive: row.status !== 'INACTIVE',
            metadata: row.metadata || {},
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            credentials: row.credentials_json ? row.credentials_json.map((c: any) => ({
                id: c.id,
                type: c.type,
                licenseNumber: c.license_number,
                jurisdiction: c.jurisdiction,
                status: c.status,
                verifiedAt: c.verified_at
            })) : undefined
        };
    }

    // mapToDb remains same for Writes (Writes still go to Table, Reads go to View)
    private mapToDb(profile: Partial<ProviderProfile>): any {
        return {
            user_id: profile.userId,
            business_name_zh: profile.businessNameZh,
            business_name_en: profile.businessNameEn,
            description_zh: profile.descriptionZh,
            description_en: profile.descriptionEn,
            identity: profile.identity,
            is_verified: profile.isVerified,
            badges: profile.badges,
            stats: profile.stats ? {
                total_orders: profile.stats.totalOrders,
                average_rating: profile.stats.averageRating,
                total_income: profile.stats.totalIncome
            } : undefined,
            location_address: profile.location?.address,
            service_radius_km: profile.location?.radiusKm,
            // provider_profiles has no is_active column (it uses `status`,
            // text, defaulting to 'ACTIVE') — sending is_active made every
            // insert through this repo fail with PGRST204 ("column not
            // found"), silently breaking the auto-provisioning path in
            // listingStore.ts (the only caller that ever set isActive).
            ...(profile.isActive === false ? { status: 'INACTIVE' } : {}),
            // Same story as is_active above — provider_profiles has no
            // metadata column either. Harmless today (no caller sets it,
            // and Supabase-js drops undefined-valued keys before sending),
            // but a landmine for whoever passes one next.
        };
    }

    async getById(id: string): Promise<ProviderProfile | null> {
        const { data, error } = await supabase
            .from('view_provider_details')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Failed to fetch provider profile:', id, error);
            return null;
        }
        return this.mapFromView(data);
    }

    async getAll(): Promise<ProviderProfile[]> {
        const { data, error } = await supabase
            .from('view_provider_details')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return (data || []).map(this.mapFromView);
    }

    async create(profile: Omit<ProviderProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<ProviderProfile> {
        // Writes still go to TABLE
        const { data, error } = await supabase
            .from('provider_profiles')
            .insert(this.mapToDb(profile))
            .select()
            .single();

        if (error) throw error;

        // Re-fetch from the view for the complete object (avatar, stats,
        // etc. that only the view joins in). getById() swallows its own
        // errors and returns null on any failure — silently propagating
        // that null here used to surface as a cryptic "Cannot read
        // properties of null" deep in whatever the caller did next (e.g.
        // Publish.tsx's auto-provisioning path), instead of a message that
        // actually says what happened.
        const created = await this.getById(data.id);
        if (!created) {
            throw new Error('Provider profile was created but could not be read back.');
        }
        return created;
    }

    async update(id: string, data: Partial<ProviderProfile>): Promise<ProviderProfile> {
        const { error } = await supabase
            .from('provider_profiles')
            .update(this.mapToDb(data))
            .eq('id', id);

        if (error) throw error;
        return (await this.getById(id))!;
    }
}
