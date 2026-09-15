// JWD's mascot family — see jwd_mascot_family memory. One consistent
// naming dimension: "小 + 两字物种名" (matches the two already-shipped
// mascots, 小海狸/AI客服 and 小螺号/邻里圈真言), each tied to a real
// Ottawa-area animal whose real-world habit maps onto its module.
// Placeholder avatars only (dicebear fun-emoji, same stopgap used for
// 小海狸) — real illustrated artwork needs a designer/image tool this
// session doesn't have, swap these out once that exists.

export type PillarType = 'service' | 'products' | 'secondhand' | 'rental' | 'task';

export interface Mascot {
    name: string;
    avatar: string;
    // Empty-state copy — {title} is replaced with the page's own title
    // (getPageTitle(type) in CategoryListing.tsx) so it stays specific to
    // whatever category the visitor is actually looking at. Optional
    // because not every mascot is used in an empty-state context (e.g.
    // 小松鼠, which only appears in JinBean reward messaging).
    emptyStateZh?: string;
    emptyStateEn?: string;
    // Reward-toast copy — {amount} is replaced with the actual bean count
    // (jinbean_rules.REVIEW_REWARD) so it never drifts from the real payout.
    rewardZh?: string;
    rewardEn?: string;
}

export const MASCOT_BEE: Mascot = {
    name: '小蜜蜂',
    avatar: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=xiaomifeng-bee&backgroundColor=fde68a',
    emptyStateZh: '小蜜蜂正忙着张罗呢，这个分类马上就有新{title}啦～',
    emptyStateEn: "Little Bee's buzzing around gathering listings — new services coming to this category soon!",
};

export const MASCOT_RACCOON: Mascot = {
    name: '小浣熊',
    avatar: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=xiaohuanxiong-raccoon&backgroundColor=c7d2fe',
    emptyStateZh: '小浣熊还没在这里淘到宝贝，要不第一个发布试试？',
    emptyStateEn: "Little Raccoon hasn't dug up any treasures here yet — want to be the first to post one?",
};

export const MASCOT_SQUIRREL: Mascot = {
    name: '小松鼠',
    avatar: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=xiaosongshu-squirrel&backgroundColor=fed7aa',
    rewardZh: '小松鼠给你囤了 {amount} 颗金豆 🌰',
    rewardEn: "Little Squirrel stashed {amount} JinBeans for you 🌰",
};

// Maps a CategoryListing.tsx `type` param to the mascot whose module it
// belongs to — mirrors the TYPE_TO_PILLAR grouping already established
// there (products shares Services' mascot, rental shares Secondhand's).
export const MASCOT_BY_TYPE: Partial<Record<PillarType, Mascot>> = {
    service: MASCOT_BEE,
    products: MASCOT_BEE,
    secondhand: MASCOT_RACCOON,
    rental: MASCOT_RACCOON,
};
