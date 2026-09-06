import { ListingFieldsConfig } from '@/types/listingFields';

type Lang = 'zh' | 'en';

export const getRentalFields = (language: Lang): ListingFieldsConfig => ({
    type: 'RENTAL',
    role: 'all',
    groups: [
        {
            title: language === 'zh' ? '租赁基础信息' : 'Rental Basics',
            fields: [
                {
                    name: 'title',
                    label: language === 'zh' ? '物品名称' : 'Item Name',
                    type: 'text',
                    importance: 'required',
                    placeholder: language === 'zh' ? '例如：DJI Mavic 3 无人机、高压清洗机' : 'e.g. DJI Mavic 3 drone, pressure washer',
                },
                {
                    name: 'images',
                    label: language === 'zh' ? '物品实拍图' : 'Item Photos',
                    type: 'images',
                    importance: 'required',
                    helpText: language === 'zh' ? '展示物品当前品相和配件，最多6张' : "Show the item's current condition and accessories, up to 6 photos",
                },
                {
                    name: 'description',
                    label: language === 'zh' ? '物品及规则说明' : 'Item & Rental Terms',
                    type: 'textarea',
                    importance: 'required',
                    placeholder: language === 'zh' ? '请说明物品成色、功能，以及您的租用要求...' : "Describe the item's condition, features, and your rental requirements...",
                    rows: 6,
                },
                {
                    name: 'mediaUrl',
                    label: language === 'zh' ? '视频介绍 (YouTube/B站)' : 'Intro Video (YouTube/Bilibili)',
                    type: 'text',
                    importance: 'optional',
                    placeholder: language === 'zh' ? '粘贴 YouTube 或 B站视频链接' : 'Paste a YouTube or Bilibili video link',
                    helpText: language === 'zh' ? '展示物品细节或使用说明视频，提升信任度' : 'A detail or how-to video builds renter trust',
                }
            ]
        },
        {
            title: language === 'zh' ? '价格与押金' : 'Price & Deposit',
            fields: [
                {
                    name: 'price',
                    label: language === 'zh' ? '租金 (CAD)' : 'Rental Rate (CAD)',
                    type: 'number',
                    importance: 'required',
                    placeholder: '20.00',
                },
                {
                    name: 'unit',
                    label: language === 'zh' ? '计费单位' : 'Billing Unit',
                    type: 'select',
                    importance: 'required',
                    options: [
                        { value: 'DAY', label: language === 'zh' ? '每天' : 'Per day' },
                        { value: 'HOUR', label: language === 'zh' ? '每小时' : 'Per hour' },
                        { value: 'WEEK', label: language === 'zh' ? '每周' : 'Per week' },
                        { value: 'SESSION', label: language === 'zh' ? '每次' : 'Per session' },
                    ]
                },
                {
                    name: 'deposit',
                    label: language === 'zh' ? '押金 (CAD)' : 'Deposit (CAD)',
                    type: 'number',
                    importance: 'required',
                    placeholder: '100.00',
                    helpText: language === 'zh' ? '租完归还无损后自动退还给租客' : 'Automatically refunded once the item is returned undamaged'
                }
            ]
        },
        {
            title: language === 'zh' ? '取还与限制' : 'Pickup & Restrictions',
            fields: [
                {
                    name: 'pickupLocation',
                    label: language === 'zh' ? '取物地点' : 'Pickup Location',
                    type: 'location',
                    importance: 'required',
                    placeholder: language === 'zh' ? '例如：Kanata Lakes' : 'e.g. Kanata Lakes',
                },
                {
                    name: 'accessories',
                    label: language === 'zh' ? '含配件清单' : 'Included Accessories',
                    type: 'textarea',
                    importance: 'recommended',
                    placeholder: language === 'zh' ? '例如：含2块电池、充电器、便携包' : 'e.g. Includes 2 batteries, charger, carry case',
                    rows: 2,
                },
                {
                    name: 'damagePolicy',
                    label: language === 'zh' ? '损耗/赔偿说明' : 'Damage Policy',
                    type: 'textarea',
                    importance: 'recommended',
                    placeholder: language === 'zh' ? '例如：划痕不计，严重摔伤按维修价格赔偿' : 'e.g. Minor scratches OK, major damage billed at repair cost',
                    rows: 2,
                }
            ]
        }
    ]
});
