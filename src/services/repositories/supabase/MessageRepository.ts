import { supabase } from '@/lib/supabase';
import { IMessageRepository, Conversation, Message, AdminConversation } from '../interfaces';

export class SupabaseMessageRepository implements IMessageRepository {
    // One RPC instead of 1 + 3-per-conversation queries (profile, latest
    // message, unread count) — see 20260923_get_conversation_summaries.sql.
    // The RPC scopes to auth.uid(); userId is kept for the interface and must
    // be the signed-in user (it always is — the chat list is "my" chats).
    async getConversations(_userId: string): Promise<Conversation[]> {
        const { data, error } = await supabase.rpc('get_conversation_summaries');
        if (error) throw error;

        return (data || []).map((row: any) => ({
            ...this.mapConversation(row),
            otherUserName: row.other_user_name || 'User',
            otherUserAvatar: row.other_user_avatar,
            lastMessagePreview: row.last_message_type
                ? this.formatMessagePreview({ content: row.last_message_content, message_type: row.last_message_type })
                : undefined,
            unreadCount: Number(row.unread_count) || 0
        }));
    }

    /** Admin-only: relies on the "Admins can view all conversations" RLS
     * policy — a non-admin caller just gets an empty/RLS-filtered result,
     * not an error, since Postgres RLS silently omits rows rather than
     * rejecting the query. */
    async getAllConversations(): Promise<AdminConversation[]> {
        const { data, error } = await supabase
            .from('conversations')
            .select(`
                id,
                participant_a,
                participant_b,
                order_id,
                last_message_at,
                created_at,
                metadata
            `)
            .order('last_message_at', { ascending: false });

        if (error) throw error;

        const participantIds = Array.from(new Set((data || []).flatMap(c => [c.participant_a, c.participant_b])));
        const { data: profiles } = await supabase
            .from('user_profiles')
            .select('id, name')
            .in('id', participantIds.length > 0 ? participantIds : ['00000000-0000-0000-0000-000000000000']);
        const nameById = new Map((profiles || []).map(p => [p.id, p.name]));

        return await Promise.all((data || []).map(async (conv) => {
            const { data: latestMessage } = await supabase
                .from('messages')
                .select('content, message_type')
                .eq('conversation_id', conv.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            return {
                ...this.mapConversation(conv),
                participantAName: nameById.get(conv.participant_a) || 'User',
                participantBName: nameById.get(conv.participant_b) || 'User',
                lastMessagePreview: latestMessage ? this.formatMessagePreview(latestMessage) : undefined,
            };
        }));
    }

    private formatMessagePreview(message: any): string {
        if (message.message_type === 'QUOTE') {
            return '💰 Quote';
        } else if (message.message_type === 'SYSTEM') {
            return '📢 ' + message.content;
        } else if (message.message_type === 'IMAGE') {
            return '📷 Image';
        } else if (message.message_type === 'FILE') {
            return '📎 File';
        }
        return message.content || 'New message';
    }

    async getMessages(conversationId: string): Promise<Message[]> {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return (data || []).map(this.mapMessage);
    }

    async sendMessage(conversationId: string, senderId: string, content: string, messageType: string = 'TEXT', metadata: Record<string, any> = {}): Promise<Message> {
        if (import.meta.env.VITE_DEBUG_MODE === 'true') {
            console.log('[📤 Send Message] Sending:', {
                conversationId,
                senderId,
                contentPreview: content.substring(0, 50),
                messageType
            });
        }

        const { data, error } = await supabase
            .from('messages')
            .insert({
                conversation_id: conversationId,
                sender_id: senderId,
                content,
                message_type: messageType,
                metadata
            })
            .select()
            .single();

        if (error) {
            console.error('[❌ Send Message] Error:', error);
            throw error;
        }

        if (import.meta.env.VITE_DEBUG_MODE === 'true') {
            console.log('[✅ Send Message] Message sent successfully:', data.id);
        }
        return this.mapMessage(data);
    }

    async createConversation(participantA: string, participantB: string, orderId?: string): Promise<Conversation> {
        // Check if conversation already exists
        const { data: existing } = await supabase
            .from('conversations')
            .select('*')
            .or(`and(participant_a.eq.${participantA},participant_b.eq.${participantB}),and(participant_a.eq.${participantB},participant_b.eq.${participantA})`)
            .single();

        if (existing) {
            return this.mapConversation(existing);
        }

        const { data, error } = await supabase
            .from('conversations')
            .insert({
                participant_a: participantA,
                participant_b: participantB,
                order_id: orderId
            })
            .select()
            .single();

        if (error) throw error;
        return this.mapConversation(data);
    }

    async markAsRead(conversationId: string, userId: string): Promise<void> {
        const { error } = await supabase
            .from('messages')
            .update({ is_read: true })
            .eq('conversation_id', conversationId)
            .neq('sender_id', userId);

        if (error) throw error;
    }

    async recallMessage(messageId: string): Promise<void> {
        const { error } = await supabase
            .from('messages')
            .update({ is_recalled: true, recalled_at: new Date().toISOString() })
            .eq('id', messageId);

        if (error) throw error;
    }

    async deleteMessageForSelf(messageId: string, userId: string): Promise<void> {
        const { data: existing, error: fetchError } = await supabase
            .from('messages')
            .select('deleted_for')
            .eq('id', messageId)
            .single();

        if (fetchError) throw fetchError;

        const deletedFor = Array.from(new Set([...(existing?.deleted_for || []), userId]));
        const { error } = await supabase
            .from('messages')
            .update({ deleted_for: deletedFor })
            .eq('id', messageId);

        if (error) throw error;
    }

    async archiveConversation(conversationId: string, userId: string): Promise<void> {
        const { data: existing, error: fetchError } = await supabase
            .from('conversations')
            .select('archived_for')
            .eq('id', conversationId)
            .single();

        if (fetchError) throw fetchError;

        const archivedFor = Array.from(new Set([...(existing?.archived_for || []), userId]));
        const { error } = await supabase
            .from('conversations')
            .update({ archived_for: archivedFor })
            .eq('id', conversationId);

        if (error) throw error;
    }

    async unarchiveConversation(conversationId: string, userId: string): Promise<void> {
        const { data: existing, error: fetchError } = await supabase
            .from('conversations')
            .select('archived_for')
            .eq('id', conversationId)
            .single();

        if (fetchError) throw fetchError;

        const archivedFor = (existing?.archived_for || []).filter((id: string) => id !== userId);
        const { error } = await supabase
            .from('conversations')
            .update({ archived_for: archivedFor })
            .eq('id', conversationId);

        if (error) throw error;
    }

    async deleteConversationForSelf(conversationId: string, userId: string): Promise<void> {
        const { data: existing, error: fetchError } = await supabase
            .from('conversations')
            .select('deleted_for')
            .eq('id', conversationId)
            .single();

        if (fetchError) throw fetchError;

        const deletedFor = Array.from(new Set([...(existing?.deleted_for || []), userId]));
        const { error } = await supabase
            .from('conversations')
            .update({ deleted_for: deletedFor })
            .eq('id', conversationId);

        if (error) throw error;
    }

    subscribeToMessages(conversationId: string, callback: (message: Message, eventType: 'INSERT' | 'UPDATE') => void): () => void {
        if (import.meta.env.VITE_DEBUG_MODE === 'true') {
            console.log(`[🔵 Realtime] Setting up subscription for conversation: ${conversationId}`);
        }

        const channel = supabase
            .channel(`messages:${conversationId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `conversation_id=eq.${conversationId}`
                },
                (payload) => {
                    if (import.meta.env.VITE_DEBUG_MODE === 'true') {
                        console.log('[✅ Realtime] New message received via subscription:', payload.new);
                    }
                    callback(this.mapMessage(payload.new), 'INSERT');
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'messages',
                    filter: `conversation_id=eq.${conversationId}`
                },
                (payload) => {
                    callback(this.mapMessage(payload.new), 'UPDATE');
                }
            )
            .subscribe((status, err) => {
                if (status === 'SUBSCRIBED') {
                    if (import.meta.env.VITE_DEBUG_MODE === 'true') {
                        console.log(`[✅ Realtime] Successfully subscribed to conversation: ${conversationId}`);
                    }
                } else if (status === 'CHANNEL_ERROR') {
                    console.error(`[❌ Realtime] Subscription error for conversation ${conversationId}:`, err);
                } else if (status === 'TIMED_OUT') {
                    console.error(`[⏱️ Realtime] Subscription timed out for conversation: ${conversationId}`);
                } else if (import.meta.env.VITE_DEBUG_MODE === 'true') {
                    console.log(`[🔵 Realtime] Subscription status: ${status}`);
                }
            });

        return () => {
            if (import.meta.env.VITE_DEBUG_MODE === 'true') {
                console.log(`[🔴 Realtime] Unsubscribing from conversation: ${conversationId}`);
            }
            supabase.removeChannel(channel);
        };
    }

    subscribeToUserEvents(userId: string, callback: (event: { type: 'CONVERSATION_UPDATE' | 'NEW_MESSAGE', data: any }) => void): () => void {
        const channel = supabase
            .channel(`user-events:${userId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'conversations',
                    filter: `participant_a=eq.${userId}`
                },
                (payload) => callback({ type: 'CONVERSATION_UPDATE', data: this.mapConversation(payload.new) })
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'conversations',
                    filter: `participant_b=eq.${userId}`
                },
                (payload) => callback({ type: 'CONVERSATION_UPDATE', data: this.mapConversation(payload.new) })
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }

    async getUnreadCount(userId: string): Promise<number> {
        // First get user's conversation IDs
        const { data: convData } = await supabase
            .from('conversations')
            .select('id')
            .or(`participant_a.eq.${userId},participant_b.eq.${userId}`);

        if (!convData || convData.length === 0) return 0;

        const conversationIds = convData.map(c => c.id);

        // Then count unread messages in those conversations
        const { count, error } = await supabase
            .from('messages')
            .select('id', { count: 'exact', head: true })
            .eq('is_read', false)
            .neq('sender_id', userId)
            .in('conversation_id', conversationIds);

        if (error) {
            console.error('Error getting unread count:', error);
            return 0;
        }
        return count || 0;
    }

    async getConversationUnreadCounts(userId: string): Promise<Map<string, number>> {
        const { data, error } = await supabase
            .from('messages')
            .select('conversation_id')
            .eq('is_read', false)
            .neq('sender_id', userId);

        if (error) {
            console.error('Error getting unread counts:', error);
            return new Map();
        }

        const counts = new Map<string, number>();
        (data || []).forEach(msg => {
            const current = counts.get(msg.conversation_id) || 0;
            counts.set(msg.conversation_id, current + 1);
        });
        return counts;
    }

    private mapConversation(data: any): Conversation {
        return {
            id: data.id,
            participantA: data.participant_a,
            participantB: data.participant_b,
            orderId: data.order_id,
            lastMessageAt: data.last_message_at,
            createdAt: data.created_at,
            metadata: data.metadata || {},
            archivedFor: data.archived_for || [],
            deletedFor: data.deleted_for || []
        };
    }

    private mapMessage(data: any): Message {
        return {
            id: data.id,
            conversationId: data.conversation_id,
            senderId: data.sender_id,
            content: data.content,
            isRead: data.is_read,
            messageType: data.message_type || 'TEXT',
            metadata: data.metadata || {},
            createdAt: data.created_at,
            isRecalled: data.is_recalled || false,
            recalledAt: data.recalled_at || undefined,
            deletedFor: data.deleted_for || []
        };
    }
}
