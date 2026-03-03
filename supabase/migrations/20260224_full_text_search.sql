-- ==========================================
-- FULL-TEXT SEARCH OPTIMIZATION
-- Purpose: Add a generated tsvector column for bilingual search.
-- ==========================================

-- 1. Add the generated column
ALTER TABLE public.listing_masters
ADD COLUMN IF NOT EXISTS fts_doc tsvector
GENERATED ALWAYS AS (
  to_tsvector('simple', coalesce(title_zh, '') || ' ' || coalesce(title_en, '') || ' ' || 
                         coalesce(description_zh, '') || ' ' || coalesce(description_en, '') || ' ' ||
                         array_to_string(tags, ' '))
) STORED;

-- 2. Create the GIN index for fast search
CREATE INDEX IF NOT EXISTS idx_listing_masters_fts_doc ON public.listing_masters USING GIN (fts_doc);

-- 3. Update search logic to use the index (this will be handled in ListingRepository.ts)
