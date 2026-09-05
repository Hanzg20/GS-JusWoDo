-- ==========================================
-- Report + Block — the safety baseline for a "browse + chat, deal
-- off-platform, no payment protection" launch model (see
-- src/config/launchFlags.ts). Lightweight: capture reports for manual
-- follow-up, no admin review workbench yet.
--
-- Note: CommunityPostDetail.tsx already had a "Report" menu item, but it
-- had no onClick handler at all — this migration is what makes it (and the
-- new listing/user report entry points) actually do something.
-- ==========================================

CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('LISTING', 'USER', 'COMMUNITY_POST', 'REVIEW')),
  target_id UUID NOT NULL,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'REVIEWED', 'DISMISSED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reports_target ON public.reports(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status) WHERE status = 'PENDING';

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can file reports" ON public.reports
  FOR INSERT WITH CHECK (reporter_id = auth.uid());
CREATE POLICY "Users can view their own reports" ON public.reports
  FOR SELECT USING (reporter_id = auth.uid());
-- No client UPDATE/DELETE — reviewing/dismissing a report is admin/service_role only.

CREATE TABLE IF NOT EXISTS public.blocked_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (blocker_id, blocked_id),
  CHECK (blocker_id <> blocked_id)
);

ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own block list" ON public.blocked_users
  FOR ALL USING (blocker_id = auth.uid()) WITH CHECK (blocker_id = auth.uid());
