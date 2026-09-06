import { ListingFieldsConfig } from '@/types/listingFields';

type Lang = 'zh' | 'en';

export const getTaskFields = (language: Lang): ListingFieldsConfig => ({
    type: 'TASK',
    role: 'all',
    groups: [
        {
            title: language === 'zh' ? '任务基本信息' : 'Task Basics',
            fields: [
                {
                    name: 'title',
                    label: language === 'zh' ? '任务标题' : 'Task Title',
                    type: 'text',
                    importance: 'required',
                    placeholder: language === 'zh' ? '例如：帮忙搬个沙发、周六帮忙去机场接人' : 'e.g. Help move a couch, airport pickup on Saturday',
                },
                {
                    name: 'description',
                    label: language === 'zh' ? '任务详情' : 'Task Details',
                    type: 'textarea',
                    importance: 'required',
                    placeholder: language === 'zh' ? '请详细描述任务内容、所需技能和具体要求...' : 'Describe the task, skills needed, and specific requirements...',
                    rows: 6,
                },
                {
                    name: 'images',
                    label: language === 'zh' ? '现场/参考图 (可选)' : 'Reference Photos (optional)',
                    type: 'images',
                    importance: 'optional',
                    helpText: language === 'zh' ? '上传现场照片可以帮助执行者更快评估' : 'Photos help helpers assess the job faster',
                }
            ]
        },
        {
            title: language === 'zh' ? '酬劳与时间' : 'Pay & Timing',
            fields: [
                {
                    name: 'price',
                    label: language === 'zh' ? '报酬金额 (CAD)' : 'Reward (CAD)',
                    type: 'number',
                    importance: 'required',
                    placeholder: '30.00',
                    helpText: language === 'zh' ? '任务完成后支付给执行者' : 'Paid to the helper once the task is done'
                },
                {
                    name: 'urgency',
                    label: language === 'zh' ? '紧急程度' : 'Urgency',
                    type: 'select',
                    importance: 'recommended',
                    options: [
                        { value: 'NORMAL', label: language === 'zh' ? '普通' : 'Normal' },
                        { value: 'URGENT', label: language === 'zh' ? '火急火燎 (尽快)' : 'Urgent (ASAP)' },
                        { value: 'SCHEDULED', label: language === 'zh' ? '预约时间' : 'Scheduled time' },
                    ]
                },
                {
                    name: 'deadline',
                    label: language === 'zh' ? '截止日期' : 'Deadline',
                    type: 'datetime',
                    importance: 'recommended',
                    placeholder: '2024-01-20',
                }
            ]
        },
        {
            title: language === 'zh' ? '位置信息' : 'Location',
            fields: [
                {
                    name: 'location',
                    label: language === 'zh' ? '任务地点' : 'Task Location',
                    type: 'location',
                    importance: 'required',
                    placeholder: language === 'zh' ? '例如：Lees Ave / 网上办公' : 'e.g. Lees Ave / Remote',
                }
            ]
        }
    ]
});
