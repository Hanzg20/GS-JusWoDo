# 🔀 PWA 与 Web 分离部署策略

## 核心原则：同一代码库，不同构建配置

```
同一个 GitHub 项目
   ↓
   ├─ Web 版本（禁用 PWA 功能）
   └─ PWA 版本（启用 PWA 功能）
```

---

## 🎯 方案 1: 环境变量控制（最推荐）

### 第一步：创建环境文件

创建 `.env.web` - 纯 Web 版本：
```bash
# .env.web
VITE_SUPABASE_URL=https://fvjgmydkxklqclcyhuvl.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_Bw8nRiGMo0oGJ52pvsNJSw_JAQJI6Ih

# 禁用 PWA
VITE_ENABLE_PWA=false
VITE_APP_MODE=web
```

创建 `.env.pwa` - PWA 版本：
```bash
# .env.pwa
VITE_SUPABASE_URL=https://fvjgmydkxklqclcyhuvl.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_Bw8nRiGMo0oGJ52pvsNJSw_JAQJI6Ih

# 启用 PWA
VITE_ENABLE_PWA=true
VITE_APP_MODE=pwa
```

### 第二步：修改 package.json

```json
{
  "scripts": {
    "dev": "vite",
    "dev:pwa": "vite --mode pwa",

    "build": "vite build --mode web",
    "build:web": "vite build --mode web",
    "build:pwa": "vite build --mode pwa",

    "preview": "vite preview",
    "preview:pwa": "vite preview --mode pwa"
  }
}
```

### 第三步：修改 vite.config.ts

```typescript
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd(), '');
  const isPWAEnabled = env.VITE_ENABLE_PWA === 'true';

  console.log('Build mode:', mode);
  console.log('PWA enabled:', isPWAEnabled);

  const plugins = [
    react(),
    mode === "development" && componentTagger()
  ];

  // 只在 PWA 模式下添加 PWA 插件
  if (isPWAEnabled) {
    plugins.push(
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['logo.png', 'robots.txt'],
        manifest: {
          name: '渥帮 JUSTWEDO',
          short_name: '渥帮',
          description: '渥太华华人互助平台',
          theme_color: '#8B5CF6',
          background_color: '#ffffff',
          display: 'standalone',
          start_url: '/',
          icons: [{
            src: '/logo.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'supabase-cache',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24
                }
              }
            }
          ]
        }
      })
    );
  }

  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins: plugins.filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    // 不同模式使用不同的输出目录
    build: {
      outDir: isPWAEnabled ? 'dist-pwa' : 'dist',
    },
  };
});
```

### 第四步：条件渲染 PWA 组件

创建 `src/components/PWAInstallPrompt.tsx`：
```typescript
import { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';
import { Button } from './ui/button';

// 只在 PWA 模式下显示
const IS_PWA_ENABLED = import.meta.env.VITE_ENABLE_PWA === 'true';

export const PWAInstallPrompt = () => {
  // 如果不是 PWA 模式，直接返回 null
  if (!IS_PWA_ENABLED) return null;

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);

      const dismissed = localStorage.getItem('pwa-prompt-dismissed');
      if (!dismissed) {
        setTimeout(() => setShowPrompt(true), 3000);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-prompt-dismissed', Date.now().toString());
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96">
      <div className="bg-card border rounded-2xl shadow-2xl p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
            <Download className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm mb-1">安装渥帮 APP</h3>
            <p className="text-xs text-muted-foreground mb-3">
              添加到主屏幕，获得更好的体验
            </p>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleInstall} className="flex-1">
                安装
              </Button>
              <Button size="sm" variant="outline" onClick={handleDismiss}>
                稍后
              </Button>
            </div>
          </div>
          <button onClick={handleDismiss} className="text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
```

### 第五步：在 App.tsx 中使用

```typescript
import { PWAInstallPrompt } from './components/PWAInstallPrompt';

const App = () => {
  // ... 现有代码

  return (
    <>
      {/* 现有代码 */}

      {/* PWA 安装提示（只在 PWA 模式下显示） */}
      <PWAInstallPrompt />
    </>
  );
};
```

---

## 🚀 部署策略

### 场景 1: 不同域名部署

```
同一代码库 → 两次部署

1. Web 版本:  https://justwedo.ca
   构建命令: npm run build:web
   输出目录: dist

2. PWA 版本:  https://app.justwedo.ca
   构建命令: npm run build:pwa
   输出目录: dist-pwa
```

**Cloudflare Pages 配置**:

创建两个项目：

**项目 1: justwedo-web**
```yaml
Production branch: main
Build command: npm run build:web
Build output: dist
Environment variables:
  VITE_ENABLE_PWA: false
```

**项目 2: justwedo-pwa**
```yaml
Production branch: main
Build command: npm run build:pwa
Build output: dist-pwa
Environment variables:
  VITE_ENABLE_PWA: true
```

### 场景 2: 同域名，路径分离

```
https://justwedo.ca       → Web 版本
https://justwedo.ca/app   → PWA 版本
```

**不推荐**：管理复杂，容易混淆

### 场景 3: A/B 测试（推荐）

```
同一域名，根据用户选择切换

默认: Web 版本
用户点击"安装 APP" → 引导到 PWA 版本
```

---

## 📂 项目结构

```
gig-neighbor/
├── .env                    # 默认配置
├── .env.web               # Web 专用配置
├── .env.pwa               # PWA 专用配置
├── .gitignore             # 忽略 dist 和 dist-pwa
│
├── src/
│   ├── components/
│   │   └── PWAInstallPrompt.tsx  # 条件渲染
│   ├── App.tsx            # 统一入口
│   └── ...
│
├── public/
│   ├── logo.png           # 通用资源
│   └── ...
│
├── dist/                  # Web 构建输出（git ignore）
├── dist-pwa/              # PWA 构建输出（git ignore）
│
└── package.json
    └── scripts:
        - build:web        # 构建 Web 版本
        - build:pwa        # 构建 PWA 版本
```

---

## 🔒 .gitignore 配置

```bash
# .gitignore

# Build outputs
dist
dist-pwa
dist-*

# Environment files (keep .env.example)
.env
.env.local
.env.*.local

# 但保留配置模板
!.env.web
!.env.pwa
!.env.example
```

---

## 🔄 CI/CD 工作流

### GitHub Actions 配置

创建 `.github/workflows/deploy.yml`:

```yaml
name: Deploy Web and PWA

on:
  push:
    branches: [main]

jobs:
  deploy-web:
    name: Deploy Web Version
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Build Web
        run: npm run build:web
        env:
          VITE_ENABLE_PWA: false

      - name: Deploy to Cloudflare (Web)
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: pages deploy dist --project-name=justwedo-web

  deploy-pwa:
    name: Deploy PWA Version
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Build PWA
        run: npm run build:pwa
        env:
          VITE_ENABLE_PWA: true

      - name: Deploy to Cloudflare (PWA)
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: pages deploy dist-pwa --project-name=justwedo-pwa
```

---

## 🧪 本地测试

### 测试 Web 版本
```bash
npm run build:web
npm run preview
# 访问 http://localhost:4173
# 应该看不到 PWA 安装提示
```

### 测试 PWA 版本
```bash
npm run build:pwa
npm run preview:pwa
# 访问 http://localhost:4173
# 应该看到 PWA 安装提示
# Chrome DevTools → Application → Manifest 有配置
```

---

## 📊 方案对比

| 方案 | 优点 | 缺点 | 推荐度 |
|-----|------|------|--------|
| **环境变量控制** | 灵活、易维护 | 需要配置 | ⭐⭐⭐⭐⭐ |
| **分支管理** | 隔离清晰 | 同步麻烦 | ⭐⭐ |
| **独立项目** | 完全隔离 | 维护成本高 | ⭐ |

---

## ✅ 推荐工作流

### 日常开发
```bash
# 开发 Web 功能（默认）
npm run dev

# 开发 PWA 功能
npm run dev:pwa
```

### 部署
```bash
# 自动部署（推送到 main 分支）
git push origin main

# 手动部署
npm run build:web      # 构建 Web
npm run build:pwa      # 构建 PWA
```

### 测试
```bash
# 测试 Web
npm run build:web && npm run preview

# 测试 PWA
npm run build:pwa && npm run preview:pwa
```

---

## 🎯 最佳实践

### 1. 渐进式启用 PWA
```typescript
// 逐步启用 PWA 功能
const PWA_FEATURES = {
  installPrompt: import.meta.env.VITE_ENABLE_PWA === 'true',
  offlineCache: import.meta.env.VITE_ENABLE_PWA === 'true',
  pushNotifications: false, // 未来启用
};
```

### 2. 功能检测
```typescript
// 检测 PWA 支持
const isPWASupported = 'serviceWorker' in navigator;
const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

if (isPWASupported && !isStandalone) {
  // 显示安装提示
}
```

### 3. 用户偏好
```typescript
// 让用户选择
const userPreference = localStorage.getItem('app-mode');
if (userPreference === 'web') {
  // 不显示 PWA 功能
} else if (userPreference === 'pwa') {
  // 显示 PWA 功能
}
```

---

## 🔍 监控和分析

### 添加分析代码
```typescript
// src/utils/analytics.ts
export const trackPWAInstall = () => {
  if (import.meta.env.VITE_ENABLE_PWA !== 'true') return;

  window.addEventListener('appinstalled', () => {
    console.log('PWA installed');
    // 发送到分析平台
  });
};

export const trackAppMode = () => {
  const mode = import.meta.env.VITE_APP_MODE;
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

  console.log('App mode:', mode);
  console.log('Running as:', isStandalone ? 'PWA' : 'Web');
};
```

---

## 📝 总结

### ✅ 推荐方案
**环境变量控制 + 同一代码库**

**优势**:
- 一套代码，零维护成本
- 灵活切换 Web/PWA
- 部署简单
- 易于 A/B 测试

**实施步骤**:
1. 创建 `.env.web` 和 `.env.pwa`
2. 修改 `vite.config.ts` 条件加载 PWA 插件
3. 修改 `package.json` 添加构建脚本
4. 创建条件渲染的 PWA 组件
5. 配置 CI/CD 自动部署

**部署方式**:
- Web 版本: `justwedo.ca` (dist/)
- PWA 版本: `app.justwedo.ca` (dist-pwa/)

---

**立即开始**: 我可以帮你配置这套方案！需要我现在就修改配置文件吗？
