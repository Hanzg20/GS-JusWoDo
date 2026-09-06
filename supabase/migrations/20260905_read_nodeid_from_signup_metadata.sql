-- ==========================================
-- Register.tsx has always sent the node the person picked on the register
-- form as auth signUp metadata (`options.data.nodeId`), but
-- handle_new_oauth_user() never read it — first it hardcoded 'NODE_LEES'
-- for every signup, and after this session's earlier fix it hardcodes NULL
-- instead, so a deliberate choice on the register form was silently thrown
-- away either way. Read it when present; NULL otherwise (OAuth/phone
-- signups, which don't go through this form) still lets the client-side
-- geolocation backfill in CommunityContext.tsx take over as before.
-- ==========================================

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
    NEW.raw_user_meta_data->>'nodeId',
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
