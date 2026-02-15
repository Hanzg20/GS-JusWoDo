# ⚡ Cloudflare Pages 快速部署指南

## 🎯 目标部署

```
justwedo.com          → Web 版本（无 PWA）
app.justwedo.com      → PWA 版本（可安装）
```

---

## 📋 部署步骤

### 第 1 步: 准备 Git 仓库

```bash
# 1. 确保代码已提交到 GitHub
git add .
git commit -m "feat: add PWA support with dual-mode deployment"
git push origin main
```

---

### 第 2 步: Cloudflare Pages - Web 版本

**登录 Cloudflare Dashboard**:
1. 进入 **Pages** → **Create a project**
2. 连接 GitHub 仓库
3. 选择 `gig-neighbor` 仓库

**项目配置**:
```yaml
项目名称: justwedo-web
生产分支: main
框架预设: None (手动配置)

构建设置:
  构建命令: npm run build:web
  构建输出目录: dist
  根目录: /
```

**环境变量** (点击 "Add variable"):
```
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

**点击 "Save and Deploy"**

---

### 第 3 步: Cloudflare Pages - PWA 版本

**重复创建项目**:
1. **Pages** → **Create a project**
2. 连接同一个 GitHub 仓库

**项目配置**:
```yaml
项目名称: justwedo-pwa
生产分支: main
框架预设: None (手动配置)

构建设置:
  构建命令: npm run build:pwa
  构建输出目录: dist-pwa
  根目录: /
```

**环境变量**:
```
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

**点击 "Save and Deploy"**

---

### 第 4 步: 配置自定义域名

#### Web 版本 (justwedo.com)

1. 进入 **justwedo-web** 项目
2. **Custom domains** → **Set up a custom domain**
3. 输入: `justwedo.com`
4. 按照提示配置 DNS（Cloudflare 会自动配置）

#### PWA 版本 (app.justwedo.com)

1. 进入 **justwedo-pwa** 项目
2. **Custom domains** → **Set up a custom domain**
3. 输入: `app.justwedo.com`
4. 按照提示配置 DNS

---

### 第 5 步: 配置 PWA 头部 (重要!)

在 **justwedo-pwa** 项目中：

1. 进入 **Settings** → **Functions**
2. 创建 `_headers` 文件（通过添加到代码库）

在项目根目录创建 `public/_headers`:

```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin

/sw.js
  Cache-Control: public, max-age=0, must-revalidate
  Service-Worker-Allowed: /

/manifest.webmanifest
  Content-Type: application/manifest+json
  Cache-Control: public, max-age=0, must-revalidate

/assets/*
  Cache-Control: public, max-age=31536000, immutable
```

提交并推送：
```bash
git add public/_headers
git commit -m "feat: add Cloudflare Pages headers for PWA"
git push origin main
```

---

## ✅ 验证部署

### Web 版本验证 (justwedo.com)

```bash
# 访问
https://justwedo.com

# Chrome DevTools → Application
✅ Manifest: 空
✅ Service Workers: 空
✅ 无"安装"提示
```

### PWA 版本验证 (app.justwedo.com)

```bash
# 访问
https://app.justwedo.com

# Chrome DevTools → Application
✅ Manifest: 完整配置
✅ Service Workers: 已激活
✅ 显示"安装"提示
✅ 地址栏有"安装"图标
```

---

## 🔄 自动部署流程

配置完成后，每次推送到 `main` 分支：

```bash
git push origin main
```

Cloudflare Pages 会自动：
1. ✅ 构建 Web 版本 → 部署到 justwedo.com
2. ✅ 构建 PWA 版本 → 部署到 app.justwedo.com

---

## 📱 测试 PWA 安装

### 桌面 (Chrome/Edge)

1. 访问 https://app.justwedo.com
2. 地址栏点击"安装"图标
3. 或等待3秒后的提示
4. 点击"安装"
5. ✅ 应用添加到桌面

### 移动端 (Android)

1. 访问 https://app.justwedo.com
2. Chrome 菜单 → "安装应用"
3. ✅ 图标添加到主屏幕

### 移动端 (iOS)

1. 访问 https://app.justwedo.com
2. Safari 分享按钮 → "添加到主屏幕"
3. ✅ 图标添加到主屏幕

---

## 🚨 常见问题

### Q: 构建失败 "Command not found: npm"

**A**: 在 Cloudflare Pages 设置中添加环境变量:
```
NODE_VERSION=18
```

### Q: Service Worker 404

**A**: 检查构建输出目录:
- Web: `dist` (无 sw.js)
- PWA: `dist-pwa` (有 sw.js)

### Q: Manifest 无法加载

**A**: 确保 `public/_headers` 文件已提交并部署

### Q: 两个项目都触发构建

**A**: 正常！两个项目监听同一个仓库，会同时构建

---

## 📊 监控部署状态

### Cloudflare Pages Dashboard

每次部署查看：
- ✅ 构建日志
- ✅ 部署时间
- ✅ 部署 URL
- ✅ 环境变量

### 构建成功标志

**Web 版本**:
```
🔧 Build mode: web
📱 PWA enabled: false
🌐 Web mode (PWA disabled)
✓ Built in XXs
```

**PWA 版本**:
```
🔧 Build mode: pwa
📱 PWA enabled: true
✨ PWA plugin activated
✓ Built in XXs
```

---

## 🎊 完成！

你现在拥有：

- ✅ **justwedo.com** - 传统 Web 应用
- ✅ **app.justwedo.com** - 可安装的 PWA
- ✅ 自动 CI/CD 部署
- ✅ 全球 CDN 加速
- ✅ 免费 SSL 证书
- ✅ 无限带宽

**开始使用**: 访问 https://app.justwedo.com 并安装应用！🚀

---

## 📞 需要帮助？

查看详细配置: [DEPLOYMENT_CONFIG.md](DEPLOYMENT_CONFIG.md)
