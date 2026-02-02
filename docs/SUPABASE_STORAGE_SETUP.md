# 📦 Supabase Storage 设置指南

## 问题：Bucket not found

如果你看到 `Bucket not found` 错误，说明Supabase Storage中还没有创建存储bucket。

---

## 方法1：使用Supabase Dashboard（推荐）

### 步骤1：登录Supabase Dashboard
1. 访问 https://supabase.com/dashboard
2. 选择你的项目

### 步骤2：创建Storage Bucket
1. 在左侧菜单点击 **Storage**
2. 点击 **New bucket** 按钮
3. 填写以下信息：
   - **Name**: `chat-media`
   - **Public bucket**: ✅ 勾选（允许公开访问）
   - **File size limit**: 5MB（可选）
   - **Allowed MIME types**: `image/*`（可选）
4. 点击 **Create bucket**

### 步骤3：设置存储策略
1. 点击刚创建的 `chat-media` bucket
2. 点击 **Policies** 标签
3. 点击 **New policy**
4. 选择模板或手动创建以下策略：

#### 策略1：允许认证用户上传
```sql
-- Policy name: Authenticated users can upload
-- Allowed operation: INSERT
-- Target roles: authenticated

bucket_id = 'chat-media'
AND (storage.foldername(name))[1] = 'chat-images'
```

#### 策略2：允许所有人查看
```sql
-- Policy name: Anyone can view
-- Allowed operation: SELECT
-- Target roles: public

bucket_id = 'chat-media'
AND (storage.foldername(name))[1] = 'chat-images'
```

---

## 方法2：使用SQL Editor

### 步骤1：打开SQL Editor
1. 在Supabase Dashboard左侧点击 **SQL Editor**
2. 点击 **New query**

### 步骤2：运行SQL创建Bucket
复制粘贴以下SQL并运行：

```sql
-- 创建 chat-media bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-media', 'chat-media', true)
ON CONFLICT (id) DO NOTHING;

-- 允许认证用户上传聊天图片
CREATE POLICY "Authenticated users can upload chat images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'chat-media'
    AND (storage.foldername(name))[1] = 'chat-images'
);

-- 允许所有人查看聊天图片
CREATE POLICY "Anyone can view chat images"
ON storage.objects FOR SELECT
TO public
USING (
    bucket_id = 'chat-media'
    AND (storage.foldername(name))[1] = 'chat-images'
);

-- 允许用户删除自己的图片
CREATE POLICY "Users can delete their own chat images"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'chat-media'
    AND (storage.foldername(name))[1] = 'chat-images'
    AND owner = auth.uid()
);
```

### 步骤3：验证创建成功
运行查询：
```sql
SELECT * FROM storage.buckets WHERE id = 'chat-media';
```

应该看到返回一行数据。

---

## 方法3：使用Migration文件

我已经为你创建了migration文件：
```
supabase/migrations/20260130_create_chat_images_bucket.sql
```

### 本地开发：
```bash
# 如果使用Supabase CLI
supabase db push
```

### 生产环境：
1. 复制 `supabase/migrations/20260130_create_chat_images_bucket.sql` 的内容
2. 在Supabase Dashboard的SQL Editor中运行

---

## 验证设置

### 测试上传
运行以下代码片段测试：

```typescript
import { supabase } from '@/lib/supabase';

async function testUpload() {
    // 创建一个测试文件
    const testBlob = new Blob(['test'], { type: 'text/plain' });
    const testFile = new File([testBlob], 'test.txt');

    // 尝试上传
    const { data, error } = await supabase.storage
        .from('chat-media')
        .upload('chat-images/test.txt', testFile);

    if (error) {
        console.error('Upload failed:', error);
    } else {
        console.log('Upload successful:', data);

        // 获取公开URL
        const { data: { publicUrl } } = supabase.storage
            .from('chat-media')
            .getPublicUrl('chat-images/test.txt');

        console.log('Public URL:', publicUrl);
    }
}
```

### 检查Bucket列表
```typescript
async function listBuckets() {
    const { data, error } = await supabase.storage.listBuckets();
    console.log('Buckets:', data);
}
```

---

## 常见问题

### Q1: 为什么要用名为 'chat-media' 的bucket？
**A**: 这个名称清晰表明bucket用于存储聊天相关的媒体文件（图片、位置地图等）。注意：'public' 是Supabase的保留名称，不能使用。

### Q2: 如果我想使用不同的bucket名称怎么办？
**A**: 修改 `src/components/chat/ImageUpload.tsx` 中的代码：

```typescript
// 原代码（第120行左右）
const { data, error } = await supabase.storage
    .from('chat-media')  // 改成你的bucket名称
    .upload(filePath, compressedFile);
```

### Q3: 上传的图片存储在哪里？
**A**:
- Bucket: `chat-media`
- 文件夹: `chat-images/`
- 完整路径示例: `chat-media/chat-images/abc123-1234567890.jpg`

### Q4: 如何查看已上传的图片？
**A**:
1. 在Supabase Dashboard → Storage → chat-media bucket
2. 进入 `chat-images` 文件夹
3. 可以看到所有上传的图片

### Q5: 图片URL是什么格式？
**A**:
```
https://[PROJECT_ID].supabase.co/storage/v1/object/public/chat-media/chat-images/[FILENAME]
```

示例：
```
https://fvjgmydkxklqclcyhuvl.supabase.co/storage/v1/object/public/chat-media/chat-images/abc123-1234567890.jpg
```

### Q6: 存储空间有限制吗？
**A**:
- Supabase免费计划：1GB存储空间
- Pro计划：100GB起
- 可以在Dashboard → Settings → Billing查看使用情况

### Q7: 如何限制上传文件大小和类型？
**A**: 可以在bucket设置中配置：
1. Storage → public → Settings
2. File size limit: 设置最大文件大小（如5MB）
3. Allowed MIME types: 设置允许的文件类型（如 `image/*`）

---

## 安全建议

### 1. 启用RLS（Row Level Security）
确保storage policies已正确设置，防止未授权访问。

### 2. 文件类型验证
在客户端和服务端都进行文件类型验证：
```typescript
// 客户端验证（已实现）
if (!file.type.startsWith('image/')) {
    alert('Please select an image file');
    return;
}
```

### 3. 文件大小限制
```typescript
// 客户端限制（已实现）
if (file.size > 5 * 1024 * 1024) {
    alert('Image size should be less than 5MB');
    return;
}
```

### 4. 文件名随机化
使用随机文件名防止文件名冲突和猜测攻击（已实现）：
```typescript
const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
```

### 5. 定期清理
建议设置定期清理未使用的图片，节省存储空间。

---

## 故障排除

### 错误：`Bucket not found`
- **原因**: bucket未创建
- **解决**: 按照上述方法1或2创建bucket

### 错误：`new row violates row-level security policy`
- **原因**: storage policies未正确设置
- **解决**: 检查并重新创建policies

### 错误：`Failed to upload`
- **原因**: 网络问题或文件过大
- **解决**: 检查网络连接，确保文件小于5MB

### 错误：`403 Forbidden`
- **原因**: 用户未登录或无权限
- **解决**: 确保用户已登录（authenticated状态）

---

**最后更新**: 2026-01-30
