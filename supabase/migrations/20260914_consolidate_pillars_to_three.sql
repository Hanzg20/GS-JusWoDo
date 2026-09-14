-- Record-only migration (applied via `supabase db query --linked --file`).
--
-- Restores the homepage to 3 pillars (see jwd_three_pillars memory: "杜绝
-- 大而全，突出特色" / reject bloat, stay focused). The 2026-09-06 expansion
-- to 6 pillars (splitting GOODS into Products/Secondhand, promoting
-- Tasks/Rentals to full tiles) drifted from that founding positioning
-- without anyone deciding to revise it — left two stale code comments
-- still claiming "3 Core Category Grid" while rendering 6, and two of the
-- six tiles (Tasks, Rentals) pointed at categories with zero real listings.
--
-- Products folds into Services (both are merchant/professional
-- offerings), Tasks folds into Neighbors (restores the original "跑腿短工
-- folds under 邻里互助" decision), Rentals folds into Secondhand (both are
-- "share what you already own"). Each retired pillar's own route
-- (/category/products, /category/task, /category/rental) still works —
-- only the top-level homepage tile is gone. Reachability is preserved via:
--   - CategoryListing.tsx: sibling tabs (Services<->Products,
--     Secondhand<->Rentals)
--   - Community.tsx: a new "Tasks" top-level tab rendering a listing grid
--     instead of the post feed

UPDATE ref_codes SET is_active = false WHERE code_id IN ('PILLAR_PRODUCTS', 'PILLAR_TASK', 'PILLAR_RENTAL');

UPDATE ref_codes SET
  sort_order = 1,
  extra_data = jsonb_set(jsonb_set(extra_data, '{desc_zh}', '"保洁 / 维修 / 铲雪 / 接送 / 商户产品"'), '{desc_en}', '"Cleaning, repairs, snow, rides & merchant products"')
WHERE code_id = 'PILLAR_SERVICE';

UPDATE ref_codes SET
  sort_order = 2,
  extra_data = jsonb_set(jsonb_set(extra_data, '{desc_zh}', '"求助 / 任务委托 / 推荐 / 资讯"'), '{desc_en}', '"Ask, post a task, recommend, local news"')
WHERE code_id = 'PILLAR_HELP';

UPDATE ref_codes SET
  sort_order = 3,
  zh_name = '闲置 & 租赁',
  en_name = 'Secondhand & Rentals',
  extra_data = jsonb_set(jsonb_set(extra_data, '{desc_zh}', '"闲置买卖 / 免费送 / 设备场地租赁"'), '{desc_en}', '"Used items, giveaways & gear/space rentals"')
WHERE code_id = 'PILLAR_GOODS';
