-- ==========================================
-- Fix Phone Login: Auto-create user_profiles
-- ==========================================
/*
  Problem: Users logging in with phone number don't get a user_profiles record.
  Solution: Create a trigger on auth.users to auto-create user_profiles.

  Date: 2026-02-01
  Version: v1.0
*/

-- 1. Update handle_new_user function to support phone login
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_email TEXT;
    v_phone TEXT;
    v_name TEXT;
BEGIN
    -- Get email and phone from auth.users
    v_email := NEW.email;
    v_phone := NEW.phone;

    -- Generate a default name based on available data
    IF NEW.raw_user_meta_data->>'name' IS NOT NULL THEN
        v_name := NEW.raw_user_meta_data->>'name';
    ELSIF v_email IS NOT NULL THEN
        v_name := SPLIT_PART(v_email, '@', 1); -- Use email prefix as name
    ELSIF v_phone IS NOT NULL THEN
        v_name := 'User_' || RIGHT(v_phone, 4); -- Use last 4 digits of phone
    ELSE
        v_name := 'Neighbor';
    END IF;

    -- Insert into user_profiles
    INSERT INTO public.user_profiles (
        id,
        email,
        phone,
        name,
        node_id,
        avatar
    )
    VALUES (
        NEW.id,
        v_email,
        v_phone,
        v_name,
        'NODE_LEES',
        'https://api.dicebear.com/7.x/avataaars/svg?seed=' || NEW.id::text
    )
    ON CONFLICT (id) DO UPDATE SET
        email = COALESCE(EXCLUDED.email, public.user_profiles.email),
        phone = COALESCE(EXCLUDED.phone, public.user_profiles.phone),
        updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 3. Create trigger to call handle_new_user on auth.users insert
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 4. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON public.user_profiles TO authenticated;

-- 5. Add comment
COMMENT ON TRIGGER on_auth_user_created ON auth.users IS
'Automatically creates a user_profiles record when a new user signs up (via email, phone, or OAuth)';

-- 6. Fix existing phone users without profiles (if any)
DO $$
DECLARE
    auth_user RECORD;
    v_name TEXT;
BEGIN
    -- Find auth.users without corresponding user_profiles
    FOR auth_user IN
        SELECT au.id, au.email, au.phone, au.raw_user_meta_data
        FROM auth.users au
        LEFT JOIN public.user_profiles up ON au.id = up.id
        WHERE up.id IS NULL
    LOOP
        -- Generate name
        IF auth_user.raw_user_meta_data->>'name' IS NOT NULL THEN
            v_name := auth_user.raw_user_meta_data->>'name';
        ELSIF auth_user.email IS NOT NULL THEN
            v_name := SPLIT_PART(auth_user.email, '@', 1);
        ELSIF auth_user.phone IS NOT NULL THEN
            v_name := 'User_' || RIGHT(auth_user.phone, 4);
        ELSE
            v_name := 'Neighbor';
        END IF;

        -- Create missing user_profiles
        INSERT INTO public.user_profiles (
            id,
            email,
            phone,
            name,
            node_id,
            avatar
        )
        VALUES (
            auth_user.id,
            auth_user.email,
            auth_user.phone,
            v_name,
            'NODE_LEES',
            'https://api.dicebear.com/7.x/avataaars/svg?seed=' || auth_user.id::text
        );

        RAISE NOTICE 'Created user_profiles for user %', auth_user.id;
    END LOOP;
END $$;

-- ==========================================
-- Verification Query (run after migration)
-- ==========================================
/*
-- Check if trigger exists
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- Check for orphaned auth users without profiles
SELECT au.id, au.email, au.phone, au.created_at
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.id
WHERE up.id IS NULL;

-- Should return 0 rows
*/
