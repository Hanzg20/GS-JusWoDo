-- Record-only migration (applied via `supabase db query --linked --file`).
--
-- Rename 小螺号 -> 小百灵. "螺号" (conch horn) is an object/instrument, not
-- a species, breaking the "小 + 两字物种名" mascot naming convention that
-- the rest of the family (小海狸/小蜜蜂/小浣熊/小松鼠) already follows.
-- 百灵 (lark) is a real bird known for singing/announcing, which also
-- fits her 邻里圈 broadcaster role better than a passive shell horn.

UPDATE user_profiles
SET name = '小百灵',
    bio = '邻里圈管理员 🎶 为你唱响本地新鲜事'
WHERE id = '9c2b0ee5-3b88-4534-aaf9-993785bffd40';

UPDATE community_posts
SET title = replace(title, '小螺号', '小百灵'),
    content = replace(replace(content, '小螺号', '小百灵'), '🐚', '🎶')
WHERE author_id = '9c2b0ee5-3b88-4534-aaf9-993785bffd40';
