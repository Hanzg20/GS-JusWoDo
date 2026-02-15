# 🎉 PWA 已完成配置 - 测试指南

## ✅ 已完成的配置

### 1. Service Worker 注册 ([src/main.tsx](../src/main.tsx))
- ✅ 动态导入 `virtual:pwa-register`
- ✅ 仅在 PWA 模式下加载 Service Worker
- ✅ 自动更新检测（每小时检查一次）
- ✅ 离线就绪提示
- ✅ 完整的错误处理

### 2. TypeScript 类型定义 ([src/vite-env.d.ts](../src/vite-env.d.ts))
- ✅ 添加 `vite-plugin-pwa/client` 类型引用
- ✅ PWA 环境变量类型定义
- ✅ 完整的 TypeScript 支持

### 3. 环境变量配置 ([.env](./.env))
- ✅ `VITE_ENABLE_PWA=false` - 默认禁用（Web 模式）
- ✅ `VITE_APP_MODE=web` - 应用模式标识

### 4. 其他已完成项
- ✅ Vite PWA 插件配置 ([vite.config.ts](../vite.config.ts))
- ✅ PWA 图标（24个文件，所有尺寸）
- ✅ HTML Meta 标签和 favicon
- ✅ PWA 安装提示组件 ([src/components/PWAInstallPrompt.tsx](../src/components/PWAInstallPrompt.tsx))
- ✅ 双模式构建脚本

---

## 🧪 测试步骤

### 测试 1: Web 模式（默认，PWA 禁用）

```bash
# 1. 确认 .env 文件中 VITE_ENABLE_PWA=false
cat .env

# 2. 开发模式测试
npm run dev

# 3. 访问 http://localhost:8080
# 预期结果：
# ✅ 控制台输出: "🌐 Running in Web mode (PWA disabled)"
# ✅ 没有 Service Worker 注册
# ✅ 没有"安装 APP"提示
```

### 测试 2: PWA 模式（完整 PWA 功能）

```bash
# 1. 修改 .env 文件
# 将 VITE_ENABLE_PWA=false 改为 VITE_ENABLE_PWA=true

# 2. PWA 开发模式
npm run dev:pwa

# 3. 访问 http://localhost:8080
# 预期结果：
# ✅ 控制台输出: "📱 PWA enabled: true"
# ✅ 控制台输出: "✨ PWA plugin activated"
# ✅ 控制台输出: "✅ Service Worker registered: ..."
# ✅ 3秒后显示"安装 APP"提示
```

### 测试 3: 生产构建测试

#### 构建 Web 版本
```bash
npm run build:web

# 预期输出:
# 🔧 Build mode: web
# 📱 PWA enabled: false
# 🌐 Web mode (PWA disabled)
# 输出目录: dist/

# 验证
ls dist/  # 应该没有 sw.js 或 manifest.webmanifest
```

#### 构建 PWA 版本
```bash
npm run build:pwa

# 预期输出:
# 🔧 Build mode: pwa
# 📱 PWA enabled: true
# ✨ PWA plugin activated
# 输出目录: dist-pwa/

# 验证
ls dist-pwa/  # 应该包含 sw.js 和 manifest.webmanifest
```

#### 预览构建结果
```bash
# 预览 Web 版本（在 dist/ 中）
npm run preview
# 访问 http://localhost:4173

# 预览 PWA 版本（在 dist-pwa/ 中）
npm run preview:pwa
# 访问 http://localhost:4173
```

---

## 🔍 Chrome DevTools 验证

### Web 模式验证
1. 打开 Chrome DevTools (F12)
2. 进入 **Application** 标签
3. 检查项：
   - [ ] **Manifest**: 应该显示 "No manifest detected"
   - [ ] **Service Workers**: 应该为空
   - [ ] **Console**: 显示 "🌐 Running in Web mode (PWA disabled)"

### PWA 模式验证
1. 打开 Chrome DevTools (F12)
2. 进入 **Application** 标签
3. 检查项：
   - [ ] **Manifest**: 显示完整的应用信息
     - Name: "渥帮 JUSTWEDO"
     - Short name: "渥帮"
     - Theme color: #8B5CF6
     - Icons: 10个图标（72px - 512px）
   - [ ] **Service Workers**: 显示已激活的 SW
   - [ ] **Cache Storage**: 应该看到缓存条目
   - [ ] **Console**: 显示 Service Worker 相关日志

---

## 📱 安装测试

### 桌面浏览器（Chrome/Edge）

1. 访问 PWA 版本
2. 地址栏右侧应显示"安装"图标（⊕）
3. 点击安装或等待3秒后的提示
4. 安装后：
   - [ ] 应用出现在系统应用列表中
   - [ ] 独立窗口打开（无浏览器 UI）
   - [ ] 启动屏幕正常显示

### 移动设备（iOS/Android）

#### Android Chrome
1. 访问 PWA 版本
2. 点击菜单 → "安装应用"
3. 确认安装
4. 检查：
   - [ ] 主屏幕图标正确
   - [ ] 启动屏幕正常
   - [ ] 离线访问正常

#### iOS Safari
1. 访问 PWA 版本
2. 点击"分享"按钮
3. 选择"添加到主屏幕"
4. 检查：
   - [ ] 主屏幕图标正确
   - [ ] Apple Touch 图标显示正常
   - [ ] 启动屏幕正常

---

## 🔄 离线功能测试

### 测试离线缓存

1. **首次访问**（在线）
   ```bash
   # 访问 PWA 版本
   npm run dev:pwa
   # 打开 http://localhost:8080
   # 浏览几个页面，触发缓存
   ```

2. **离线模式测试**
   - 打开 Chrome DevTools
   - 进入 **Network** 标签
   - 勾选 **Offline** 复选框
   - 刷新页面

3. **预期结果**
   - [ ] 页面正常加载（从缓存）
   - [ ] 静态资源（JS/CSS）从缓存加载
   - [ ] Supabase API 请求失败（NetworkFirst 策略）
   - [ ] 头像图片从缓存加载（CacheFirst 策略）

---

## 🚨 故障排查

### 问题 1: Service Worker 未注册

**症状**: 控制台没有 "✅ Service Worker registered" 日志

**检查**:
```bash
# 1. 确认环境变量
cat .env | grep VITE_ENABLE_PWA
# 应该显示: VITE_ENABLE_PWA=true

# 2. 重启开发服务器
npm run dev:pwa
```

### 问题 2: TypeScript 类型错误

**症状**: `virtual:pwa-register` 模块找不到

**解决**:
```bash
# 确认 vite-env.d.ts 包含以下行:
# /// <reference types="vite-plugin-pwa/client" />
```

### 问题 3: 安装提示不显示

**检查清单**:
- [ ] `VITE_ENABLE_PWA=true` 已设置
- [ ] 等待至少3秒（组件延迟显示）
- [ ] 检查 localStorage 中是否有 `pwa-prompt-dismissed`
- [ ] 使用桌面 Chrome/Edge（移动浏览器可能不触发 `beforeinstallprompt`）

**清除提示记录**:
```javascript
// 在浏览器控制台执行
localStorage.removeItem('pwa-prompt-dismissed')
location.reload()
```

### 问题 4: 构建后 Service Worker 404

**原因**: 预览时 base path 配置问题

**检查**:
```bash
# 确认预览命令
npm run preview:pwa

# 如果使用自定义服务器，确保：
# - sw.js 在根目录
# - manifest.webmanifest 在根目录
```

---

## 📊 性能监控

### Lighthouse 审计

1. 打开 Chrome DevTools
2. 进入 **Lighthouse** 标签
3. 选择 **Progressive Web App** 类别
4. 点击 **Generate report**

### 预期分数（PWA 模式）
- **Progressive Web App**: 90+ / 100
  - [ ] Installable
  - [ ] PWA optimized
  - [ ] Works offline

### 预期分数（Web 模式）
- **Progressive Web App**: 不适用
  - Manifest 不存在
  - Service Worker 未注册

---

## 🎯 快速切换模式

### 切换到 PWA 模式
```bash
# 编辑 .env 文件
# 修改: VITE_ENABLE_PWA=true

# 重启开发服务器
npm run dev:pwa
```

### 切换到 Web 模式
```bash
# 编辑 .env 文件
# 修改: VITE_ENABLE_PWA=false

# 重启开发服务器
npm run dev
```

---

## 📦 部署前检查清单

### Web 版本部署
- [ ] `VITE_ENABLE_PWA=false` 已设置
- [ ] 运行 `npm run build:web`
- [ ] 输出到 `dist/` 目录
- [ ] 验证无 `sw.js` 文件
- [ ] 测试所有核心功能

### PWA 版本部署
- [ ] `VITE_ENABLE_PWA=true` 已设置
- [ ] 运行 `npm run build:pwa`
- [ ] 输出到 `dist-pwa/` 目录
- [ ] 验证包含 `sw.js` 和 `manifest.webmanifest`
- [ ] 使用 HTTPS 环境测试
- [ ] 验证安装功能
- [ ] 测试离线访问

---

## 🎊 完成！

你的 PWA 配置已经全部完成！现在可以：

1. ✅ 在开发中使用 `npm run dev` (Web) 或 `npm run dev:pwa` (PWA)
2. ✅ 构建两个独立版本：`npm run build:web` 和 `npm run build:pwa`
3. ✅ 通过环境变量轻松切换模式
4. ✅ 部署到不同域名或作为 A/B 测试

---

## 📚 相关文档

- [PWA_SETUP_NOW.md](./PWA_SETUP_NOW.md) - 完整配置指南
- [PWA_WEB_SEPARATION.md](./PWA_WEB_SEPARATION.md) - Web/PWA 分离架构
- [vite-plugin-pwa 文档](https://vite-pwa-org.netlify.app/)
- [Workbox 文档](https://developers.google.com/web/tools/workbox)

---

**需要帮助？** 检查控制台日志，查看 Chrome DevTools Application 标签！🔍
