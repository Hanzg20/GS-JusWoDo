-- ==========================================
-- COMMUNITY NODE TREE: DISTRICT -> NODE
-- Purpose: Grow the flat 5-node COMMUNITY_NODE list into a real
-- geographic tree (Ottawa/Gatineau neighborhoods), same parent_id
-- mechanism as the PILLAR/INDUSTRY/CATEGORY tree. Adds a new
-- 'DISTRICT' tier above 'NODE'. No coordinates yet for the new leaf
-- nodes (see 20260904_add_node_coordinates.sql for the 5 that already
-- have them) — a follow-up pass, not guessed here.
-- ==========================================

-- 1. Districts (7)
INSERT INTO public.ref_codes (code_id, type, zh_name, en_name, extra_data, sort_order) VALUES
  ('DISTRICT_WEST', 'DISTRICT', '西区', 'West End', '{"city": "Ottawa"}', 1),
  ('DISTRICT_NEPEAN', 'DISTRICT', '西中区 (内皮恩/梅里维尔)', 'Nepean & Merivale', '{"city": "Ottawa"}', 2),
  ('DISTRICT_SOUTH', 'DISTRICT', '南区', 'South', '{"city": "Ottawa"}', 3),
  ('DISTRICT_CENTRAL', 'DISTRICT', '中心区', 'Downtown Core', '{"city": "Ottawa"}', 4),
  ('DISTRICT_EAST', 'DISTRICT', '东区', 'East End', '{"city": "Ottawa"}', 5),
  ('DISTRICT_SOUTHEAST', 'DISTRICT', '东南区', 'South-East', '{"city": "Ottawa"}', 6),
  ('DISTRICT_GATINEAU', 'DISTRICT', '加蒂诺', 'Gatineau', '{"city": "Gatineau"}', 7)
ON CONFLICT (code_id) DO UPDATE SET
  zh_name = EXCLUDED.zh_name,
  en_name = EXCLUDED.en_name,
  extra_data = EXCLUDED.extra_data;

-- 2. Link the 5 existing pilot nodes into the tree
UPDATE public.ref_codes SET parent_id = 'DISTRICT_WEST' WHERE code_id = 'NODE_KANATA';
UPDATE public.ref_codes SET parent_id = 'DISTRICT_EAST' WHERE code_id = 'NODE_ORLEANS';
UPDATE public.ref_codes SET parent_id = 'DISTRICT_SOUTH' WHERE code_id = 'NODE_BARRHAVEN';
UPDATE public.ref_codes SET parent_id = 'DISTRICT_CENTRAL' WHERE code_id IN ('NODE_LEES', 'NODE_DOWNTOWN');

-- 3. New neighborhood nodes (32) — the other 3 pilot nodes above (Kanata/
-- Orleans/Barrhaven) already cover their spot in this list, so they're
-- not duplicated here.
INSERT INTO public.ref_codes (code_id, parent_id, type, zh_name, en_name, sort_order) VALUES
  -- West End
  ('NODE_STITTSVILLE', 'DISTRICT_WEST', 'NODE', '斯蒂茨维尔', 'Stittsville', 2),
  ('NODE_BELLSCORNERS', 'DISTRICT_WEST', 'NODE', '贝尔斯科纳斯', 'Bells Corners', 3),
  ('NODE_CARP', 'DISTRICT_WEST', 'NODE', '卡普', 'Carp', 4),
  ('NODE_WESTBORO', 'DISTRICT_WEST', 'NODE', '西波罗', 'Westboro', 5),

  -- Nepean & Merivale
  ('NODE_NEPEAN', 'DISTRICT_NEPEAN', 'NODE', '内皮恩', 'Nepean', 1),
  ('NODE_MERIVALE', 'DISTRICT_NEPEAN', 'NODE', '梅里维尔', 'Merivale', 2),
  ('NODE_BAYSHORE', 'DISTRICT_NEPEAN', 'NODE', '贝肖尔', 'Bayshore', 3),
  ('NODE_HUNTCLUB', 'DISTRICT_NEPEAN', 'NODE', '亨特俱乐部', 'Hunt Club', 4),
  ('NODE_GREENBORO', 'DISTRICT_NEPEAN', 'NODE', '格林伯洛', 'Greenboro', 5),

  -- South
  ('NODE_MANOTICK', 'DISTRICT_SOUTH', 'NODE', '马诺蒂克', 'Manotick', 2),
  ('NODE_RIVERSIDESOUTH', 'DISTRICT_SOUTH', 'NODE', '南河畔', 'Riverside South', 3),
  ('NODE_FINDLAYCREEK', 'DISTRICT_SOUTH', 'NODE', '芬德利溪', 'Findlay Creek', 4),
  ('NODE_GREELY', 'DISTRICT_SOUTH', 'NODE', '格里利', 'Greely', 5),
  ('NODE_OSGOODE', 'DISTRICT_SOUTH', 'NODE', '奥斯古德', 'Osgoode', 6),
  ('NODE_VARS', 'DISTRICT_SOUTH', 'NODE', '瓦尔斯', 'Vars', 7),
  ('NODE_METCALFE', 'DISTRICT_SOUTH', 'NODE', '梅特卡夫', 'Metcalfe', 8),

  -- Downtown Core
  ('NODE_CENTRETOWN', 'DISTRICT_CENTRAL', 'NODE', '中城区', 'Centretown', 1),
  ('NODE_BYWARDMARKET', 'DISTRICT_CENTRAL', 'NODE', '拜沃德市场', 'ByWard Market', 2),
  ('NODE_SANDYHILL', 'DISTRICT_CENTRAL', 'NODE', '沙丘', 'Sandy Hill', 3),
  ('NODE_THEGLEBE', 'DISTRICT_CENTRAL', 'NODE', '格莱布', 'The Glebe', 4),
  ('NODE_OLDOTTAWASOUTH', 'DISTRICT_CENTRAL', 'NODE', '老渥太华南区', 'Old Ottawa South', 5),
  ('NODE_OLDOTTAWAEAST', 'DISTRICT_CENTRAL', 'NODE', '老渥太华东区', 'Old Ottawa East', 6),

  -- East End
  ('NODE_CUMBERLAND', 'DISTRICT_EAST', 'NODE', '坎伯兰', 'Cumberland', 2),
  ('NODE_VANIER', 'DISTRICT_EAST', 'NODE', '瓦尼尔', 'Vanier', 3),
  ('NODE_ROCKCLIFFEPARK', 'DISTRICT_EAST', 'NODE', '洛克利夫公园', 'Rockcliffe Park', 4),

  -- South-East
  ('NODE_ALTAVISTA', 'DISTRICT_SOUTHEAST', 'NODE', '阿尔塔维斯塔', 'Alta Vista', 1),
  ('NODE_BLACKBURNHAMLET', 'DISTRICT_SOUTHEAST', 'NODE', '布莱克本村', 'Blackburn Hamlet', 2),
  ('NODE_RIVERSIDEPARK', 'DISTRICT_SOUTHEAST', 'NODE', '河畔公园', 'Riverside Park', 3),

  -- Gatineau (Quebec side)
  ('NODE_AYLMER', 'DISTRICT_GATINEAU', 'NODE', '艾尔默', 'Aylmer', 1),
  ('NODE_HULL', 'DISTRICT_GATINEAU', 'NODE', '赫尔', 'Hull', 2),
  ('NODE_OLDGATINEAU', 'DISTRICT_GATINEAU', 'NODE', '老加蒂诺', 'Old Gatineau', 3),
  ('NODE_PLATEAU', 'DISTRICT_GATINEAU', 'NODE', '普拉托', 'Plateau', 4)
ON CONFLICT (code_id) DO UPDATE SET
  parent_id = EXCLUDED.parent_id,
  zh_name = EXCLUDED.zh_name,
  en_name = EXCLUDED.en_name;
