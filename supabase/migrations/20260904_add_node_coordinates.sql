-- ==========================================
-- COMMUNITY NODE COORDINATES
-- Purpose: Give each COMMUNITY_NODE/NODE ref_codes row an approximate
-- center lat/lng so distance can be shown by default (as an approximation
-- from the user's selected node) without requiring a geolocation prompt.
-- Precise "closest to me" sort still upgrades to real GPS on demand.
-- Merges into existing extra_data (jsonb ||) rather than overwriting it.
-- ==========================================

UPDATE public.ref_codes SET extra_data = extra_data || '{"lat": 45.4215, "lng": -75.6819}'::jsonb
  WHERE code_id = 'NODE_LEES';

UPDATE public.ref_codes SET extra_data = extra_data || '{"lat": 45.3483, "lng": -75.9221}'::jsonb
  WHERE code_id = 'NODE_KANATA';

UPDATE public.ref_codes SET extra_data = extra_data || '{"lat": 45.4677, "lng": -75.5194}'::jsonb
  WHERE code_id = 'NODE_ORLEANS';

UPDATE public.ref_codes SET extra_data = extra_data || '{"lat": 45.2731, "lng": -75.7527}'::jsonb
  WHERE code_id = 'NODE_BARRHAVEN';

UPDATE public.ref_codes SET extra_data = extra_data || '{"lat": 45.4215, "lng": -75.6972}'::jsonb
  WHERE code_id = 'NODE_DOWNTOWN';
