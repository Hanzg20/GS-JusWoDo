/**
 * Cloudflare Worker for serving PWA static files
 *
 * 注意：本项目推荐使用 Cloudflare Pages 而非 Workers
 * 此文件仅在需要高级边缘计算功能时使用
 *
 * 部署: npm run deploy:workers
 */

import { getAssetFromKV } from '@cloudflare/kv-asset-handler';

// 不应该被缓存的文件（Service Worker 和 Manifest）
const NO_CACHE_PATHS = [
  '/sw.js',
  '/manifest.webmanifest',
  '/workbox-',
];

// 监听所有请求
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event));
});

/**
 * 处理所有请求
 */
async function handleRequest(event) {
  const url = new URL(event.request.url);

  try {
    // 从 KV 存储获取静态资源
    const response = await getAssetFromKV(event, {
      cacheControl: getCacheControl(url.pathname),
    });

    // 添加自定义头部
    const headers = new Headers(response.headers);

    // PWA 必需的头部
    addPWAHeaders(headers, url.pathname);

    // 安全头部
    addSecurityHeaders(headers);

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });

  } catch (e) {
    // 404 错误 - SPA 回退到 index.html
    if (e.status === 404) {
      return handleSPAFallback(event);
    }

    // 其他错误
    return new Response(`Error: ${e.message || e.toString()}`, {
      status: e.status || 500,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  }
}

/**
 * SPA 回退处理 - 所有未找到的路由返回 index.html
 */
async function handleSPAFallback(event) {
  try {
    const response = await getAssetFromKV(event, {
      mapRequestToAsset: req => {
        const url = new URL(req.url);
        return new Request(`${url.origin}/index.html`, req);
      },
    });

    const headers = new Headers(response.headers);
    addSecurityHeaders(headers);

    return new Response(response.body, {
      status: 200,
      statusText: 'OK',
      headers,
    });
  } catch (e) {
    return new Response('Not Found', { status: 404 });
  }
}

/**
 * 添加 PWA 相关头部
 */
function addPWAHeaders(headers, pathname) {
  // Service Worker
  if (pathname === '/sw.js') {
    headers.set('Cache-Control', 'public, max-age=0, must-revalidate');
    headers.set('Service-Worker-Allowed', '/');
    headers.set('Content-Type', 'application/javascript');
  }

  // Workbox Service Worker
  if (pathname.includes('/workbox-')) {
    headers.set('Cache-Control', 'public, max-age=0, must-revalidate');
    headers.set('Content-Type', 'application/javascript');
  }

  // Manifest
  if (pathname === '/manifest.webmanifest') {
    headers.set('Content-Type', 'application/manifest+json');
    headers.set('Cache-Control', 'public, max-age=0, must-revalidate');
  }

  // PWA 图标
  if (pathname.startsWith('/pwa-icons/')) {
    headers.set('Cache-Control', 'public, max-age=86400'); // 1 day
  }

  // 静态资源（长期缓存）
  if (pathname.startsWith('/assets/')) {
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  }
}

/**
 * 添加安全头部
 */
function addSecurityHeaders(headers) {
  headers.set('X-Frame-Options', 'DENY');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Permissions-Policy', 'geolocation=(self), microphone=(), camera=()');

  // 移除可能暴露服务器信息的头部
  headers.delete('Server');
  headers.delete('X-Powered-By');
}

/**
 * 获取缓存策略
 */
function getCacheControl(pathname) {
  // Service Worker 和 Manifest - 不缓存
  if (NO_CACHE_PATHS.some(path => pathname.includes(path))) {
    return {
      browserTTL: 0,
      edgeTTL: 0,
      bypassCache: true,
    };
  }

  // 静态资源 - 长期缓存
  if (pathname.startsWith('/assets/')) {
    return {
      browserTTL: 31536000, // 1 year
      edgeTTL: 31536000,
      bypassCache: false,
    };
  }

  // PWA 图标 - 中期缓存
  if (pathname.startsWith('/pwa-icons/')) {
    return {
      browserTTL: 86400, // 1 day
      edgeTTL: 86400,
      bypassCache: false,
    };
  }

  // 默认 - 短期边缘缓存
  return {
    browserTTL: 0,
    edgeTTL: 3600, // 1 hour
    bypassCache: false,
  };
}
