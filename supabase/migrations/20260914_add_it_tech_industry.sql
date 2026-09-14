-- Record-only migration (applied via `supabase db query --linked --file`).
--
-- 本地服务 pillar's 4 existing industries (居家生活/专业美业/育儿教育/出行时令)
-- are all home-service/trades/childcare/seasonal oriented — none fit IT/tech
-- services (website dev, custom software, data migration, IoT, POS
-- systems). This is exactly why GOLDSKY TECH's 5 real listings
-- (jwd_goldsky_tech_provider_listings memory) had category_id=NULL and
-- showed "0 results" under every existing industry filter once the new
-- always-visible 二级分类 tabs shipped.

INSERT INTO ref_codes (code_id, type, parent_id, zh_name, en_name, sort_order, is_active, extra_data) VALUES
('1060000', 'INDUSTRY', 'PILLAR_SERVICE', 'IT科技', 'IT & Tech', 6, true, '{}');

INSERT INTO ref_codes (code_id, type, parent_id, zh_name, en_name, sort_order, is_active, extra_data) VALUES
('1060100', 'CATEGORY', '1060000', '网站建设', 'Web Development', 1, true, '{}'),
('1060200', 'CATEGORY', '1060000', '软件定制开发', 'Custom Software', 2, true, '{}'),
('1060300', 'CATEGORY', '1060000', '物联网 IoT 控制', 'IoT Control', 3, true, '{}'),
('1060400', 'CATEGORY', '1060000', '数据迁移与传输', 'Data Migration & Transfer', 4, true, '{}'),
('1060500', 'CATEGORY', '1060000', '支付 / 收银系统', 'Payment & POS Systems', 5, true, '{}');

-- Backfill the 5 real GOLDSKY TECH listings that motivated this addition.
UPDATE listing_masters SET category_id = '1060200' WHERE id = 'd96df905-1dd4-4f02-982e-c7af8a1755f4'; -- 网站建设与软件定制开发
UPDATE listing_masters SET category_id = '1060500' WHERE id = 'b3ff232c-58ba-4839-9ea2-5d09d09632fd'; -- 无人值守支付终端部署
UPDATE listing_masters SET category_id = '1060500' WHERE id = '761c2cf4-3016-486b-bc9c-6bdc61981c35'; -- 门店收银与移动收款方案
UPDATE listing_masters SET category_id = '1060400' WHERE id = '198d8628-99f5-4acc-bad3-814790771e07'; -- 企业数据迁移与传输服务
UPDATE listing_masters SET category_id = '1060300' WHERE id = 'af9f83be-f545-49b8-8a9d-0f7e01f9eca1'; -- 工业物联网(IoT)控制软件定制
