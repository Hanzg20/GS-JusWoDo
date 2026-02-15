# 🚀 App 版本部署到 Cloudflare Pages

## 📋 部署架构

```
┌─────────────────────────────────────┐
│  GitHub 仓库 (gig-neighbor)         │
│  同一代码库                          │
└─────────────┬───────────────────────┘
              │
      ┌───────┴────────┐
      │                │
      ▼                ▼
┌──────────┐    ┌──────────────┐
│ Workers  │    │ Pages (新建) │
├──────────┤    ├──────────────┤
│ Web 版本 │    │ App 版本     │
│ 已部署   │    │ PWA 版本     │
└──────────┘    └──────────────┘
      │                │
      ▼                ▼
justwedo.com    app.justwedo.com
```

---

## ✅ 为什么这样部署？

### Web 版本（继续用 Workers）
- ✅ 已有配置，不需要改动
- ✅ 可能有自定义逻辑
- ✅ 保持现有部署流程

### App 版本（新部署到 Pages）
- ✅ PWA 是纯静态资源，适合 Pages
- ✅ 免费无限带宽和请求
- ✅ 自动 CI/CD，推送即部署
- ✅ 不影响 Web 版本

---

## 🚀 部署步骤

### 第 1 步: 确保代码已推送到 GitHub

```bash
# 提交所有 PWA 相关更改
git add .
git commit -m "feat: add PWA support for app.justwedo.com"
git push origin main
```

---

### 第 2 步: 创建 Cloudflare Pages 项目

1. **登录 Cloudflare Dashboard**
   - 访问: https://dash.cloudflare.com/

2. **进入 Pages**
   - 左侧菜单 → **Workers & Pages**
   - 点击 **Create application**
   - 选择 **Pages** 标签
   - 点击 **Connect to Git**

3. **连接 GitHub 仓库**
   - 选择你的 GitHub 账号
   - 找到并选择 `gig-neighbor` 仓库（和 Web 版本同一个）
   - 点击 **Begin setup**

---

### 第 3 步: 配置构建设置

**项目名称**:
```
justwedo-app
```
（或者任何你喜欢的名称，不影响域名）

**生产分支**:
```
main
```

**框架预设**:
```
None (留空或选择 "None")
```

**构建配置**:

| 设置项 | 值 |
|--------|-----|
| 构建命令 | `npm run build:pwa` |
| 构建输出目录 | `dist-pwa` |
| 根目录 | `/` (默认) |

**环境变量** (点击 "Add variable" 添加每一个):

```env
# 必需的环境变量
VITE_SUPABASE_URL=https://fvjgmydkxklqclcyhuvl.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_Bw8nRiGMo0oGJ52pvsNJSw_JAQJI6Ih

# PWA 控制（重要！）
VITE_ENABLE_PWA=true
VITE_APP_MODE=pwa

# 功能开关
VITE_USE_MOCK_DATA=false
VITE_ENABLE_AI_SEARCH=false

# 节点配置
VITE_DEFAULT_NODE=NODE_LEES
VITE_AVAILABLE_NODES=NODE_LEES,NODE_KANATA

# 调试选项（生产环境建议关闭）
VITE_DEBUG_MODE=false
VITE_SHOW_DEV_TOOLS=false
```

**点击 "Save and Deploy"**

---

### 第 4 步: 等待首次构建

Cloudflare Pages 会自动：
1. ✅ 克隆你的 GitHub 仓库
2. ✅ 安装依赖（npm install）
3. ✅ 运行构建命令（npm run build:pwa）
4. ✅ 部署到全球 CDN

**预计时间**: 2-5 分钟

**查看构建日志**:
- 构建页面会实时显示日志
- 成功后会显示预览 URL（类似 `justwedo-app.pages.dev`）

---

### 第 5 步: 配置自定义域名

**添加 app.justwedo.com**:

1. 进入你的 Pages 项目
2. 点击 **Custom domains** 标签
3. 点击 **Set up a custom domain**
4. 输入: `app.justwedo.com`
5. 点击 **Continue**

**DNS 配置**:

如果你的域名在 Cloudflare：
- ✅ Cloudflare 会自动添加 DNS 记录
- ✅ 自动启用 HTTPS

如果域名不在 Cloudflare：
- 需要手动添加 CNAME 记录
- 指向: `justwedo-app.pages.dev`（你的 Pages URL）

**等待 SSL 证书**:
- 通常在 1-5 分钟内完成
- 完成后 `app.justwedo.com` 即可访问

---

## ✅ 验证部署

### 1. 访问应用

```bash
# 临时 URL（立即可用）
https://justwedo-app.pages.dev

# 自定义域名（配置后）
https://app.justwedo.com
```

### 2. 检查 PWA 功能

**Chrome DevTools** (F12):

1. **Application** → **Manifest**
   - ✅ 显示应用名称："渥帮 JUSTWEDO"
   - ✅ 显示图标（10 个不同尺寸）
   - ✅ Theme Color: #8B5CF6

2. **Application** → **Service Workers**
   - ✅ 状态: "activated and is running"
   - ✅ Source: `/sw.js`

3. **Console** 日志
   ```
   ✅ "✨ PWA plugin activated"
   ✅ "✅ Service Worker registered"
   ✅ "📴 App ready to work offline"
   ```

4. **地址栏**
   - ✅ 显示"安装"图标 (⊕)

5. **安装提示**
   - ✅ 3秒后显示"安装渥帮 APP"提示

### 3. 测试离线功能

1. 打开 `app.justwedo.com`
2. 浏览几个页面
3. DevTools → Network → 勾选 **Offline**
4. 刷新页面
5. ✅ 应该仍然可以访问（从缓存加载）

---

## 🔄 自动部署流程

配置完成后，**每次推送代码**：

```bash
git add .
git commit -m "update: improve PWA features"
git push origin main
```

Cloudflare Pages 会自动：
1. ✅ 检测到代码更新
2. ✅ 运行 `npm run build:pwa`
3. ✅ 部署到 `app.justwedo.com`
4. ✅ 发送邮件通知部署结果

**Web 版本（Workers）不受影响！**

---

## 📊 监控和管理

### Cloudflare Pages Dashboard

**查看部署**:
- 每次部署的历史记录
- 构建日志
- 部署状态
- 访问统计

**预览部署**:
- 创建 PR → 自动创建预览环境
- URL: `<pr-number>.<project-name>.pages.dev`
- 合并 PR → 自动部署到生产

**回滚**:
- 点击之前的部署
- 点击 "Rollback to this deployment"
- 立即回滚到之前的版本

---

## 🆚 两个版本对比

| 项目 | Web 版本 | App 版本 |
|------|----------|----------|
| **域名** | justwedo.com | app.justwedo.com |
| **部署平台** | Cloudflare Workers | Cloudflare Pages |
| **构建命令** | (Workers 配置) | `npm run build:pwa` |
| **输出目录** | (Workers 配置) | `dist-pwa` |
| **PWA 功能** | ❌ 禁用 | ✅ 启用 |
| **Service Worker** | ❌ 无 | ✅ 有 |
| **可安装** | ❌ 否 | ✅ 是 |
| **离线访问** | ❌ 否 | ✅ 是 |
| **部署方式** | Wrangler CLI | Git 推送自动 |
| **环境变量** | `VITE_ENABLE_PWA=false` | `VITE_ENABLE_PWA=true` |

---

## 🎯 关键配置检查

### 确保这些文件已提交到 GitHub

```bash
# PWA 必需文件
✅ public/_headers              # HTTP 头部配置
✅ public/pwa-icons/*.png       # 所有 PWA 图标
✅ index.html                   # PWA meta 标签
✅ vite.config.ts               # PWA 插件配置
✅ src/main.tsx                 # Service Worker 注册
✅ src/components/PWAInstallPrompt.tsx  # 安装提示

# 环境变量模板
✅ .env.example                 # 供参考
✅ .env.pwa                     # PWA 配置模板
```

检查命令：
```bash
git status
git log --oneline -5
```

---

## 🚨 常见问题

### Q: 构建失败 - "Command not found: npm"

**A**: 添加环境变量
```
NODE_VERSION=18
```

### Q: Service Worker 404

**A**: 检查构建日志，确认：
- 构建命令: `npm run build:pwa` ✅
- 输出目录: `dist-pwa` ✅
- `VITE_ENABLE_PWA=true` ✅

### Q: 安装提示不显示

**A**: 检查：
1. 使用 HTTPS（`https://app.justwedo.com`）
2. 使用桌面 Chrome/Edge
3. 清除浏览器缓存
4. 检查 Console 是否有错误

### Q: Web 版本会受影响吗？

**A**: 不会！
- Web 版本继续用 Workers 部署
- App 版本是独立的 Pages 项目
- 两者使用同一代码库，但构建配置不同

---

## 📱 用户体验

### 访问 Web 版本（justwedo.com）
```
✅ 正常网站访问
❌ 无安装提示
❌ 无 PWA 功能
```

### 访问 App 版本（app.justwedo.com）
```
✅ 3秒后显示"安装 APP"提示
✅ 可以安装到桌面/主屏幕
✅ 支持离线访问
✅ 独立窗口启动（无浏览器 UI）
✅ 自动更新检测
```

---

## 🔗 导流策略（可选）

### 在 Web 版本添加引导

可以在 `justwedo.com` 添加横幅：

```tsx
// 检测 PWA 支持
if ('serviceWorker' in navigator) {
  // 显示提示
  "📱 体验更佳的 APP 版本 → app.justwedo.com"
}
```

或者添加下载按钮：
```tsx
<Button onClick={() => window.location.href = 'https://app.justwedo.com'}>
  下载 APP 版本
</Button>
```

---

## ✅ 部署前检查清单

- [ ] 代码已提交到 GitHub（`git push origin main`）
- [ ] TypeScript 编译通过（`npx tsc --noEmit`）
- [ ] 本地构建成功（`npm run build:pwa`）
- [ ] PWA 图标存在（`public/pwa-icons/` 有 24 个文件）
- [ ] `public/_headers` 文件已提交
- [ ] Service Worker 注册代码在 `src/main.tsx`

---

## 🎊 完成！

部署完成后，你将拥有：

- ✅ **justwedo.com** - Web 版本（Workers，已有）
- ✅ **app.justwedo.com** - PWA 版本（Pages，新建）
- ✅ 同一代码库，自动部署
- ✅ 两个版本完全独立
- ✅ 零维护成本（自动 CI/CD）

---

## 📞 需要帮助？

遇到问题时：

1. **查看构建日志**
   - Pages 项目 → Deployments → 点击最新部署
   - 查看详细日志输出

2. **检查环境变量**
   - Settings → Environment variables
   - 确认 `VITE_ENABLE_PWA=true`

3. **测试本地构建**
   ```bash
   npm run build:pwa
   npm run preview:pwa
   ```

---

**立即开始**: 按照上面的步骤，5分钟完成 App 版本部署！🚀
