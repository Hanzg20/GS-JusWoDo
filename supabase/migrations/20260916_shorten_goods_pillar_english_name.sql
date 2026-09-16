-- Record-only migration (applied via `supabase db query --linked`).
--
-- "Secondhand & Rentals" was noticeably longer than the other two
-- pillar names ("Services", "Neighbors") and risked wrapping in the
-- homepage's 3-column tile grid. Shortened to a single word that still
-- covers both used-goods trading and gear/space rentals, matching the
-- other two pillars' single-word parallelism. Chinese name (闲置 & 租赁)
-- untouched — only the English name was flagged as too long.

UPDATE ref_codes SET en_name = 'Marketplace' WHERE code_id = 'PILLAR_GOODS';
