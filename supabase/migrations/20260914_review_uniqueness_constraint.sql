-- Record-only migration (applied via `supabase db query --linked`).
--
-- Closes the "no uniqueness constraint per buyer" gap flagged in the
-- earlier review-system audit and the 58同城-positioning risk list
-- (jwd_avoid_58tongcheng_positioning): nothing previously stopped the same
-- buyer submitting multiple reviews for the same listing (LeaveReview.tsx
-- only checked client-side, and ReviewSubmission.tsx's order-based flow
-- didn't check at all). One review per buyer per listing, matching
-- Google/Yelp-style norms.
CREATE UNIQUE INDEX reviews_buyer_listing_unique ON reviews(buyer_id, listing_id);

-- Verified end-to-end: inserted a real review, attempted a duplicate for
-- the same (buyer_id, listing_id), got 23505 unique_violation as expected,
-- then cleaned up the test row.
