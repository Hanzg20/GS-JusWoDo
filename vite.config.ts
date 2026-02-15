import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from 'vite-plugin-pwa';
import basicSsl from '@vitejs/plugin-basic-ssl';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd(), '');
  const isPWAEnabled = env.VITE_ENABLE_PWA === 'true' || mode === 'pwa';

  console.log('🔧 Build mode:', mode);
  console.log('📱 PWA enabled:', isPWAEnabled);

  const plugins = [
    react(),
    basicSsl(),
    mode === "development" && componentTagger()
  ];

  plugins.push(
    VitePWA({
      disable: !isPWAEnabled,
      registerType: 'autoUpdate',
      includeAssets: ['pwa-icons/*.png', 'robots.txt'],
      manifest: {
        name: '渥帮 JWD',
        short_name: '渥帮',
        description: 'JustWeDo - 渥太华本地互助社区',
        theme_color: '#8B5CF6',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        orientation: 'portrait-primary',
        icons: [
          {
            src: '/pwa-icons/icon-72x72.png',
            sizes: '72x72',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/pwa-icons/icon-96x96.png',
            sizes: '96x96',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/pwa-icons/icon-128x128.png',
            sizes: '128x128',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/pwa-icons/icon-144x144.png',
            sizes: '144x144',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/pwa-icons/icon-152x152.png',
            sizes: '152x152',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/pwa-icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/pwa-icons/icon-384x384.png',
            sizes: '384x384',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/pwa-icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/pwa-icons/icon-192x192-maskable.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: '/pwa-icons/icon-512x512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
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

  return {
    server: {
      https: true,
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
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-slot', 'framer-motion', 'lucide-react', 'sonner', 'clsx', 'tailwind-merge'],
            'supabase-vendor': ['@supabase/supabase-js'],
            'map-vendor': ['leaflet', 'react-leaflet'],
            'utils-vendor': ['date-fns', 'zod', 'react-hook-form']
          }
        }
      }
    },
  };
});
