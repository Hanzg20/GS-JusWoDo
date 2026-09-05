-- ==========================================
-- Test data targeting the specific coverage gaps found while auditing the
-- Master-Detail listing model against real usage. Before this file, the
-- live DB had (54 listing_masters / 65 listing_items):
--   types:          GOODS 21, SERVICE 21, RENTAL 7, TASK 4, CONSULTATION 1
--                   (EVENT/FREE_GIVEAWAY/WANTED/OTHER: impossible — see
--                   20260904_add_listing_type_enum_values.sql)
--   pricing models: FIXED 53, QUOTE 5, DAILY 5, VISIT_FEE 2
--                   (HOURLY/NEGOTIABLE/DEPOSIT_REQUIRED: zero rows)
--   listing_items.parent_item_id (hierarchical add-ons): zero rows, despite
--                   explicit schema support
--
-- Each row below isolates exactly one previously-untested dimension rather
-- than broadly padding out demo content. Run AFTER
-- 20260904_add_listing_type_enum_values.sql.
-- ==========================================

-- New leaf categories the existing tree had no slot for.
INSERT INTO public.ref_codes (code_id, parent_id, type, en_name, zh_name, extra_data, sort_order) VALUES
  ('1020700', '1020000', 'CATEGORY', 'Legal Consultation', '法律咨询', '{"icon": "Scale", "requiresLicense": true, "license": "LSO"}', 7),
  ('1010800', '1010000', 'CATEGORY', 'Community Events', '社区活动', '{"icon": "PartyPopper"}', 8)
ON CONFLICT (code_id) DO UPDATE SET
  en_name = EXCLUDED.en_name, zh_name = EXCLUDED.zh_name, extra_data = EXCLUDED.extra_data;

-- ------------------------------------------
-- Providers
-- ------------------------------------------
INSERT INTO public.provider_profiles
  (id, user_id, business_name_zh, business_name_en, identity, is_verified, verification_level, stats, insurance_summary_en, license_info, status)
VALUES
  -- Verified professional, for CONSULTATION + HOURLY pricing + a LAWYER credential row.
  ('a1000001-0001-4001-8001-000000000001', 'e1507f9e-7343-4474-a1da-301a213943ec',
   '渥太华家庭律师事务所', 'Ottawa Family Law', 'MERCHANT', true, 3,
   '{"totalOrders": 34, "averageRating": 4.9, "reviewCount": 21, "totalIncome": 0}',
   NULL, 'LSO Licensed — Family & Real Estate Law', 'ACTIVE'),

  -- Bakery for the SERVICE+DEPOSIT_REQUIRED case (deposit outside RENTAL).
  ('a1000003-0003-4003-8003-000000000003', '4ccc08eb-263b-4f40-9f44-5a5d1f1d44c1',
   '甜心定制蛋糕', 'Sweet Treats Custom Cakes', 'MERCHANT', true, 2,
   '{"totalOrders": 60, "averageRating": 4.8, "reviewCount": 40, "totalIncome": 0}',
   NULL, NULL, 'ACTIVE'),

  -- Deliberately thin profile: a WANTED post is authored by someone looking
  -- to BUY, not a service provider — but listing_masters.provider_id is a
  -- hard FK to provider_profiles, so even a buyer needs a (mostly empty)
  -- provider row just to post a want-ad. Zero stats, unverified — this is
  -- the shape a real "just want to ask" neighbor would have.
  ('a1000002-0002-4002-8002-000000000002', '90a959d2-9b40-4848-a16c-8113a4598ec7',
   '', 'Andy (Neighbor)', 'NEIGHBOR', false, 1,
   '{"totalOrders": 0, "averageRating": 0, "reviewCount": 0, "totalIncome": 0}',
   NULL, NULL, 'ACTIVE')
ON CONFLICT (id) DO UPDATE SET
  business_name_en = EXCLUDED.business_name_en, is_verified = EXCLUDED.is_verified;

INSERT INTO public.professional_credentials (provider_id, type, license_number, jurisdiction, status)
VALUES ('a1000001-0001-4001-8001-000000000001', 'LAWYER', 'LSO-445566', 'ONTARIO', 'VERIFIED')
ON CONFLICT DO NOTHING;

-- ------------------------------------------
-- Listings — one per gap
-- ------------------------------------------
INSERT INTO public.listing_masters
  (id, provider_id, title_zh, title_en, description_zh, description_en, images, type, category_id, node_id, status, tags, location, metadata)
VALUES

-- 1. CONSULTATION billed HOURLY (only CONSULTATION row before this was QUOTE-priced)
('b1000001-0001-4001-8001-000000000001', 'a1000001-0001-4001-8001-000000000001',
 '家庭法律咨询', 'Family Law Consultation',
 '离婚、监护权、房产纠纷的初次咨询。按小时计费，首次咨询可通过视频或面谈进行。',
 'Initial consultation for divorce, custody, or property disputes. Billed hourly, available by video or in person.',
 ARRAY['https://images.unsplash.com/photo-1521791136064-7986c2920216'],
 'CONSULTATION', '1020700', 'NODE_CENTRETOWN', 'PUBLISHED',
 ARRAY['legal','lawyer','consultation'], '{"fullAddress": "Centretown, Ottawa"}', '{}'),

-- 2. RENTAL with pricing_model=DEPOSIT_REQUIRED (not just a DAILY/FIXED item
--    that happens to carry a deposit) + a hierarchical add-on item.
('b1000002-0002-4002-8002-000000000002', 'c3333333-3333-3333-3333-33333333333c',
 '投影仪+幕布租赁（活动用）', 'Projector & Screen Rental (Event Kit)',
 '4K投影仪 + 100寸幕布，适合社区活动、生日会。押金取车时刷卡预授权，归还后原路退回。',
 '4K projector + 100" screen, great for community events or birthday parties. Deposit is a hold at pickup, released on return.',
 ARRAY['https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c'],
 'RENTAL', '1040300', 'NODE_BARRHAVEN', 'PUBLISHED',
 ARRAY['rental','projector','event'], '{"fullAddress": "Barrhaven, Ottawa"}', '{}'),

-- 3. SERVICE (not RENTAL) with pricing_model=DEPOSIT_REQUIRED — exercises
--    the deposit UI outside the one type it currently assumes.
('b1000003-0003-4003-8003-000000000003', 'a1000003-0003-4003-8003-000000000003',
 '定制生日蛋糕预订', 'Custom Birthday Cake Order',
 '3天前下单，$20定金锁定档期，取货时补齐尾款。可指定图案和口味。',
 'Order 3 days ahead, $20 deposit holds your slot, balance due at pickup. Custom design & flavor.',
 ARRAY['https://images.unsplash.com/photo-1578985545062-69928b1d9587'],
 'SERVICE', '1040600', 'NODE_ORLEANS', 'PUBLISHED',
 ARRAY['cake','custom','food'], '{"fullAddress": "Orleans, Ottawa"}', '{}'),

-- 4. TASK, NEGOTIABLE budget, with metadata.deadline — TaskDetailView.tsx
--    currently hardcodes "Flexible" for its Deadline field and never reads
--    master.metadata at all, so this also documents that as a live gap.
('b1000004-0004-4004-8004-000000000004', '11111111-1111-1111-1111-111111111110',
 '帮忙搬一个书架到二楼', 'Help Move a Bookshelf Upstairs',
 '一个中等大小的书架，从车库搬到二楼卧室。大概20分钟，预算可议。周六前需要完成。',
 'Medium bookshelf, garage to a 2nd-floor bedroom. About 20 minutes, budget negotiable. Needs doing before Saturday.',
 ARRAY['https://images.unsplash.com/photo-1595428774223-ef52624120d2'],
 'TASK', '1010500', 'NODE_CENTRETOWN', 'PUBLISHED',
 ARRAY['task','moving','help'], '{"fullAddress": "Centretown, Ottawa"}',
 '{"deadline": "2026-09-10", "urgency": "THIS_WEEK"}'),

-- 5. EVENT — first-ever row of this type, exercises EventDetailView.tsx's
--    RSVP flow, bean-commitment lock, and participant cap.
('b1000005-0005-4005-8005-000000000005', '20a1b2c3-4d5e-4f6a-7b8c-9d0e1f2a3b4c',
 '中秋灯笼节 · 邻里聚会', 'Mid-Autumn Lantern Festival — Neighbors Meetup',
 '一起做灯笼、吃月饼、聊聊天！适合全家参加，请提前报名以便准备物料。',
 'Make lanterns, share mooncakes, meet your neighbors! Family-friendly — RSVP ahead so we can prep supplies.',
 ARRAY['https://images.unsplash.com/photo-1541535650810-10d26f5c2ab3'],
 'EVENT', '1010800', 'NODE_CENTRETOWN', 'PUBLISHED',
 ARRAY['event','community','festival'], '{"fullAddress": "Dundonald Park, Centretown, Ottawa"}',
 '{"eventType": "FESTIVAL", "eventTime": "2026-09-27T22:00:00Z", "maxParticipants": 40, "beanCommitment": 20}'),

-- 6. FREE_GIVEAWAY, now properly typed instead of the pre-existing
--    workaround (id 13131313-..., "Free Moving Boxes", stored as GOODS
--    because this type didn't exist yet).
('b1000006-0006-4006-8006-000000000006', '11111111-1111-1111-1111-111111111110',
 '旧书箱免费送', 'Box of Used Books — Free',
 '搬家整理出的一箱书，小说和育儿类为主，状态良好。先到先得，需自取。',
 'A box of books from moving — mostly novels and parenting titles, good condition. First come first served, pickup only.',
 ARRAY['https://images.unsplash.com/photo-1512820790803-83ca734da794'],
 'FREE_GIVEAWAY', '1040100', 'NODE_BYWARDMARKET', 'PUBLISHED',
 ARRAY['free','books','giveaway'], '{"fullAddress": "ByWard Market, Ottawa"}', '{}'),

-- 7. WANTED — reverse listing (the "provider" is the person looking to buy,
--    not sell); first-ever row of this type.
('b1000007-0007-4007-8007-000000000007', 'a1000002-0002-4002-8002-000000000002',
 '求购二手儿童自行车（12-16寸）', 'Looking for a Used Kids Bike (12–16")',
 '孩子刚学会骑车，求购一辆二手儿童自行车，12-16寸都可以，状态能骑就行。预算$30左右。',
 'Kid just learned to ride — looking for a used bike, 12–16", any working condition. Budget around $30.',
 ARRAY['https://images.unsplash.com/photo-1571333250630-f0230c320b6d'],
 'WANTED', '1040200', 'NODE_BARRHAVEN', 'PUBLISHED',
 ARRAY['wanted','kids','bike'], '{"fullAddress": "Barrhaven, Ottawa"}', '{}')

ON CONFLICT (id) DO UPDATE SET
  title_zh = EXCLUDED.title_zh, title_en = EXCLUDED.title_en,
  description_zh = EXCLUDED.description_zh, description_en = EXCLUDED.description_en,
  status = EXCLUDED.status, metadata = EXCLUDED.metadata;

-- ------------------------------------------
-- Items
-- ------------------------------------------
INSERT INTO public.listing_items
  (id, master_id, name_zh, name_en, description_en, price_amount, price_currency, price_unit, deposit_amount, pricing_model, status, pricing, parent_item_id)
VALUES

-- 1. HOURLY
('c1000001-0001-4001-8001-000000000001', 'b1000001-0001-4001-8001-000000000001',
 '首次咨询（1小时）', 'Initial Consultation (1 hour)', 'Video or in-person, 1-hour block.',
 22000, 'CAD', 'hour', 0, 'HOURLY', 'AVAILABLE',
 '{"model":"HOURLY","price":{"amount":22000,"currency":"CAD","formatted":"$220.00"},"unit":"hour"}', NULL),

-- 2a. RENTAL parent item, DEPOSIT_REQUIRED
('c1000002-0002-4002-8002-000000000002', 'b1000002-0002-4002-8002-000000000002',
 '投影仪套装（每次活动）', 'Projector Kit (per event)', 'Projector + 100" screen + cables.',
 3500, 'CAD', 'per event', 15000, 'DEPOSIT_REQUIRED', 'AVAILABLE',
 '{"model":"DEPOSIT_REQUIRED","price":{"amount":3500,"currency":"CAD","formatted":"$35.00"},"unit":"per event","deposit":{"amount":15000,"currency":"CAD","formatted":"$150.00"}}', NULL),

-- 2b. Hierarchical add-on — first-ever use of parent_item_id.
('c1000012-0012-4012-8012-000000000012', 'b1000002-0002-4002-8002-000000000002',
 '+ 便携发电机（户外用）', '+ Portable Generator (outdoor add-on)', 'For outdoor screenings without a power outlet.',
 1500, 'CAD', 'per event', 5000, 'DEPOSIT_REQUIRED', 'AVAILABLE',
 '{"model":"DEPOSIT_REQUIRED","price":{"amount":1500,"currency":"CAD","formatted":"$15.00"},"unit":"per event","deposit":{"amount":5000,"currency":"CAD","formatted":"$50.00"}}',
 'c1000002-0002-4002-8002-000000000002'),

-- 3. SERVICE + DEPOSIT_REQUIRED (deposit UI is currently gated to
--    item.type === 'RENTAL' in ListingCard.tsx — this row has no RENTAL
--    type, so its deposit amount won't surface on the card at all).
('c1000003-0003-4003-8003-000000000003', 'b1000003-0003-4003-8003-000000000003',
 '8寸定制蛋糕', '8" Custom Cake', 'Design + flavor of your choice, 3-day lead time.',
 6500, 'CAD', 'per cake', 2000, 'DEPOSIT_REQUIRED', 'AVAILABLE',
 '{"model":"DEPOSIT_REQUIRED","price":{"amount":6500,"currency":"CAD","formatted":"$65.00"},"unit":"per cake","deposit":{"amount":2000,"currency":"CAD","formatted":"$20.00"}}', NULL),

-- 4. TASK, NEGOTIABLE
('c1000004-0004-4004-8004-000000000004', 'b1000004-0004-4004-8004-000000000004',
 '搬运工时', 'Moving Help', 'Roughly 20 minutes of help.',
 4000, 'CAD', 'task', 0, 'NEGOTIABLE', 'AVAILABLE',
 '{"model":"NEGOTIABLE","price":{"amount":4000,"currency":"CAD","formatted":"$40.00"},"unit":"task"}', NULL),

-- 5. EVENT, free ticket (bean commitment carries the "cost")
('c1000005-0005-4005-8005-000000000005', 'b1000005-0005-4005-8005-000000000005',
 '活动名额', 'Event RSVP', 'Free to attend — bean commitment refunded on attendance.',
 0, 'CAD', 'per person', 0, 'FIXED', 'AVAILABLE',
 '{"model":"FIXED","price":{"amount":0,"currency":"CAD","formatted":"$0.00"},"unit":"per person"}', NULL),

-- 6. FREE_GIVEAWAY, $0
('c1000006-0006-4006-8006-000000000006', 'b1000006-0006-4006-8006-000000000006',
 '一箱书', 'Box of Books', 'Pickup only.',
 0, 'CAD', 'box', 0, 'FIXED', 'AVAILABLE',
 '{"model":"FIXED","price":{"amount":0,"currency":"CAD","formatted":"$0.00"},"unit":"box"}', NULL),

-- 7. WANTED, NEGOTIABLE (their budget ceiling, not a seller's ask)
('c1000007-0007-4007-8007-000000000007', 'b1000007-0007-4007-8007-000000000007',
 '预算', 'Budget', 'Willing to pay up to this for the right bike.',
 3000, 'CAD', 'budget', 0, 'NEGOTIABLE', 'AVAILABLE',
 '{"model":"NEGOTIABLE","price":{"amount":3000,"currency":"CAD","formatted":"$30.00"},"unit":"budget"}', NULL)

ON CONFLICT (id) DO UPDATE SET
  price_amount = EXCLUDED.price_amount, pricing_model = EXCLUDED.pricing_model,
  pricing = EXCLUDED.pricing, status = EXCLUDED.status;

-- Finding: listing_masters has two location representations —
-- location_address (text) and location (jsonb, {"fullAddress": "..."}).
-- src/services/repositories/supabase/ListingRepository.ts only ever reads
-- row.location_address; the location jsonb column (used by this file's own
-- INSERT above, following the pre-existing convention in
-- docs/SEED_TEST_GOODS.sql) is dead on the read path. Backfill so these
-- rows actually show an address instead of TaskDetailView's "Remote"
-- fallback / EventDetailView's blank Location line.
UPDATE public.listing_masters SET location_address = location->>'fullAddress'
WHERE id IN (
  'b1000001-0001-4001-8001-000000000001', 'b1000002-0002-4002-8002-000000000002',
  'b1000003-0003-4003-8003-000000000003', 'b1000004-0004-4004-8004-000000000004',
  'b1000005-0005-4005-8005-000000000005', 'b1000006-0006-4006-8006-000000000006',
  'b1000007-0007-4007-8007-000000000007'
) AND location_address IS NULL;
