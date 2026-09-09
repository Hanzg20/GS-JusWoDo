-- Record-only: applied directly via `supabase db query --linked` since
-- `supabase db push` is broken for this project (see repo conversation
-- history / project memory jwd_db_query_bypasses_broken_push).

-- Knowledge base backing ai-support-reply's system prompt. Previously
-- hardcoded as a string constant in the Edge Function — moved here so the
-- operator can add/edit facts via /admin/knowledge-base without a code
-- deploy. The "how to behave" instructions (tone, format, defer-to-human
-- rules) stay hardcoded in the function; only the "what to know" facts
-- live here.

CREATE TABLE ai_knowledge_base (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    category text NOT NULL,
    content text NOT NULL,
    is_active boolean NOT NULL DEFAULT true,
    sort_order integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE ai_knowledge_base ENABLE ROW LEVEL SECURITY;

-- Only SUPER_ADMIN can read/write — the Edge Function itself uses the
-- service-role key and bypasses RLS entirely, so this policy only
-- governs the admin UI's direct client-side access.
CREATE POLICY "Admins can manage knowledge base"
ON ai_knowledge_base FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM user_profiles up
        WHERE up.id = auth.uid() AND 'SUPER_ADMIN' = ANY(up.roles)
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM user_profiles up
        WHERE up.id = auth.uid() AND 'SUPER_ADMIN' = ANY(up.roles)
    )
);

-- Seed data: the facts that were in ai-support-reply's hardcoded
-- SYSTEM_PROMPT as of 2026-09-08, fact-checked against real platform
-- state (no payment escrow yet — see jwd_launch_skips_escrow memory).
INSERT INTO ai_knowledge_base (category, content, sort_order) VALUES
('platform_basics', '渥帮是 GoldSky Technologies 旗下面向渥太华地区的本地生活服务平台。', 1),
('platform_basics', '平台核心板块：商户服务（本地专业服务/商户，如清洁、维修、宠物美容等）、邻里互助（社区求助、跑腿、推荐、资讯）、二手闲置（个人闲置物品买卖/赠送），首页还有产品、任务、租赁等分类。', 2),
('payment_policy', '目前平台【没有】站内支付托管或担保交易机制——交易的付款方式、时间、地点由买卖双方自行在聊天中协商确定，平台不参与资金环节，也不提供退款保证。如果用户问"钱有没有保障"，如实说明目前是这个状态，不要暗示有担保。', 3),
('how_to_use', '用户可以在具体服务/商品详情页点击"Chat"或"联系"按钮直接和商家/邻居发起聊天。', 4),
('dispute_handling', '如果用户反映和某个商家/邻居之间有纠纷、投诉，或者需要人工客服介入，回复"已经记录，人工客服会尽快跟进处理"，不要承诺具体的处理时限、赔偿方案或调查结果。', 5),
('uncertainty_handling', '遇到你不确定、平台信息里没有提到的问题（具体价格、优惠活动、认证审核细节等），如实说"这个我暂时不确定，会请人工客服跟进确认"，绝对不要猜测或编造答案。', 6);
