-- 创建聊天图片存储bucket
-- Create storage bucket for chat images

-- 1. 创建 chat-media bucket（如果不存在）
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-media', 'chat-media', true)
ON CONFLICT (id) DO NOTHING;

-- 2. 设置存储策略 - 允许认证用户上传
CREATE POLICY "Authenticated users can upload chat images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'chat-media'
    AND (storage.foldername(name))[1] = 'chat-images'
);

-- 3. 允许所有人读取公开的聊天图片
CREATE POLICY "Anyone can view chat images"
ON storage.objects FOR SELECT
TO public
USING (
    bucket_id = 'chat-media'
    AND (storage.foldername(name))[1] = 'chat-images'
);

-- 4. 允许用户删除自己上传的图片（可选）
CREATE POLICY "Users can delete their own chat images"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'chat-media'
    AND (storage.foldername(name))[1] = 'chat-images'
    AND owner = auth.uid()
);

-- 注释：
-- - bucket_id: 使用 'chat-media' bucket
-- - chat-images: 聊天图片存储在 chat-images 文件夹下
-- - public read: 任何人都可以查看图片
-- - authenticated upload: 只有登录用户可以上传
