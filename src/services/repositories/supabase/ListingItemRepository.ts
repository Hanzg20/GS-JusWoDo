import { supabase } from '@/lib/supabase';
import { ListingItem, PricingModel } from '@/types/domain';
import { IListingItemRepository } from '../interfaces';

export class SupabaseListingItemRepository implements IListingItemRepository {
    private mapFromDb(row: any): ListingItem {
        return {
            id: row.id,
            masterId: row.master_id,
            nameZh: row.name_zh,
            nameEn: row.name_en,
            descriptionZh: row.description_zh,
            descriptionEn: row.description_en,
            images: row.images || [],
            pricing: {
                model: row.pricing_model as PricingModel,
                price: {
                    amount: row.price_amount,
                    currency: row.price_currency,
                    formatted: `$${(row.price_amount / 100).toFixed(2)}`,
                },
                unit: row.price_unit,
                deposit: row.deposit_amount ? {
                    amount: row.deposit_amount,
                    currency: row.price_currency,
                    formatted: `$${(row.deposit_amount / 100).toFixed(2)}`,
                } : undefined
            },
            status: row.status as any,
            attributes: row.attributes || {},
            parentId: row.parent_item_id,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };
    }

    private mapToDb(item: Partial<ListingItem>): any {
        const dbRow: any = {
            master_id: item.masterId,
            name_zh: item.nameZh,
            name_en: item.nameEn,
            description_zh: item.descriptionZh,
            description_en: item.descriptionEn,
            images: item.images,
            status: item.status,
            attributes: item.attributes,
            parent_item_id: item.parentId
        };

        if (item.pricing) {
            dbRow.pricing_model = item.pricing.model;
            dbRow.price_amount = item.pricing.price.amount;
            dbRow.price_currency = item.pricing.price.currency;
            dbRow.price_unit = item.pricing.unit;
            dbRow.deposit_amount = item.pricing.deposit?.amount || 0;
        }

        return dbRow;
    }

    async getByMaster(masterId: string): Promise<ListingItem[]> {
        const { data, error } = await supabase
            .from('listing_items')
            .select('*')
            .eq('master_id', masterId)
            .order('sort_order', { ascending: true });

        if (error) throw error;
        return (data || []).map(this.mapFromDb);
    }

    // Bulk variant for listing/search pages — one round trip for a whole
    // page of cards instead of N (or the items just never loading at all,
    // which is what card price displays were silently falling back on).
    async getByMasters(masterIds: string[]): Promise<ListingItem[]> {
        if (masterIds.length === 0) return [];
        const { data, error } = await supabase
            .from('listing_items')
            .select('*')
            .in('master_id', masterIds)
            .order('sort_order', { ascending: true });

        if (error) throw error;
        return (data || []).map(this.mapFromDb);
    }

    async getById(id: string): Promise<ListingItem | null> {
        const { data, error } = await supabase
            .from('listing_items')
            .select('*')
            .eq('id', id)
            .single();

        if (error) return null;
        return this.mapFromDb(data);
    }

    async create(item: Omit<ListingItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<ListingItem> {
        const { data, error } = await supabase
            .from('listing_items')
            .insert(this.mapToDb(item))
            .select()
            .single();

        if (error) throw error;
        return this.mapFromDb(data);
    }

    async update(id: string, data: Partial<ListingItem>): Promise<ListingItem> {
        const { data: updatedData, error } = await supabase
            .from('listing_items')
            .update(this.mapToDb(data))
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return this.mapFromDb(updatedData);
    }

    async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('listing_items')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
}
