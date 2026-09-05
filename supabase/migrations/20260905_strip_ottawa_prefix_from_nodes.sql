-- ==========================================
-- The 5 original pilot nodes (created before the 37-node district tree)
-- had "Ottawa-" baked into en_name ("Ottawa-Barrhaven", "Ottawa-Downtown",
-- etc.), inconsistent with the other 32 nodes added later ("Alta Vista",
-- "Bells Corners", ...). Strip the prefix so all NODE en_names read the
-- same way, and clean up the matching zh_name which had the English name
-- redundantly duplicated in parentheses.
-- ==========================================

UPDATE public.ref_codes SET en_name = 'Barrhaven', zh_name = '巴尔黑文' WHERE code_id = 'NODE_BARRHAVEN';
UPDATE public.ref_codes SET en_name = 'Downtown', zh_name = '市中心' WHERE code_id = 'NODE_DOWNTOWN';
UPDATE public.ref_codes SET en_name = 'Kanata', zh_name = '卡纳塔' WHERE code_id = 'NODE_KANATA';
UPDATE public.ref_codes SET en_name = 'Lees', zh_name = '利斯' WHERE code_id = 'NODE_LEES';
UPDATE public.ref_codes SET en_name = 'Orleans', zh_name = '奥尔良' WHERE code_id = 'NODE_ORLEANS';
