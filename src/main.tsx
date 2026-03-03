import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "leaflet/dist/leaflet.css";

// PWA Service Worker 注册
const IS_PWA_ENABLED = import.meta.env.VITE_ENABLE_PWA === 'true';

// Browser Compatibility: crypto.randomUUID polyfill (important for non-secure contexts or older browsers)
if (typeof window !== 'undefined' && window.crypto && !window.crypto.randomUUID) {
  (window.crypto as any).randomUUID = function () {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };
} else if (typeof window !== 'undefined' && !window.crypto) {
  (window as any).crypto = {
    randomUUID: function () {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    }
  };
}

createRoot(document.getElementById("root")!).render(<App />);

// 注册 Service Worker (仅在 PWA 模式下)
if (IS_PWA_ENABLED) {
  // 动态导入 registerSW，避免在 Web 模式下加载
  import('virtual:pwa-register')
    .then(({ registerSW }) => {
      const updateSW = registerSW({
        immediate: true,
        onNeedRefresh() {
          console.log('🔄 New content available, refresh to update.');
          // 可以在这里显示一个更新提示 toast
        },
        onOfflineReady() {
          console.log('📴 App ready to work offline.');
        },
        onRegistered(registration) {
          console.log('✅ Service Worker registered:', registration);

          // 每小时检查一次更新
          if (registration) {
            setInterval(() => {
              registration.update();
            }, 60 * 60 * 1000);
          }
        },
        onRegisterError(error) {
          console.error('❌ Service Worker registration error:', error);
        },
      });
    })
    .catch((error) => {
      console.error('❌ Failed to load PWA register module:', error);
    });
} else {
  console.log('🌐 Running in Web mode (PWA disabled)');
}
