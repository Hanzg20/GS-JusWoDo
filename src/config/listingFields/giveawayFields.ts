import { ListingFieldsConfig } from '@/types/listingFields';

type Lang = 'zh' | 'en';

export const getGiveawayFields = (language: Lang): ListingFieldsConfig => ({
    type: 'GOODS', // Using GOODS type but flavored as giveaway
    role: 'all',
    groups: [
        {
            title: language === 'zh' ? '赠送信息' : 'Giveaway Info',
            fields: [
                {
                    name: 'title',
                    label: language === 'zh' ? '物品名称' : 'Item Name',
                    type: 'text',
                    importance: 'required',
                    placeholder: language === 'zh' ? '例如：闲置搬家纸箱、多余的盆栽' : 'e.g. Spare moving boxes, extra potted plants',
                },
                {
                    name: 'images',
                    label: language === 'zh' ? '物品图片' : 'Item Photos',
                    type: 'images',
                    importance: 'required',
                },
                {
                    name: 'description',
                    label: language === 'zh' ? '详情说明' : 'Details',
                    type: 'textarea',
                    importance: 'required',
                    placeholder: language === 'zh' ? '请说明物品新旧程度及领取方式...' : 'Describe the condition and how to pick it up...',
                    rows: 4,
                }
            ]
        },
        {
            title: language === 'zh' ? '领取规则' : 'Pickup Rules',
            fields: [
                {
                    name: 'price',
                    label: language === 'zh' ? '价格' : 'Price',
                    type: 'number',
                    importance: 'required',
                    placeholder: '0',
                    // Locked to 0 in UI would be better, but for now we set default
                },
                {
                    name: 'pickupLocation',
                    label: language === 'zh' ? '领取地点' : 'Pickup Location',
                    type: 'location',
                    importance: 'required',
                },
                {
                    name: 'giveawayCondition',
                    label: language === 'zh' ? '赠送对象要求' : 'Who Can Claim It',
                    type: 'select',
                    importance: 'optional',
                    options: [
                        { value: 'ANYONE', label: language === 'zh' ? '先到先得 (先联系先得)' : 'First come, first served' },
                        { value: 'NEIGHBOR_ONLY', label: language === 'zh' ? '认证邻居优先' : 'Verified neighbors first' },
                        { value: 'CHARITY', label: language === 'zh' ? '优先给有需要的人' : 'Priority to those in need' },
                    ]
                }
            ]
        }
    ]
});
