-- ==========================================
-- Every new signup was hardcoded to node_id='NODE_LEES' regardless of where
-- the person actually is (11 of 13 profiles ended up there). Worse, this
-- silently blocked CommunityContext.tsx's real geolocation logic, which
-- explicitly skips running whenever a profile already has a nodeId — so the
-- fake "chosen" default made real GPS detection never fire for anyone.
-- Leaving node_id NULL at signup lets that existing detection logic
-- actually place new users for real.
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
    NULL,
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

-- Un-stick existing profiles that were silently defaulted rather than having
-- picked/detected Lees for real. NODE_KANATA rows (real accounts that
-- already corrected themselves) are untouched.
UPDATE public.user_profiles SET node_id = NULL WHERE node_id = 'NODE_LEES';
