import { create } from 'zustand';
import { repositoryFactory } from '@/services/repositories/factory';

export interface Conversation {
    id: string;
    participantA: string;
    participantB: string;
    orderId?: string;
    lastMessageAt: string;
    createdAt: string;
    // UI enrichment
    otherUserName?: string;
    otherUserAvatar?: string;
    lastMessagePreview?: string;
    unreadCount?: number;
}

export interface Message {
    id: string;
    conversationId: string;
    senderId: string;
    content: string;
    isRead: boolean;
    readAt?: string;
    messageType?: string;
    metadata?: Record<string, any>;
    createdAt: string;
}

interface MessageState {
    conversations: Conversation[];
    messages: Message[];
    activeConversationId: string | null;
    totalUnreadCount: number;
    isLoading: boolean;
    error: string | null;
    unsubscribe: (() => void) | null;

    loadConversations: (userId: string) => Promise<void>;
    loadMessages: (conversationId: string) => Promise<void>;
    loadUnreadCount: (userId: string) => Promise<void>;
    sendMessage: (senderId: string, content: string, type?: string, metadata?: Record<string, any>, conversationId?: string) => Promise<void>;
    sendQuote: (senderId: string, orderId: string, amount: number, description?: string) => Promise<void>;
    createConversation: (userA: string, userB: string, orderId?: string) => Promise<Conversation>;
    setActiveConversation: (conversationId: string) => void;
    subscribeToActiveConversation: () => void;
    subscribeToGlobalEvents: (userId: string) => void;
    updateMessageReadStatus: (messageIds: string[], isRead: boolean) => void;
    cleanup: () => void;
}

export const useMessageStore = create<MessageState>((set, get) => ({
    conversations: [],
    messages: [],
    activeConversationId: null,
    totalUnreadCount: 0,
    isLoading: false,
    error: null,
    unsubscribe: null,

    loadConversations: async (userId: string) => {
        set({ isLoading: true, error: null });
        try {
            const repo = repositoryFactory.getMessageRepository();
            const conversations = await repo.getConversations(userId);
            console.log('[MessageStore] Loaded conversations:', conversations.length);
            console.log('[MessageStore] Conversation details:', conversations.map(c => ({
                id: c.id,
                otherUserName: c.otherUserName,
                otherUserAvatar: c.otherUserAvatar,
                participantA: c.participantA,
                participantB: c.participantB,
                unreadCount: c.unreadCount
            })));

            // Calculate total unread count from all conversations
            const totalUnread = conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
            console.log('[MessageStore] Total unread count:', totalUnread);

            set({
                conversations,
                totalUnreadCount: totalUnread,
                isLoading: false
            });
            // Start global subscription for other conversations
            get().subscribeToGlobalEvents(userId);
        } catch (error: any) {
            console.error('Failed to load conversations:', error);
            set({ error: error.message, isLoading: false });
        }
    },

    loadMessages: async (conversationId: string) => {
        set({ isLoading: true, error: null });
        try {
            const repo = repositoryFactory.getMessageRepository();
            const messages = await repo.getMessages(conversationId);
            set({ messages, isLoading: false });
        } catch (error: any) {
            console.error('Failed to load messages:', error);
            set({ error: error.message, isLoading: false });
        }
    },

    loadUnreadCount: async (userId: string) => {
        try {
            const repo = repositoryFactory.getMessageRepository();
            const count = await repo.getUnreadCount(userId);
            set({ totalUnreadCount: count });
        } catch (error: any) {
            console.error('Failed to load unread count:', error);
        }
    },

    sendMessage: async (senderId: string, content: string, type: string = 'TEXT', metadata: Record<string, any> = {}, conversationId?: string) => {
        const targetConversationId = conversationId || get().activeConversationId;
        if (!targetConversationId || !content.trim()) return;

        try {
            const repo = repositoryFactory.getMessageRepository();
            const newMessage = await repo.sendMessage(targetConversationId, senderId, content, type, metadata);

            // Optimistic update if it's the active conversation
            if (targetConversationId === get().activeConversationId) {
                set(state => {
                    if (state.messages.find(m => m.id === newMessage.id)) return state;
                    return { messages: [...state.messages, newMessage] };
                });
            }
        } catch (error: any) {
            console.error('Failed to send message:', error);
            set({ error: error.message });
        }
    },

    sendQuote: async (senderId: string, orderId: string, amount: number, description: string = '') => {
        // 1. Find conversation for this order
        const repo = repositoryFactory.getMessageRepository();
        const convs = await repo.getConversations(senderId);
        const conversation = convs.find(c => c.orderId === orderId);

        if (!conversation) {
            console.warn('No conversation found for order:', orderId);
            return;
        }

        const content = `[QUOTE] Custom Price: $${(amount / 100).toFixed(2)}`;
        const metadata = { orderId, amount, description };
        await get().sendMessage(senderId, content, 'QUOTE', metadata, conversation.id);
    },

    createConversation: async (userA: string, userB: string, orderId?: string) => {
        set({ isLoading: true, error: null });
        try {
            const repo = repositoryFactory.getMessageRepository();
            const conversation = await repo.createConversation(userA, userB, orderId);

            set(state => ({
                conversations: [conversation, ...state.conversations],
                activeConversationId: conversation.id,
                isLoading: false
            }));

            // Also load messages for this new conversation
            get().loadMessages(conversation.id);
            get().subscribeToActiveConversation();

            return conversation;
        } catch (error: any) {
            console.error('Failed to create conversation:', error);
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    setActiveConversation: (conversationId: string) => {
        const { cleanup } = get();
        cleanup(); // Unsubscribe from previous conversation

        set({ activeConversationId: conversationId, messages: [] });
        get().loadMessages(conversationId);
        get().subscribeToActiveConversation();
    },

    subscribeToActiveConversation: () => {
        const { activeConversationId } = get();
        if (!activeConversationId) {
            if (import.meta.env.VITE_DEBUG_MODE === 'true') {
                console.warn('[MessageStore] Cannot subscribe: no active conversation');
            }
            return;
        }

        if (import.meta.env.VITE_DEBUG_MODE === 'true') {
            console.log('[MessageStore] Subscribing to active conversation:', activeConversationId);
        }
        const repo = repositoryFactory.getMessageRepository();
        const unsubscribe = repo.subscribeToMessages(activeConversationId, (newMessage) => {
            if (import.meta.env.VITE_DEBUG_MODE === 'true') {
                console.log('[MessageStore] Received new message via callback:', {
                    id: newMessage.id,
                    senderId: newMessage.senderId,
                    content: newMessage.content.substring(0, 50)
                });
            }

            set(state => {
                // Avoid duplicates
                if (state.messages.find(m => m.id === newMessage.id)) {
                    if (import.meta.env.VITE_DEBUG_MODE === 'true') {
                        console.log('[MessageStore] Duplicate message ignored:', newMessage.id);
                    }
                    return state;
                }
                if (import.meta.env.VITE_DEBUG_MODE === 'true') {
                    console.log('[MessageStore] Adding new message to store');
                }
                return { messages: [...state.messages, newMessage] };
            });
        });

        set({ unsubscribe });
    },

    subscribeToGlobalEvents: (userId: string) => {
        const repo = repositoryFactory.getMessageRepository();
        repo.subscribeToUserEvents(userId, (event) => {
            if (event.type === 'CONVERSATION_UPDATE') {
                const updatedConv = event.data;
                set(state => {
                    const existing = state.conversations.find(c => c.id === updatedConv.id);
                    if (existing) {
                        // Update existing and move to top
                        const otherConvs = state.conversations.filter(c => c.id !== updatedConv.id);
                        return { conversations: [{ ...existing, ...updatedConv }, ...otherConvs] };
                    } else {
                        // New conversation from someone else
                        return { conversations: [updatedConv, ...state.conversations] };
                    }
                });
            }
        });
    },

    updateMessageReadStatus: (messageIds: string[], isRead: boolean) => {
        set(state => {
            // First, update the messages
            const updatedMessages = state.messages.map(msg =>
                messageIds.includes(msg.id) ? { ...msg, isRead } : msg
            );

            // Get current user from auth store (we can't use get() inside set())
            // So we'll recalculate unread from conversations loaded from server
            // For now, just refresh conversations to get accurate count
            const newTotalUnread = state.totalUnreadCount - (isRead ? messageIds.length : -messageIds.length);

            if (import.meta.env.VITE_DEBUG_MODE === 'true') {
                console.log('[MessageStore] Updated read status:', {
                    updatedMessageIds: messageIds,
                    isRead,
                    newTotalUnread
                });
            }

            return {
                messages: updatedMessages,
                totalUnreadCount: Math.max(0, newTotalUnread)
            };
        });
    },

    cleanup: () => {
        const { unsubscribe } = get();
        if (unsubscribe) {
            unsubscribe();
            set({ unsubscribe: null });
        }
    }
}));
