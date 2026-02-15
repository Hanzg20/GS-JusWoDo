# ⚡ 部署快速决策指南

## 🤔 我应该选择哪种部署方式？

```
选择 Cloudflare Pages（推荐 ✅）
    ↓
如果你的项目是：
✅ 纯前端应用（React、Vue 等）
✅ 静态网站
✅ PWA 应用
✅ 不需要服务端逻辑
✅ 希望简单部署（零配置）

选择 Cloudflare Workers
    ↓
如果你需要：
⚡ 服务端渲染 (SSR)
⚡ 动态 API 路由
⚡ 请求拦截和转换
⚡ A/B 测试
⚡ 边缘计算能力
```

---

## 🚀 方案 1: Cloudflare Pages（推荐）

### ✅ 为什么选择 Pages？

本项目是 **React SPA + PWA**，完全符合 Pages 的使用场景：
- ✅ 零配置，推送即部署
- ✅ 免费无限带宽
- ✅ 自动 CI/CD
- ✅ Git 集成
- ✅ 预览部署（PR 自动预览）

### 🎯 部署步骤（5分钟）

#### 1. 准备代码
```bash
# 确保代码已提交
git add .
git commit -m "feat: add PWA support"
git push origin main
```

#### 2. 创建 Pages 项目

**Web 版本 (justwedo.com)**:
1. Cloudflare Dashboard → Pages → Create project
2. 连接 GitHub 仓库
3. 配置：
   - 构建命令: `npm run build:web`
   - 输出目录: `dist`
   - 环境变量: `VITE_ENABLE_PWA=false`

**PWA 版本 (app.justwedo.com)**:
1. 再创建一个项目
2. 同样连接 GitHub 仓库
3. 配置：
   - 构建命令: `npm run build:pwa`
   - 输出目录: `dist-pwa`
   - 环境变量: `VITE_ENABLE_PWA=true`

#### 3. 配置域名
- Web 项目: 添加 `justwedo.com`
- PWA 项目: 添加 `app.justwedo.com`

#### 4. 完成！
每次推送 `main` 分支，两个项目会自动构建和部署。

### 📖 详细文档
👉 [DEPLOY_TO_CLOUDFLARE.md](DEPLOY_TO_CLOUDFLARE.md)

---

## ⚡ 方案 2: Cloudflare Workers（高级）

### ⚠️ 注意
Workers 适用于需要服务端逻辑的场景。对于本项目（静态 SPA + PWA），**不推荐使用**。

### 如果仍要使用 Workers

#### 1. 安装依赖
```bash
# Wrangler CLI
npm install -g wrangler

# Worker 依赖
npm install @cloudflare/kv-asset-handler --save-dev
```

#### 2. 登录 Cloudflare
```bash
wrangler login
```

#### 3. 部署
```bash
npm run deploy:workers
```

### 📖 详细文档
👉 [DEPLOY_WORKERS.md](DEPLOY_WORKERS.md)

---

## 📊 对比表格

| 特性 | Cloudflare Pages | Cloudflare Workers |
|------|------------------|-------------------|
| **部署复杂度** | ⭐ 简单 | ⭐⭐⭐ 中等 |
| **配置文件** | 不需要 | 需要 wrangler.toml |
| **部署方式** | Git 推送自动 | CLI 手动 |
| **免费额度** | 无限请求 | 100,000 请求/天 |
| **带宽** | 无限 | 根据请求计费 |
| **预览部署** | 自动（PR） | 需手动配置 |
| **本项目推荐** | ✅ 是 | ❌ 否 |

---

## 💰 成本对比

### Cloudflare Pages (免费)
```
✅ 无限请求
✅ 无限带宽
✅ 500 次构建/月
✅ 无限网站数量
```

### Cloudflare Workers
```
免费版:
- 100,000 请求/天
- 超出后: $5/月（10M 请求）

本项目估算（假设日均 10,000 访问）:
- 页面加载: ~5 个请求/访问
- 总请求: 50,000/天
- 成本: 免费 ✅

但 Pages 更简单且无需担心超限！
```

---

## 🎯 推荐方案

### 对于本项目: **使用 Cloudflare Pages**

**理由**:
1. ✅ 这是纯前端 React SPA + PWA
2. ✅ 不需要服务端逻辑
3. ✅ Pages 完全满足需求
4. ✅ 零配置，更简单
5. ✅ 完全免费，无限制
6. ✅ 自动 CI/CD

---

## 🚀 立即开始

### 选择 A: Cloudflare Pages（推荐 ⭐）

```bash
# 1. 提交代码
git add .
git commit -m "feat: ready for deployment"
git push origin main

# 2. 访问 Cloudflare Dashboard
https://dash.cloudflare.com/

# 3. 按照上面的 "方案 1" 步骤操作
```

### 选择 B: Cloudflare Workers

```bash
# 1. 安装 Wrangler
npm install -g wrangler

# 2. 安装依赖
npm install @cloudflare/kv-asset-handler --save-dev

# 3. 登录
wrangler login

# 4. 部署
npm run deploy:workers
```

---

## 📁 当前项目文件

已准备好的配置文件：

**Cloudflare Pages**:
- ✅ [public/_headers](public/_headers) - HTTP 头部配置
- ✅ [.env.web](.env.web) - Web 版本环境变量
- ✅ [.env.pwa](.env.pwa) - PWA 版本环境变量

**Cloudflare Workers**:
- ✅ [wrangler.toml](wrangler.toml) - Workers 配置
- ✅ [src/worker.js](src/worker.js) - Worker 脚本

**构建脚本**:
```json
{
  "scripts": {
    "build:web": "vite build --mode web",
    "build:pwa": "vite build --mode pwa",
    "deploy:workers": "npm run build:pwa && wrangler deploy"
  }
}
```

---

## ✅ 检查清单

部署前确认：

- [ ] 代码已提交到 GitHub
- [ ] TypeScript 编译通过（`npx tsc --noEmit`）
- [ ] 本地构建成功（`npm run build:pwa`）
- [ ] 本地预览正常（`npm run preview:pwa`）
- [ ] Service Worker 注册正常
- [ ] PWA 图标资源存在（`public/pwa-icons/`）

---

## 🆘 需要帮助？

- **Pages 部署**: [DEPLOY_TO_CLOUDFLARE.md](DEPLOY_TO_CLOUDFLARE.md)
- **Workers 部署**: [DEPLOY_WORKERS.md](DEPLOY_WORKERS.md)
- **详细配置**: [DEPLOYMENT_CONFIG.md](DEPLOYMENT_CONFIG.md)
- **PWA 测试**: [docs/PWA_TESTING_GUIDE.md](docs/PWA_TESTING_GUIDE.md)

---

## 💡 我的建议

**直接使用 Cloudflare Pages！**

这是最适合你项目的方案：
- 🎯 零学习成本
- ⚡ 5分钟完成部署
- 💰 完全免费
- 🔄 自动化 CI/CD
- 🚀 性能优秀

如果未来需要边缘计算，可以轻松迁移到 Workers。但现在，Pages 就够了！

---

**立即开始**: 选择方案 1（Cloudflare Pages），5分钟搞定！🚀
