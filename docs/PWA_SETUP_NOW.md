# 🚀 立即配置 PWA（保持 Web 不受影响）

## ✅ 已完成的配置

我已经为你创建了以下文件：

```
✅ .env.web          - Web 版本配置（PWA 禁用）
✅ .env.pwa          - PWA 版本配置（PWA 启用）
✅ .env.example      - 配置模板
✅ package.json      - 新增构建脚本
```

---

## 🎯 核心概念

```
同一代码库
   ↓
   ├─ npm run build:web → dist/     (纯 Web，无 PWA)
   └─ npm run build:pwa → dist-pwa/ (完整 PWA 功能)
```

**关键**: 两个版本互不影响，通过环境变量控制！

---

## 📝 下一步操作（3步）

### 步骤 1: 安装 PWA 插件（1分钟）

```bash
cd "d:\My Project\ts\hangs\gig-neighbor"
npm install vite-plugin-pwa workbox-window -D
```

### 步骤 2: 修改 vite.config.ts（5分钟）

<details>
<summary>点击查看完整配置代码</summary>

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

  console.log('🔧 Build mode:', mode);
  console.log('📱 PWA enabled:', isPWAEnabled);

  const plugins = [
    react(),
    mode === "development" && componentTagger()
  ];

  // 只在 PWA 模式下添加 PWA 插件
  if (isPWAEnabled) {
    console.log('✨ PWA plugin activated');
    plugins.push(
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['logo.png', 'robots.txt'],
        manifest: {
          name: '渥帮 JUSTWEDO',
          short_name: '渥帮',
          description: '渥太华华人互助平台 - Get Things Done Together',
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
            },
            {
              urlPattern: /^https:\/\/api\.dicebear\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'avatar-cache',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24 * 7
                }
              }
            }
          ]
        }
      })
    );
  } else {
    console.log('🌐 Web mode (PWA disabled)');
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

</details>

### 步骤 3: 创建 PWA 安装提示组件（3分钟）

创建 `src/components/PWAInstallPrompt.tsx`:

<details>
<summary>点击查看完整组件代码</summary>

```typescript
import { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';
import { Button } from './ui/button';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// 只在 PWA 模式下显示
const IS_PWA_ENABLED = import.meta.env.VITE_ENABLE_PWA === 'true';

export const PWAInstallPrompt = () => {
  // 如果不是 PWA 模式，直接返回 null（不显示任何内容）
  if (!IS_PWA_ENABLED) {
    console.log('PWA Install Prompt: disabled (Web mode)');
    return null;
  }

  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      const dismissed = localStorage.getItem('pwa-prompt-dismissed');
      const dismissedTime = dismissed ? parseInt(dismissed) : 0;
      const now = Date.now();
      const threeDays = 3 * 24 * 60 * 60 * 1000;

      // 3天后再次提示
      if (!dismissed || now - dismissedTime > threeDays) {
        setTimeout(() => {
          console.log('Showing PWA install prompt');
          setShowPrompt(true);
        }, 3000);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    console.log('Install prompt outcome:', outcome);
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-prompt-dismissed', Date.now().toString());
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96 animate-in slide-in-from-bottom-5">
      <div className="bg-card border border-border rounded-2xl shadow-2xl p-4">
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
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
```

</details>

---

## 🧪 测试验证

### 测试 Web 版本（应该没有 PWA 功能）

```bash
# 构建 Web 版本
npm run build:web

# 预览
npm run preview

# 访问 http://localhost:4173
# ✅ 应该看不到"安装 APP"提示
# ✅ Chrome DevTools → Application → Manifest 应该是空的
```

### 测试 PWA 版本（应该有完整 PWA 功能）

```bash
# 构建 PWA 版本
npm run build:pwa

# 预览
npm run preview:pwa

# 访问 http://localhost:4173
# ✅ 应该看到"安装 APP"提示（3秒后）
# ✅ Chrome DevTools → Application → Manifest 有完整配置
# ✅ 可以点击浏览器的"安装"按钮
```

---

## 📂 当前项目结构

```
gig-neighbor/
│
├── .env                ← 默认配置（开发用）
├── .env.web            ← Web 构建配置（新增 ✨）
├── .env.pwa            ← PWA 构建配置（新增 ✨）
├── .env.example        ← 配置模板（新增 ✨）
│
├── package.json        ← 已更新脚本（修改 ✅）
├── vite.config.ts      ← 需要修改（下一步）
│
├── src/
│   ├── components/
│   │   └── PWAInstallPrompt.tsx  ← 需要创建（下一步）
│   └── App.tsx         ← 需要导入 PWA 组件（下一步）
│
├── dist/               ← Web 构建输出
└── dist-pwa/           ← PWA 构建输出
```

---

## 🚀 使用指南

### 日常开发
```bash
# Web 开发（默认，PWA 功能禁用）
npm run dev

# PWA 开发（PWA 功能启用）
npm run dev:pwa
```

### 构建部署
```bash
# 构建 Web 版本 → dist/
npm run build:web

# 构建 PWA 版本 → dist-pwa/
npm run build:pwa

# 同时构建两个版本
npm run build:web && npm run build:pwa
```

### 本地预览
```bash
# 预览 Web 版本
npm run preview

# 预览 PWA 版本
npm run preview:pwa
```

---

## 🎯 部署策略

### 方案 A: 不同子域名（推荐）

```
https://justwedo.ca           → dist/      (Web)
https://app.justwedo.ca       → dist-pwa/  (PWA)
```

### 方案 B: 同域名 A/B 测试

```
https://justwedo.ca
  ├─ 默认显示 Web 版本
  └─ 用户点击"安装 APP" → 跳转到 PWA 版本
```

---

## ⚙️ Cloudflare Pages 配置示例

### 项目 1: justwedo-web

```yaml
Name: justwedo-web
Production branch: main
Build command: npm run build:web
Build output: dist
Environment variables:
  VITE_ENABLE_PWA: false
  VITE_APP_MODE: web
```

### 项目 2: justwedo-pwa

```yaml
Name: justwedo-pwa
Production branch: main
Build command: npm run build:pwa
Build output: dist-pwa
Environment variables:
  VITE_ENABLE_PWA: true
  VITE_APP_MODE: pwa
```

---

## 🔍 验证清单

完成配置后，检查：

### Web 版本检查
- [ ] 访问 Web 版本不显示"安装 APP"提示
- [ ] DevTools 中 Application → Manifest 为空
- [ ] 浏览器地址栏没有"安装"图标
- [ ] 功能正常（登录、浏览、操作等）

### PWA 版本检查
- [ ] 访问 PWA 版本显示"安装 APP"提示
- [ ] DevTools 中 Application → Manifest 有配置
- [ ] 浏览器地址栏有"安装"图标
- [ ] 可以安装到主屏幕
- [ ] 安装后可以离线访问
- [ ] 功能正常（登录、浏览、操作等）

---

## 💡 关键要点

### ✅ Web 版本保持不变
- 不会看到任何 PWA 相关功能
- 不会生成 Service Worker
- 不会有 manifest.json
- 用户体验完全不变

### ✅ PWA 版本增强功能
- 可以安装到主屏幕
- 支持离线访问
- 像原生 APP 一样启动
- 自动缓存资源

### ✅ 代码零冗余
- 一套代码，两种构建
- 通过环境变量自动切换
- 不需要维护两份代码
- 部署简单，维护方便

---

## 🆘 常见问题

### Q: Web 版本会被影响吗？
**A**: 不会！Web 版本通过 `VITE_ENABLE_PWA=false` 完全禁用 PWA 功能。

### Q: 需要维护两套代码吗？
**A**: 不需要！同一套代码，只是构建时配置不同。

### Q: PWA 组件在 Web 模式下会显示吗？
**A**: 不会！组件内部有 `if (!IS_PWA_ENABLED) return null;` 保护。

### Q: 用户怎么选择 Web 还是 PWA？
**A**: 部署到不同域名，用户选择访问的网址。

---

## 📞 需要帮助？

如果遇到问题，检查：

1. **构建日志**: 查看是否有 `PWA enabled: true/false` 的输出
2. **浏览器控制台**: 查看是否有 PWA 相关日志
3. **DevTools → Application**: 查看 Manifest 和 Service Workers

---

**立即开始**: 执行上面的步骤 1-3，10分钟完成配置！🚀
