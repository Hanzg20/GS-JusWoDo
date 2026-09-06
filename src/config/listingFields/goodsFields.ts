import { ListingFieldsConfig } from '@/types/listingFields';

type Lang = 'zh' | 'en';

/**
 * Field definitions for GOODS type - Buyer (individual selling second-hand
 * items). Deliberately modeled on Facebook Marketplace's "Item for Sale"
 * flow — photos, title, price, condition, description, location, nothing
 * else — since that's the bar for "quick and easy for a non-professional
 * seller" (see conversation 2026-09-05). The old version of this form had
 * 14 fields across 3 groups (purchase source/date, selling reason,
 * conditional delivery-method matrix, negotiable checkbox, etc.) — far more
 * friction than a neighbor listing a used couch should need, and none of it
 * matches what an actual marketplace listing flow asks for.
 */
export const getBuyerGoodsFields = (language: Lang): ListingFieldsConfig => ({
    type: 'GOODS',
    role: 'buyer',
    groups: [
        {
            title: language === 'zh' ? '基础信息' : 'Basic Info',
            fields: [
                {
                    name: 'images',
                    label: language === 'zh' ? '照片' : 'Photos',
                    type: 'images',
                    importance: 'required',
                    helpText: language === 'zh' ? '最多10张，第一张会作为封面' : 'Up to 10 photos, the first one becomes the cover',
                    validation: {
                        min: 1,
                        max: 10,
                    }
                },
                {
                    name: 'title',
                    label: language === 'zh' ? '商品名称' : 'Item Name',
                    type: 'text',
                    importance: 'required',
                    placeholder: language === 'zh' ? '例如：宜家餐桌' : 'e.g. IKEA dining table',
                    validation: {
                        min: 3,
                        max: 100,
                    }
                },
                {
                    name: 'price',
                    label: language === 'zh' ? '价格 (CAD)' : 'Price (CAD)',
                    type: 'number',
                    importance: 'required',
                    placeholder: language === 'zh' ? '0.00 （填0表示免费送）' : '0.00 (enter 0 for free)',
                    validation: {
                        min: 0,
                    }
                },
                {
                    name: 'condition',
                    label: language === 'zh' ? '成色' : 'Condition',
                    type: 'select',
                    importance: 'required',
                    options: [
                        { value: 'NEW', label: language === 'zh' ? '全新' : 'New' },
                        { value: 'LIKE_NEW', label: language === 'zh' ? '几乎全新' : 'Like New' },
                        { value: 'GOOD', label: language === 'zh' ? '良好' : 'Good' },
                        { value: 'FAIR', label: language === 'zh' ? '可用' : 'Fair' },
                    ]
                },
                {
                    name: 'description',
                    label: language === 'zh' ? '描述' : 'Description',
                    type: 'textarea',
                    importance: 'recommended',
                    placeholder: language === 'zh' ? '介绍一下这件物品的情况...' : "Tell buyers about this item's condition...",
                    rows: 4,
                }
            ]
        },
        {
            title: language === 'zh' ? '位置' : 'Location',
            fields: [
                {
                    name: 'pickupLocation',
                    label: language === 'zh' ? '取货地点' : 'Pickup Location',
                    type: 'location',
                    importance: 'required',
                    placeholder: 'Kanata Lakes',
                }
            ]
        }
    ]
});

/**
 * Field definitions for GOODS type - Provider (business selling products)
 */
export const getProviderGoodsFields = (language: Lang): ListingFieldsConfig => ({
    type: 'GOODS',
    role: 'provider',
    groups: [
        {
            title: language === 'zh' ? '基础信息' : 'Basic Info',
            fields: [
                {
                    name: 'title',
                    label: language === 'zh' ? '商品名称' : 'Product Name',
                    type: 'text',
                    importance: 'required',
                    placeholder: language === 'zh' ? '例如：健身月卡、洗车套餐' : 'e.g. Gym monthly pass, car wash bundle',
                    validation: {
                        min: 5,
                        max: 100,
                    }
                },
                {
                    name: 'images',
                    label: language === 'zh' ? '商品图片' : 'Product Photos',
                    type: 'images',
                    importance: 'required',
                    validation: {
                        min: 1,
                        max: 6,
                    }
                },
                {
                    name: 'mediaUrl',
                    label: language === 'zh' ? '展示视频 (YouTube/B站)' : 'Showcase Video (YouTube/Bilibili)',
                    type: 'text',
                    importance: 'optional',
                    placeholder: 'https://www.youtube.com/watch?v=...',
                    helpText: language === 'zh' ? '支持 YouTube, Bilibili, Vimeo 等主流视频链接' : 'YouTube, Bilibili, Vimeo and other major video links supported',
                },
                {
                    name: 'description',
                    label: language === 'zh' ? '商品描述' : 'Product Description',
                    type: 'textarea',
                    importance: 'required',
                    placeholder: language === 'zh' ? '详细介绍商品或服务内容...' : 'Describe the product or service in detail...',
                    rows: 6,
                }
            ]
        },
        {
            title: language === 'zh' ? '价格规格与库存' : 'Pricing, Options & Stock',
            fields: [
                {
                    name: 'skus',
                    label: language === 'zh' ? '规格与价格清单' : 'Options & Pricing',
                    type: 'sku-list',
                    importance: 'required',
                    helpText: language === 'zh' ? '您可以添加多个规格，如：不同容量、不同套餐等。' : 'Add multiple options, e.g. different sizes or bundles.',
                },
                {
                    name: 'maxPerOrder',
                    label: language === 'zh' ? '每单限购' : 'Max Per Order',
                    type: 'number',
                    importance: 'recommended',
                    placeholder: language === 'zh' ? '例如：2' : 'e.g. 2',
                    helpText: language === 'zh' ? '防止恶意囤货' : 'Prevents bulk-buying/hoarding',
                }
            ]
        },
        {
            title: language === 'zh' ? '有效期与使用' : 'Validity & Usage',
            fields: [
                {
                    name: 'validity',
                    label: language === 'zh' ? '有效期' : 'Validity Period',
                    type: 'text',
                    importance: 'required',
                    placeholder: language === 'zh' ? '例如：购买后30天内激活，激活后1个月有效' : 'e.g. Activate within 30 days of purchase, valid for 1 month after activation',
                },
                {
                    name: 'usageInstructions',
                    label: language === 'zh' ? '使用说明' : 'Usage Instructions',
                    type: 'textarea',
                    importance: 'required',
                    placeholder: language === 'zh' ? '详细说明如何使用、是否需要预约等...' : 'Explain how to use it, whether a booking is required, etc...',
                    rows: 4,
                },
                {
                    name: 'restrictions',
                    label: language === 'zh' ? '使用限制' : 'Restrictions',
                    type: 'textarea',
                    importance: 'recommended',
                    placeholder: language === 'zh' ? '例如：节假日不可用、需提前预约' : 'e.g. Not valid on holidays, booking required in advance',
                    rows: 3,
                }
            ]
        },
        {
            title: language === 'zh' ? '政策与定价' : 'Policy & Pricing',
            fields: [
                {
                    name: 'refundPolicy',
                    label: language === 'zh' ? '退换政策' : 'Refund Policy',
                    type: 'textarea',
                    importance: 'required',
                    placeholder: language === 'zh' ? '例如：未激活可退，激活后不退不换' : 'e.g. Refundable before activation, no refunds after activation',
                    rows: 3,
                },
                {
                    name: 'price',
                    label: language === 'zh' ? '售价 (CAD)' : 'Price (CAD)',
                    type: 'number',
                    importance: 'required',
                    validation: {
                        min: 0,
                    }
                },
                {
                    name: 'promotion',
                    label: language === 'zh' ? '优惠活动' : 'Promotion',
                    type: 'text',
                    importance: 'recommended',
                    placeholder: language === 'zh' ? '例如：买2送1、新客8折' : 'e.g. Buy 2 get 1 free, 20% off for new customers',
                }
            ]
        }
    ]
});
