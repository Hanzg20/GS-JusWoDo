-- Fix: update_listing_fts_doc() used array_to_string(NEW.tags, ' ')
-- directly — when tags IS NULL, array_to_string(NULL, ' ') returns NULL
-- in Postgres, which poisons the whole `||` concatenation, so fts_doc
-- silently ends up NULL for any listing inserted/updated without tags.
-- Found while verifying 赵师傅's new listings didn't show up under
-- keyword search — turned out 7 real published listings (his 2 plus
-- all 5 GOLDSKY TECH ones) were silently invisible to keyword search
-- this whole time. COALESCE to an empty array fixes it going forward.

CREATE OR REPLACE FUNCTION public.update_listing_fts_doc()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.fts_doc := to_tsvector('simple',
    coalesce(NEW.title_zh, '') || ' ' || coalesce(NEW.title_en, '') || ' ' ||
    coalesce(NEW.description_zh, '') || ' ' || coalesce(NEW.description_en, '') || ' ' ||
    array_to_string(coalesce(NEW.tags, ARRAY[]::text[]), ' '));
  RETURN NEW;
END;
$function$;

-- Backfill real tags for 赵师傅's 2 listings + re-trigger fts_doc/embedding
UPDATE listing_masters SET tags = ARRAY['维修', '水电', '居家维修', 'Handyman', 'Repair', 'Barrhaven']
WHERE id = 'b2c3d4e5-6f7a-4b8c-9d0e-1f2a3b4c5d6e';

UPDATE listing_masters SET tags = ARRAY['汽车', '钣金', '换胎', '换机油', 'Auto Repair', 'Car Service', 'Barrhaven']
WHERE id = 'd4e5f6a7-8b9c-4d0e-1f2a-3b4c5d6e7f8a';

-- Backfill the 5 pre-existing GOLDSKY TECH listings that hit the same
-- bug — empty array is enough to make the trigger populate fts_doc
-- correctly from title/description alone.
UPDATE listing_masters SET tags = '{}'::text[]
WHERE tags IS NULL AND provider_id = '79c4bfa8-0161-4c7e-9a3c-28683d6494d1';
