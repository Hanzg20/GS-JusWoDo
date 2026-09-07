-- ==========================================
-- The 6-pillar homepage grid (CategoryIconGrid.tsx) is a 3-column layout
-- on mobile. Real-device testing (WeChat in-app browser, English UI)
-- showed "Secondhand Market" and "Neighborhood Help" overflowing/clipping
-- inside their card ("Secondhan" losing its final "d"), and "Local
-- Services" wrapping awkwardly too — the English pillar names were never
-- checked against the narrow mobile card width the Chinese names already
-- fit comfortably in. Shortened to single words to match the visual
-- rhythm of the other pillars (Products/Tasks/Rentals).
-- ==========================================

UPDATE public.ref_codes SET en_name = 'Services' WHERE code_id = 'PILLAR_SERVICE';
UPDATE public.ref_codes SET en_name = 'Secondhand' WHERE code_id = 'PILLAR_GOODS';
UPDATE public.ref_codes SET en_name = 'Neighbors' WHERE code_id = 'PILLAR_HELP';
