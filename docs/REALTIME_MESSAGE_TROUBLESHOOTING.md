# 🔧 实时消息故障排查指南

## 📌 问题描述

两个用户在不同浏览器登录,一个能接收到消息,另一个接收不到。

---

## 🔍 诊断步骤

### 步骤 1: 打开浏览器开发者工具

在**两个浏览器**中都打开控制台:
- **Chrome/Edge**: 按 `F12` 或 `Ctrl+Shift+J` (Windows) / `Cmd+Option+J` (Mac)
- **Firefox**: 按 `F12` 或 `Ctrl+Shift+K`

### 步骤 2: 检查关键日志

在控制台中查找以下日志:

#### ✅ 正常情况应该看到:

```
[MessageStore] Loaded conversations: 2
[MessageStore] Subscribing to active conversation: abc12345-...
[🔵 Realtime] Setting up subscription for conversation: abc12345-...
[✅ Realtime] Successfully subscribed to conversation: abc12345-...
```

#### 发送消息时:

```
[📤 Send Message] Sending: { conversationId: "abc12345-...", ... }
[✅ Send Message] Message sent successfully: msg-id-...
```

#### 接收消息时:

```
[✅ Realtime] New message received via subscription: { ... }
[MessageStore] Received new message via callback: { ... }
[MessageStore] Adding new message to store
```

### 步骤 3: 验证 Conversation ID 一致性

在聊天头部查看 **Debug信息** (仅当 `VITE_DEBUG_MODE=true` 时可见):

```
Online • Seller • ID: abc12345...
```

**⚠️ 两个用户的 Conversation ID 必须完全一致！**

如果不一致,说明他们在不同的对话中。

---

## ❌ 常见问题和解决方案

### 问题 1: 订阅失败 (CHANNEL_ERROR 或 TIMED_OUT)

**症状**:
```
[❌ Realtime] Subscription error for conversation abc123: ...
[⏱️ Realtime] Subscription timed out for conversation: abc123
```

**可能原因**:
- Supabase Realtime 未启用
- RLS 策略阻止访问
- 网络连接问题

**解决方案**:

#### 1. 检查 Supabase Realtime 是否启用

登录 [Supabase Dashboard](https://supabase.com/dashboard):

1. 进入你的项目
2. 左侧菜单 → **Database** → **Replication**
3. 找到 `messages` 表
4. 确保 **Source** 列显示为已启用

或者运行以下 SQL 验证:

```sql
SELECT schemaname, tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime';
```

应该看到包含 `messages` 表的结果。

#### 2. 验证 RLS 策略

在 Supabase SQL Editor 中运行:

```sql
-- 检查当前用户能否查看消息
SELECT * FROM public.messages
WHERE conversation_id = '你的-conversation-id';
```

如果返回空或错误,说明 RLS 策略有问题。

**修复方法**: 运行以下 SQL:

```sql
-- 重新创建 RLS 策略
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;

CREATE POLICY "Users can view messages in their conversations"
    ON public.messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.conversations c
            WHERE c.id = conversation_id
            AND (auth.uid() = c.participant_a OR auth.uid() = c.participant_b)
        )
    );
```

---

### 问题 2: 消息发送成功但订阅未触发

**症状**:
```
[✅ Send Message] Message sent successfully: msg-123
// 但没有看到:
[✅ Realtime] New message received via subscription
```

**可能原因**:
- 订阅频道与实际 conversation_id 不匹配
- Realtime 订阅在消息发送后才建立

**解决方案**:

1. **检查订阅顺序**: 确保在发送消息**之前**已经订阅

```
正确顺序:
1. [MessageStore] Subscribing to active conversation
2. [✅ Realtime] Successfully subscribed
3. [📤 Send Message] Sending...
```

2. **手动触发重新订阅**:

在浏览器控制台运行:

```javascript
// 获取当前 conversation ID
const convId = localStorage.getItem('lastActiveConversation');
console.log('Current conversation:', convId);

// 重新加载页面以重新订阅
location.reload();
```

---

### 问题 3: Conversation ID 不一致

**症状**: 两个用户看到不同的 `ID: abc12345...`

**原因**: 创建了重复的 conversation

**解决方案**:

在 Supabase SQL Editor 中运行:

```sql
-- 查找可能的重复对话
SELECT
    id,
    participant_a,
    participant_b,
    created_at
FROM public.conversations
WHERE (participant_a = '用户A-ID' AND participant_b = '用户B-ID')
   OR (participant_a = '用户B-ID' AND participant_b = '用户A-ID')
ORDER BY created_at DESC;
```

如果有多条记录,删除旧的:

```sql
-- 保留最新的,删除旧的
DELETE FROM public.conversations
WHERE id IN (
    SELECT id FROM public.conversations
    WHERE (participant_a = '用户A-ID' AND participant_b = '用户B-ID')
       OR (participant_a = '用户B-ID' AND participant_b = '用户A-ID')
    ORDER BY created_at DESC
    OFFSET 1
);
```

---

### 问题 4: 网络或浏览器限制

**症状**: 订阅建立但消息延迟很久才到达

**可能原因**:
- WebSocket 连接被防火墙阻止
- 浏览器扩展干扰 (如广告拦截器)
- 网络不稳定

**解决方案**:

1. **禁用浏览器扩展**: 在隐身模式下测试
2. **检查网络**: 使用其他网络 (如手机热点)
3. **查看 WebSocket 状态**:

在浏览器控制台 → **Network** 标签:
- 过滤器选择 **WS** (WebSocket)
- 应该看到 `realtime` 连接状态为 **101 Switching Protocols**

---

## 🧪 测试步骤

### 完整测试流程:

1. **用户 A** (浏览器 1):
   ```
   1. 登录
   2. 打开 /messages 页面
   3. 选择或创建与用户 B 的对话
   4. 检查控制台日志,确认订阅成功
   ```

2. **用户 B** (浏览器 2):
   ```
   1. 登录
   2. 打开 /messages 页面
   3. 选择与用户 A 的对话 (ID 应该相同)
   4. 检查控制台日志,确认订阅成功
   ```

3. **发送测试消息**:
   ```
   用户 A: 发送 "test1"
   用户 B 控制台应该显示:
   [✅ Realtime] New message received via subscription
   [MessageStore] Adding new message to store

   用户 B: 发送 "test2"
   用户 A 控制台应该显示相同日志
   ```

---

## 🔧 高级诊断

### 检查 Supabase Realtime 配置

在 SQL Editor 运行:

```sql
-- 1. 检查 messages 表是否在 Realtime publication 中
SELECT * FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
AND tablename = 'messages';

-- 2. 检查 RLS 是否启用
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('messages', 'conversations');

-- 3. 检查现有策略
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename IN ('messages', 'conversations');
```

### 手动测试 Realtime

在浏览器控制台运行:

```javascript
import { supabase } from '@/lib/supabase';

const testChannel = supabase
    .channel('test-channel')
    .on(
        'postgres_changes',
        {
            event: 'INSERT',
            schema: 'public',
            table: 'messages'
        },
        (payload) => {
            console.log('✅ Received:', payload);
        }
    )
    .subscribe((status) => {
        console.log('📡 Subscription status:', status);
    });

// 5秒后取消订阅
setTimeout(() => {
    supabase.removeChannel(testChannel);
    console.log('🔴 Unsubscribed');
}, 5000);
```

---

## 📊 日志级别说明

| 符号 | 含义 | 示例 |
|------|------|------|
| 🔵 | 信息 | Realtime 设置订阅 |
| ✅ | 成功 | 订阅成功/消息接收 |
| ❌ | 错误 | 订阅失败/发送失败 |
| ⏱️ | 超时 | 连接超时 |
| 📤 | 发送 | 发送消息 |
| 🔴 | 清理 | 取消订阅 |

---

## 📞 仍然无法解决？

提供以下信息以获得帮助:

1. **两个浏览器的完整控制台日志** (从打开页面到发送消息)
2. **Conversation ID** (从调试信息中)
3. **Supabase Project ID**
4. **用户 ID** (两个用户的)
5. **SQL 查询结果**:

```sql
SELECT id, participant_a, participant_b
FROM public.conversations
WHERE id = '你的-conversation-id';

SELECT id, conversation_id, sender_id, content, created_at
FROM public.messages
WHERE conversation_id = '你的-conversation-id'
ORDER BY created_at DESC
LIMIT 5;
```

---

**最后更新**: 2026-01-31
**版本**: v1.0
