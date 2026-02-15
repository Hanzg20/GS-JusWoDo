# ⚡ Cloudflare Workers 部署指南

## 🤔 Workers vs Pages - 选择建议

### Cloudflare Pages（推荐 ✅）
```
优点:
✅ 零配置，自动部署
✅ 免费无限带宽
✅ Git 集成（推送自动部署）
✅ 预览部署（PR 自动创建预览）
✅ 完美支持 SPA 和 PWA
✅ 内置 CDN

适用场景:
- 静态网站
- SPA (React, Vue)
- PWA 应用
- 无需服务端逻辑
```

### Cloudflare Workers
```
优点:
✅ 边缘计算能力
✅ 自定义服务端逻辑
✅ API 路由处理
✅ 请求拦截和修改
✅ A/B 测试
✅ 地理位置路由

适用场景:
- 需要服务端渲染 (SSR)
- 动态 API 路由
- 请求转换/代理
- 边缘计算
```

### 本项目推荐
**使用 Cloudflare Pages** - 因为这是纯前端 React SPA + PWA

---

## 🚀 方案 A: Cloudflare Pages 部署（推荐）

详见：[DEPLOY_TO_CLOUDFLARE.md](DEPLOY_TO_CLOUDFLARE.md)

**快速步骤**:
```bash
1. 推送代码到 GitHub
2. Cloudflare Dashboard → Pages → 连接 Git
3. 配置构建命令: npm run build:pwa
4. 配置输出目录: dist-pwa
5. 添加环境变量: VITE_ENABLE_PWA=true
6. 完成！
```

---

## 🔧 方案 B: Cloudflare Workers 部署（高级）

### 前置要求

```bash
# 安装 Wrangler CLI
npm install -g wrangler

# 登录 Cloudflare
wrangler login
```

### 步骤 1: 安装依赖

```bash
npm install -D wrangler
```

### 步骤 2: 创建 Workers 配置

创建 `wrangler.toml`:

```toml
name = "justwedo-pwa"
main = "src/worker.js"
compatibility_date = "2024-01-01"

# Workers Sites 配置
[site]
bucket = "./dist-pwa"

# 环境变量
[vars]
ENVIRONMENT = "production"

# 路由配置
[[routes]]
pattern = "app.justwedo.com/*"
zone_name = "justwedo.com"
```

### 步骤 3: 创建 Worker 脚本

创建 `src/worker.js`:

```javascript
import { getAssetFromKV } from '@cloudflare/kv-asset-handler';

// Service Worker 和 Manifest 不应被缓存
const NO_CACHE_PATHS = ['/sw.js', '/manifest.webmanifest', '/workbox-*.js'];

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event));
});

async function handleRequest(event) {
  const url = new URL(event.request.url);

  try {
    // 获取静态资源
    const response = await getAssetFromKV(event, {
      cacheControl: getCacheControl(url.pathname),
    });

    // 添加 PWA 必需的头部
    const headers = new Headers(response.headers);

    // Service Worker 头部
    if (NO_CACHE_PATHS.some(path => url.pathname.includes(path))) {
      headers.set('Cache-Control', 'public, max-age=0, must-revalidate');
    }

    if (url.pathname === '/sw.js') {
      headers.set('Service-Worker-Allowed', '/');
    }

    if (url.pathname === '/manifest.webmanifest') {
      headers.set('Content-Type', 'application/manifest+json');
    }

    // 安全头部
    headers.set('X-Frame-Options', 'DENY');
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    return new Response(response.body, {
      status: response.status,
      headers,
    });

  } catch (e) {
    // SPA 回退：所有未找到的路由返回 index.html
    if (e.status === 404) {
      const fallbackResponse = await getAssetFromKV(event, {
        mapRequestToAsset: req => new Request(`${new URL(req.url).origin}/index.html`, req),
      });

      return new Response(fallbackResponse.body, {
        status: 200,
        headers: fallbackResponse.headers,
      });
    }

    return new Response(e.message || e.toString(), { status: 500 });
  }
}

function getCacheControl(pathname) {
  // 静态资源长期缓存
  if (pathname.startsWith('/assets/')) {
    return {
      browserTTL: 31536000, // 1 year
      edgeTTL: 31536000,
      bypassCache: false,
    };
  }

  // Service Worker 和 Manifest 不缓存
  if (NO_CACHE_PATHS.some(path => pathname.includes(path))) {
    return {
      browserTTL: 0,
      edgeTTL: 0,
      bypassCache: true,
    };
  }

  // 默认缓存策略
  return {
    browserTTL: 0,
    edgeTTL: 86400, // 1 day
    bypassCache: false,
  };
}
```

### 步骤 4: 安装 Workers 依赖

```bash
npm install @cloudflare/kv-asset-handler
```

### 步骤 5: 更新 package.json

添加部署脚本：

```json
{
  "scripts": {
    "build:pwa": "vite build --mode pwa",
    "deploy:workers": "npm run build:pwa && wrangler publish"
  }
}
```

### 步骤 6: 部署

```bash
# 构建 + 部署
npm run deploy:workers

# 或分步执行
npm run build:pwa
wrangler publish
```

---

## 🌐 配置自定义域名

### 在 Cloudflare Dashboard

1. **Workers & Pages** → 选择你的 Worker
2. **Settings** → **Triggers** → **Custom Domains**
3. 添加域名: `app.justwedo.com`
4. Cloudflare 自动配置 DNS

---

## 📋 环境变量配置

### 通过 wrangler.toml

```toml
[vars]
VITE_ENABLE_PWA = "true"
VITE_APP_MODE = "pwa"
```

### 通过 Wrangler CLI

```bash
wrangler secret put VITE_SUPABASE_ANON_KEY
# 粘贴 key 并回车

wrangler secret put VITE_SUPABASE_URL
# 粘贴 URL 并回车
```

---

## 🔍 本地测试

```bash
# 1. 构建
npm run build:pwa

# 2. 本地运行 Worker
wrangler dev

# 3. 访问 http://localhost:8787
```

---

## 🚨 Workers 注意事项

### 限制
- 免费版: 100,000 请求/天
- 付费版: $5/月 起（10M 请求）
- CPU 时间限制: 10ms (免费), 50ms (付费)

### 文件大小
- Worker 脚本: < 1MB (压缩后)
- 总资产大小: < 25MB (Workers Sites)

### 冷启动
- 首次请求可能较慢（~50-200ms）
- 后续请求会更快

---

## ✅ 验证部署

### 检查 Service Worker

```bash
curl -I https://app.justwedo.com/sw.js

# 应该看到:
# Cache-Control: public, max-age=0, must-revalidate
# Service-Worker-Allowed: /
```

### 检查 Manifest

```bash
curl -I https://app.justwedo.com/manifest.webmanifest

# 应该看到:
# Content-Type: application/manifest+json
```

---

## 📊 监控和日志

### 查看实时日志

```bash
wrangler tail
```

### Dashboard 分析

1. **Workers & Pages** → 选择 Worker
2. **Metrics** → 查看:
   - 请求数
   - 错误率
   - CPU 时间
   - 带宽使用

---

## 🆚 Pages vs Workers 对比

| 特性 | Cloudflare Pages | Cloudflare Workers |
|------|------------------|-------------------|
| **部署方式** | Git 推送自动部署 | CLI 手动发布 |
| **配置复杂度** | 简单（零配置） | 中等（需要配置文件） |
| **免费请求** | 无限 | 100,000/天 |
| **带宽** | 无限 | 根据请求计费 |
| **构建时间** | 自动 CI/CD | 本地构建 |
| **预览部署** | 自动（PR） | 需手动配置 |
| **边缘计算** | 有限 | 完整支持 |
| **自定义逻辑** | Functions (有限) | 完全自定义 |
| **适用场景** | 静态网站、SPA、PWA | SSR、API、边缘计算 |

---

## 💡 推荐选择

### 使用 Cloudflare Pages 如果你需要:
- ✅ 简单部署流程
- ✅ Git 集成
- ✅ 无限免费带宽
- ✅ 自动预览部署
- ✅ 纯前端应用

### 使用 Cloudflare Workers 如果你需要:
- ✅ 服务端渲染 (SSR)
- ✅ 动态路由逻辑
- ✅ API 代理/转换
- ✅ A/B 测试
- ✅ 地理位置路由

---

## 🎯 本项目建议

**使用 Cloudflare Pages！**

理由：
1. 这是纯前端 React SPA + PWA
2. 不需要服务端逻辑
3. Pages 提供更好的 DX（开发体验）
4. 免费且无限制
5. 自动 CI/CD

---

## 📚 相关文档

- **Pages 部署**: [DEPLOY_TO_CLOUDFLARE.md](DEPLOY_TO_CLOUDFLARE.md)
- **配置详情**: [DEPLOYMENT_CONFIG.md](DEPLOYMENT_CONFIG.md)
- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [Cloudflare Pages 文档](https://developers.cloudflare.com/pages/)

---

**建议**: 先尝试 Cloudflare Pages，如果后续有特殊需求再考虑迁移到 Workers！
