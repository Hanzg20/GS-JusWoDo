-- ==========================================
-- GIG NEIGHBOR: MAP GEOSPATIAL FIX
-- Date: 2026-02-03
-- Description: Enables PostGIS, adds geography column, and implements radius search.
-- ==========================================

-- 1. Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Add geography column to listing_masters if it doesn't exist
-- We use geography(POINT) for performance and distance accuracy in meters.
ALTER TABLE public.listing_masters 
ADD COLUMN IF NOT EXISTS location_coords geography(POINT);

-- 3. Add latitude/longitude columns if they are missing (redundancy check)
ALTER TABLE public.listing_masters 
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- 4. Create index for spatial queries
CREATE INDEX IF NOT EXISTS idx_listing_masters_location_coords ON public.listing_masters USING GIST (location_coords);

-- 5. Function to sync lat/lng to geography column
CREATE OR REPLACE FUNCTION public.sync_listing_coords()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
        NEW.location_coords = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
    ELSE
        NEW.location_coords = NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Trigger to automatically sync coords on insert/update
DROP TRIGGER IF EXISTS trg_sync_listing_coords ON public.listing_masters;
CREATE TRIGGER trg_sync_listing_coords
BEFORE INSERT OR UPDATE OF latitude, longitude
ON public.listing_masters
FOR EACH ROW
EXECUTE FUNCTION public.sync_listing_coords();

-- 7. RPC for Radius Search
-- This matches the call structure in SupabaseListingRepository.ts
CREATE OR REPLACE FUNCTION public.match_listings_by_radius(
    p_lat DOUBLE PRECISION,
    p_lng DOUBLE PRECISION,
    p_radius_meters DOUBLE PRECISION,
    p_type TEXT DEFAULT NULL,
    p_category_id TEXT DEFAULT NULL,
    p_match_count INTEGER DEFAULT 100
)
RETURNS TABLE (
    id UUID,
    title_zh TEXT,
    title_en TEXT,
    description_zh TEXT,
    description_en TEXT,
    images TEXT[],
    type listing_type,
    category_id TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    rating NUMERIC,
    review_count INTEGER,
    status TEXT,
    distance_meters DOUBLE PRECISION
) 
LANGUAGE plpgsql
AS $$
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
    LIMIT p_match_count;
END;
$$;

-- 8. Backfill existing data
UPDATE public.listing_masters
SET location_coords = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
WHERE latitude IS NOT NULL AND longitude IS NOT NULL AND location_coords IS NULL;

-- 9. Ensure listing_masters are publicly readable if not already handled
-- DO NOT execute if policies already exist
ALTER TABLE public.listing_masters ENABLE ROW LEVEL SECURITY;
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Masters viewable if published' AND tablename = 'listing_masters') THEN
        CREATE POLICY "Masters viewable if published" 
        ON public.listing_masters FOR SELECT USING (status = 'PUBLISHED');
    END IF;
END $$;
