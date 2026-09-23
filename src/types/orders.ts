import { BaseEntity, Money, ListingMaster, ListingItem } from './domain';

/**
 * Order Status following the JinBean state machine pattern
 */
export type OrderStatus =
    | 'PENDING_QUOTE'        // Initial inquiry / Request for quote
    | 'PENDING_DEPOSIT'      // Waiting for visit fee or deposit
    | 'WAITING_FOR_PRICE_APPROVAL' // Provider updated price, waiting for user
    | 'PENDING_PAYMENT'      // Just created, awaiting payment
    | 'PENDING_CONFIRMATION' // Paid, waiting for provider acceptance
    | 'ACCEPTED'             // Provider accepted the order
    | 'IN_PROGRESS'          // Work is underway
    | 'COMPLETED'            // Service completed
    | 'CANCELLED'            // Cancelled by user or system
    | 'DISPUTED'              // Under dispute resolution
    | 'PICKED_UP'             // Item picked up by buyer
    | 'RETURNED';            // Item returned to provider

/**
 * Payment Status
 */
export type PaymentStatus = 'UNPAID' | 'PAID' | 'REFUNDED' | 'PARTIALLY_REFUNDED';

/**
 * Price Breakdown - Transparent pricing following JinBean pattern
 */
export interface PriceBreakdown {
    baseAmount: Money;        // Item base price
    serviceFee?: Money;       // Service-specific fees
    platformFee: Money;       // Platform commission
    taxAmount?: Money;        // Tax if applicable
    tipAmount?: Money;        // Optional tip
    total: Money;             // Total amount
}

/**
 * Order Snapshot - Captures listing state at purchase time
 * This prevents price changes from affecting historical orders
 */
export interface OrderSnapshot {
    masterTitle: string;
    masterDescription: string;
    masterImages: string[];
    itemName: string;
    itemDescription: string;
    itemPricing: {
        model: string;
        price: Money;
        unit?: string;
        deposit?: Money;
        serviceCallFee?: Money; // Added for web ordering
    };
    providerName: string;
    providerBadges: string[];
    coupon_code?: string;
    coupon_discount?: number; // cents
}

/**
 * Main Order Interface
 */
export interface Order extends BaseEntity {
    // References
    masterId: string;
    itemId: string;
    buyerId?: string;
    providerId: string;
    providerUserId: string; // The auth.users.id of the provider

    // Status
    status: OrderStatus;
    paymentStatus: PaymentStatus;

    // Pricing
    pricing: PriceBreakdown;
    currency: string;

    // Snapshot of what was purchased
    snapshot: OrderSnapshot;

    // Payment reference
    paymentIntentId?: string;

    // Metadata for industry-specific fields
    metadata?: {
        quoteDetails?: {
            scopeDescription: string;
            preferredDate?: string;
            estimatedHours?: number;
            materialsCost?: number;
            visitFee?: Money;
        };
        [key: string]: any;
    };

    // Timestamps
    acceptedAt?: string;
    completedAt?: string;
    cancelledAt?: string;

    // Web Ordering Extensions (v0.0.3)
    rentalStartDate?: string;
    rentalEndDate?: string;
    depositAmount?: number;
    depositStatus?: 'NONE' | 'HELD' | 'RELEASED' | 'FORFEITED';
    serviceCallFee?: number;
    rentalDays?: number; // Added for convenience
}

/**
 * Shopping Cart Item
 */
export interface CartItem {
    id: string;
    userId: string;
    itemId: string;
    masterId: string;
    quantity: number;
    addedAt: string;

    // Denormalized for display
    master?: ListingMaster;
    item?: ListingItem;
    // Optional metadata for booking/rentals
    rentalStart?: string;
    rentalEnd?: string;
    consultHours?: number;
    serviceCallFee?: number; // Added
}

/**
 * Cart Summary
 */
export interface CartSummary {
    items: CartItem[];
    itemCount: number;
    subtotal: Money;
    estimatedFees: Money;
    estimatedTotal: Money;
}
