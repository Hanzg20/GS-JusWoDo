-- Migration: Auto-create user profiles for OAuth users
-- Description: Trigger to automatically create user_profiles when OAuth users sign up
-- Date: 2026-01-31

CREATE OR REPLACE FUNCTION public.handle_new_oauth_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert user profile with data from OAuth provider
  INSERT INTO public.user_profiles (id, email, name, avatar, node_id, beans_balance)
  VALUES (
    NEW.id,
    NEW.email,
    -- Try to get full_name, fallback to name, fallback to email prefix
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name', 
      split_part(NEW.email, '@', 1)
    ),
    -- Get avatar URL from OAuth provider
    NEW.raw_user_meta_data->>'avatar_url',
    -- Default to Lees Ave node
    'NODE_LEES',
    -- Welcome bonus
    100
  )
  ON CONFLICT (id) DO UPDATE SET
    -- Update avatar if provided and not already set
    avatar = COALESCE(user_profiles.avatar, EXCLUDED.avatar),
    -- Update name if not already set
    name = COALESCE(user_profiles.name, EXCLUDED.name);
  
  -- Assign default BUYER role
  INSERT INTO public.user_roles (user_id, role_id)
  SELECT NEW.id, id FROM public.roles WHERE name = 'BUYER'
  ON CONFLICT (user_id, role_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users insert
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_oauth_user();

-- Comment for documentation
COMMENT ON FUNCTION public.handle_new_oauth_user() IS 
'Automatically creates user_profiles and assigns BUYER role when new users sign up via OAuth (Google, Apple, etc.)';
