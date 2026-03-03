
select * from auth.users 
-- 1. Mock Providers
INSERT INTO public.provider_profiles --not providers corrected
  (id, user_id, business_name_en, business_name_zh, identity, is_verified, verification_level, stats)
VALUES
  ('10f3a1d2-9f4b-4e74-8a2e-1c2b3d4e5f60', '4ccc08eb-263b-4f40-9f44-5a5d1f1d44c1', 'Kanata Home Care', '', 'NEIGHBOR', true, 3, '{"totalOrders": 12, "averageRating": 4.9, "reviewCount": 8}'),
  ('21a4b2c3-8e6d-4f55-9b3c-2d3e4f5a6b70', '4ccc08eb-263b-4f40-9f44-5a5d1f1d44c1', 'UOttawa Student Gear', '', 'NEIGHBOR', true, 2, '{"totalOrders": 45, "averageRating": 4.7, "reviewCount": 32}')
ON CONFLICT (id) DO UPDATE
  SET business_name_en = EXCLUDED.business_name_en;


ALTER TABLE public.listing_masters
  ADD COLUMN location jsonb,
  ADD COLUMN latitude double precision,
  ADD COLUMN longitude double precision;


-- 2. Listing Masters -- corrected
INSERT INTO public.listing_masters (id, provider_id, title_en, title_zh,description_en, images, type, category_id, node_id, status, tags, location) VALUES
('30b5c3d4-7f8e-4a61-9c4d-3e4f5a6b7c80', '10f3a1d2-9f4b-4e74-8a2e-1c2b3d4e5f60', 'Driveway Power Washing', 'Driveway Power Washing-zh', 'Professional power washing for your driveway and walkways. We remove all stains, moss, and winter salt.', 
ARRAY['https://images.unsplash.com/photo-1520220663982-f0945f220f18?auto=format&fit=crop&q=80&w=800'], 
'SERVICE', '1010100', 'NODE_KANATA', 'PUBLISHED', ARRAY['Kanata', 'Cleanup', 'Service'], '{"fullAddress": "Kanata Lakes, Ottawa"}'),

('40c6d4e5-6f7a-4b72-8d5e-4f5a6b7c8d90', '21a4b2c3-8e6d-4f55-9b3c-2d3e4f5a6b70', 'DeWalt Cordless Drill 20V', 'DeWalt Cordless Drill 20V-', 'High-power DeWalt drill with two batteries and a charger. Perfect for home DIY or furniture assembly.', 
ARRAY['https://images.unsplash.com/photo-1540103359328-3bc92bcfe131?auto=format&fit=crop&q=80&w=800'], 
'RENTAL', '1040300', 'NODE_LEES', 'PUBLISHED', ARRAY['Lees', 'Tools', 'DIY'], '{"fullAddress": "170 Lees Ave"}')
ON CONFLICT (id) DO UPDATE SET
  title_en = EXCLUDED.title_en,
  description_en = EXCLUDED.description_en,
  status = EXCLUDED.status;


ALTER TABLE public.listing_items
  ADD COLUMN pricing jsonb;


-- 3. Listing Items (SKUs) — corrected
INSERT INTO public.listing_items (
  id,
  master_id,
  name_zh,
  name_en,
  description_zh,
  description_en,
  price_amount,
  price_currency,
  price_unit,
  deposit_amount,
  pricing_model,
  status,
  pricing
) VALUES
(
  '50d7e5f6-5a6b-4c83-7e6f-5a6b7c8d9e00',
  '30b5c3d4-7f8e-4a61-9c4d-3e4f5a6b7c80',
  'Standard Driveway (2-Car)', -- name_zh (provided)
  'Standard Driveway (2-Car)', -- name_en
  NULL,
  'Full cleaning of a standard family driveway.',
  8500,
  'CAD',
  'per service',
  0,
  'FIXED',
  'AVAILABLE',
  '{"model": "FIXED", "price": {"amount": 8500, "currency": "CAD", "formatted": "$85.00"}, "unit": "per service"}'
),
(
  '60e8f6a7-4b5c-4d94-6f7a-6b7c8d9e0f10',
  '30b5c3d4-7f8e-4a61-9c4d-3e4f5a6b7c80',
  'Large Driveway (4-Car+)',
  'Large Driveway (4-Car+)',
  NULL,
  'Specialized for larger properties or interlocking stone.',
  15000,
  'CAD',
  'per service',
  0,
  'FIXED',
  'AVAILABLE',
  '{"model": "FIXED", "price": {"amount": 15000, "currency": "CAD", "formatted": "$150.00"}, "unit": "per service"}'
),
(
  '70f9a7b8-3c4d-4e05-5a6b-7c8d9e0f1a20',
  '40c6d4e5-6f7a-4b72-8d5e-4f5a6b7c8d90',
  'Daily Rental-zh',
  'Daily Rental',
  NULL,
  'Includes drill, 2 batteries, and hard case.',
  1500,
  'CAD',
  'per day',
  10000,
  'DAILY',
  'AVAILABLE',
  '{"model": "DAILY", "price": {"amount": 1500, "currency": "CAD", "formatted": "$15.00"}, "unit": "per day", "deposit": {"amount": 10000, "currency": "CAD", "formatted": "$100.00"}}'
),
(
  '80a0b8c9-2d3e-4f16-4b5c-8d9e0f1a2b30',
  '40c6d4e5-6f7a-4b72-8d5e-4f5a6b7c8d90',
  'Weekend Special (3 Days)-zh',
  'Weekend Special (3 Days)',
  NULL,
  'Pick up Friday, return Monday.',
  3500,
  'CAD',
  'per weekend',
  10000,
  'FIXED',
  'AVAILABLE',
  '{"model": "FIXED", "price": {"amount": 3500, "currency": "CAD", "formatted": "$35.00"}, "unit": "per weekend", "deposit": {"amount": 10000, "currency": "CAD", "formatted": "$100.00"}}'
),
(
  '90b1c9da-1e2f-4a27-3c4d-9e0f1a2b3c40',
  '30b5c3d4-7f8e-4a61-9c4d-3e4f5a6b7c80',
  'Custom Interlocking Repair-zh',
  'Custom Interlocking Repair',
  NULL,
  'Requires on-site assessment for accurate quote.',
  0,
  'CAD',
  'per project',
  0,
  'QUOTE',
  'AVAILABLE',
  '{"model": "QUOTE", "price": {"amount": 0, "currency": "CAD", "formatted": "$0.00"}, "unit": "per project"}'
),
(
  'a0c2dab1-0f1e-4b38-2d3e-0f1a2b3c4d50',
  '30b5c3d4-7f8e-4a61-9c4d-3e4f5a6b7c80',
  'On-Site Assessment-zh',
  'On-Site Assessment',
  NULL,
  'Professional visit to inspect property and provide detailed quote.',
  5000,
  'CAD',
  'per visit',
  0,
  'VISIT_FEE',
  'AVAILABLE',
  '{"model": "VISIT_FEE", "price": {"amount": 5000, "currency": "CAD", "formatted": "$50.00"}, "unit": "per visit"}'
)
ON CONFLICT (id) DO UPDATE SET
  name_en = EXCLUDED.name_en,
  name_zh = EXCLUDED.name_zh,
  description_en = EXCLUDED.description_en,
  price_amount = EXCLUDED.price_amount,
  price_currency = EXCLUDED.price_currency,
  price_unit = EXCLUDED.price_unit,
  deposit_amount = EXCLUDED.deposit_amount,
  pricing_model = EXCLUDED.pricing_model,
  pricing = EXCLUDED.pricing,
  status = EXCLUDED.status;