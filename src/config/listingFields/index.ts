import { ListingFieldsConfig, ListingType, UserRole } from '@/types/listingFields';
import { buyerGoodsFields, providerGoodsFields } from './goodsFields';
import { providerServiceFields } from './serviceFields';
import { rentalFields } from './rentalFields';
import { taskFields } from './taskFields';
import { giveawayFields } from './giveawayFields';
import { wantedFields } from './wantedFields';
import { eventFields } from './eventFields';

// Default fields for types that don't have specific config yet
const defaultBasicFields: ListingFieldsConfig = {
    type: 'GOODS', // Placeholder, will be overridden
    role: 'buyer', // Placeholder
    groups: [
        {
            title: '基础信息',
            fields: [
                {
                    name: 'title',
                    label: '标题',
                    type: 'text',
                    importance: 'required',
                    placeholder: '简短清晰的标题',
                    validation: { min: 5, max: 100 }
                },
                {
                    name: 'images',
                    label: '图片',
                    type: 'images',
                    importance: 'required',
                    validation: { min: 1, max: 6 }
                },
                {
                    name: 'description',
                    label: '详细描述',
                    type: 'textarea',
                    importance: 'required',
                    placeholder: '详细说明...',
                    rows: 5
                },
                {
                    name: 'price',
                    label: '价格 (CAD)',
                    type: 'number',
                    importance: 'recommended',
                    placeholder: '0.00'
                }
            ]
        }
    ]
};

/**
 * Get field configuration for a specific listing type and user role
 */
export const getFieldsForType = (
    type: ListingType,
    isProvider: boolean
): ListingFieldsConfig => {
    const role: UserRole = isProvider ? 'provider' : 'buyer';

    const fieldMap: Record<string, Record<UserRole, ListingFieldsConfig>> = {
        'GOODS': {
            // Was mapping 'buyer' to providerGoodsFields too — buyerGoodsFields
            // (the simplified, Facebook-Marketplace-style form) was defined but
            // never actually reachable.
            buyer: buyerGoodsFields,
            provider: providerGoodsFields,
            all: buyerGoodsFields,
        },
        'RENTAL': {
            buyer: rentalFields,
            provider: rentalFields,
            all: rentalFields,
        },
        'SERVICE': {
            buyer: { ...defaultBasicFields, type: 'SERVICE', role: 'buyer' },
            provider: providerServiceFields,
            all: providerServiceFields,
        },
        'TASK': {
            buyer: taskFields,
            provider: taskFields,
            all: taskFields,
        },
        'EVENT': {
            buyer: eventFields,
            provider: eventFields,
            all: eventFields,
        },
        'OTHER': {
            buyer: { ...defaultBasicFields, type: 'GOODS', role: 'buyer' },
            provider: { ...defaultBasicFields, type: 'GOODS', role: 'provider' },
            all: { ...defaultBasicFields, type: 'GOODS', role: 'buyer' }
        }
    };

    const typeConfig = fieldMap[type] || fieldMap['OTHER'];

    // Safety check
    const roleConfig = typeConfig[role] || typeConfig['all'];

    // Ensure the returned config has the correct type set
    return {
        ...roleConfig,
        type // Override type just in case
    };
};

/**
 * Export all field configs
 */
export { buyerGoodsFields, providerGoodsFields };
