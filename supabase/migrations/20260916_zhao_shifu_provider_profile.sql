-- Record-only migration (applied via `supabase db query --linked --file`).
--
-- 赵师傅's real 达人 (NEIGHBOR-identity) provider profile + 2 service
-- listings — the first real individual-provider profile on the
-- platform, see jwd_zhao_shifu_provider memory and jwd_daren_show_deferred.
-- Account already created via a temp Edge Function (admin.createUser,
-- deployed/run once/deleted immediately after — not in this repo),
-- userId 66905ed7-6053-4e1b-a8ae-8d3490e64935, user_profiles row
-- auto-populated by handle_new_oauth_user() trigger from user_metadata.

INSERT INTO provider_profiles (
    id, user_id, business_name_zh, business_name_en,
    description_zh, description_en,
    identity, is_verified, verification_level,
    location_address, location_coords, service_radius_km, status
) VALUES (
    'a1b2c3d4-5e6f-4a7b-8c9d-0e1f2a3b4c5d',
    '66905ed7-6053-4e1b-a8ae-8d3490e64935',
    '赵师傅',
    'Master Zhao',
    '国内退休高级机械师/电工师傅，现居渥太华 Barrhaven。可上门处理各类商业与住宅的非资质要求小型维修问题，也承接汽车钣金、换胎、换机油等汽车保养维护服务。服务范围覆盖整个首都地区（渥太华-加蒂诺）。',
    'Retired senior mechanic and electrician from China, now based in Barrhaven, Ottawa. Handles a wide range of small commercial and residential repairs that don''t require professional licensing, plus auto body work, tire changes, and oil changes. Serves the entire National Capital Region (Ottawa-Gatineau).',
    'NEIGHBOR', false, 1,
    'Barrhaven, Ottawa',
    ST_SetSRID(ST_MakePoint(-75.7527, 45.2731), 4326)::geography,
    40,
    'ACTIVE'
);

-- Listing 1: general commercial/residential minor repairs
INSERT INTO listing_masters (
    id, provider_id, type, title_zh, title_en, description_zh, description_en,
    category_id, node_id, images, status, latitude, longitude, location_coords
) VALUES (
    'b2c3d4e5-6f7a-4b8c-9d0e-1f2a3b4c5d6e',
    'a1b2c3d4-5e6f-4a7b-8c9d-0e1f2a3b4c5d',
    'SERVICE',
    '商业/住宅小型维修 - 水电杂项',
    'Small Commercial & Residential Repairs',
    '国内退休高级机械师/电工，经验丰富，可上门处理各类不需要专业资质的小型维修问题——水电小活儿、门窗五金、家电小故障等，商铺和住宅都可以。诚信可靠，价格面议。',
    'Retired senior mechanic and electrician with years of hands-on experience. Handles a wide range of small commercial and residential repairs that don''t require professional licensing — minor electrical/plumbing fixes, door and window hardware, small appliance issues, and more. Reliable and fair, price negotiable.',
    '1010400', 'NODE_BARRHAVEN',
    ARRAY['https://images.unsplash.com/photo-1426927308491-6380b6a9936f?w=800&auto=format&fit=crop&q=60'],
    'PUBLISHED',
    45.2731, -75.7527,
    ST_SetSRID(ST_MakePoint(-75.7527, 45.2731), 4326)::geography
);

INSERT INTO listing_items (
    id, master_id, name_zh, name_en, pricing_model, price_amount, price_currency, price_unit,
    pricing, images, status
) VALUES (
    'c3d4e5f6-7a8b-4c9d-0e1f-2a3b4c5d6e7f',
    'b2c3d4e5-6f7a-4b8c-9d0e-1f2a3b4c5d6e',
    '小型维修上门服务', 'Small Repair Visit',
    'NEGOTIABLE', 0, 'CAD', 'visit',
    '{"model": "NEGOTIABLE", "price": {"amount": 0, "currency": "CAD", "formatted": "$0.00"}, "unit": "per visit"}'::jsonb,
    ARRAY['https://images.unsplash.com/photo-1426927308491-6380b6a9936f?w=800&auto=format&fit=crop&q=60'],
    'AVAILABLE'
);

-- Listing 2: auto body / tire / oil service
INSERT INTO listing_masters (
    id, provider_id, type, title_zh, title_en, description_zh, description_en,
    category_id, node_id, images, status, latitude, longitude, location_coords
) VALUES (
    'd4e5f6a7-8b9c-4d0e-1f2a-3b4c5d6e7f8a',
    'a1b2c3d4-5e6f-4a7b-8c9d-0e1f2a3b4c5d',
    'SERVICE',
    '汽车保养维修 - 钣金/换胎/换机油',
    'Auto Body, Tire & Oil Service',
    '国内退休高级机械师，汽车维修经验丰富。承接汽车钣金修复、轮胎更换、机油更换等日常保养维护，价格实在，服务范围覆盖整个首都地区。',
    'Retired senior mechanic with extensive automotive repair experience. Offers auto body/sheet metal repair, tire changes, oil changes, and other routine maintenance. Fair pricing, serving the entire National Capital Region.',
    '1010900', 'NODE_BARRHAVEN',
    ARRAY['https://images.unsplash.com/photo-1771340012319-0b4fca008b54?w=800&auto=format&fit=crop&q=60'],
    'PUBLISHED',
    45.2731, -75.7527,
    ST_SetSRID(ST_MakePoint(-75.7527, 45.2731), 4326)::geography
);

INSERT INTO listing_items (
    id, master_id, name_zh, name_en, pricing_model, price_amount, price_currency, price_unit,
    pricing, images, status
) VALUES (
    'e5f6a7b8-9c0d-4e1f-2a3b-4c5d6e7f8a9b',
    'd4e5f6a7-8b9c-4d0e-1f2a-3b4c5d6e7f8a',
    '汽车保养维修', 'Auto Maintenance & Repair',
    'NEGOTIABLE', 0, 'CAD', 'job',
    '{"model": "NEGOTIABLE", "price": {"amount": 0, "currency": "CAD", "formatted": "$0.00"}, "unit": "per job"}'::jsonb,
    ARRAY['https://images.unsplash.com/photo-1771340012319-0b4fca008b54?w=800&auto=format&fit=crop&q=60'],
    'AVAILABLE'
);
