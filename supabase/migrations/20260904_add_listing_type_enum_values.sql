-- ==========================================
-- Unlock the 4 ListingType values the frontend already assumes exist but
-- the DB enum never actually supported.
--
-- Finding: src/types/domain.ts declares
--   ListingType = 'SERVICE'|'RENTAL'|'CONSULTATION'|'GOODS'|'TASK'
--               | 'EVENT'|'FREE_GIVEAWAY'|'WANTED'|'OTHER'
-- but the live `listing_type` Postgres enum only had the first 5 values.
-- EventDetailView.tsx (RSVP flow, event_rsvps table, bean-commitment UI) is
-- fully built and imported but was completely unreachable — any attempt to
-- insert type='EVENT' would fail outright. FREE_GIVEAWAY had to be faked as
-- GOODS with a $0 price (see listing 13131313-..., "Free Moving Boxes",
-- stored as type=GOODS/category=1040100 "Free & Share" instead of its own
-- type). WANTED (reverse "looking for X" listings) had no path either.
--
-- Kept as its own migration file, applied before the seed-data insert file,
-- because Postgres forbids using a brand-new enum value inside the same
-- transaction that added it ("unsafe use of new value of enum type").
-- ==========================================

ALTER TYPE public.listing_type ADD VALUE IF NOT EXISTS 'EVENT';
ALTER TYPE public.listing_type ADD VALUE IF NOT EXISTS 'FREE_GIVEAWAY';
ALTER TYPE public.listing_type ADD VALUE IF NOT EXISTS 'WANTED';
ALTER TYPE public.listing_type ADD VALUE IF NOT EXISTS 'OTHER';
