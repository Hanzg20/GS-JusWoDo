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
