-- ==========================================
-- UNIFIED SEMANTIC SEARCH RPC v2.0
-- Purpose: Consolidate search_listings and match_listings into a single robust function.
-- ==========================================

-- 1. Ensure extension and column exist
CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE public.listing_masters 
ADD COLUMN IF NOT EXISTS embedding vector(384);

-- 2. Create the unified match_listings function
CREATE OR REPLACE FUNCTION public.match_listings (
  query_embedding vector(384),
  match_threshold float DEFAULT 0.3,
  match_count int DEFAULT 20,
  filter_node_id text DEFAULT NULL,
  filter_category_id text DEFAULT NULL,
  filter_type public.listing_type DEFAULT NULL,
  filter_provider_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  provider_id UUID,
  title_zh TEXT,
  title_en TEXT,
  description_zh TEXT,
  description_en TEXT,
  images TEXT[],
  media_url TEXT,
  type public.listing_type,
  category_id TEXT,
  node_id TEXT,
  tags TEXT[],
  status TEXT,
  location_address TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  rating DECIMAL,
  review_count INTEGER,
  attributes JSONB,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id,
    m.provider_id,
    m.title_zh,
    m.title_en,
    m.description_zh,
    m.description_en,
    m.images,
    m.media_url,
    m.type,
    m.category_id,
    m.node_id,
    m.tags,
    m.status,
    m.location_address,
    m.latitude,
    m.longitude,
    m.rating,
    m.review_count,
    m.attributes,
    m.metadata,
    1 - (m.embedding <=> query_embedding) AS similarity
  FROM public.listing_masters m
  WHERE m.status = 'PUBLISHED'
    AND (filter_node_id IS NULL OR m.node_id = filter_node_id)
    AND (
      filter_category_id IS NULL 
      OR m.category_id = filter_category_id
      OR (
        filter_category_id LIKE '%0000' 
        AND m.category_id LIKE SUBSTRING(filter_category_id FROM 1 FOR 3) || '%'
      )
    )
    AND (filter_type IS NULL OR m.type = filter_type)
    AND (filter_provider_id IS NULL OR m.provider_id = filter_provider_id)
    AND (1 - (m.embedding <=> query_embedding) > match_threshold)
  ORDER BY m.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 3. Optimization Indexes
CREATE INDEX IF NOT EXISTS idx_listing_masters_embedding_hnsw 
ON public.listing_masters USING hnsw (embedding vector_cosine_ops);

-- 4. Cleanup old/redundant function if it exists
-- DROP FUNCTION IF EXISTS public.search_listings(vector(384), float, int, text);
