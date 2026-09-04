-- ==========================================
-- CATEGORY PILLARS
-- Purpose: Add a top-level "PILLAR" tier above the existing INDUSTRY/CATEGORY
-- tree so the homepage's 3-pillar navigation (商户服务/邻里互助/二手闲置) is
-- driven by ref_codes instead of hardcoded in CategoryIconGrid.tsx.
-- No new table — ref_codes.type is plain TEXT with no CHECK constraint,
-- so this is additive only (new rows + parent_id reassignment).
-- ==========================================

-- 1. The 3 pillars
INSERT INTO public.ref_codes (code_id, type, zh_name, en_name, extra_data, sort_order) VALUES
  ('PILLAR_SERVICE', 'PILLAR', '商户服务', 'Local Services',
    '{"icon": "Wrench", "bgColor": "bg-orange-50 text-orange-600 border-orange-100", "badgeColor": "bg-orange-500", "desc_zh": "保洁 / 维修 / 铲雪 / 接送", "desc_en": "Cleaning, repairs, snow, rides", "path": "/category/service"}', 1),
  ('PILLAR_HELP', 'PILLAR', '邻里互助', 'Neighborhood Help',
    '{"icon": "MessageSquareQuote", "bgColor": "bg-emerald-50 text-emerald-600 border-emerald-100", "badgeColor": "bg-emerald-500", "desc_zh": "求助 / 跑腿短工 / 推荐 / 资讯", "desc_en": "Ask, errands, recommend", "path": "/community"}', 2),
  ('PILLAR_GOODS', 'PILLAR', '二手闲置', 'Secondhand & Free',
    '{"icon": "Gift", "bgColor": "bg-purple-50 text-purple-600 border-purple-100", "badgeColor": "bg-purple-500", "desc_zh": "闲置买卖 / 免费送 / 物品转让", "desc_en": "Used items, free giveaways", "path": "/category/goods"}', 3)
ON CONFLICT (code_id) DO UPDATE SET
  zh_name = EXCLUDED.zh_name,
  en_name = EXCLUDED.en_name,
  extra_data = EXCLUDED.extra_data,
  sort_order = EXCLUDED.sort_order;

-- 2. Reparent whole industries that map cleanly to one pillar
-- 1010000 Home & Life, 1020000 Pro & Beauty, 1030000 Kids & Wellness, 1050000 Travel & Outdoor
UPDATE public.ref_codes SET parent_id = 'PILLAR_SERVICE'
  WHERE code_id IN ('1010000', '1020000', '1030000', '1050000');

-- 3. 1040000 "Food & Market" straddles two pillars — reparent its leaf
-- categories individually instead of the whole industry.
-- Free & Share (1040100), Used Goods (1040200) -> secondhand
UPDATE public.ref_codes SET parent_id = 'PILLAR_GOODS'
  WHERE code_id IN ('1040100', '1040200');

-- Tool Rental, Sports Gear, Food Sharing, Home Food, Local Eats -> local services
UPDATE public.ref_codes SET parent_id = 'PILLAR_SERVICE'
  WHERE code_id IN ('1040300', '1040400', '1040500', '1040600', '1040700');

-- The old 1040000 industry row itself no longer has a clean pillar home;
-- deactivate it rather than delete (its children have already moved up).
UPDATE public.ref_codes SET is_active = false WHERE code_id = '1040000';
