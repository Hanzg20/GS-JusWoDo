-- ==========================================
-- Fix full-text search: fts_doc never actually existed on the live DB.
--
-- 20260224_full_text_search.sql (tracked in git) tried to add it as a
-- `GENERATED ALWAYS AS (to_tsvector('simple', ...)) STORED` column. That
-- ALTER TABLE has always failed with "generation expression is not
-- immutable" — Postgres marks to_tsvector(regconfig, text) as STABLE, not
-- IMMUTABLE (text search dictionaries can be altered), so it can never
-- back a generated column, cast to regconfig or not. Since the migration
-- silently never applied, every keyword search in
-- src/services/repositories/supabase/ListingRepository.ts
-- (`qb.textSearch('fts_doc', ...)`) has been throwing "column fts_doc does
-- not exist" — i.e. the entire keyword search feature has been dead in
-- production, for every listing, since it was built.
--
-- Fix: a plain column kept in sync by a BEFORE INSERT/UPDATE trigger
-- instead of a generated column.
-- ==========================================

ALTER TABLE public.listing_masters ADD COLUMN IF NOT EXISTS fts_doc tsvector;

CREATE OR REPLACE FUNCTION public.update_listing_fts_doc() RETURNS trigger AS $$
BEGIN
  NEW.fts_doc := to_tsvector('simple',
    coalesce(NEW.title_zh, '') || ' ' || coalesce(NEW.title_en, '') || ' ' ||
    coalesce(NEW.description_zh, '') || ' ' || coalesce(NEW.description_en, '') || ' ' ||
    array_to_string(NEW.tags, ' '));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_listing_fts_doc ON public.listing_masters;
CREATE TRIGGER set_listing_fts_doc
  BEFORE INSERT OR UPDATE OF title_zh, title_en, description_zh, description_en, tags
  ON public.listing_masters
  FOR EACH ROW EXECUTE FUNCTION public.update_listing_fts_doc();

-- Backfill every row that existed before this trigger did.
UPDATE public.listing_masters SET fts_doc = to_tsvector('simple',
    coalesce(title_zh, '') || ' ' || coalesce(title_en, '') || ' ' ||
    coalesce(description_zh, '') || ' ' || coalesce(description_en, '') || ' ' ||
    array_to_string(tags, ' '));

CREATE INDEX IF NOT EXISTS idx_listing_masters_fts_doc ON public.listing_masters USING GIN (fts_doc);
