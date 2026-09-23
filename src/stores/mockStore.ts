import { create } from 'zustand';
import { ListingMaster, ListingItem, User, Review, ProviderProfile, RefCode } from '@/types/domain';
import { Order, CartItem, OrderStatus, PriceBreakdown, OrderSnapshot } from '@/types/orders';

interface AppState {
    currentUser: User | null;
    listings: ListingMaster[]; // The catalog/grid entries
    listingItems: ListingItem[]; // The specific variants/offerings
    providers: ProviderProfile[];
    reviews: Review[];
    refCodes: RefCode[]; // JinBean ref-code system
    cartItems: CartItem[];
    orders: Order[];
    searchQuery: string;

    // Auth
    login: (user: User) => void;
    logout: () => void;

    // Search
    setSearchQuery: (query: string) => void;

    // Listings
    getListingsByCategory: (categoryId: string) => ListingMaster[];
    getListingItems: (masterId: string) => ListingItem[];
    getProvider: (id: string) => ProviderProfile | undefined;
    getRefCode: (codeId: string) => RefCode | undefined;

    // Cart Management
    addToCart: (itemId: string, masterId: string) => void;
    removeFromCart: (cartItemId: string) => void;
    clearCart: () => void;
    getCartItems: () => CartItem[];

    // Order Management
    createOrder: (itemId: string, masterId: string) => Order | null;
    getOrders: (userId?: string) => Order[];
    updateOrderStatus: (orderId: string, status: OrderStatus) => void;
}

export const useStore = create<AppState>((set, get) => ({
    currentUser: {
        id: 'u1',
        email: 'demo@justwedo.com',
        name: '张三 (Demo User)',
        avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&h=100&fit=crop',
        roles: ['BUYER'],
        permissions: ['VIEW_LISTINGS', 'POST_REVIEW'],
        joinedDate: '2025-01-01',
        beansBalance: 512,
        isEmailVerified: true,
        isPhoneVerified: true,
        isVerifiedProvider: true,
        createdAt: '2025-01-01',
        updatedAt: '2025-01-01',
    } as any,

    searchQuery: '',

    refCodes: [
        { codeId: '1010000', type: 'INDUSTRY', zhName: '美食天地', enName: 'Food & Dining', extraData: { icon: 'Utensils' } },
        { codeId: '1010100', parentId: '1010000', type: 'CATEGORY', zhName: '川菜', enName: 'Sichuan Cuisine' },
        { codeId: '1020000', type: 'INDUSTRY', zhName: '家政到家', enName: 'Home Services', extraData: { icon: 'Home' } },
        { codeId: '1020100', parentId: '1020000', type: 'CATEGORY', zhName: '日常保洁', enName: 'Regular Cleaning' },
        { codeId: '1040000', type: 'INDUSTRY', zhName: '共享乐园', enName: 'Rental & Sharing', extraData: { icon: 'Share2' } },
        { codeId: '1060000', type: 'INDUSTRY', zhName: '专业速帮', enName: 'Professional Help', extraData: { icon: 'Briefcase' } },
    ],

    listings: [
        {
            id: 'l1',
            providerId: 'p1',
            type: 'SERVICE',
            titleZh: '深度保洁 - 全屋清洁消毒',
            titleEn: 'Deep Cleaning - Whole House Disinfection',
            descriptionZh: '专业家政服务10年经验，细心负责。使用环保清洁剂，对宠物和儿童安全友好。',
            descriptionEn: '10 years of professional housekeeping experience. Eco-friendly cleaning agents.',
            images: ['https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&h=600&fit=crop'],
            categoryId: '1020100',
            nodeId: 'lees-ave',
            tags: ['保洁', '家政', '消毒'],
            location: {
                fullAddress: '幸福小区, Shanghai, SH 200000',
                street: '幸福小区',
                city: 'Shanghai',
                state: 'SH',
                zip: '200000',
                coordinates: { lat: 31.23, lng: 121.47 }
            },
            status: 'PUBLISHED',
            rating: 4.9,
            reviewCount: 128,
            createdAt: '2025-12-01',
            updatedAt: '2025-12-01',
            itemIds: ['li1', 'li2']
        },
        {
            id: 'l2',
            providerId: 'p2',
            type: 'RENTAL',
            titleZh: 'Sony 专业摄影器材租赁',
            titleEn: 'Sony Professional Photography Gear Rental',
            descriptionZh: '包含顶配机身与各焦段大师级镜头. 适合婚礼跟拍、活动记录。',
            descriptionEn: 'Top-tier camera bodies and master-grade lenses. Perfect for weddings and events.',
            images: ['https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&h=600&fit=crop'],
            categoryId: '1040000',
            nodeId: 'lees-ave',
            tags: ['摄影', '相机', '数码'],
            location: { fullAddress: '科技园, Shanghai, SH 200000', street: '科技园', city: 'Shanghai', state: 'SH', zip: '200000' },
            status: 'PUBLISHED',
            rating: 5.0,
            reviewCount: 42,
            createdAt: '2025-12-05',
            updatedAt: '2025-12-05',
            itemIds: ['li3', 'li4']
        }
    ],

    listingItems: [
        {
            id: 'li1',
            masterId: 'l1',
            nameZh: '基础保洁 (2小时)',
            nameEn: 'Basic Cleaning (2h)',
            descriptionZh: '适合日常维护，包含客餐厅、卧室简单整理。',
            descriptionEn: 'Suitable for daily maintenance, including simple organization.',
            pricing: {
                model: 'FIXED',
                price: { amount: 15000, currency: 'CNY', formatted: '¥150.00' },
                unit: '2小时'
            },
            status: 'AVAILABLE',
            sortOrder: 1,
            createdAt: '2025-12-01',
            updatedAt: '2025-12-01'
        },
        {
            id: 'li2',
            masterId: 'l1',
            nameZh: '深度消毒版 (3小时)',
            nameEn: 'Deep Disinfection (3h)',
            descriptionZh: '含全屋高温蒸汽消毒，死角清理。',
            descriptionEn: 'High-temperature steam disinfection for the whole house.',
            pricing: {
                model: 'FIXED',
                price: { amount: 28000, currency: 'CNY', formatted: '¥280.00' },
                unit: '3小时'
            },
            status: 'AVAILABLE',
            sortOrder: 2,
            createdAt: '2025-12-01',
            updatedAt: '2025-12-01'
        },
        {
            id: 'li3',
            masterId: 'l2',
            nameZh: 'Sony A7M4 机身',
            nameEn: 'Sony A7M4 Body',
            descriptionZh: '全画幅微单，成色极佳。',
            descriptionEn: 'Full-frame mirrorless, excellent condition.',
            pricing: {
                model: 'DAILY',
                price: { amount: 20000, currency: 'CNY', formatted: '¥200.00' },
                unit: '天',
                deposit: { amount: 1500000, currency: 'CNY', formatted: '¥15000.00' }
            },
            status: 'AVAILABLE',
            sortOrder: 1,
            createdAt: '2025-12-05',
            updatedAt: '2025-12-05'
        },
        {
            id: 'li4',
            masterId: 'l2',
            nameZh: '24-70mm GM II 镜头',
            nameEn: '24-70mm GM II Lens',
            descriptionZh: '大师级变焦镜，画质巅峰。',
            descriptionEn: 'Master-grade zoom lens, peak image quality.',
            pricing: {
                model: 'DAILY',
                price: { amount: 12000, currency: 'CNY', formatted: '¥120.00' },
                unit: '天',
                deposit: { amount: 800000, currency: 'CNY', formatted: '¥8000.00' }
            },
            status: 'AVAILABLE',
            sortOrder: 2,
            createdAt: '2025-12-05',
            updatedAt: '2025-12-05'
        }
    ],

    providers: [
        {
            id: 'p1',
            isActive: true,
            userId: 'u_p1',
            businessNameZh: '李阿姨',
            businessNameEn: 'Auntie Li',
            descriptionZh: '专注社区保洁5年，也是烹饪达人。',
            descriptionEn: 'Focus on community cleaning for 5 years, also a cooking expert.',
            identity: 'NEIGHBOR',
            isVerified: true,
            verificationLevel: 2,
            badges: ['实名认证', '健康证'],
            stats: {
                totalOrders: 128,
                totalIncome: 5000000,
                averageRating: 4.9,
                reviewCount: 128,
                responseTime: '10分钟',
                repeatRate: 0.85
            },
            location: { lat: 31.23, lng: 121.47, address: '幸福小区', radiusKm: 3 },
            createdAt: '2025-01-01',
            updatedAt: '2025-01-01'
        },
        {
            id: 'p2',
            isActive: true,
            userId: 'u_p2',
            businessNameZh: '极速数码租赁',
            businessNameEn: 'Speedy Digital Rental',
            descriptionZh: '专业摄影器材租赁，上海全城送货。',
            descriptionEn: 'Professional photography equipment rental, delivery available throughout Shanghai.',
            identity: 'MERCHANT',
            isVerified: true,
            verificationLevel: 3,
            badges: ['企业认证', '缴纳保证金'],
            stats: {
                totalOrders: 2050,
                totalIncome: 100000000,
                averageRating: 4.8,
                reviewCount: 520,
                responseTime: '5分钟',
                repeatRate: 0.60
            },
            location: { lat: 31.2, lng: 121.5, address: '张江高科', radiusKm: 20 },
            createdAt: '2025-01-01',
            updatedAt: '2025-01-01'
        },
        {
            id: 'p3',
            isActive: true,
            userId: 'u_p3',
            businessNameZh: '王律师',
            businessNameEn: 'Lawyer Wang',
            descriptionZh: '执业律师，提供专业的法律咨询服务。',
            descriptionEn: 'Practicing lawyer, providing professional legal consultation services.',
            identity: 'MERCHANT',
            isVerified: true,
            verificationLevel: 4,
            badges: ['执业证', '律协认证'],
            stats: {
                totalOrders: 45,
                totalIncome: 2000000,
                averageRating: 5.0,
                reviewCount: 30,
                responseTime: '1小时',
                repeatRate: 0.30
            },
            location: { lat: 31.2, lng: 121.4, address: '陆家嘴', radiusKm: 0 },
            createdAt: '2025-01-01',
            updatedAt: '2025-01-01'
        }
    ],

    reviews: [],

    cartItems: [],

    orders: [],

    login: (user) => set({ currentUser: user }),
    logout: () => set({ currentUser: null }),
    setSearchQuery: (query) => set({ searchQuery: query }),

    getListingsByCategory: (categoryId) => {
        return get().listings.filter(l => l.categoryId === categoryId);
    },
    getListingItems: (masterId) => {
        return get().listingItems.filter(item => item.masterId === masterId);
    },
    getProvider: (id) => get().providers.find(p => p.id === id),
    getRefCode: (codeId) => get().refCodes.find(r => r.codeId === codeId),

    // Cart Management
    addToCart: (itemId, masterId) => {
        const { currentUser, cartItems, listingItems, listings } = get();
        if (!currentUser) return;

        // Check if item already in cart
        const existing = cartItems.find(ci => ci.itemId === itemId && ci.userId === currentUser.id);
        if (existing) {
            // Increase quantity
            set({
                cartItems: cartItems.map(ci =>
                    ci.id === existing.id ? { ...ci, quantity: ci.quantity + 1 } : ci
                )
            });
        } else {
            // Add new item
            const newCartItem: CartItem = {
                id: `cart_${Date.now()}`,
                userId: currentUser.id,
                itemId,
                masterId,
                quantity: 1,
                addedAt: new Date().toISOString(),
                item: listingItems.find(li => li.id === itemId),
                master: listings.find(l => l.id === masterId)
            };
            set({ cartItems: [...cartItems, newCartItem] });
        }
    },

    removeFromCart: (cartItemId) => {
        set({ cartItems: get().cartItems.filter(ci => ci.id !== cartItemId) });
    },

    clearCart: () => {
        const { currentUser } = get();
        if (!currentUser) return;
        set({ cartItems: get().cartItems.filter(ci => ci.userId !== currentUser.id) });
    },

    getCartItems: () => {
        const { currentUser, cartItems } = get();
        if (!currentUser) return [];
        return cartItems.filter(ci => ci.userId === currentUser.id);
    },

    // Order Management
    createOrder: (itemId, masterId) => {
        const { currentUser, listingItems, listings, providers, orders } = get();
        if (!currentUser) return null;

        const item = listingItems.find(li => li.id === itemId);
        const master = listings.find(l => l.id === masterId);
        if (!item || !master) return null;

        const provider = providers.find(p => p.id === master.providerId);
        if (!provider) return null;

        // Calculate pricing
        const baseAmount = item.pricing.price.amount;
        const platformFee = Math.floor(baseAmount * 0.05); // 5% platform fee
        const total = baseAmount + platformFee;

        const pricing: PriceBreakdown = {
            baseAmount: item.pricing.price,
            platformFee: { amount: platformFee, currency: 'CNY', formatted: `¥${(platformFee / 100).toFixed(2)}` },
            total: { amount: total, currency: 'CNY', formatted: `¥${(total / 100).toFixed(2)}` }
        };

        // Create snapshot
        const snapshot: OrderSnapshot = {
            masterTitle: master.titleZh,
            masterDescription: master.descriptionZh,
            masterImages: master.images,
            itemName: item.nameZh,
            itemDescription: item.descriptionZh,
            itemPricing: item.pricing,
            providerName: provider.businessNameZh,
            providerBadges: provider.badges
        };

        const newOrder: Order = {
            id: `order_${Date.now()}`,
            masterId,
            itemId,
            buyerId: currentUser.id,
            providerId: master.providerId,
            providerUserId: provider.userId,
            status: 'PENDING_PAYMENT',
            paymentStatus: 'UNPAID',
            pricing,
            currency: 'CNY',
            snapshot,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        set({ orders: [...orders, newOrder] });
        return newOrder;
    },

    getOrders: (userId?) => {
        const { currentUser, orders } = get();
        const targetUserId = userId || currentUser?.id;
        if (!targetUserId) return [];

        return orders.filter(o => o.buyerId === targetUserId || o.providerId === targetUserId);
    },

    updateOrderStatus: (orderId, status) => {
        set({
            orders: get().orders.map(o =>
                o.id === orderId
                    ? { ...o, status, updatedAt: new Date().toISOString() }
                    : o
            )
        });
    },
}));
