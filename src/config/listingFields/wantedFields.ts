import { ListingFieldsConfig } from '@/types/listingFields';

type Lang = 'zh' | 'en';

export const getWantedFields = (language: Lang): ListingFieldsConfig => ({
    type: 'GOODS',
    role: 'buyer',
    groups: [
        {
            title: language === 'zh' ? '我想求购' : 'What I Want',
            fields: [
                {
                    name: 'title',
                    label: language === 'zh' ? '想要的物品/服务' : 'Item/Service Wanted',
                    type: 'text',
                    importance: 'required',
                    placeholder: language === 'zh' ? '例如：求购二手显示器、寻求搬家服务' : 'e.g. Looking for a used monitor, need moving help',
                },
                {
                    name: 'description',
                    label: language === 'zh' ? '详细要求' : 'Details',
                    type: 'textarea',
                    importance: 'required',
                    placeholder: language === 'zh' ? '请详细说明您的需求、期望的成色或服务内容...' : 'Describe what you need, expected condition, or service details...',
                    rows: 5,
                },
                {
                    name: 'images',
                    label: language === 'zh' ? '参考图 (可选)' : 'Reference Photo (optional)',
                    type: 'images',
                    importance: 'optional',
                    helpText: language === 'zh' ? '上传一张参考图可以帮您更快找到目标' : 'A reference photo helps others find what you need faster',
                }
            ]
        },
        {
            title: language === 'zh' ? '预算与时间' : 'Budget & Timing',
            fields: [
                {
                    name: 'price',
                    label: language === 'zh' ? '我的预算 (CAD)' : 'My Budget (CAD)',
                    type: 'number',
                    importance: 'recommended',
                    placeholder: '0.00',
                    helpText: language === 'zh' ? '填0表示面议' : 'Enter 0 for negotiable'
                },
                {
                    name: 'neededBy',
                    label: language === 'zh' ? '期望获得日期' : 'Needed By',
                    type: 'datetime',
                    importance: 'optional',
                }
            ]
        }
    ]
});
