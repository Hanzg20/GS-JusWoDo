import { supabase } from '@/lib/supabase';
import { BeanTransaction } from '@/types/domain';
import { IBeanRepository } from '../interfaces';

export class SupabaseBeanRepository implements IBeanRepository {
    async getBalance(userId: string): Promise<number> {
        const { data, error } = await supabase
            .from('user_profiles')
            .select('beans_balance')
            .eq('id', userId)
            .single();

        if (error) throw error;
        return data?.beans_balance || 0;
    }

    async getTransactions(userId: string): Promise<BeanTransaction[]> {
        const { data, error } = await supabase
            .from('bean_transactions')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return (data || []).map(this.mapToDomain);
    }

    async addTransaction(transaction: Omit<BeanTransaction, 'id' | 'createdAt'>): Promise<BeanTransaction> {
        const { error } = await supabase
            .rpc('record_bean_transaction', {
                p_user_id: transaction.userId,
                p_amount: transaction.amount,
                p_type: transaction.type,
                p_reason_zh: transaction.descriptionZh,
                p_reason_en: transaction.descriptionEn || transaction.descriptionZh,
                p_related_order_id: (transaction as any).relatedOrderId
            });

        if (error) throw error;

        // Fetch the newly created transaction to return it (matching interface)
        const { data, error: fetchError } = await supabase
            .from('bean_transactions')
            .select('*')
            .eq('user_id', transaction.userId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (fetchError) throw fetchError;
        return this.mapToDomain(data);
    }

    private mapToDomain(dbTx: any): BeanTransaction {
        return {
            id: dbTx.id,
            userId: dbTx.user_id,
            amount: dbTx.amount,
            type: dbTx.type as any,
            descriptionZh: dbTx.reason,
            createdAt: dbTx.created_at
        };
    }
}
