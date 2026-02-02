-- RLS FIX: Ensure anyone can read active community posts
-- This migration explicitly drops and recreates the select policy to ensure all users (anon + authenticated) can see content.

BEGIN;

-- 1. Drop existing policy to avoid conflicts
DROP POLICY IF EXISTS "Anyone can view active posts" ON public.community_posts;

-- 2. Recreate policy with explicit TO PUBLIC
CREATE POLICY "Anyone can view active posts" 
ON public.community_posts 
FOR SELECT 
TO PUBLIC 
USING (status = 'ACTIVE' OR status = 'RESOLVED');

-- 3. Also fix Comment policies just in case
DROP POLICY IF EXISTS "Anyone can view comments" ON public.community_comments;
CREATE POLICY "Anyone can view comments" 
ON public.community_comments 
FOR SELECT 
TO PUBLIC 
USING (TRUE);

COMMIT;
