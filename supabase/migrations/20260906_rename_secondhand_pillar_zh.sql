-- "二手市场" -> "闲置市场": more idiomatic for this category in Chinese (matches
-- how the app already described it elsewhere — "二手闲置"/"闲置买卖" — and how
-- this kind of marketplace is usually named, e.g. 闲鱼). English stays
-- "Secondhand Market", which is already the natural English equivalent.
UPDATE public.ref_codes
SET zh_name = '闲置市场'
WHERE code_id = 'PILLAR_GOODS';
