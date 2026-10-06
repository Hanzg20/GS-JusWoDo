-- Counter triggers ran as the acting user, so RLS silently blocked them.
--
-- update_post_like_count() etc. were plain (SECURITY INVOKER) functions.
-- When user B likes/comments on/saves user A's post, the trigger's
-- "UPDATE community_posts SET like_count = like_count + 1" runs as B, and
-- community_posts' UPDATE policy only lets the author touch the row — so
-- it matched 0 rows with no error. Only the author's own actions were
-- ever counted. Found 2026-10-05: one post had 3 likes but like_count=1,
-- another had 9 comments but comment_count=1. Same for follower_count
-- (the followed user's row belongs to someone else).
--
-- Fix: run these as the function owner (bypasses RLS, like the existing
-- increment_post_view_count / comment-like functions already do), with a
-- pinned search_path, then recount everything from the real rows.

ALTER FUNCTION public.update_post_like_count()    SECURITY DEFINER SET search_path = public;
ALTER FUNCTION public.update_post_comment_count() SECURITY DEFINER SET search_path = public;
ALTER FUNCTION public.update_post_save_count()    SECURITY DEFINER SET search_path = public;
ALTER FUNCTION public.update_follow_counts()      SECURITY DEFINER SET search_path = public;
ALTER FUNCTION public.update_user_post_count()    SECURITY DEFINER SET search_path = public;

-- Recount from the source tables.
UPDATE public.community_posts p SET
    like_count    = (SELECT COUNT(*) FROM public.community_post_likes l WHERE l.post_id = p.id),
    comment_count = (SELECT COUNT(*) FROM public.community_comments  c WHERE c.post_id = p.id),
    save_count    = (SELECT COUNT(*) FROM public.post_saves          s WHERE s.post_id = p.id);

UPDATE public.user_profiles u SET
    follower_count  = (SELECT COUNT(*) FROM public.user_followers f WHERE f.following_id = u.id),
    following_count = (SELECT COUNT(*) FROM public.user_followers f WHERE f.follower_id  = u.id),
    post_count      = (SELECT COUNT(*) FROM public.community_posts cp WHERE cp.author_id = u.id AND cp.status = 'ACTIVE');
