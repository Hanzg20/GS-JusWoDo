import { ListingFieldsConfig } from '@/types/listingFields';

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
export const buyerGoodsFields: ListingFieldsConfig = {
    type: 'GOODS',
    role: 'buyer',
    groups: [
        {
            title: '基础信息',
            fields: [
                {
                    name: 'images',
                    label: '照片',
                    type: 'images',
                    importance: 'required',
                    helpText: '最多10张，第一张会作为封面',
                    validation: {
                        min: 1,
                        max: 10,
                    }
                },
                {
                    name: 'title',
                    label: '商品名称',
                    type: 'text',
                    importance: 'required',
                    placeholder: '例如：宜家餐桌',
                    validation: {
                        min: 3,
                        max: 100,
                    }
                },
                {
                    name: 'price',
                    label: '价格 (CAD)',
                    type: 'number',
                    importance: 'required',
                    placeholder: '0.00 （填0表示免费送）',
                    validation: {
                        min: 0,
                    }
                },
                {
                    name: 'condition',
                    label: '成色',
                    type: 'select',
                    importance: 'required',
                    options: [
                        { value: 'NEW', label: '全新' },
                        { value: 'LIKE_NEW', label: '几乎全新' },
                        { value: 'GOOD', label: '良好' },
                        { value: 'FAIR', label: '可用' },
                    ]
                },
                {
                    name: 'description',
                    label: '描述',
                    type: 'textarea',
                    importance: 'recommended',
                    placeholder: '介绍一下这件物品的情况...',
                    rows: 4,
                }
            ]
        },
        {
            title: '位置',
            fields: [
                {
                    name: 'pickupLocation',
                    label: '取货地点',
                    type: 'location',
                    importance: 'required',
                    placeholder: 'Kanata Lakes',
                }
            ]
        }
    ]
};

/**
 * Field definitions for GOODS type - Provider (business selling products)
 */
export const providerGoodsFields: ListingFieldsConfig = {
    type: 'GOODS',
    role: 'provider',
    groups: [
        {
            title: '基础信息',
            fields: [
                {
                    name: 'title',
                    label: '商品名称',
                    type: 'text',
                    importance: 'required',
                    placeholder: '例如：健身月卡、洗车套餐',
                    validation: {
                        min: 5,
                        max: 100,
                    }
                },
                {
                    name: 'images',
                    label: '商品图片',
                    type: 'images',
                    importance: 'required',
                    validation: {
                        min: 1,
                        max: 6,
                    }
                },
                {
                    name: 'mediaUrl',
                    label: '展示视频 (YouTube/B站)',
                    type: 'text',
                    importance: 'optional',
                    placeholder: 'https://www.youtube.com/watch?v=...',
                    helpText: '支持 YouTube, Bilibili, Vimeo 等主流视频链接',
                },
                {
                    name: 'description',
                    label: '商品描述',
                    type: 'textarea',
                    importance: 'required',
                    placeholder: '详细介绍商品或服务内容...',
                    rows: 6,
                }
            ]
        },
        {
            title: '价格规格与库存',
            fields: [
                {
                    name: 'skus',
                    label: '规格与价格清单',
                    type: 'sku-list',
                    importance: 'required',
                    helpText: '您可以添加多个规格，如：不同容量、不同套餐等。',
                },
                {
                    name: 'maxPerOrder',
                    label: '每单限购',
                    type: 'number',
                    importance: 'recommended',
                    placeholder: '例如：2',
                    helpText: '防止恶意囤货',
                }
            ]
        },
        {
            title: '有效期与使用',
            fields: [
                {
                    name: 'validity',
                    label: '有效期',
                    type: 'text',
                    importance: 'required',
                    placeholder: '例如：购买后30天内激活，激活后1个月有效',
                },
                {
                    name: 'usageInstructions',
                    label: '使用说明',
                    type: 'textarea',
                    importance: 'required',
                    placeholder: '详细说明如何使用、是否需要预约等...',
                    rows: 4,
                },
                {
                    name: 'restrictions',
                    label: '使用限制',
                    type: 'textarea',
                    importance: 'recommended',
                    placeholder: '例如：节假日不可用、需提前预约',
                    rows: 3,
                }
            ]
        },
        {
            title: '政策与定价',
            fields: [
                {
                    name: 'refundPolicy',
                    label: '退换政策',
                    type: 'textarea',
                    importance: 'required',
                    placeholder: '例如：未激活可退，激活后不退不换',
                    rows: 3,
                },
                {
                    name: 'price',
                    label: '售价 (CAD)',
                    type: 'number',
                    importance: 'required',
                    validation: {
                        min: 0,
                    }
                },
                {
                    name: 'promotion',
                    label: '优惠活动',
                    type: 'text',
                    importance: 'recommended',
                    placeholder: '例如：买2送1、新客8折',
                }
            ]
        }
    ]
};
