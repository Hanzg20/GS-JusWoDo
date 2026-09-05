-- ==========================================
-- COORDINATES FOR THE 32 NEW NEIGHBORHOOD NODES
-- Purpose: Approximate neighborhood-center coordinates so the existing
-- distance feature (which already labels node-based distance with a "~"
-- prefix to signal it's an estimate, not GPS) works for the nodes added
-- in 20260904_add_node_districts.sql. Center-of-neighborhood accuracy,
-- not surveyed addresses — good enough for "~Xkm" card display.
-- ==========================================

UPDATE public.ref_codes SET extra_data = extra_data || jsonb_build_object('lat', v.lat, 'lng', v.lng)
FROM (VALUES
  ('NODE_STITTSVILLE', 45.2569, -75.9145),
  ('NODE_BELLSCORNERS', 45.3236, -75.8175),
  ('NODE_CARP', 45.3499, -76.0430),
  ('NODE_WESTBORO', 45.3876, -75.7538),
  ('NODE_NEPEAN', 45.3552, -75.7397),
  ('NODE_MERIVALE', 45.3477, -75.7280),
  ('NODE_BAYSHORE', 45.3467, -75.8010),
  ('NODE_HUNTCLUB', 45.3444, -75.6772),
  ('NODE_GREENBORO', 45.3600, -75.6467),
  ('NODE_MANOTICK', 45.2280, -75.6772),
  ('NODE_RIVERSIDESOUTH', 45.2887, -75.6389),
  ('NODE_FINDLAYCREEK', 45.2833, -75.6167),
  ('NODE_GREELY', 45.2167, -75.5833),
  ('NODE_OSGOODE', 45.1428, -75.6033),
  ('NODE_VARS', 45.2667, -75.2833),
  ('NODE_METCALFE', 45.2333, -75.4667),
  ('NODE_CENTRETOWN', 45.4142, -75.6947),
  ('NODE_BYWARDMARKET', 45.4285, -75.6910),
  ('NODE_SANDYHILL', 45.4245, -75.6800),
  ('NODE_THEGLEBE', 45.3989, -75.6889),
  ('NODE_OLDOTTAWASOUTH', 45.3897, -75.6836),
  ('NODE_OLDOTTAWAEAST', 45.4056, -75.6708),
  ('NODE_CUMBERLAND', 45.4989, -75.4083),
  ('NODE_VANIER', 45.4342, -75.6647),
  ('NODE_ROCKCLIFFEPARK', 45.4444, -75.6753),
  ('NODE_ALTAVISTA', 45.3833, -75.6500),
  ('NODE_BLACKBURNHAMLET', 45.4167, -75.5667),
  ('NODE_RIVERSIDEPARK', 45.3733, -75.6683),
  ('NODE_AYLMER', 45.3958, -75.8347),
  ('NODE_HULL', 45.4285, -75.7169),
  ('NODE_OLDGATINEAU', 45.4765, -75.6812),
  ('NODE_PLATEAU', 45.4739, -75.7156)
) AS v(code_id, lat, lng)
WHERE ref_codes.code_id = v.code_id;
