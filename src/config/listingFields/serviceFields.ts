import { ListingFieldsConfig } from '@/types/listingFields';

type Lang = 'zh' | 'en';

/**
 * Field definitions for SERVICE type - Provider (Professional services)
 */
export const getProviderServiceFields = (language: Lang): ListingFieldsConfig => ({
    type: 'SERVICE',
    role: 'provider',
    groups: [
        {
            title: language === 'zh' ? '服务基础信息' : 'Basic Service Info',
            fields: [
                {
                    name: 'title',
                    label: language === 'zh' ? '服务名称' : 'Service Name',
                    type: 'text',
                    importance: 'required',
                    placeholder: language === 'zh' ? '例如：专业房屋保洁、理财咨询' : 'e.g. Professional house cleaning, financial consulting',
                    validation: {
                        min: 5,
                        max: 100,
                    }
                },
                {
                    name: 'images',
                    label: language === 'zh' ? '服务展示图片' : 'Service Photos',
                    type: 'images',
                    importance: 'required',
                    helpText: language === 'zh' ? '上传1-6张图，可以是工作照、证书或服务案例' : 'Upload 1-6 photos — work shots, certificates, or past jobs',
                    validation: {
                        min: 1,
                        max: 6,
                    }
                },
                {
                    name: 'description',
                    label: language === 'zh' ? '服务详细说明' : 'Service Description',
                    type: 'textarea',
                    importance: 'required',
                    placeholder: language === 'zh' ? '详细介绍您的服务内容、流程及专业优势...' : 'Describe your service, process, and what sets you apart...',
                    rows: 6,
                },
                {
                    name: 'mediaUrl',
                    label: language === 'zh' ? '展示视频 (YouTube/B站)' : 'Showcase Video (YouTube/Bilibili)',
                    type: 'text',
                    importance: 'optional',
                    placeholder: language === 'zh' ? '粘贴 YouTube 或 B站视频链接' : 'Paste a YouTube or Bilibili video link',
                    helpText: language === 'zh' ? '展示服务演示或作品集视频，提升客户信任' : 'A demo or portfolio video builds customer trust',
                }
            ]
        },
        {
            title: language === 'zh' ? '交易模式与定价' : 'Booking Mode & Pricing',
            fields: [
                {
                    name: 'pricingMode',
                    label: language === 'zh' ? '预定/交易模式' : 'Booking Mode',
                    type: 'select',
                    importance: 'required',
                    options: [
                        { value: 'FIXED', label: language === 'zh' ? '一口价/套餐 (买家可直接付款预定)' : 'Fixed price/package (buyer books & pays directly)' },
                        { value: 'QUOTE', label: language === 'zh' ? '先询价/报价 (买家发起咨询单)' : 'Request a quote (buyer sends an inquiry)' },
                        { value: 'NEGOTIABLE', label: language === 'zh' ? '价格面议 (仅支持私信沟通)' : 'Negotiable (chat to discuss price)' }
                    ],
                    helpText: language === 'zh' ? '选择合适的交易模式，系统将匹配不同的订单流程' : 'This determines which order flow gets used'
                },
                {
                    name: 'skus',
                    label: language === 'zh' ? '服务规格/价格方案' : 'Service Options & Pricing',
                    type: 'sku-list',
                    importance: 'required',
                    conditional: {
                        dependsOn: 'pricingMode',
                        value: 'FIXED'
                    },
                    helpText: language === 'zh' ? '您可以设置多个服务档位，如：基础咨询、深度评估、年度包等。' : 'Add multiple tiers, e.g. basic consult, in-depth assessment, annual plan.',
                }
            ]
        },
        {
            title: language === 'zh' ? '服务范围与规则' : 'Service Area & Rules',
            fields: [
                {
                    name: 'serviceArea',
                    label: language === 'zh' ? '服务区域' : 'Service Area',
                    type: 'location',
                    importance: 'required',
                    placeholder: language === 'zh' ? '例如：Kanata, Barrhaven, 全Ottawa' : 'e.g. Kanata, Barrhaven, all of Ottawa',
                },
                {
                    name: 'bookingRequired',
                    label: language === 'zh' ? '需提前预约' : 'Advance Booking',
                    type: 'select',
                    importance: 'recommended',
                    options: [
                        { value: 'NONE', label: language === 'zh' ? '无需预约' : 'No booking needed' },
                        { value: '1_DAY', label: language === 'zh' ? '需提前1天' : '1 day notice' },
                        { value: '2_DAYS', label: language === 'zh' ? '需提前2天' : '2 days notice' },
                        { value: '1_WEEK', label: language === 'zh' ? '需提前1周' : '1 week notice' },
                    ]
                },
                {
                    name: 'cancelPolicy',
                    label: language === 'zh' ? '取消政策' : 'Cancellation Policy',
                    type: 'textarea',
                    importance: 'recommended',
                    placeholder: language === 'zh' ? '例如：提前24小时免费取消，否则收取50%费用' : 'e.g. Free cancellation 24h in advance, 50% fee otherwise',
                    rows: 2,
                }
            ]
        }
    ]
});
