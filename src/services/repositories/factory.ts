import {
    IAuthRepository,
    IListingRepository,
    IListingItemRepository,
    IOrderRepository,
    ICartRepository,
    IProviderRepository,
    IRefCodeRepository,
    IBeanRepository,
    IMessageRepository,
    ICommunityStatsRepository,
    IReviewRepository,
    IUserRepository,
    IInventoryRepository,
    IPayoutRepository,
    ICommunityPostRepository
} from './interfaces';

// Supabase implementations
import { SupabaseAuthRepository } from './supabase/AuthRepository';
import { SupabaseListingRepository } from './supabase/ListingRepository';
import { SupabaseListingItemRepository } from './supabase/ListingItemRepository';
import { SupabaseOrderRepository } from './supabase/OrderRepository';
import { SupabaseCartRepository } from './supabase/CartRepository';
import { SupabaseProviderRepository } from './supabase/ProviderRepository';
import { SupabaseRefCodeRepository } from './supabase/RefCodeRepository';
import { SupabaseBeanRepository } from './supabase/BeanRepository';
import { SupabaseMessageRepository } from './supabase/MessageRepository';
import { CommunityStatsRepository } from './supabase/CommunityStatsRepository';
import { SupabaseReviewRepository } from './supabase/ReviewRepository';
import { SupabaseUserRepository } from './supabase/UserRepository';
import { SupabaseInventoryRepository } from './supabase/InventoryRepository';
import { SupabasePayoutRepository } from "./supabase/PayoutRepository";
import { SupabaseCommunityPostRepository } from './supabase/CommunityPostRepository';

// Mock implementations
import { MockReviewRepository } from './mock/ReviewRepository';

/**
 * Service Factory for Dependency Injection
 * Allows easy switching between Mock and Supabase implementations
 */
class RepositoryFactory {
    private static instance: RepositoryFactory;
    private useSupabase: boolean = false;

    private constructor() {
        // Check environment configuration
        const useMockData = import.meta.env.VITE_USE_MOCK_DATA === 'true';
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const hasSupabaseUrl = !!supabaseUrl;

        console.log('🏗️ Repository Factory: Initializing...');
        console.log('   - VITE_USE_MOCK_DATA:', import.meta.env.VITE_USE_MOCK_DATA);
        console.log('   - VITE_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Not Set');

        // Use Supabase if URL is configured AND mock mode is not explicitly enabled
        this.useSupabase = hasSupabaseUrl && !useMockData;

        if (this.useSupabase) {
            console.log('%c🔗 Repository Factory: Using Supabase Mode', 'color: #10b981; font-weight: bold; font-size: 12px;');
        } else {
            console.log('%c🔧 Repository Factory: Using Mock Data (Development Mode)', 'color: #f59e0b; font-weight: bold; font-size: 12px;');
        }
    }

    static getInstance(): RepositoryFactory {
        if (!RepositoryFactory.instance) {
            RepositoryFactory.instance = new RepositoryFactory();
        }
        return RepositoryFactory.instance;
    }

    isUsingSupabase(): boolean {
        return this.useSupabase;
    }

    setDataSource(useSupabase: boolean) {
        this.useSupabase = useSupabase;
        console.log(`🔄 Data source changed to: ${useSupabase ? 'Supabase' : 'Mock'}`);
    }

    getAuthRepository(): IAuthRepository {
        if (this.useSupabase) {
            return new SupabaseAuthRepository();
        }
        // TODO: Return MockAuthRepository when needed
        throw new Error('Mock Auth Repository not implemented yet. Using Supabase.');
    }

    getRefCodeRepository(): IRefCodeRepository {
        return new SupabaseRefCodeRepository();
    }

    getListingRepository(): IListingRepository {
        return new SupabaseListingRepository();
    }

    getListingItemRepository(): IListingItemRepository {
        return new SupabaseListingItemRepository();
    }

    getOrderRepository(): IOrderRepository {
        if (this.useSupabase) {
            return new SupabaseOrderRepository();
        }
        return new SupabaseOrderRepository(); // TODO: Add MockOrderRepository
    }

    getCartRepository(): ICartRepository {
        return new SupabaseCartRepository();
    }

    getProviderRepository(): IProviderRepository {
        return new SupabaseProviderRepository();
    }

    getBeanRepository(): IBeanRepository {
        if (this.useSupabase) {
            return new SupabaseBeanRepository();
        }
        return new SupabaseBeanRepository(); // TODO: Add MockBeanRepository
    }

    getMessageRepository(): IMessageRepository {
        return new SupabaseMessageRepository();
    }

    getCommunityStatsRepository(): ICommunityStatsRepository {
        return new CommunityStatsRepository();
    }

    getCommunityPostRepository(): ICommunityPostRepository {
        if (this.useSupabase) {
            return new SupabaseCommunityPostRepository();
        }
        // TODO: Implement MockCommunityPostRepository if needed
        return new SupabaseCommunityPostRepository();
    }

    getReviewRepository(): IReviewRepository {
        if (this.useSupabase) {
            return new SupabaseReviewRepository();
        }
        return new MockReviewRepository();
    }

    getUserRepository(): IUserRepository {
        // We only have the Supabase implementation for now as requested
        return new SupabaseUserRepository();
    }

    getInventoryRepository(): IInventoryRepository {
        return new SupabaseInventoryRepository();
    }

    getPayoutRepository(): IPayoutRepository {
        return new SupabasePayoutRepository();
    }

    // Convenience methods for common operations
    createAuthRepository(): IAuthRepository {
        return this.getAuthRepository();
    }

    createListingRepository(): IListingRepository {
        return this.getListingRepository();
    }

    createOrderRepository(): IOrderRepository {
        return this.getOrderRepository();
    }

    createBeanRepository(): IBeanRepository {
        return this.getBeanRepository();
    }
}

export const repositoryFactory = RepositoryFactory.getInstance();
