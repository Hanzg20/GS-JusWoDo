-- ==========================================
-- CRITICAL SECURITY FIX
--
-- Audit found these tables with RLS completely OFF, while `anon` AND
-- `authenticated` both held full INSERT/SELECT/UPDATE/DELETE/TRUNCATE
-- grants (the default Supabase-generated grant, never narrowed after these
-- tables were created — almost certainly by hand via the dashboard, since
-- none of the tracked migration files create them). In practice, right now
-- on the live site, ANY visitor holding only the public anon key (which
-- ships inside the frontend JS bundle) can read, modify, delete, or
-- truncate:
--   - orders            (everyone's orders: pricing, buyer/provider ids)
--   - user_addresses / addresses  (everyone's real home addresses)
--   - bean_transactions (fabricate unlimited JinBeans for themselves)
--   - cart_items
--   - user_roles / roles / role_permissions / permissions
--       (INSERT a row giving themselves the ADMIN role_id — the most
--       severe one; no frontend feature currently checks for ADMIN/
--       MODERATOR, so this isn't exploitable into anything *today*, but
--       it will be the instant an admin panel exists)
--   - audit_logs, community_post_conversions, jinbean_rules
--
-- Separately (documented, NOT fixed here — needs its own decision): the
-- "Users can update own profile" RLS policy on user_profiles allows a user
-- to UPDATE their own row including the `roles` text[] column with no
-- restriction on which roles they set — i.e. a user can already self-grant
-- 'ADMIN' via a plain UPDATE today. Same "not exploitable into anything
-- yet" caveat applies, but it's a second, independent path to the same
-- problem and isn't touched by this migration.
-- ==========================================

-- ------------------------------------------
-- Tables that need real per-row ownership scoping
-- ------------------------------------------

ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own addresses" ON public.addresses
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

ALTER TABLE public.user_addresses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own user_addresses" ON public.user_addresses
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own cart items" ON public.cart_items
  FOR ALL USING (EXISTS (SELECT 1 FROM public.carts c WHERE c.id = cart_items.cart_id AND c.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.carts c WHERE c.id = cart_items.cart_id AND c.user_id = auth.uid()));

-- Note: OrderRepository.ts has a dormant "guest checkout" path
-- (buyer_id = NULL, guarded by a DEMO_BUYER_ID sentinel) for the
-- QuickScanCheckout flow, which is currently hidden entirely behind
-- PAYMENTS_ENABLED (src/config/launchFlags.ts). WITH CHECK still allows
-- inserting a null-buyer row so that path keeps working if re-enabled, but
-- USING deliberately does NOT allow reading null-buyer rows back — nobody,
-- anon included, should be able to browse other guests' orders. Revisit
-- this policy if guest checkout ever actually ships.
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Buyers and providers manage their own orders" ON public.orders
  FOR ALL USING (
    buyer_id = auth.uid() OR
    provider_id IN (SELECT id FROM public.provider_profiles WHERE user_id = auth.uid())
  )
  WITH CHECK (
    buyer_id IS NULL OR buyer_id = auth.uid() OR
    provider_id IN (SELECT id FROM public.provider_profiles WHERE user_id = auth.uid())
  );

-- Users can read their own JinBean history; writes are server-side only
-- (client "reward" inserts from ReviewSubmission.tsx etc. are removed in a
-- follow-up — see the app-side note below).
ALTER TABLE public.bean_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own bean transactions" ON public.bean_transactions
  FOR SELECT USING (user_id = auth.uid());
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.bean_transactions FROM anon, authenticated;

-- CommunityPostRepository.convertToListing() inserts here client-side —
-- only allow it for a post the caller actually authored.
ALTER TABLE public.community_post_conversions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view post conversions" ON public.community_post_conversions
  FOR SELECT USING (true);
CREATE POLICY "Authors can convert their own posts" ON public.community_post_conversions
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.community_posts cp WHERE cp.id = post_id AND cp.author_id = auth.uid())
  );

-- AuthRepository.ts inserts {user_id, role_id: <BUYER>} at registration —
-- only allow self-assigning the BUYER role, never ADMIN/MODERATOR/etc.
-- Role changes beyond that are backend/admin-only (service_role bypasses RLS).
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own roles" ON public.user_roles
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can self-assign the default BUYER role" ON public.user_roles
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND role_id IN (SELECT id FROM public.roles WHERE name = 'BUYER')
  );

-- ------------------------------------------
-- Pure reference/lookup tables: world-readable by design (matches
-- ref_codes' existing intended behavior), just shouldn't be writable by
-- anon/authenticated. No RLS needed — narrowing the grant is enough.
-- ------------------------------------------
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.ref_codes FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.roles FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.role_permissions FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.permissions FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.jinbean_rules FROM anon, authenticated;

-- No frontend code references audit_logs at all — it's write-only from
-- triggers/service_role. No legitimate client access, so revoke entirely.
REVOKE ALL ON public.audit_logs FROM anon, authenticated;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
