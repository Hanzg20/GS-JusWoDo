import { ListingFieldsConfig, ListingType, UserRole } from '@/types/listingFields';
import { getBuyerGoodsFields, getProviderGoodsFields } from './goodsFields';
import { getProviderServiceFields } from './serviceFields';
import { getRentalFields } from './rentalFields';
import { getTaskFields } from './taskFields';
import { getGiveawayFields } from './giveawayFields';
import { getWantedFields } from './wantedFields';
import { getEventFields } from './eventFields';

type Lang = 'zh' | 'en';

// Default fields for types that don't have specific config yet
const getDefaultBasicFields = (language: Lang): ListingFieldsConfig => ({
    type: 'GOODS', // Placeholder, will be overridden
    role: 'buyer', // Placeholder
    groups: [
        {
            title: language === 'zh' ? '基础信息' : 'Basic Info',
            fields: [
                {
                    name: 'title',
                    label: language === 'zh' ? '标题' : 'Title',
                    type: 'text',
                    importance: 'required',
                    placeholder: language === 'zh' ? '简短清晰的标题' : 'A short, clear title',
                    validation: { min: 5, max: 100 }
                },
                {
                    name: 'images',
                    label: language === 'zh' ? '图片' : 'Photos',
                    type: 'images',
                    importance: 'required',
                    validation: { min: 1, max: 6 }
                },
                {
                    name: 'description',
                    label: language === 'zh' ? '详细描述' : 'Description',
                    type: 'textarea',
                    importance: 'required',
                    placeholder: language === 'zh' ? '详细说明...' : 'Add details...',
                    rows: 5
                },
                {
                    name: 'price',
                    label: language === 'zh' ? '价格 (CAD)' : 'Price (CAD)',
                    type: 'number',
                    importance: 'recommended',
                    placeholder: '0.00'
                }
            ]
        }
    ]
});

/**
 * Get field configuration for a specific listing type and user role
 */
export const getFieldsForType = (
    type: ListingType,
    isProvider: boolean,
    language: Lang = 'zh'
): ListingFieldsConfig => {
    const role: UserRole = isProvider ? 'provider' : 'buyer';
    const defaultBasicFields = getDefaultBasicFields(language);

    const fieldMap: Record<string, Record<UserRole, ListingFieldsConfig>> = {
        'GOODS': {
            // Always the simplified, Facebook-Marketplace-style form now —
            // post-gig's "Sell Items" category no longer distinguishes
            // buyer/provider (see 2026-09-05 decision), so the detail form
            // it leads to shouldn't either. getProviderGoodsFields still
            // exists but nothing routes to it anymore.
            buyer: getBuyerGoodsFields(language),
            provider: getBuyerGoodsFields(language),
            all: getBuyerGoodsFields(language),
        },
        'RENTAL': {
            buyer: getRentalFields(language),
            provider: getRentalFields(language),
            all: getRentalFields(language),
        },
        'SERVICE': {
            buyer: { ...defaultBasicFields, type: 'SERVICE', role: 'buyer' },
            provider: getProviderServiceFields(language),
            all: getProviderServiceFields(language),
        },
        'TASK': {
            buyer: getTaskFields(language),
            provider: getTaskFields(language),
            all: getTaskFields(language),
        },
        'EVENT': {
            buyer: getEventFields(language),
            provider: getEventFields(language),
            all: getEventFields(language),
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
export { getBuyerGoodsFields, getProviderGoodsFields, getGiveawayFields, getWantedFields };
