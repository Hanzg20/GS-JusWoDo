// JWD's mascot family — see jwd_mascot_family memory. One consistent
// naming dimension: "小 + 两字物种名" (matches the two already-shipped
// mascots, 小海狸/AI客服 and 小百灵/邻里圈真言 — renamed 2026-09-16 from
// 小螺号, which was an object/instrument name, not a species, and broke
// this exact convention), each tied to a real Ottawa-area animal whose
// real-world habit maps onto its module.
// Real illustrated artwork shipped 2026-09-16 (public/mascots/*.png,
// cropped from a single AI-generated character sheet so all five stay
// one consistent style/palette) — replaced the earlier dicebear
// fun-emoji placeholders.

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
    avatar: '/mascots/bee.png',
    emptyStateZh: '小蜜蜂正忙着张罗呢，这个分类马上就有新{title}啦～',
    emptyStateEn: "Little Bee's buzzing around gathering listings — new services coming to this category soon!",
};

export const MASCOT_RACCOON: Mascot = {
    name: '小浣熊',
    avatar: '/mascots/raccoon.png',
    emptyStateZh: '小浣熊还没在这里淘到宝贝，要不第一个发布试试？',
    emptyStateEn: "Little Raccoon hasn't dug up any treasures here yet — want to be the first to post one?",
};

export const MASCOT_SQUIRREL: Mascot = {
    name: '小松鼠',
    avatar: '/mascots/squirrel.png',
    rewardZh: '小松鼠给你囤了 {amount} 颗金豆 🌰',
    rewardEn: "Little Squirrel stashed {amount} JinBeans for you 🌰",
};

// 小百灵/小海狸 are real accounts (community mascot, AI support), not
// pure UI config like the three above — but other pages (homepage
// pillar grid, 404 page) need their avatar paths too, so they're
// exported here rather than hardcoded again at each call site.
export const MASCOT_LARK: Mascot = {
    name: '小百灵',
    avatar: '/mascots/lark.png',
};

export const MASCOT_BEAVER: Mascot = {
    name: '小海狸',
    avatar: '/mascots/beaver.png',
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

// Maps a homepage pillar's ref_codes codeId (or FALLBACK_PILLARS entry,
// same codeIds) to the mascot that fronts it on CategoryIconGrid.tsx —
// so a visitor sees the same character on the homepage tile and later
// inside that module, instead of the animal feeling introduced out of
// nowhere the first time they hit an empty state.
export const MASCOT_BY_PILLAR: Record<string, Mascot> = {
    PILLAR_SERVICE: MASCOT_BEE,
    PILLAR_HELP: MASCOT_LARK,
    PILLAR_GOODS: MASCOT_RACCOON,
};
