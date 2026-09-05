-- ==========================================
-- CRITICAL FIX: new user registration has been completely broken.
--
-- handle_new_oauth_user() (fires on EVERY new auth.users insert, via the
-- on_auth_user_created trigger) and record_bean_transaction() (the shared
-- helper called by every fact/order bean-reward trigger — vote, publish,
-- consensus, order completion) both INSERT INTO bean_transactions using
-- columns reason_zh/reason_en/metadata that were never actually added to
-- the table — it only has a single `reason` text column. Since these run
-- inside the same transaction as the triggering action, the error rolled
-- back the whole thing: nobody could create a new account, vote on a
-- Fact, publish a Fact, or complete an order.
--
-- Fix: add the missing `metadata` column (additive — it's genuinely used
-- to store {post_id, new_level} for fact-consensus rewards, no reason to
-- drop it), and reconcile reason_zh/reason_en into the one `reason` column
-- that actually exists (matches the pre-existing convention: plain text,
-- e.g. "GigBridge First Purchase Bonus", "Neighbor Story Review Reward").
-- ==========================================

ALTER TABLE public.bean_transactions ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

CREATE OR REPLACE FUNCTION public.record_bean_transaction(
  p_user_id uuid, p_amount integer, p_type text, p_reason_zh text, p_reason_en text,
  p_related_order_id uuid DEFAULT NULL::uuid, p_metadata jsonb DEFAULT '{}'::jsonb
)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  UPDATE public.user_profiles
  SET beans_balance = beans_balance + p_amount,
      updated_at = NOW()
  WHERE id = p_user_id;

  INSERT INTO public.bean_transactions (
    user_id, amount, type, reason, related_order_id, metadata
  ) VALUES (
    p_user_id, p_amount, p_type,
    COALESCE(NULLIF(p_reason_zh, '') || ' / ' || NULLIF(p_reason_en, ''), p_reason_en, p_reason_zh),
    p_related_order_id, p_metadata
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_oauth_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_signup_bonus INTEGER;
BEGIN
  v_signup_bonus := public.get_bean_rule_amount('SIGNUP_REWARD');

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

  IF v_signup_bonus > 0 THEN
    INSERT INTO public.bean_transactions (user_id, amount, type, reason)
    VALUES (NEW.id, v_signup_bonus, 'SIGNUP', '新用户注册奖励 / New user welcome bonus');
  END IF;

  INSERT INTO public.user_roles (user_id, role_id)
  SELECT NEW.id, id FROM public.roles WHERE name = 'BUYER'
  ON CONFLICT (user_id, role_id) DO NOTHING;

  RETURN NEW;
END;
$function$;
