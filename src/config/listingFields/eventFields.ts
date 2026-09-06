import { ListingFieldsConfig } from '@/types/listingFields';

type Lang = 'zh' | 'en';

export const getEventFields = (language: Lang): ListingFieldsConfig => ({
    type: 'EVENT',
    role: 'all',
    groups: [
        {
            title: language === 'zh' ? '活动基本信息' : 'Event Basics',
            fields: [
                {
                    name: 'title',
                    label: language === 'zh' ? '活动主题' : 'Event Title',
                    type: 'text',
                    importance: 'required',
                    placeholder: language === 'zh' ? '例如：周末桌游聚会、羽毛球组队' : 'e.g. Weekend board game night, badminton meetup',
                },
                {
                    name: 'images',
                    label: language === 'zh' ? '活动海报/封面' : 'Event Poster/Cover',
                    type: 'images',
                    importance: 'required',
                },
                {
                    name: 'eventType',
                    label: language === 'zh' ? '活动类型' : 'Event Type',
                    type: 'select',
                    importance: 'required',
                    options: [
                        { label: language === 'zh' ? '邻里聚会 (Neighborhood Party)' : 'Neighborhood Party', value: 'PARTY' },
                        { label: language === 'zh' ? '邻里团购 (Group Buy)' : 'Group Buy', value: 'GROUP_BUY' },
                        { label: language === 'zh' ? '技能分享 (Skill Share)' : 'Skill Share', value: 'SKILL_SHARE' },
                        { label: language === 'zh' ? '互助请求 (Community Task)' : 'Community Task', value: 'TASK' },
                        { label: language === 'zh' ? '二手市集 (Yard Sale)' : 'Yard Sale', value: 'YARD_SALE' },
                        { label: language === 'zh' ? '其他 (Other)' : 'Other', value: 'OTHER' }
                    ],
                    defaultValue: 'PARTY'
                },
                {
                    name: 'description',
                    label: language === 'zh' ? '活动详细信息' : 'Event Details',
                    type: 'textarea',
                    importance: 'required',
                    placeholder: language === 'zh' ? '请说明活动流程、费用说明、注意事项等...' : 'Describe the itinerary, costs, and anything attendees should know...',
                    rows: 6,
                }
            ]
        },
        {
            title: language === 'zh' ? '邻里承诺 (JinBean)' : 'Commitment (JinBean)',
            fields: [
                {
                    name: 'beanCommitment',
                    label: language === 'zh' ? '报名承诺金 (金豆)' : 'RSVP Commitment (Beans)',
                    type: 'number',
                    importance: 'recommended',
                    placeholder: language === 'zh' ? '建议 5-10 豆' : 'Suggested: 5-10 beans',
                    helpText: language === 'zh' ? '用户报名时需暂时锁定的金豆，如约参加后自动退回，可有效防止鸽子。' : 'Temporarily locked when RSVPing, auto-refunded on attendance — discourages no-shows.'
                }
            ]
        },
        {
            title: language === 'zh' ? '时间与地点' : 'Time & Place',
            fields: [
                {
                    name: 'eventTime',
                    label: language === 'zh' ? '活动开始时间' : 'Start Time',
                    type: 'datetime',
                    importance: 'required',
                },
                {
                    name: 'location',
                    label: language === 'zh' ? '活动地点' : 'Event Location',
                    type: 'location',
                    importance: 'required',
                }
            ]
        },
        {
            title: language === 'zh' ? '参与限制' : 'Participation Limits',
            fields: [
                {
                    name: 'maxParticipants',
                    label: language === 'zh' ? '人数限制' : 'Max Participants',
                    type: 'number',
                    importance: 'recommended',
                    placeholder: language === 'zh' ? '0 表示不限' : '0 for unlimited',
                },
                {
                    name: 'price',
                    label: language === 'zh' ? '报名费/人均费用 (CAD)' : 'Fee Per Person (CAD)',
                    type: 'number',
                    importance: 'required',
                    placeholder: '0',
                    helpText: language === 'zh' ? '0 表示免费活动' : '0 means the event is free'
                },
                {
                    name: 'contact',
                    label: language === 'zh' ? '组织者联系方式' : "Organizer's Contact",
                    type: 'contact',
                    importance: 'required',
                }
            ]
        }
    ]
});
