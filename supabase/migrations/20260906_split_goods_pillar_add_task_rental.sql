-- ==========================================
-- Homepage pillar grid: 3 -> 6 tiles (2026-09-06 conversation).
--
-- GOODS was one bucket mixing merchant-listed products (providerGoodsFields,
-- reached via pro hub's ?type=GOODS&pro=1) with casual secondhand items
-- (buyerGoodsFields, reached via the homepage's simple post flow) — with no
-- way to browse just one. Split by which form created the listing (see
-- Publish.tsx's new attributes.goodsTier marker), not by who posted it —
-- a merchant can still post a personal secondhand item through the simple
-- flow, so provider identity was the wrong signal.
--
-- Task and Rental already had working listing types/forms and even their
-- own /category/task and /category/rental routes, but were never promoted
-- to a homepage pillar tile.
-- ==========================================

UPDATE public.ref_codes
SET zh_name = '本地服务', sort_order = 1
WHERE type = 'PILLAR' AND code_id = 'PILLAR_SERVICE';

UPDATE public.ref_codes
SET zh_name = '二手市场',
    en_name = 'Secondhand Market',
    sort_order = 4,
    extra_data = jsonb_set(
        jsonb_set(extra_data, '{path}', '"/category/secondhand"'),
        '{icon}', '"RefreshCw"'
    )
WHERE type = 'PILLAR' AND code_id = 'PILLAR_GOODS';

UPDATE public.ref_codes
SET sort_order = 6
WHERE type = 'PILLAR' AND code_id = 'PILLAR_HELP';

INSERT INTO public.ref_codes (code_id, type, zh_name, en_name, sort_order, extra_data)
VALUES
  ('PILLAR_PRODUCTS', 'PILLAR', '产品', 'Products', 2,
   '{"icon":"ShoppingBag","path":"/category/products","bgColor":"bg-blue-50 text-blue-600 border-blue-100","badgeColor":"bg-blue-500","desc_zh":"商户上架 / 批量供货","desc_en":"Merchant-listed products"}'::jsonb),
  ('PILLAR_TASK', 'PILLAR', '任务', 'Tasks', 3,
   '{"icon":"ClipboardList","path":"/category/task","bgColor":"bg-amber-50 text-amber-600 border-amber-100","badgeColor":"bg-amber-500","desc_zh":"发布需求 / 邻居帮忙","desc_en":"Post a need, get help"}'::jsonb),
  ('PILLAR_RENTAL', 'PILLAR', '租赁', 'Rentals', 5,
   '{"icon":"Camera","path":"/category/rental","bgColor":"bg-pink-50 text-pink-600 border-pink-100","badgeColor":"bg-pink-500","desc_zh":"设备 / 场地共享租赁","desc_en":"Shared gear & space rentals"}'::jsonb)
ON CONFLICT (code_id) DO NOTHING;

-- Backfill goodsTier for the 2 GOODS listings that existed before this
-- attribute did — both were created outside the app's own submit flow
-- (raw SQL / pre-fix), so Publish.tsx never got a chance to tag them.
UPDATE public.listing_masters
SET attributes = jsonb_set(coalesce(attributes, '{}'::jsonb), '{goodsTier}', '"PRODUCT"')
WHERE type = 'GOODS' AND id = 'c0559e70-0004-4004-8004-000000000004'; -- Cosset Pet supplies

UPDATE public.listing_masters
SET attributes = jsonb_set(coalesce(attributes, '{}'::jsonb), '{goodsTier}', '"SECONDHAND"')
WHERE type = 'GOODS' AND id NOT IN ('c0559e70-0004-4004-8004-000000000004')
  AND (attributes->>'goodsTier') IS NULL;
