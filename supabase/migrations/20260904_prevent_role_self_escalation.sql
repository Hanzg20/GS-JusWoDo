-- ==========================================
-- Close the second path to self-granting ADMIN/MODERATOR found during the
-- RLS audit: "Users can update own profile" on user_profiles only checks
-- row ownership (auth.uid() = id), with no restriction on which values a
-- user can put in the `roles` text[] column — so a normal authenticated
-- user could already do
--   supabase.from('user_profiles').update({ roles: ['ADMIN'] }).eq('id', me)
-- directly, no INSERT into user_roles needed at all.
--
-- No frontend feature currently checks for ADMIN/MODERATOR/SUPER_ADMIN (see
-- 20260904_rls_lockdown_critical_tables.sql), so this isn't exploitable
-- into anything today — but it's a trigger-level fix so it's closed before
-- any admin/moderation panel gets built and starts trusting this column.
-- ==========================================

-- Deliberately NOT SECURITY DEFINER: current_user inside a SECURITY
-- DEFINER function resolves to the function's owner (postgres), not the
-- caller, which would make the "postgres"/"service_role" bypass below
-- always true and defeat the whole check. Plain SECURITY INVOKER lets
-- current_user correctly reflect who's actually running the UPDATE
-- (anon/authenticated/service_role/postgres).
CREATE OR REPLACE FUNCTION public.prevent_role_self_escalation()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.roles IS DISTINCT FROM OLD.roles THEN
    -- service_role (backend/admin operations, migrations run as postgres)
    -- bypasses this check entirely.
    IF current_user IN ('service_role', 'postgres') THEN
      RETURN NEW;
    END IF;

    IF NEW.roles && ARRAY['ADMIN', 'MODERATOR', 'SUPER_ADMIN']::text[] THEN
      RAISE EXCEPTION 'Cannot self-assign a privileged role';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS prevent_role_self_escalation_trigger ON public.user_profiles;
CREATE TRIGGER prevent_role_self_escalation_trigger
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_role_self_escalation();
