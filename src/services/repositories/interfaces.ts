import {
    ListingMaster, ListingItem, ListingType, User, ProviderProfile, RefCode, BeanTransaction,
    Review, ReviewReaction, ReviewReply, UserAddress,
    InventoryItem, InventoryUsageLog
} from '@/types/domain';
import { Order, CartItem } from '@/types/orders';

/**
 * Repository interfaces for data access abstraction
 * Allows switching between Mock and Supabase implementations
 */

export interface IAuthRepository {
    login(email: string, password: string): Promise<User | null>;
    signInWithOtp(email: string): Promise<void>; // New: Magic Link/OTP
    signInWithGoogle(): Promise<void>; // New: Google OAuth
    signInWithApple(): Promise<void>; // New: Apple OAuth
    resetPasswordForEmail(email: string): Promise<void>; // New: Password reset
    updatePassword(newPassword: string): Promise<void>; // New: Update password
    logout(): Promise<void>;
    getCurrentUser(): Promise<User | null>;
    updateProfile(userId: string, data: Partial<User>): Promise<User>;
    uploadAvatar(userId: string, file: File): Promise<string>;
    register(email: string, password: string, name: string, nodeId?: string): Promise<User | null>;
}

export interface IUserRepository {
    getAddresses(userId: string): Promise<UserAddress[]>;
    addAddress(address: Omit<UserAddress, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserAddress>;
    updateAddress(id: string, data: Partial<UserAddress>): Promise<UserAddress>;
    deleteAddress(id: string): Promise<void>;
}

export interface IListingRepository {
    getAll(): Promise<ListingMaster[]>;
    getById(id: string): Promise<ListingMaster | null>;
    getByCategory(categoryId: string): Promise<ListingMaster[]>;
    getByNode(nodeId: string): Promise<ListingMaster[]>; // New: Filter by pilot node
    getByProvider(providerId: string): Promise<ListingMaster[]>;
    search(options: {
        query?: string,
        nodeId?: string,
        categoryId?: string,
        type?: ListingType,
        isSemantic?: boolean,
        lat?: number,
        lng?: number,
        radius?: number
    }): Promise<ListingMaster[]>;
    create(listing: Omit<ListingMaster, 'id' | 'createdAt' | 'updatedAt'>): Promise<ListingMaster>;
    update(id: string, data: Partial<ListingMaster>): Promise<ListingMaster>;
    delete(id: string): Promise<void>;
}

export interface IListingItemRepository {
    getByMaster(masterId: string): Promise<ListingItem[]>;
    getById(id: string): Promise<ListingItem | null>;
    create(item: Omit<ListingItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<ListingItem>;
    update(id: string, data: Partial<ListingItem>): Promise<ListingItem>;
    delete(id: string): Promise<void>;
}

export interface IOrderRepository {
    getAll(): Promise<Order[]>;
    getById(id: string): Promise<Order | null>;
    getByUser(userId: string): Promise<Order[]>;
    getByProvider(providerId: string): Promise<Order[]>;
    create(order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<Order>;
    updateStatus(id: string, status: Order['status']): Promise<Order>;
    // New method for partial updates, including metadata, payment status, and web ordering extensions
    update(id: string, updates: Partial<Order>): Promise<Order>;
    subscribeToUserOrders(userId: string, callback: (order: Order) => void): () => void;
}

export interface ICartRepository {
    getItems(userId: string): Promise<CartItem[]>;
    addItem(userId: string, itemId: string, masterId: string): Promise<CartItem>;
    removeItem(cartItemId: string): Promise<void>;
    clearCart(userId: string): Promise<void>;
}

export interface IProviderRepository {
    getById(id: string): Promise<ProviderProfile | null>;
    getAll(): Promise<ProviderProfile[]>;
    create(profile: Omit<ProviderProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<ProviderProfile>;
    update(id: string, data: Partial<ProviderProfile>): Promise<ProviderProfile>;
}

export interface IRefCodeRepository {
    getAll(): Promise<RefCode[]>;
    getById(codeId: string): Promise<RefCode | null>;
    getByType(type: string): Promise<RefCode[]>;
    getByParent(parentId: string): Promise<RefCode[]>;
}

export interface IBeanRepository {
    getBalance(userId: string): Promise<number>;
    getTransactions(userId: string): Promise<BeanTransaction[]>;
    addTransaction(transaction: Omit<BeanTransaction, 'id' | 'createdAt'>): Promise<BeanTransaction>;
}

// Messaging Types
export interface Conversation {
    id: string;
    participantA: string;
    participantB: string;
    orderId?: string;
    lastMessageAt: string;
    createdAt: string;
    metadata?: Record<string, any>;
}

export interface Message {
    id: string;
    conversationId: string;
    senderId: string;
    content: string;
    isRead: boolean;
    messageType?: string; // 'TEXT', 'QUOTE', 'SYSTEM'
    metadata?: Record<string, any>;
    createdAt: string;
}

export interface IMessageRepository {
    getConversations(userId: string): Promise<Conversation[]>;
    getMessages(conversationId: string): Promise<Message[]>;
    sendMessage(conversationId: string, senderId: string, content: string, messageType?: string, metadata?: Record<string, any>): Promise<Message>;
    createConversation(participantA: string, participantB: string, orderId?: string): Promise<Conversation>;
    markAsRead(conversationId: string, userId: string): Promise<void>;
    subscribeToMessages(conversationId: string, callback: (message: Message) => void): () => void;
    subscribeToUserEvents(userId: string, callback: (event: { type: 'CONVERSATION_UPDATE' | 'NEW_MESSAGE', data: any }) => void): () => void;
    getUnreadCount(userId: string): Promise<number>;
    getConversationUnreadCounts(userId: string): Promise<Map<string, number>>;
}

import {
    CommunityPost,
    CommunityComment,
    CommunityPostType,
    CreateCommunityPostInput,
    UpdateCommunityPostInput,
    CreateCommentInput,
    ConsensusVoteType,
    FactVoteRecord
} from '@/types/community';

export interface ICommunityPostRepository {
    getFeed(options?: {
        nodeId?: string;
        postType?: CommunityPostType;
        query?: string;
        scope?: 'nearby' | 'city';
        limit?: number;
        offset?: number;
    }): Promise<CommunityPost[]>;
    getById(id: string): Promise<CommunityPost | null>;
    getByAuthor(authorId: string): Promise<CommunityPost[]>;
    create(authorId: string, input: CreateCommunityPostInput): Promise<CommunityPost>;
    update(id: string, input: UpdateCommunityPostInput): Promise<CommunityPost>;
    delete(id: string): Promise<void>;
    incrementViewCount(id: string): Promise<void>;

    // Likes
    likePost(postId: string, userId: string): Promise<void>;
    unlikePost(postId: string, userId: string): Promise<void>;
    isLikedByUser(postId: string, userId: string): Promise<boolean>;
    getLikedPostIds(userId: string, postIds: string[]): Promise<Set<string>>;

    // Comments
    getComments(postId: string): Promise<CommunityComment[]>;
    getCommentsWithReplies(postId: string): Promise<CommunityComment[]>;
    createComment(authorId: string, input: CreateCommentInput): Promise<CommunityComment>;
    deleteComment(id: string): Promise<void>;
    likeComment(commentId: string, userId: string): Promise<void>;
    unlikeComment(commentId: string, userId: string): Promise<void>;
    getUserLikedCommentIds(userId: string, commentIds: string[]): Promise<Set<string>>;

    // Conversion
    convertToListing(postId: string, listingId: string): Promise<void>;

    // Fact Voting
    getUserVote(postId: string, userId: string): Promise<ConsensusVoteType | null>;
    voteOnFact(postId: string, userId: string, voteType: ConsensusVoteType): Promise<void>;
    removeVote(postId: string, userId: string): Promise<void>;

    // Saves
    savePost(postId: string, userId: string): Promise<void>;
    unsavePost(postId: string, userId: string): Promise<void>;
    isSavedByUser(postId: string, userId: string): Promise<boolean>;
    getSavedPosts(userId: string, limit?: number, offset?: number): Promise<CommunityPost[]>;
    getLikedPosts(userId: string, limit?: number, offset?: number): Promise<CommunityPost[]>;

    // Tags
    getTrendingTags(limit?: number): Promise<{ tag: string; count: number; trending?: boolean }[]>;
}

export interface CommunityStats {
    newNeighborsThisWeek: number;
    tasksCompletedToday: number;
    avgCommunityRating: number;
    neighborsHelped: number;
}

export interface IReviewRepository {
    getByListing(listingId: string): Promise<Review[]>;
    submitReview(review: Omit<Review, 'id' | 'createdAt' | 'updatedAt' | 'replies' | 'reactions' | 'buyerName' | 'buyerAvatar'>): Promise<Review>;
    addReaction(reviewId: string, userId: string, type: ReviewReaction['type']): Promise<ReviewReaction>;
    removeReaction(reviewId: string, userId: string, type: ReviewReaction['type']): Promise<void>;
    submitReply(reviewId: string, providerId: string, content: string): Promise<ReviewReply>;
    getNeighborStories(limit?: number): Promise<Review[]>;
}

export interface ICommunityStatsRepository {
    getStats(nodeId?: string): Promise<CommunityStats>;
}

export interface PayoutRequest {
    id: string;
    providerId: string;
    amountCents: number;
    currency: string;
    status: 'PENDING' | 'COMPLETED' | 'REJECTED';
    method: string;
    details: any;
    createdAt: string;
}

export interface IPayoutRepository {
    getRequests(providerId: string): Promise<PayoutRequest[]>;
    createRequest(request: Omit<PayoutRequest, 'id' | 'status' | 'createdAt'>): Promise<PayoutRequest>;
    getProviderEarnings(providerId: string): Promise<{
        totalRevenue: number;
        availableBalance: number;
        pendingPayouts: number;
    }>;
}

export interface IInventoryRepository {
    getByListingItem(listingItemId: string): Promise<InventoryItem[]>;
    getByOrder(orderId: string): Promise<InventoryItem | null>;
    getByProvider(providerId: string): Promise<InventoryItem[]>; // New method
    allocateSerialNumber(listingItemId: string, orderId: string, buyerId: string): Promise<InventoryItem>;
    addUsageLog(log: Omit<InventoryUsageLog, 'id' | 'createdAt'>): Promise<InventoryUsageLog>;
    getUsageLogs(inventoryId: string): Promise<InventoryUsageLog[]>;
    importInventory(items: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'orderId' | 'buyerId'>[]): Promise<void>;
}
