import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
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
          globPatterns: ['**/*.{js,css,html,ico,svg}'],
          globIgnores: ['**/logo-o.png', '**/logo-1.png', '**/JWD-logo-*.png'],
          maximumFileSizeToCacheInBytes: 3 * 1024 * 1024, // 3 MB
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
