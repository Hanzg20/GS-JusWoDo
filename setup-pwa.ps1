# PWA 快速配置脚本
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  渥帮 JUSTWEDO - PWA 配置脚本" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 步骤 1: 安装依赖
Write-Host "[1/5] 安装 PWA 依赖..." -ForegroundColor Yellow
npm install vite-plugin-pwa workbox-window --save-dev

# 步骤 2: 创建 manifest.json
Write-Host "[2/5] 创建 manifest.json..." -ForegroundColor Yellow
$manifestContent = @'
{
  "name": "渥帮 JUSTWEDO",
  "short_name": "渥帮",
  "description": "渥太华华人互助平台 - Get Things Done Together",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#8B5CF6",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/logo.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "categories": ["social", "lifestyle", "utilities"],
  "lang": "zh-CN"
}
'@

$manifestContent | Out-File -FilePath "public\manifest.json" -Encoding UTF8

# 步骤 3: 创建 PWA 安装提示组件
Write-Host "[3/5] 创建 PWA 安装提示组件..." -ForegroundColor Yellow
$componentContent = @'
import { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';
import { Button } from './ui/button';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PWAInstallPrompt = () => {
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

      if (!dismissed || now - dismissedTime > threeDays) {
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
          <button onClick={handleDismiss} className="flex-shrink-0 text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
'@

New-Item -ItemType Directory -Force -Path "src\components" | Out-Null
$componentContent | Out-File -FilePath "src\components\PWAInstallPrompt.tsx" -Encoding UTF8

Write-Host "[4/5] 提示信息" -ForegroundColor Yellow
Write-Host ""
Write-Host "✅ PWA 基础配置完成!" -ForegroundColor Green
Write-Host ""
Write-Host "接下来需要手动完成:" -ForegroundColor Cyan
Write-Host "1. 修改 vite.config.ts (参考 docs/APP_PACKAGING_GUIDE.md)" -ForegroundColor White
Write-Host "2. 在 App.tsx 中导入 PWAInstallPrompt 组件" -ForegroundColor White
Write-Host "3. 更新 index.html 添加 PWA meta 标签" -ForegroundColor White
Write-Host "4. 运行 'npm run build' 构建生产版本" -ForegroundColor White
Write-Host ""
Write-Host "详细文档: docs/APP_PACKAGING_GUIDE.md" -ForegroundColor Yellow

