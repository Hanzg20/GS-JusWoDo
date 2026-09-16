-- Record-only migration (applied via `supabase db query --linked`).
--
-- No existing CATEGORY covers automotive repair (车身钣金/换胎/换机油) —
-- confirmed by listing every CATEGORY under every PILLAR_SERVICE
-- industry before writing this. Needed for 赵师傅's real 达人 profile
-- (see jwd_zhao_shifu_provider memory), which includes auto services
-- alongside general handyman repairs. Nested under 居家生活 (1010000)
-- as a sibling to Handyman (1010400) rather than spinning up a whole
-- new industry — this is one provider's listing, not a business
-- vertical like GOLDSKY TECH's IT services were, so ordinary category
-- growth is the right scope per jwd_avoid_58tongcheng_positioning.

INSERT INTO ref_codes (code_id, type, parent_id, zh_name, en_name, sort_order, is_active)
VALUES ('1010900', 'CATEGORY', '1010000', '汽车服务', 'Auto Services', 9, true);
