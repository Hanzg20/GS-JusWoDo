/**
 * Simple Auto-Categorization Utility
 * In production, this would use an LLM or a more complex keyword/embedding matcher.
 */
export const autoMatchSubcategory = (title: string, description: string, parentIndustryId: string): string => {
    const text = (title + " " + description).toLowerCase();

    // Simple Keyword Mapping (Numeric IDs from ref_codes)
    const mappings: Record<string, string[]> = {
        '1010100': ['clean', 'cleaning', '保洁', '洗'], // Home Cleaning
        '1040600': ['food', 'eat', 'meal', 'bake', 'cake', 'groceries', '美食', '外卖', '代购'], // Market
        '1040200': ['sell', 'unused', 'secondhand', 'old', '二手', '闲置'], // Used Goods
        '1050600': ['car', 'ride', 'airport', 'transport', '顺风车', '接送'], // Carpool
        '1010400': ['assemble', 'ikea', 'furniture', 'repair', '安装', '维修'], // Maintenance
    };

    for (const [subId, keywords] of Object.entries(mappings)) {
        if (keywords.some(k => text.includes(k.toLowerCase()))) {
            return subId;
        }
    }

    // Default to the parent industry ID
    return parentIndustryId;
};
