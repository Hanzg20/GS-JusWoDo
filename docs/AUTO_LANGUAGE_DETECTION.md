# 🌍 自动语言检测功能

## 🎯 功能说明

应用首次运行时，会自动检测用户浏览器的语言设置，并自动设置UI语言为中文或英文。

---

## 🔧 实现方式

### 1. **浏览器语言检测**

```typescript
const detectBrowserLanguage = (): 'en' | 'zh' => {
    // 获取浏览器语言
    const browserLang = navigator.language || (navigator as any).userLanguage;

    console.log('[Language Detection] Browser language:', browserLang);
    console.log('[Language Detection] All languages:', navigator.languages);

    // 检查是否为中文
    if (browserLang.toLowerCase().startsWith('zh')) {
        console.log('[Language Detection] Detected Chinese, setting to zh');
        return 'zh';
    }

    // 默认使用英文
    console.log('[Language Detection] Detected non-Chinese, setting to en');
    return 'en';
};
```

**检测逻辑**:
- 读取 `navigator.language`（浏览器主语言）
- 如果语言代码以 `zh` 开头（zh-CN, zh-TW, zh-HK 等）→ 设置为中文
- 其他语言 → 设置为英文

---

### 2. **存储机制**

```typescript
interface ConfigState {
    language: 'en' | 'zh';
    isLanguageAutoDetected: boolean; // 标记语言是否已被检测/设置过
}
```

使用 **zustand persist** 存储到 localStorage：
- **首次访问**: 自动检测并保存
- **再次访问**: 读取保存的语言，不再自动检测
- **手动切换**: 用户手动切换后，标记为已设置，不再自动检测

---

### 3. **初始化流程**

```typescript
// App.tsx
const App = () => {
  const { initializeLanguage } = useConfigStore();

  useEffect(() => {
    initializeLanguage(); // 应用启动时初始化语言
  }, [initializeLanguage]);

  // ...
};
```

```typescript
// configStore.ts
initializeLanguage: () => {
    const state = get();
    // 只在首次访问时自动检测
    if (!state.isLanguageAutoDetected) {
        const detectedLang = detectBrowserLanguage();
        console.log('[Language Detection] First run, setting language to:', detectedLang);
        set({ language: detectedLang, isLanguageAutoDetected: true });
    } else {
        console.log('[Language Detection] Language already set, keeping:', state.language);
    }
}
```

---

## 📊 工作流程

### 场景 1: 首次访问（中文用户）

```
1. 用户首次打开应用
   ↓
2. 浏览器语言: zh-CN
   ↓
3. 检测到中文 → 自动设置 language = 'zh'
   ↓
4. 保存到 localStorage:
   {
     language: 'zh',
     isLanguageAutoDetected: true
   }
   ↓
5. UI 显示中文界面
```

---

### 场景 2: 首次访问（英文用户）

```
1. 用户首次打开应用
   ↓
2. 浏览器语言: en-US
   ↓
3. 检测到非中文 → 自动设置 language = 'en'
   ↓
4. 保存到 localStorage:
   {
     language: 'en',
     isLanguageAutoDetected: true
   }
   ↓
5. UI 显示英文界面
```

---

### 场景 3: 再次访问

```
1. 用户再次打开应用
   ↓
2. 从 localStorage 读取:
   {
     language: 'zh',
     isLanguageAutoDetected: true
   }
   ↓
3. isLanguageAutoDetected = true
   → 跳过自动检测
   ↓
4. 直接使用保存的语言: 'zh'
   ↓
5. UI 显示中文界面
```

---

### 场景 4: 用户手动切换语言

```
1. 用户在设置中选择 English
   ↓
2. 调用 setLanguage('en')
   ↓
3. 更新 localStorage:
   {
     language: 'en',
     isLanguageAutoDetected: true  // 标记为已设置
   }
   ↓
4. UI 切换为英文
   ↓
5. 下次访问时保持 English（不会再自动检测）
```

---

## 🌐 支持的语言代码

### 中文（自动识别为 zh）
- `zh` - 中文（通用）
- `zh-CN` - 简体中文（中国大陆）
- `zh-TW` - 繁体中文（台湾）
- `zh-HK` - 繁体中文（香港）
- `zh-SG` - 简体中文（新加坡）

### 英文（默认）
- `en` - 英文（通用）
- `en-US` - 英文（美国）
- `en-CA` - 英文（加拿大）
- `en-GB` - 英文（英国）
- `en-AU` - 英文（澳大利亚）
- 以及所有其他语言（默认显示英文）

---

## 🧪 测试方法

### 方法 1: 清除 localStorage 测试

```javascript
// 在浏览器控制台运行
localStorage.removeItem('gig-neighbor-config');
location.reload();

// 检查自动检测结果
console.log('Detected language:',
  JSON.parse(localStorage.getItem('gig-neighbor-config')).state.language
);
```

---

### 方法 2: 修改浏览器语言测试

#### Chrome
1. 打开 **设置** → **语言**
2. 添加 **中文（简体）**
3. 将中文移到列表顶部
4. 清除 localStorage: `localStorage.removeItem('gig-neighbor-config')`
5. 刷新页面 → 应显示中文界面

#### Firefox
1. 打开 **设置** → **语言**
2. 添加 **中文（简体）**
3. 将中文设为首选语言
4. 清除 localStorage
5. 刷新页面 → 应显示中文界面

---

### 方法 3: 使用开发者工具模拟

#### Chrome DevTools
```javascript
// 打开控制台，运行以下代码模拟中文浏览器
Object.defineProperty(navigator, 'language', {
  value: 'zh-CN',
  configurable: true
});

// 清除存储并刷新
localStorage.removeItem('gig-neighbor-config');
location.reload();
```

---

## 📝 控制台日志

启用自动检测后，控制台会显示：

```
[Language Detection] Browser language: zh-CN
[Language Detection] All languages: ["zh-CN", "en-US", "en"]
[Language Detection] Detected Chinese, setting to zh
[Language Detection] First run, setting language to: zh
```

或

```
[Language Detection] Browser language: en-US
[Language Detection] All languages: ["en-US", "en"]
[Language Detection] Detected non-Chinese, setting to en
[Language Detection] First run, setting language to: en
```

再次访问时：

```
[Language Detection] Language already set, keeping: zh
```

---

## 🔒 安全性和隐私

### 数据存储
- 存储位置: **浏览器 localStorage**
- 存储内容: 语言偏好（'en' 或 'zh'）
- 不涉及服务器: 完全本地存储
- 用户可清除: 清除浏览器数据即可重置

### 隐私保护
- ✅ 不收集用户语言数据到服务器
- ✅ 不跨设备同步
- ✅ 用户完全可控（可手动切换）
- ✅ 符合 GDPR 和隐私法规

---

## 🎯 用户体验优势

### 1. **自动适配**
- 中文用户自动看到中文界面
- 英文用户自动看到英文界面
- 无需手动选择

### 2. **记住偏好**
- 首次检测后保存偏好
- 下次访问自动应用
- 跨标签页一致

### 3. **灵活切换**
- 自动检测不强制
- 用户可随时手动切换
- 切换后永久保存

---

## 🔧 技术细节

### localStorage 结构

```json
{
  "gig-neighbor-config": {
    "state": {
      "language": "zh",
      "activeNodeId": "NODE_LEES",
      "isLanguageAutoDetected": true
    },
    "version": 0
  }
}
```

### 检测优先级

```
1. localStorage 中的保存值（如果存在）
   ↓
2. 浏览器语言（首次访问）
   ↓
3. 默认值 'en'（作为最后的 fallback）
```

---

## 🐛 故障排查

### 问题 1: 语言没有自动检测

**检查步骤**:
```javascript
// 1. 检查 localStorage
console.log(localStorage.getItem('gig-neighbor-config'));

// 2. 检查浏览器语言
console.log(navigator.language);
console.log(navigator.languages);

// 3. 清除并重试
localStorage.removeItem('gig-neighbor-config');
location.reload();
```

---

### 问题 2: 检测到错误的语言

**原因**: 浏览器语言设置不正确

**解决**:
1. 检查浏览器语言设置
2. 或手动在设置中切换语言

---

### 问题 3: 切换语言后又变回去了

**原因**: 可能是多个标签页冲突

**解决**:
```javascript
// 关闭所有标签页
// 清除 localStorage
localStorage.removeItem('gig-neighbor-config');
// 重新打开应用
```

---

## 📊 数据监控（可选）

如果需要了解用户语言分布，可以添加 Analytics：

```typescript
// 在 initializeLanguage 中添加
const detectedLang = detectBrowserLanguage();

// 发送到 Google Analytics
gtag('event', 'language_auto_detected', {
  language: detectedLang,
  browser_language: navigator.language
});
```

---

## 🚀 未来改进

### 1. 支持更多语言
```typescript
const detectBrowserLanguage = (): 'en' | 'zh' | 'fr' | 'es' => {
  if (browserLang.startsWith('zh')) return 'zh';
  if (browserLang.startsWith('fr')) return 'fr';
  if (browserLang.startsWith('es')) return 'es';
  return 'en';
};
```

### 2. 智能推荐
```typescript
// 如果检测到用户在加拿大但使用中文浏览器
// 提示: "检测到您使用中文，是否切换为中文界面？"
```

### 3. A/B 测试
- 测试自动检测 vs 手动选择
- 收集用户满意度数据

---

## ✅ 验收标准

- [x] 首次访问时自动检测浏览器语言
- [x] 中文浏览器显示中文界面
- [x] 英文/其他浏览器显示英文界面
- [x] 语言偏好保存到 localStorage
- [x] 再次访问时使用保存的语言
- [x] 用户手动切换语言后永久保存
- [x] 控制台显示检测日志
- [x] 跨标签页一致

---

## 📝 相关文件

| 文件 | 修改内容 |
|------|---------|
| [src/stores/configStore.ts](../src/stores/configStore.ts) | 添加自动检测逻辑 |
| [src/App.tsx](../src/App.tsx) | 添加初始化调用 |

---

**实现日期**: 2026-02-01
**版本**: v1.0
**状态**: ✅ 已实现
