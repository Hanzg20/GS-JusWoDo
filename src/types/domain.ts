// --- Value Objects (Best Practice: Reusable, standardized components) ---

export interface Money {
  amount: number; // Stored in smallest unit (e.g. cents) to avoid float errors
  currency: string; // ISO 4217, e.g. 'CNY', 'USD'
  formatted: string; // Display string, e.g. "¥100.00"
}

export interface Address {
  fullAddress: string;
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface BaseEntity {
  id: string;
  createdAt: string; // ISO 8601
  updatedAt: string;
}

export type CategoryType = 'FOOD' | 'SERVICE' | 'RENTAL' | 'GOODS' | 'CONSULTATION' | 'EVENT' | 'FREE_GIVEAWAY' | 'WANTED';

export type UserRoleType = 'SUPER_ADMIN' | 'MODERATOR' | 'PROVIDER' | 'BUYER';

export interface Permission {
  id: string;
  name: string; // e.g., 'POST_LISTING'
  description?: string;
}

export interface Role {
  id: string;
  name: UserRoleType;
  description?: string;
  permissions: Permission[];
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar: string;
  joinedDate: string;

  // RBAC
  roles: UserRoleType[];
  permissions: string[]; // List of permission names for quick checking

  // Points System: JinBean (金豆)
  beansBalance: number;
  phone?: string;
  bio?: string;
  settings?: {
    language: 'en' | 'zh';
    notifications: {
      email: boolean;
      push: boolean;
    };
  };

  // Role Logic
  isVerifiedProvider?: boolean;

  // Specific to JinBean reference: Separation of User and Provider Profile
  providerProfileId?: string; // If they are a seller

  // Pilot Node Context
  nodeId?: string; // Preferred community node (e.g., NODE_LEES)

  // Community Contribution & Level (JustTalk System)
  contributionScore?: number;  // Total contribution score
  level?: number;              // User level (1-5)
  verificationLevel?: number;   // Trust level (1: Email/Phone, 2: ID, 3: Pro)
  levelIcon?: string;          // Level icon emoji
  levelName?: string;          // Level name
  jwdCode?: string;            // Unique JWD Personal Identity Code
}

export interface UserAddress extends BaseEntity {
  userId: string;
  label: string;
  address: Address;
  isDefault: boolean;
}

export interface BeanTransaction {
  id: string;
  userId: string;
  amount: number;
  type: 'DAILY_LOGIN' | 'NEIGHBOR_VOUCH' | 'STORY_BONUS' | 'FEE_REDEMPTION' | 'GIFT';
  descriptionZh?: string;
  descriptionEn?: string;
  createdAt: string;
}

export type ProviderIdentity = 'NEIGHBOR' | 'MERCHANT';

export interface ProfessionalCredential extends BaseEntity {
  providerId: string;
  type: 'LAWYER' | 'REAL_ESTATE_AGENT' | 'HVAC' | 'ELECTRICIAN' | 'ACCOUNTANT' | 'HEALTHPRO' | 'OTHER';
  licenseNumber: string;
  jurisdiction: string;
  status: 'VERIFIED' | 'PENDING' | 'EXPIRED' | 'REJECTED';
  verifiedAt?: string;
  extraData?: Record<string, any>;
}

export interface ProviderProfile extends BaseEntity {
  userId: string;

  // Multi-language Profile
  businessNameZh: string;
  businessNameEn?: string;
  descriptionZh?: string;
  descriptionEn?: string;
  avatar?: string; // Mapped from linked User profile

  identity: 'NEIGHBOR' | 'MERCHANT';
  isVerified: boolean;
  verificationLevel: number; // 1-5 level system
  badges: string[];
  stats: {
    totalOrders: number;
    totalIncome: number;
    averageRating: number;
    reviewCount: number;
    responseTime?: string;
    repeatRate?: number;
  };

  // Service Details for UI (Trust UX)
  insuranceSummaryZh?: string;
  insuranceSummaryEn?: string;
  licenseInfo?: string;

  location: {
    lat: number;
    lng: number;
    address: string;
    radiusKm: number; // Service area
  };

  isActive: boolean; // Whether the provider is currently accepting orders
  metadata?: Record<string, any>;

  // Professional Directory Extensions
  credentials?: ProfessionalCredential[];
}

export type ListingType = 'SERVICE' | 'RENTAL' | 'CONSULTATION' | 'GOODS' | 'TASK' | 'EVENT' | 'FREE_GIVEAWAY' | 'WANTED' | 'OTHER';

export type PricingModel = 'FIXED' | 'HOURLY' | 'DAILY' | 'NEGOTIABLE' | 'DEPOSIT_REQUIRED' | 'QUOTE' | 'VISIT_FEE';

// --- Reference Codes (JinBean ref-code pattern) ---
export interface RefCode {
  codeId: string; // e.g. '1010000'
  parentId?: string;
  type: 'INDUSTRY' | 'CATEGORY' | 'STATUS' | 'UNIT' | 'COMMUNITY_NODE';
  zhName: string;
  enName?: string;
  extraData?: Record<string, any>;
  sortOrder?: number;
}

// --- Listing Master-Detail Pattern (JinBean Inspired) ---

/**
 * ListingMaster: The "Shopfront" / "Catalog Entry"
 * Displayed in grids, owns location and provider info.
 */
export interface ListingMaster extends BaseEntity {
  providerId: string;

  // Multi-language Support
  titleZh: string;
  titleEn?: string;
  descriptionZh: string;
  descriptionEn?: string;

  mediaUrl?: string; // Enhanced: link to social videos/posts
  attributes?: Record<string, any>; // JSONB attributes (e.g. pricingMode)

  images: string[];
  type: ListingType;
  categoryId: string; // Linked to RefCode
  nodeId: string; // Community Node ID (e.g., NODE_LEES)
  tags: string[];
  location: Address;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'SUSPENDED';

  rating: number;
  reviewCount: number;
  isPromoted?: boolean;
  distanceMeters?: number; // Calculated distance from search center
  searchScore?: number; // Hybrid ranking score

  // New: Link to child items
  itemIds?: string[];

  // Metadata for different listing types (e.g. Goods delivery, Task urgency)
  metadata?: Record<string, any>;
}

/**
 * ListingItem: The "SKU" / "Specific Offering"
 * Displayed in the detail page, holds pricing and specific attributes.
 */
export interface ListingItem extends BaseEntity {
  masterId: string; // Link back to ListingMaster

  // Multi-language Support
  nameZh: string;
  nameEn?: string;
  descriptionZh: string;
  descriptionEn?: string;

  images?: string[];

  // Specifics
  pricing: {
    model: PricingModel;
    price: Money;
    unit?: string;
    deposit?: Money;
  };

  status: 'AVAILABLE' | 'UNAVAILABLE' | 'OUT_OF_STOCK';
  sortOrder?: number;

  // Industry specific attributes (JSONB equivalent)
  attributes?: Record<string, any>;

  // Support for hierarchical items (e.g., Add-ons)
  parentId?: string;
}

// Legacy / Helper Types (Will be phased out or adapted)
export type ListingItemLegacy = ListingMaster; // Temporary alias during migration

export interface ReviewReaction {
  id: string;
  reviewId: string;
  userId: string;
  type: 'HELPFUL' | 'WARMTH' | 'FUNNY';
}

export interface ReviewReply extends BaseEntity {
  reviewId: string;
  providerId: string;
  content: string;
}

// Enhanced Reviews & Trust (Dianping/Yelp Inspired)
export interface Review extends BaseEntity {
  listingId: string;
  orderId?: string;
  buyerId: string; // Reviewer
  providerId: string;

  // UI Display Info (Denormalized or joined)
  buyerName: string;
  buyerAvatar?: string;

  rating: number; // Overall 1-5
  ratingDimensions: Record<string, number>; // e.g. { quality: 5, punctuality: 4 }

  content: string; // The "Story"
  media: string[]; // Image/Video URLs

  isNeighborStory: boolean; // Promotion flag

  // Relationships
  replies?: ReviewReply[];
  reactions?: ReviewReaction[];
}

// New Types from Reference Analysis
export interface Promotion {
  id: string;
  providerId: string;
  title: string;
  type: 'DISCOUNT' | 'BONUS' | 'FEATURED';
  discountPercent?: number;
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'EXPIRED';
}

// --- Order & Transaction Models (Best Practice: Explicit State Machine) ---

export type OrderStatus =
  | 'PENDING_PAYMENT'   // Buyer initiated, hasn't paid
  | 'PENDING_CONFIRMATION' // Buyer paid/requested, waiting for Provider
  | 'IN_PROGRESS'       // Service started / Item rented / Session happening
  | 'COMPLETED'         // Finished, waiting for review
  | 'CANCELLED'         // Cancelled by either party
  | 'DISPUTED';         // CS intervention needed

export interface Order extends BaseEntity {
  listingId: string;
  providerId: string;
  userId: string; // Buyer

  type: ListingType;
  status: OrderStatus;

  amountTotal: Money;
  amountDeposit?: Money; // For rentals

  beansAmount?: number; // Amount paid in beans

  // Snapshot of what was bought (Best Practice: Don't rely on live listing data)
  snapshot: {
    title: string;
    image: string;
    description: string;
  };

  // Scheduling
  scheduledStart?: string;
  scheduledEnd?: string;

  // Rental Specifics
  rental?: {
    isPickedUp: boolean;
    isReturned: boolean;
    actualReturnDate?: string;
  };
}

export interface ScheduleSlot extends BaseEntity {
  providerId: string;
  startTime: string;
  endTime: string;
  status: 'AVAILABLE' | 'BOOKED' | 'BLOCKED';
  orderId?: string; // Link to order if booked
}

// --- GigBridge (Scan-to-Buy) Inventory Models ---

export type InventoryStatus = 'available' | 'reserved' | 'sold' | 'defective' | 'expired' | 'archived';

export interface InventoryItem extends BaseEntity {
  listingItemId: string;
  providerId?: string;
  serialNumber: string;
  secretCode?: string;
  status: InventoryStatus;
  validFrom?: string;
  validUntil?: string;
  metadata?: Record<string, any>;
  orderId?: string;
  buyerId?: string;
}

export interface InventoryUsageLog {
  id: string;
  inventoryId: string;
  actionType: 'USE' | 'RECHARGE' | 'VOID';
  amount: number;
  locationId?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}
