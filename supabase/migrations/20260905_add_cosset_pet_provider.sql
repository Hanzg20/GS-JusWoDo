-- ==========================================
-- Cosset Pet Supplies Inc. — first real merchant onboarded post-cleanup.
-- Data sourced from https://cosset-pet.com/ (2026-09-05). Grooming service
-- has no published price, so it's QUOTE-priced ("contact for details").
-- Business hours and real photos weren't available on the site — left as
-- reasonable placeholders per the user's call to publish now and fill in
-- later, rather than block on it.
-- ==========================================

INSERT INTO public.provider_profiles
  (id, user_id, business_name_zh, business_name_en, description_zh, description_en,
   identity, is_verified, verification_level, stats, location_address, service_radius_km, status)
VALUES
  ('c0559e70-0001-4001-8001-000000000001', '76078f98-4457-47d2-b08b-cc4238d19623',
   'Cosset Pet Supplies', 'Cosset Pet Supplies Inc.',
   '定期护理不仅能帮助爱宠维持整洁外观，更有助于毛发与皮肤健康。',
   'Online pet supplies retailer offering grooming services, pet food, toys, and accessories.',
   'MERCHANT', false, 1,
   '{"totalOrders": 0, "averageRating": 0, "reviewCount": 0, "totalIncome": 0}',
   '1100 Canadian Shield Ave #1112, Ottawa, ON K2K 0K9', 15, 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

UPDATE public.user_profiles
SET provider_profile_id = 'c0559e70-0001-4001-8001-000000000001',
    roles = ARRAY['BUYER', 'PROVIDER']
WHERE id = '76078f98-4457-47d2-b08b-cc4238d19623';

INSERT INTO public.listing_masters
  (id, provider_id, title_zh, title_en, description_zh, description_en, images,
   type, category_id, node_id, status, tags, location_address, latitude, longitude, attributes)
VALUES
  -- SERVICE: grooming (no published price on the site -> QUOTE). attributes.
  -- pricingMode is what ServiceActions.tsx actually reads to pick the
  -- "Request Quote" button/copy — separate from the item's own
  -- pricing_model, easy to forget (learned the hard way testing this one).
  ('c0559e70-0002-4002-8002-000000000002', 'c0559e70-0001-4001-8001-000000000001',
   '宠物美容服务', 'Pet Grooming Service',
   '专业宠物美容，需在线预约。定期护理不仅能帮助爱宠维持整洁外观，更有助于毛发与皮肤健康。',
   'Professional pet grooming, booking required. Regular grooming keeps your pet looking great and supports healthy skin & coat.',
   ARRAY['//cosset-pet.com/cdn/shop/files/42dbc330f16bba4514986fc33e4b7cb.jpg'],
   'SERVICE', '1030100', 'NODE_KANATA', 'PUBLISHED',
   ARRAY['pet','grooming','service'], '1100 Canadian Shield Ave #1112, Ottawa, ON K2K 0K9', 45.3483, -75.9221,
   '{"pricingMode": "QUOTE"}'::jsonb),

  -- GOODS: pet supplies retail
  ('c0559e70-0004-4004-8004-000000000004', 'c0559e70-0001-4001-8001-000000000001',
   '宠物用品 - 狗粮/猫粮/猫砂/玩具', 'Pet Supplies - Dog & Cat Food, Litter, Toys',
   '渥太华地区订单满$50免费送货，另有多个自提点：190 Lees Market、Green Fresh Supermarket Nepean、T&T Supermarket (Hunt Club)、Dakgogi (Barrhaven)。',
   'Free delivery on Ottawa-area orders over $50. Pickup also available at: 190 Lees Market, Green Fresh Supermarket Nepean, T&T Supermarket (Hunt Club), Dakgogi (Barrhaven).',
   ARRAY['//cosset-pet.com/cdn/shop/files/42dbc330f16bba4514986fc33e4b7cb.jpg'],
   'GOODS', NULL, 'NODE_KANATA', 'PUBLISHED',
   ARRAY['pet','food','supplies'], '1100 Canadian Shield Ave #1112, Ottawa, ON K2K 0K9', 45.3483, -75.9221)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.listing_items
  (id, master_id, name_zh, name_en, price_amount, price_currency, price_unit, pricing_model, status, pricing)
VALUES
  -- Grooming: contact for quote
  ('c0559e70-0003-4003-8003-000000000003', 'c0559e70-0002-4002-8002-000000000002',
   '美容服务', 'Grooming Session', 0, 'CAD', 'per session', 'QUOTE', 'AVAILABLE',
   '{"model":"QUOTE","price":{"amount":0,"currency":"CAD","formatted":"$0.00"},"unit":"per session"}'),

  -- Pet supplies SKUs (real prices from the site)
  ('c0559e70-0005-4005-8005-000000000005', 'c0559e70-0004-4004-8004-000000000004',
   'Acana Duck 狗粮 (小袋)', 'Acana Duck Dog Food (Small Bag)', 3599, 'CAD', 'bag', 'FIXED', 'AVAILABLE',
   '{"model":"FIXED","price":{"amount":3599,"currency":"CAD","formatted":"$35.99"},"unit":"bag"}'),
  ('c0559e70-0006-4006-8006-000000000006', 'c0559e70-0004-4004-8004-000000000004',
   'Acana Duck 狗粮 (大袋)', 'Acana Duck Dog Food (Large Bag)', 12499, 'CAD', 'bag', 'FIXED', 'AVAILABLE',
   '{"model":"FIXED","price":{"amount":12499,"currency":"CAD","formatted":"$124.99"},"unit":"bag"}'),
  ('c0559e70-0007-4007-8007-000000000007', 'c0559e70-0004-4004-8004-000000000004',
   'Feline Natural 猫粮', 'Feline Natural Cat Food', 499, 'CAD', 'can', 'FIXED', 'AVAILABLE',
   '{"model":"FIXED","price":{"amount":499,"currency":"CAD","formatted":"$4.99"},"unit":"can"}'),
  ('c0559e70-0008-4008-8008-000000000008', 'c0559e70-0004-4004-8004-000000000004',
   'Pidan 豆腐猫砂', 'Pidan Tofu Cat Litter', 1299, 'CAD', 'bag', 'FIXED', 'AVAILABLE',
   '{"model":"FIXED","price":{"amount":1299,"currency":"CAD","formatted":"$12.99"},"unit":"bag"}'),
  ('c0559e70-0009-4009-8009-000000000009', 'c0559e70-0004-4004-8004-000000000004',
   'Yimeow 猫砂', 'Yimeow Cat Litter', 1099, 'CAD', 'bag', 'FIXED', 'AVAILABLE',
   '{"model":"FIXED","price":{"amount":1099,"currency":"CAD","formatted":"$10.99"},"unit":"bag"}')
ON CONFLICT (id) DO NOTHING;
