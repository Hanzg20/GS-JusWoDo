-- Record-only migration (applied via `supabase db query --linked --file`).
--
-- Only the 本地服务 (Services) pillar had an INDUSTRY tier (居家生活/专业美业/
-- 育儿教育/出行时令) — 邻里圈 and 闲置&租赁 had none, so there was no
-- second-level category browsing for them at all. Adds one for
-- 闲置&租赁, reusing (and correctly re-parenting) two categories that
-- already existed but were parented directly to PILLAR_GOODS instead of
-- through an INDUSTRY row — which is exactly why CategoryListing.tsx's
-- pillar->industry->category walk never surfaced them.
--
-- 邻里圈 intentionally gets none here — it already has its own
-- content-type taxonomy (CommunityPostType: MOMENT/ACTION/HELP/NOTICE,
-- rendered as Community.tsx's level-2 tab row), which is the reference
-- UI this migration's industry tabs are styled to match, not something
-- that needs a parallel ref_codes structure of its own.

-- Promote the 2 pre-existing categories to INDUSTRY tier.
UPDATE ref_codes SET type = 'INDUSTRY', sort_order = 1 WHERE code_id = '1040200'; -- 二手市集/Used Goods
UPDATE ref_codes SET type = 'INDUSTRY', sort_order = 2 WHERE code_id = '1040100'; -- 免费领/Free & Share

-- New industries for the Rentals half of this pillar.
INSERT INTO ref_codes (code_id, type, parent_id, zh_name, en_name, sort_order, is_active, extra_data) VALUES
('2030000', 'INDUSTRY', 'PILLAR_GOODS', '设备租赁', 'Gear Rental', 3, true, '{}'),
('2040000', 'INDUSTRY', 'PILLAR_GOODS', '场地租赁', 'Space Rental', 4, true, '{}')
ON CONFLICT (code_id) DO NOTHING;
