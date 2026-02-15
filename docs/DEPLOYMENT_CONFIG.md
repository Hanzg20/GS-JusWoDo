# 🚀 部署配置 - app.justwedo.com

## 📋 部署架构

```
justwedo.com          → dist/      (Web 版本，无 PWA)
app.justwedo.com      → dist-pwa/  (PWA 版本，可安装)
```

---

## ☁️ Cloudflare Pages 配置

### 项目 1: justwedo-web (主站)

**基本设置**:
```yaml
项目名称: justwedo-web
生产分支: main
域名: justwedo.com
```

**构建设置**:
```yaml
构建命令: npm run build:web
构建输出目录: dist
根目录: /
Node 版本: 18
```

**环境变量**:
```env
VITE_SUPABASE_URL=https://fvjgmydkxklqclcyhuvl.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_Bw8nRiGMo0oGJ52pvsNJSw_JAQJI6Ih
VITE_USE_MOCK_DATA=false
VITE_ENABLE_PWA=false
VITE_APP_MODE=web
VITE_DEFAULT_NODE=NODE_LEES
VITE_AVAILABLE_NODES=NODE_LEES,NODE_KANATA
VITE_DEBUG_MODE=false
VITE_SHOW_DEV_TOOLS=false
```

---

### 项目 2: justwedo-pwa (PWA 应用)

**基本设置**:
```yaml
项目名称: justwedo-pwa
生产分支: main
域名: app.justwedo.com
```

**构建设置**:
```yaml
构建命令: npm run build:pwa
构建输出目录: dist-pwa
根目录: /
Node 版本: 18
```

**环境变量**:
```env
VITE_SUPABASE_URL=https://fvjgmydkxklqclcyhuvl.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_Bw8nRiGMo0oGJ52pvsNJSw_JAQJI6Ih
VITE_USE_MOCK_DATA=false
VITE_ENABLE_PWA=true
VITE_APP_MODE=pwa
VITE_DEFAULT_NODE=NODE_LEES
VITE_AVAILABLE_NODES=NODE_LEES,NODE_KANATA
VITE_DEBUG_MODE=false
VITE_SHOW_DEV_TOOLS=false
```

**重要的 PWA 头部配置**:

在 Cloudflare Pages 设置中添加自定义头部：

```
/*
  Cache-Control: public, max-age=0, must-revalidate

/sw.js
  Cache-Control: public, max-age=0, must-revalidate
  Service-Worker-Allowed: /

/manifest.webmanifest
  Content-Type: application/manifest+json
  Cache-Control: public, max-age=0, must-revalidate

/assets/*
  Cache-Control: public, max-age=31536000, immutable
```

---

## 🔧 本地构建测试

### 测试 Web 版本 (justwedo.com)

```bash
# 使用 Web 环境变量构建
npm run build:web

# 预览（模拟 justwedo.com）
npm run preview

# 验证
# ✅ 访问 http://localhost:4173
# ✅ 检查：无 Service Worker
# ✅ 检查：无安装提示
# ✅ DevTools → Application → Manifest: 空
```

### 测试 PWA 版本 (app.justwedo.com)

```bash
# 使用 PWA 环境变量构建
npm run build:pwa

# 预览（模拟 app.justwedo.com）
npm run preview:pwa

# 验证
# ✅ 访问 http://localhost:4173
# ✅ 检查：Service Worker 已注册
# ✅ 检查：显示"安装 APP"提示
# ✅ DevTools → Application → Manifest: 完整配置
# ✅ 可以安装到桌面/主屏幕
```

---

## 📱 PWA 部署验证清单

部署到 `app.justwedo.com` 后，验证以下项：

### ✅ HTTPS 配置
- [ ] 域名使用 HTTPS（PWA 必需）
- [ ] SSL 证书有效
- [ ] 没有混合内容警告

### ✅ Service Worker
- [ ] `/sw.js` 可访问（返回 200）
- [ ] Service Worker 正确注册
- [ ] 控制台显示："✅ Service Worker registered"
- [ ] 正确的 `Service-Worker-Allowed` 头部

### ✅ Manifest
- [ ] `/manifest.webmanifest` 可访问（返回 200）
- [ ] Content-Type 为 `application/manifest+json`
- [ ] 包含正确的应用名称和图标
- [ ] Chrome DevTools 显示完整 manifest

### ✅ 图标资源
- [ ] 所有 PWA 图标可访问（`/pwa-icons/*.png`）
- [ ] favicon 正确显示
- [ ] Apple Touch 图标正确显示

### ✅ 安装功能
- [ ] Chrome 地址栏显示"安装"图标
- [ ] 3秒后显示"安装 APP"提示
- [ ] 点击安装后成功添加到桌面/主屏幕
- [ ] 安装后独立窗口打开

### ✅ 离线功能
- [ ] 首次访问后缓存静态资源
- [ ] 离线时可以加载应用
- [ ] Service Worker 缓存策略正常工作

### ✅ 更新机制
- [ ] 新版本发布后自动检测更新
- [ ] 每小时检查一次更新
- [ ] 更新提示正常显示

---

## 🧪 Lighthouse PWA 审计

在 `app.justwedo.com` 上运行 Lighthouse：

```bash
# Chrome DevTools → Lighthouse
# 选择 "Progressive Web App" 类别
# 点击 "Generate report"
```

**目标分数**:
- Progressive Web App: **90+** / 100
- Performance: **90+** / 100

**必须通过的审计项**:
- ✅ Installable
- ✅ PWA optimized
- ✅ Works offline
- ✅ Has a web app manifest
- ✅ Uses HTTPS
- ✅ Redirects HTTP to HTTPS
- ✅ Has a service worker
- ✅ Viewport meta tag configured
- ✅ Theme color meta tag set

---

## 🔄 CI/CD 自动部署

### GitHub Actions 示例 (可选)

创建 `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Cloudflare Pages

on:
  push:
    branches: [main]

jobs:
  deploy-web:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run build:web
      - name: Deploy to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: justwedo-web
          directory: dist

  deploy-pwa:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run build:pwa
      - name: Deploy to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: justwedo-pwa
          directory: dist-pwa
```

---

## 🌐 DNS 配置

在你的域名服务商（如 Cloudflare、Namecheap）配置：

```
类型    名称    值                          TTL
CNAME   @       justwedo-web.pages.dev     Auto
CNAME   app     justwedo-pwa.pages.dev     Auto
```

---

## 📊 用户导流策略

### 方案 A: 主站引导安装

在 `justwedo.com` 添加横幅：

```tsx
// 仅在桌面/移动浏览器显示
"体验更佳的 APP 版本 → app.justwedo.com"
```

### 方案 B: 智能重定向

检测 PWA 支持后自动建议：

```javascript
if ('serviceWorker' in navigator) {
  // 显示："立即安装 APP 版本获得离线访问"
  // 点击后跳转到 app.justwedo.com
}
```

---

## 🔍 监控和分析

### 推荐工具

1. **Google Analytics 4**
   - 跟踪 Web 和 PWA 用户行为
   - 监控安装率和离线访问

2. **Sentry**
   - Service Worker 错误监控
   - 离线场景下的异常追踪

3. **Cloudflare Analytics**
   - 带宽使用
   - 缓存命中率

---

## 🚨 故障排查

### 问题 1: Service Worker 404

**症状**: 控制台显示 "Failed to register service worker"

**解决**:
```bash
# 检查构建输出
ls dist-pwa/sw.js

# 确认 Cloudflare Pages 构建日志
# Build output directory: dist-pwa ✓
```

### 问题 2: Manifest 无法加载

**症状**: DevTools 显示 "No manifest detected"

**解决**:
- 确认 `/manifest.webmanifest` 返回 200
- 检查 Content-Type 头部
- 验证 JSON 格式正确

### 问题 3: 离线不工作

**症状**: 离线时页面无法加载

**解决**:
1. 检查 Service Worker 是否激活
2. 查看 Cache Storage 是否有缓存
3. 验证 Workbox 配置正确

---

## ✅ 部署前最后检查

运行以下命令确保一切就绪：

```bash
# 1. TypeScript 检查
npx tsc --noEmit

# 2. 构建 Web 版本
npm run build:web

# 3. 构建 PWA 版本
npm run build:pwa

# 4. 本地预览测试
npm run preview:pwa

# 5. 验证构建输出
ls dist/         # Web 版本（无 sw.js）
ls dist-pwa/     # PWA 版本（有 sw.js）
```

---

## 🎊 完成！

配置完成后，你将拥有：

- ✅ **justwedo.com** - 主站（Web 版本）
- ✅ **app.justwedo.com** - PWA 应用（可安装）
- ✅ 同一代码库，自动部署
- ✅ 独立的域名和构建输出

**下一步**: 推送代码到 GitHub，连接 Cloudflare Pages 开始部署！🚀

---

## 📚 相关文档

- [PWA_QUICKSTART.md](PWA_QUICKSTART.md) - 快速启动
- [docs/PWA_TESTING_GUIDE.md](docs/PWA_TESTING_GUIDE.md) - 测试指南
- [docs/PWA_SETUP_NOW.md](docs/PWA_SETUP_NOW.md) - 配置说明
