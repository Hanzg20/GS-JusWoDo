# 💬 聊天媒体功能使用指南

## 概述

消息系统现在支持发送表情、图片和位置，让沟通更加丰富多彩！

---

## 🎨 表情选择器

### 功能特点
- **6个分类**：表情、手势、心情、生活、食物、符号
- **200+表情**：精心挑选的常用emoji
- **快速插入**：点击即可插入到输入框

### 使用方法
1. 点击快速操作栏中的 **"😊 表情"** 按钮
2. 选择分类标签
3. 点击任意表情即可插入到输入框
4. 可以组合多个表情或配合文字发送

### 技术实现
```typescript
// 组件路径
src/components/chat/EmojiPicker.tsx

// 使用示例
<EmojiPicker onEmojiSelect={(emoji) => setInput(prev => prev + emoji)} />
```

---

## 📸 图片上传

### 功能特点
- **自动压缩**：超过1200px自动缩小，减少流量
- **实时预览**：上传前查看效果
- **进度显示**：上传进度条实时更新
- **格式限制**：支持所有常见图片格式 (jpg, png, gif, webp等)
- **大小限制**：最大5MB

### 使用方法
1. 点击快速操作栏中的 **"📷 图片"** 按钮
2. 选择要上传的图片文件
3. 预览确认无误后点击 **"发送图片"**
4. 等待上传完成（会显示进度条）

### 图片压缩逻辑
```typescript
// 压缩参数
- 最大宽度：1200px
- 最大高度：1200px
- JPEG质量：85%
- 输出格式：JPEG

// 示例
原始图片: 3000×2000, 2.5MB
压缩后: 1200×800, 180KB
```

### 技术实现
```typescript
// 组件路径
src/components/chat/ImageUpload.tsx

// 存储位置
Supabase Storage: public/chat-images/

// 使用示例
<ImageUpload onImageUploaded={async (url) => {
    await sendMessage(userId, url, 'IMAGE', { imageUrl: url });
}} />
```

---

## 📍 位置分享

### 功能特点
- **实时定位**：自动获取当前GPS坐标
- **地图预览**：发送前预览位置
- **地址解析**：自动反向地理编码获取详细地址
- **一键导航**：收到位置后可直接在Google Maps中打开
- **静态地图**：消息中显示地图缩略图

### 使用方法
1. 点击快速操作栏中的 **"📍 位置"** 按钮
2. 浏览器会请求位置权限，点击"允许"
3. 等待定位完成（会显示地图预览）
4. 确认位置无误后点击 **"发送位置"**
5. 对方收到后可点击地图或链接在导航应用中查看

### 位置数据结构
```typescript
{
    lat: 45.4215,           // 纬度
    lng: -75.6972,          // 经度
    address: "123 Main St, Ottawa, ON"  // 地址（可选）
}
```

### 技术实现
```typescript
// 组件路径
src/components/chat/LocationShare.tsx

// 使用API
- 定位：Browser Geolocation API
- 反向地理编码：OpenStreetMap Nominatim
- 静态地图：OpenStreetMap Static Map

// 使用示例
<LocationShare onLocationShare={async (location) => {
    const locationText = `📍 ${location.address}`;
    await sendMessage(userId, locationText, 'LOCATION', {
        lat: location.lat,
        lng: location.lng,
        address: location.address
    });
}} />
```

---

## 🎯 消息类型

### 支持的消息类型

| 类型 | messageType | 描述 | 显示方式 |
|------|-------------|------|----------|
| 普通文本 | `TEXT` | 默认消息类型 | 文本气泡 |
| 表情 | `TEXT` | 文本中包含emoji | 文本气泡 |
| 图片 | `IMAGE` | 图片消息 | 图片预览 + 点击放大 |
| 位置 | `LOCATION` | 位置分享 | 地图缩略图 + 地址 + 导航链接 |
| 报价 | `QUOTE` | 自定义价格报价 | 橙色卡片 + 金额 + 批准按钮 |
| 系统 | `SYSTEM` | 系统通知 | 居中灰色标签 |

### 消息Metadata结构

```typescript
// TEXT 消息
{
    content: "Hello! 👋"
}

// IMAGE 消息
{
    content: "https://storage.supabase.co/...",
    messageType: "IMAGE",
    metadata: {
        imageUrl: "https://storage.supabase.co/..."
    }
}

// LOCATION 消息
{
    content: "📍 123 Main St, Ottawa, ON",
    messageType: "LOCATION",
    metadata: {
        lat: 45.4215,
        lng: -75.6972,
        address: "123 Main St, Ottawa, ON"
    }
}
```

---

## 🎨 UI/UX 设计

### 视觉效果

#### 表情选择器
- 圆角弹窗设计
- 分类标签切换
- 8列网格布局
- 悬停高亮效果

#### 图片上传
- 卡片式预览
- 进度条动画
- 上传中禁用操作
- 缩略图圆角

#### 位置分享
- 迷你地图预览
- 毛玻璃背景
- 坐标等宽字体
- 蓝色链接样式

### 响应式适配

```css
/* 移动端 */
- 触摸友好按钮尺寸
- 全宽预览卡片
- 简化操作流程

/* 桌面端 */
- 鼠标悬停效果
- 更大预览区域
- 快捷键支持
```

---

## 🔧 技术栈

| 功能 | 技术 |
|------|------|
| 表情选择器 | React + Popover组件 |
| 图片压缩 | Canvas API |
| 图片存储 | Supabase Storage |
| 位置获取 | Geolocation API |
| 地理编码 | Nominatim API |
| 静态地图 | OpenStreetMap |
| 消息发送 | Zustand Store |

---

## 📊 性能优化

### 图片优化
- ✅ 上传前压缩（减少90%体积）
- ✅ 懒加载（loading="lazy"）
- ✅ WebP格式支持
- ✅ 缩略图缓存

### 位置优化
- ✅ 静态地图CDN
- ✅ 反向地理编码缓存
- ✅ 地图图片懒加载
- ✅ 错误处理和重试

### 渲染优化
- ✅ 虚拟列表（未来实现）
- ✅ 图片懒加载
- ✅ 消息分页
- ✅ DOM复用

---

## 🐛 常见问题

### Q1: 无法上传图片？
**A:** 检查以下几点：
1. 图片格式是否支持（jpg/png/gif/webp）
2. 文件大小是否超过5MB
3. 网络连接是否正常
4. Supabase Storage是否配置正确

### Q2: 位置定位失败？
**A:** 可能的原因：
1. 浏览器未授予位置权限
2. HTTPS连接问题（HTTP无法使用定位）
3. GPS信号弱
4. 浏览器不支持Geolocation API

解决方法：
- 检查浏览器地址栏的位置权限图标
- 确保网站使用HTTPS
- 移动到信号更好的位置
- 尝试刷新页面重新授权

### Q3: 图片加载很慢？
**A:** 优化建议：
1. 启用图片压缩（默认已启用）
2. 使用稳定网络
3. 清除浏览器缓存
4. 升级网络带宽

### Q4: 表情显示为方块？
**A:** 这是操作系统或字体不支持该emoji。尝试：
1. 更新操作系统
2. 安装最新字体包
3. 使用其他表情

---

## 🚀 未来规划

### 即将支持

- [ ] **语音消息** - 录音并发送语音
- [ ] **视频消息** - 短视频分享
- [ ] **文件传输** - PDF/DOC等文档
- [ ] **表情包** - 自定义贴纸
- [ ] **GIF动图** - GIF搜索和发送
- [ ] **消息引用** - 回复特定消息
- [ ] **消息转发** - 转发到其他对话
- [ ] **消息撤回** - 2分钟内撤回

### 性能提升

- [ ] 图片CDN加速
- [ ] WebP自动转换
- [ ] 消息虚拟滚动
- [ ] 离线消息队列

---

## 📝 更新日志

### v1.0.0 (2026-01-30)
- ✅ 表情选择器（200+表情，6个分类）
- ✅ 图片上传（自动压缩，进度显示）
- ✅ 位置分享（实时定位，地图预览）
- ✅ 消息类型扩展（IMAGE, LOCATION）
- ✅ 响应式UI优化

---

**最后更新**: 2026-01-30
**文档版本**: 1.0.0
