-- ==========================================
-- The map page (MapDiscovery.tsx) has never shown a single listing, for
-- anyone, regardless of location or radius. ListingRepository.ts's
-- search() calls match_listings_by_radius() with a p_offset parameter that
-- the function never actually declared — PostgREST can't match the RPC
-- call to any function signature and returns a plain 404, which the
-- frontend just swallows as "no results in this area".
--
-- Fix: add p_offset (matching the sibling match_listings semantic-search
-- RPC, which already supports it) instead of dropping it from the client
-- call, since pagination is the actually-intended behavior here.
-- ==========================================

CREATE OR REPLACE FUNCTION public.match_listings_by_radius(
  p_lat double precision,
  p_lng double precision,
  p_radius_meters double precision,
  p_type text DEFAULT NULL::text,
  p_category_id text DEFAULT NULL::text,
  p_match_count integer DEFAULT 100,
  p_offset integer DEFAULT 0
)
 RETURNS TABLE(id uuid, title_zh text, title_en text, description_zh text, description_en text, images text[], type listing_type, category_id text, latitude double precision, longitude double precision, rating numeric, review_count integer, status text, distance_meters double precision)
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    SELECT
        lm.id,
        lm.title_zh,
        lm.title_en,
        lm.description_zh,
        lm.description_en,
        lm.images,
        lm.type,
        lm.category_id,
        lm.latitude,
        lm.longitude,
        lm.rating,
        lm.review_count,
        lm.status,
        ST_Distance(lm.location_coords, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography) AS distance_meters
    FROM public.listing_masters lm
    WHERE
        lm.status = 'PUBLISHED'
        AND ST_DWithin(lm.location_coords, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography, p_radius_meters)
        AND (p_type IS NULL OR lm.type::text = p_type)
        AND (p_category_id IS NULL OR lm.category_id = p_category_id)
    ORDER BY distance_meters ASC
    LIMIT p_match_count
    OFFSET p_offset;
END;
$function$;
