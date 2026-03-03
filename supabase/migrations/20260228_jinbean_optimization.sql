-- ==========================================
-- JWD Optimum Model: JinBean Optimization
-- Version: 1.1
-- Date: 2026-02-28
-- Description: Atomic transactions, Configurability, and Automated Rewards
-- ==========================================

-- 1. Create Rules Configuration Table
CREATE TABLE IF NOT EXISTS public.jinbean_rules (
    rule_id TEXT PRIMARY KEY,
    amount INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    description TEXT,
    metadata JSONB DEFAULT '{}',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.jinbean_rules IS 'Configuration for JinBean rewards and costs (JWD Optimum Model)';

-- 2. Seed Initial Rules (JWD Optimum Model)
INSERT INTO public.jinbean_rules (rule_id, amount, description, metadata) VALUES
-- Earn Scenarios
('SIGNUP_REWARD', 50, 'New user welcome bonus', '{"category": "EARN"}'),
('REVIEW_REWARD', 10, 'Reward for posting a neighbor story (review)', '{"category": "EARN"}'),
('ORDER_COMPLETION_REWARD', 50, 'Reward for buyer after successful transaction', '{"category": "EARN"}'),
('REFERRAL_REWARD', 100, 'Reward for successful neighbor referral', '{"category": "EARN"}'),
('PROFILE_MASTER_REWARD', 30, 'Reward for completing ID/Bio verification', '{"category": "EARN"}'),
('NODE_SPARK_REWARD', 20, 'Reward for first post in a new node', '{"category": "EARN"}'),
('ECO_GIVEAWAY_REWARD', 15, 'Reward for completing a free giveaway deal', '{"category": "EARN"}'),

-- Truth Economy (Fact System)
('FACT_PUBLISH_REWARD', 10, 'Base reward for publishing a Fact post', '{"category": "TRUTH"}'),
('FACT_VERIFIED_MEDIUM', 20, 'Bonus when Fact consensus reaches MEDIUM', '{"category": "TRUTH"}'),
('FACT_VERIFIED_HIGH', 50, 'Bonus when Fact consensus reaches HIGH', '{"category": "TRUTH"}'),
('FACT_VOTE_REWARD', 1, 'Reward for participating in community verification', '{"category": "TRUTH"}'),
('FACT_PENALTY', -30, 'Penalty for content flagged as MISINFORMATION', '{"category": "TRUTH"}'),

-- Burn Scenarios
('VIRTUAL_COFFEE_COST', -250, 'Cost to send a Virtual Coffee tip', '{"category": "BURN"}'),
('BOOST_COST_PER_HOUR', -10, 'Cost to boost a listing on the map', '{"category": "BURN"}')
ON CONFLICT (rule_id) DO UPDATE SET 
    amount = EXCLUDED.amount,
    description = EXCLUDED.description,
    metadata = EXCLUDED.metadata;

-- 3. Atomic Transaction RPC
CREATE OR REPLACE FUNCTION public.record_bean_transaction(
  p_user_id UUID,
  p_amount INTEGER,
  p_type TEXT,
  p_reason_zh TEXT,
  p_reason_en TEXT,
  p_related_order_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
) RETURNS VOID AS $$
BEGIN
  -- 1. Update the user's master balance
  UPDATE public.user_profiles 
  SET beans_balance = beans_balance + p_amount,
      updated_at = NOW()
  WHERE id = p_user_id;

  -- 2. Create the detailed history entry
  INSERT INTO public.bean_transactions (
    user_id, amount, type, reason_zh, reason_en, related_order_id, metadata
  ) VALUES (
    p_user_id, p_amount, p_type, p_reason_zh, p_reason_en, p_related_order_id, p_metadata
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Helper Function: Get Rule Amount
CREATE OR REPLACE FUNCTION public.get_bean_rule_amount(p_rule_id TEXT)
RETURNS INTEGER AS $$
DECLARE
    v_amount INTEGER;
    v_active BOOLEAN;
BEGIN
    SELECT amount, is_active INTO v_amount, v_active 
    FROM public.jinbean_rules 
    WHERE rule_id = p_rule_id;
    
    IF v_active = TRUE THEN
        RETURN v_amount;
    ELSE
        RETURN 0;
    END IF;
END;
$$ LANGUAGE plpgsql STABLE;

-- 5. Update Signup Trigger Logic
CREATE OR REPLACE FUNCTION public.handle_new_oauth_user()
RETURNS TRIGGER AS $$
DECLARE
    v_signup_bonus INTEGER;
BEGIN
  v_signup_bonus := public.get_bean_rule_amount('SIGNUP_REWARD');

  -- Insert user profile
  INSERT INTO public.user_profiles (id, email, name, avatar, node_id, beans_balance)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name', 
      split_part(NEW.email, '@', 1)
    ),
    NEW.raw_user_meta_data->>'avatar_url',
    'NODE_LEES',
    v_signup_bonus
  )
  ON CONFLICT (id) DO UPDATE SET
    avatar = COALESCE(user_profiles.avatar, EXCLUDED.avatar),
    name = COALESCE(user_profiles.name, EXCLUDED.name);

  -- Log the signup transaction if bonus > 0
  IF v_signup_bonus > 0 THEN
    INSERT INTO public.bean_transactions (user_id, amount, type, reason_zh, reason_en)
    VALUES (NEW.id, v_signup_bonus, 'SIGNUP', '新用户注册奖励', 'New user welcome bonus');
  END IF;
  
  -- Assign default BUYER role
  INSERT INTO public.user_roles (user_id, role_id)
  SELECT NEW.id, id FROM public.roles WHERE name = 'BUYER'
  ON CONFLICT (user_id, role_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Automated Review Reward Trigger
CREATE OR REPLACE FUNCTION public.process_review_bean_reward()
RETURNS TRIGGER AS $$
DECLARE
    v_reward INTEGER;
BEGIN
    v_reward := public.get_bean_rule_amount('REVIEW_REWARD');
    
    IF v_reward > 0 THEN
        PERFORM public.record_bean_transaction(
            NEW.buyer_id,
            v_reward,
            'REVIEW',
            '发布邻里故事奖励',
            'Neighbor Story reward',
            NEW.order_id
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_review_created_award_beans ON public.reviews;
CREATE TRIGGER on_review_created_award_beans
  AFTER INSERT ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.process_review_bean_reward();

-- 7. Automated Order Reward Trigger (including Eco-Bonus)
CREATE OR REPLACE FUNCTION public.process_order_bean_reward()
RETURNS TRIGGER AS $$
DECLARE
    v_reward INTEGER;
    v_is_giveaway BOOLEAN;
BEGIN
    -- Only award when status moves to COMPLETED
    IF NEW.status = 'COMPLETED' AND (OLD.status IS NULL OR OLD.status != 'COMPLETED') THEN
        -- Standard Order Reward
        v_reward := public.get_bean_rule_amount('ORDER_COMPLETION_REWARD');
        
        -- Check if it's a "Free/Giveaway" deal (e.g., amount_total is 0 or metadata flag)
        IF NEW.amount_total = 0 THEN
            v_reward := v_reward + public.get_bean_rule_amount('ECO_GIVEAWAY_REWARD');
        END IF;

        IF v_reward > 0 THEN
            PERFORM public.record_bean_transaction(
                NEW.buyer_id,
                v_reward,
                'ORDER_REWARD',
                CASE WHEN NEW.amount_total = 0 THEN '绿色环保交易奖励' ELSE '交易成功奖励' END,
                CASE WHEN NEW.amount_total = 0 THEN 'Eco-Giveaway reward' ELSE 'Order completion reward' END,
                NEW.id
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_order_completed_award_beans ON public.orders;
CREATE TRIGGER on_order_completed_award_beans
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.process_order_bean_reward();

-- 8. Truth Economy: Fact Voting Reward
CREATE OR REPLACE FUNCTION public.process_fact_vote_reward()
RETURNS TRIGGER AS $$
DECLARE
    v_reward INTEGER;
BEGIN
    v_reward := public.get_bean_rule_amount('FACT_VOTE_REWARD');
    
    IF v_reward > 0 THEN
        PERFORM public.record_bean_transaction(
            NEW.user_id,
            v_reward,
            'TRUTH_VOTE',
            '参与真言验证奖励',
            'Fact verification reward'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_fact_vote_award_beans ON public.fact_votes;
CREATE TRIGGER on_fact_vote_award_beans
  AFTER INSERT ON public.fact_votes
  FOR EACH ROW
  EXECUTE FUNCTION public.process_fact_vote_reward();

-- 9. Truth Economy: Fact Level Up Reward
-- This function will be called by the existing update_post_consensus logic or as a separate trigger
CREATE OR REPLACE FUNCTION public.process_fact_consensus_reward()
RETURNS TRIGGER AS $$
DECLARE
    v_reward INTEGER := 0;
    v_old_level TEXT;
    v_new_level TEXT;
    v_author_id UUID;
BEGIN
    v_old_level := OLD.consensus->>'level';
    v_new_level := NEW.consensus->>'level';
    v_author_id := NEW.author_id;

    -- Only award on level UP
    IF v_new_level = 'MEDIUM' AND (v_old_level = 'PENDING' OR v_old_level = 'LOW') THEN
        v_reward := public.get_bean_rule_amount('FACT_VERIFIED_MEDIUM');
    ELSIF v_new_level = 'HIGH' AND v_old_level != 'HIGH' THEN
        v_reward := public.get_bean_rule_amount('FACT_VERIFIED_HIGH');
    ELSIF v_new_level = 'CONTROVERSIAL' AND v_old_level != 'CONTROVERSIAL' THEN
        v_reward := public.get_bean_rule_amount('FACT_PENALTY'); -- Penalty is negative
    END IF;

    IF v_reward != 0 THEN
        PERFORM public.record_bean_transaction(
            v_author_id,
            v_reward,
            'TRUTH_CONSENSUS',
            '真言共识变动奖励/抵扣',
            'Fact consensus reward/penalty',
            NULL,
            jsonb_build_object('post_id', NEW.id, 'new_level', v_new_level)
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_fact_consensus_change_award_beans ON public.community_posts;
CREATE TRIGGER on_fact_consensus_change_award_beans
  AFTER UPDATE OF consensus ON public.community_posts
  FOR EACH ROW
  WHEN (NEW.is_fact = TRUE)
  EXECUTE FUNCTION public.process_fact_consensus_reward();

-- 10. Truth Economy: Fact Initial Publish Reward
CREATE OR REPLACE FUNCTION public.process_fact_publish_reward()
RETURNS TRIGGER AS $$
DECLARE
    v_reward INTEGER;
BEGIN
    IF NEW.is_fact = TRUE THEN
        v_reward := public.get_bean_rule_amount('FACT_PUBLISH_REWARD');
        
        IF v_reward > 0 THEN
            PERFORM public.record_bean_transaction(
                NEW.author_id,
                v_reward,
                'TRUTH_PUBLISH',
                '发布真言帖子奖励',
                'Fact post publication reward',
                NULL,
                jsonb_build_object('post_id', NEW.id)
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_fact_published_award_beans ON public.community_posts;
CREATE TRIGGER on_fact_published_award_beans
  AFTER INSERT ON public.community_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.process_fact_publish_reward();
