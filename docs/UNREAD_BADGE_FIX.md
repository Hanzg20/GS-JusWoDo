# 🔴 未读徽章修复指南

## 问题描述
底部导航栏的"消息"图标上没有显示未读数徽章。

---

## 🔧 修复内容

### 0. **🚨 关键问题: 编辑了错误的文件**
**问题**: 之前所有修复都应用到了 `BottomNav.tsx`，但应用实际使用的是 `MobileBottomNav.tsx`（在 [App.tsx:6](../src/App.tsx#L6) 中导入）。

**修复**: 将所有修复重新应用到 `MobileBottomNav.tsx`

### 1. **MobileBottomNav.tsx - 添加 `relative` 定位**
**问题**: 按钮没有 `relative` 定位，导致绝对定位的徽章无法正确显示。

**修复**:
```tsx
// 之前
<button className="flex-1 flex flex-col items-center ...">

// 之后
<button className="relative flex-1 flex flex-col items-center ...">
```

### 2. **优化徽章位置**
**修复**:
- 水平: `right-1/4` → `right-6` (更靠近图标)
- 垂直: `top-2` → `top-1` (更贴近顶部)

---

### 3. **messageStore.ts - 修复 `loadConversations`**
**问题**: 加载对话后没有计算 `totalUnreadCount`。

**修复**: 在加载对话后累加所有对话的未读数
```typescript
// 添加计算逻辑
const totalUnread = conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
console.log('[MessageStore] Total unread count:', totalUnread);

set({
    conversations,
    totalUnreadCount: totalUnread,  // 设置总未读数
    isLoading: false
});
```

---

### 4. **messageStore.ts - 修复 `updateMessageReadStatus`**
**问题**: 使用两个 `set` 调用导致状态不一致。

**修复**: 合并为单个 `set` 调用
```typescript
// 之前 (有bug)
set(state => ({ messages: updatedMessages }));
set(state => ({
    conversations: updatedConversations,
    totalUnreadCount: newTotalUnread
})); // 这里的 state.messages 还是旧的！

// 之后 (正确)
set(state => {
    const updatedMessages = state.messages.map(...);
    const newTotalUnread = state.totalUnreadCount - (isRead ? messageIds.length : -messageIds.length);

    return {
        messages: updatedMessages,
        totalUnreadCount: Math.max(0, newTotalUnread)
    };
});
```

---

### 5. **MobileBottomNav.tsx - 添加实时更新机制**

#### 5.1 定期轮询 (每30秒)
```typescript
useEffect(() => {
    if (!currentUser?.id) return;

    const interval = setInterval(() => {
        loadUnreadCount(currentUser.id);
    }, 30000);

    return () => clearInterval(interval);
}, [currentUser?.id, loadUnreadCount]);
```

#### 5.2 路由切换时刷新
```typescript
useEffect(() => {
    if (currentUser?.id && location.pathname !== '/messages' && location.pathname !== '/chat') {
        loadUnreadCount(currentUser.id);
    }
}, [location.pathname, currentUser?.id, loadUnreadCount]);
```

#### 5.3 首次加载时获取对话
```typescript
useEffect(() => {
    if (currentUser?.id) {
        loadConversations(currentUser.id);
    }
}, [currentUser?.id, loadConversations]);
```

---

## 🎯 徽章样式

```css
- 位置: absolute top-1 right-6
- 颜色: bg-red-500
- 文字: text-white font-bold text-[10px]
- 尺寸: min-w-[18px] h-[18px]
- 边框: border-2 border-card
- 阴影: shadow-lg
- 动画: animate-pulse
- 显示: 最多 "99+"
```

---

## 🧪 测试步骤

### 步骤 1: 检查初始状态
1. 重启开发服务器: `npm run dev`
2. 打开浏览器控制台
3. 登录账户
4. 查看控制台日志:
   ```
   [MessageStore] Loaded conversations: 2
   [MessageStore] Total unread count: 3
   ```

### 步骤 2: 发送测试消息
1. **浏览器 A**: 登录用户A,停留在首页
2. **浏览器 B**: 登录用户B,进入与用户A的聊天
3. **浏览器 B**: 发送消息 "test1"
4. **浏览器 A**: 检查底部导航栏

✅ **预期结果**:
- 底部"消息"图标右上角显示红色徽章
- 徽章显示未读数 (例如: 1)
- 徽章有脉动动画

### 步骤 3: 进入聊天后检查
1. **浏览器 A**: 点击"消息"进入聊天列表
2. **浏览器 A**: 点击与用户B的对话
3. 等待2秒 (自动标记为已读)
4. **浏览器 A**: 点击"首页"返回

✅ **预期结果**:
- 底部导航栏的徽章消失
- 控制台显示: `[MessageStore] Updated read status: { ..., totalUnread: 0 }`

### 步骤 4: 多条未读消息
1. **浏览器 B**: 连续发送5条消息
2. **浏览器 A**: 检查底部导航栏

✅ **预期结果**:
- 徽章显示 "5"
- 脉动动画持续

### 步骤 5: 超过99条
1. 在数据库中手动插入100+条未读消息
2. 刷新浏览器A
3. 检查底部导航栏

✅ **预期结果**:
- 徽章显示 "99+"

---

## 🐛 故障排查

### 问题 1: 徽章不显示

**检查步骤**:
1. 打开控制台,运行:
   ```javascript
   useMessageStore.getState().totalUnreadCount
   ```
2. 如果返回 `0`,但明明有未读消息:
   ```javascript
   // 手动刷新
   const { loadUnreadCount } = useMessageStore.getState();
   const { currentUser } = useAuthStore.getState();
   loadUnreadCount(currentUser.id);
   ```

3. 检查 conversations 中的 unreadCount:
   ```javascript
   useMessageStore.getState().conversations.map(c => ({
       id: c.id.slice(0, 8),
       unreadCount: c.unreadCount
   }))
   ```

### 问题 2: 徽章位置不对

**检查**: 确保按钮有 `relative` 类
```html
<button className="relative flex flex-col items-center ...">
```

### 问题 3: 徽章不更新

**原因**:
- 路由没有切换 (一直在首页)
- 定时器被清除

**解决**: 刷新页面或等待30秒

---

## 📊 调试日志

启用 Debug 模式查看详细日志:

```bash
# .env.local
VITE_DEBUG_MODE=true
```

**关键日志**:
```
✅ 加载对话:
[MessageStore] Loaded conversations: 2
[MessageStore] Total unread count: 3

✅ 标记已读:
[MessageStore] Updated read status: {
    updatedMessageIds: [...],
    isRead: true,
    newTotalUnread: 0
}

✅ 实时消息:
[✅ Realtime] New message received via subscription
[MessageStore] Adding new message to store
```

---

## 📝 相关文件

| 文件 | 修改内容 |
|------|----------|
| [src/components/MobileBottomNav.tsx](../src/components/MobileBottomNav.tsx) | 徽章位置、轮询更新、首次加载对话 |
| [src/stores/messageStore.ts](../src/stores/messageStore.ts) | 计算未读数、修复状态更新bug |
| [src/services/repositories/supabase/MessageRepository.ts](../src/services/repositories/supabase/MessageRepository.ts) | 调试日志 |
| [src/App.tsx](../src/App.tsx) | 添加 `/messages` 路由别名 |

---

## ✅ 验收标准

- [x] 首次加载时显示正确的未读数
- [x] 收到新消息时徽章实时更新
- [x] 进入聊天后徽章消失
- [x] 未读数超过99显示 "99+"
- [x] 徽章有脉动动画
- [x] 位置正确 (消息图标右上角)
- [x] 每30秒自动刷新
- [x] 切换路由时刷新

---

**修复日期**: 2026-01-31
**版本**: v2.2.1
**测试状态**: ✅ 通过
