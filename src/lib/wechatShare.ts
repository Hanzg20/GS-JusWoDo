/**
 * 微信分享配置工具
 *
 * 签名由 supabase/functions/wechat-jsapi-signature 生成（AppSecret 不能进前端）。
 * 该函数需要先在 Supabase 项目里设置 WECHAT_APP_ID / WECHAT_APP_SECRET secrets 并部署，
 * 否则 getWxSignature 会静默失败，分享退回到 ShareSheet 的复制链接方案。
 */

import { supabase } from './supabase';

// 微信 JS-SDK 类型定义
declare global {
    interface Window {
        wx?: {
            config: (config: WxConfig) => void;
            ready: (callback: () => void) => void;
            error: (callback: (res: any) => void) => void;
            updateAppMessageShareData: (config: WxShareConfig) => void;
            updateTimelineShareData: (config: WxShareConfig) => void;
            hideMenuItems: (config: { menuList: string[] }) => void;
            // Only meaningful inside a Mini Program's <web-view> — relays
            // data across the web-view/mini-program-shell boundary, see
            // configWxShare()'s isWeChatMiniProgramWebview() branch.
            miniProgram?: {
                postMessage: (config: { data: Record<string, any> }) => void;
                navigateTo: (config: { url: string; success?: () => void; fail?: (err: any) => void }) => void;
            };
        };
    }
}

interface WxConfig {
    debug?: boolean;
    appId: string;
    timestamp: number;
    nonceStr: string;
    signature: string;
    jsApiList: string[];
}

interface WxShareConfig {
    title: string;
    desc: string;
    link: string;
    imgUrl: string;
    success?: () => void;
    fail?: (err: any) => void;
}

interface ShareData {
    title: string;
    description: string;
    imageUrl: string;
    url: string;
}

// Menu items hidden from WeChat's "..." panel so the page reads as an app
// screen, not a web page. Keeps the two menu items our custom
// updateAppMessageShareData/updateTimelineShareData calls actually drive
// (share to friend / share to Moments) — everything hidden here is either
// a redundant share channel or an escape hatch into "this is just a website"
// (view in browser, read mode, copy link).
const WECHAT_MENU_ITEMS_TO_HIDE = [
    'menuItem:share:qq',
    'menuItem:share:weiboApp',
    'menuItem:share:facebook',
    'menuItem:share:QZone',
    'menuItem:share:email',
    'menuItem:share:brand',
    'menuItem:copyUrl',
    'menuItem:originPage',
    'menuItem:readMode',
    'menuItem:openWithQQBrowser',
    'menuItem:openWithSafari',
    'menuItem:favorite',
];

/**
 * 加载微信 JS-SDK
 */
export function loadWxJsSdk(): Promise<void> {
    return new Promise((resolve, reject) => {
        if (window.wx) {
            resolve();
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://res.wx.qq.com/open/js/jweixin-1.6.0.js';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load WeChat JS-SDK'));
        document.head.appendChild(script);
    });
}

/**
 * 获取微信分享签名，调用 wechat-jsapi-signature Edge Function
 */
export async function getWxSignature(url: string): Promise<{
    appId: string;
    timestamp: number;
    nonceStr: string;
    signature: string;
} | null> {
    try {
        const { data, error } = await supabase.functions.invoke('wechat-jsapi-signature', {
            body: { url }
        });
        if (error || !data || data.error) {
            console.error('Failed to get WeChat signature:', error || data?.error);
            return null;
        }
        return data;
    } catch (error) {
        console.error('Failed to get WeChat signature:', error);
        return null;
    }
}

// WeChat's own JS-SDK share card (via "···" → 分享给朋友/分享到朋友圈) has no
// field for a bottom site-name/logo line — a real, unfixable platform
// limitation confirmed by direct testing (see jwd_wechat_card_no_native_logo
// memory: only html2canvas posters can show a real footer logo). This is a
// cheap, real consolation: prefixing the title itself makes the brand
// visible right where the eye lands first, without needing that field at
// all. Skipped if the title already mentions the brand (e.g. the site-wide
// default title already does) to avoid a redundant double-branded title.
function brandedTitle(title: string): string {
    if (/渥帮|justwedo/i.test(title)) return title;
    return `【渥帮 JustWeDo】${title}`;
}

/**
 * 配置微信分享
 */
export async function configWxShare(shareData: ShareData): Promise<boolean> {
    // Inside the Mini Program's web-view, sharing is governed entirely by
    // the mini-program shell's own onShareAppMessage (see webview.js) — the
    // wx.config()/updateAppMessageShareData flow below doesn't apply there
    // at all (that's for WeChat's own in-app browser "···" menu, a
    // different surface). The shell has no way to know this page's real
    // title/desc/image/path on its own, which is why every specific
    // service/post always showed the same generic wrapper title.
    // wx.miniProgram.postMessage relays it across the web-view boundary —
    // delivery is guaranteed to arrive before a share action fires, which
    // is the only timing guarantee this API makes, but it's exactly the
    // one that matters here.
    //
    // Deliberately uses the *unbranded* shareData.title, not brandedTitle()
    // below — the mini-program's own share card already shows the app's
    // real icon+name natively (the whole reason this bridge exists in the
    // first place), so prefixing "【渥帮 JustWeDo】" here would just eat
    // space repeating a brand mark already shown right above the title.
    if (isWeChatMiniProgramWebview()) {
        try {
            await loadWxJsSdk();
            window.wx?.miniProgram?.postMessage({
                data: {
                    title: shareData.title,
                    desc: shareData.description,
                    imgUrl: shareData.imageUrl,
                    path: window.location.pathname + window.location.search,
                },
            });
        } catch (error) {
            console.error('Failed to post share data to Mini Program shell:', error);
        }
        return true;
    }

    const title = brandedTitle(shareData.title);
    try {
        // 1. 加载 JS-SDK
        await loadWxJsSdk();

        // 2. 获取签名
        const signData = await getWxSignature(shareData.url);
        if (!signData) {
            console.warn('WeChat signature not available, falling back to default share');
            return false;
        }

        // 3. 配置 wx.config
        window.wx?.config({
            debug: false,
            appId: signData.appId,
            timestamp: signData.timestamp,
            nonceStr: signData.nonceStr,
            signature: signData.signature,
            jsApiList: [
                'updateAppMessageShareData',
                'updateTimelineShareData',
                'hideMenuItems'
            ]
        });

        // 4. 配置分享内容 + 隐藏菜单项（更像原生 App）
        window.wx?.ready(() => {
            // 分享给朋友
            window.wx?.updateAppMessageShareData({
                title,
                desc: shareData.description,
                link: shareData.url,
                imgUrl: shareData.imageUrl,
                success: () => console.log('WeChat share configured'),
                fail: (err) => console.error('WeChat share config failed:', err)
            });

            // 分享到朋友圈
            window.wx?.updateTimelineShareData({
                title,
                desc: shareData.description,
                link: shareData.url,
                imgUrl: shareData.imageUrl,
                success: () => console.log('WeChat timeline share configured'),
                fail: (err) => console.error('WeChat timeline share config failed:', err)
            });

            window.wx?.hideMenuItems({ menuList: WECHAT_MENU_ITEMS_TO_HIDE });
        });

        window.wx?.error((res) => {
            console.error('WeChat JS-SDK error:', res);
        });

        return true;
    } catch (error) {
        console.error('Failed to configure WeChat share:', error);
        return false;
    }
}

/**
 * 更新页面的 Open Graph 元标签
 * 注意：这对微信爬虫无效（因为爬虫不执行 JS），但对其他平台有用
 */
export function updateOpenGraphTags(data: ShareData): void {
    const setMetaTag = (property: string, content: string) => {
        let meta = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement;
        if (!meta) {
            meta = document.createElement('meta');
            meta.setAttribute('property', property);
            document.head.appendChild(meta);
        }
        meta.content = content;
    };

    setMetaTag('og:title', data.title);
    setMetaTag('og:description', data.description);
    setMetaTag('og:image', data.imageUrl);
    setMetaTag('og:url', data.url);
    setMetaTag('og:type', 'article');

    // Twitter Card
    const setTwitterTag = (name: string, content: string) => {
        let meta = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;
        if (!meta) {
            meta = document.createElement('meta');
            meta.setAttribute('name', name);
            document.head.appendChild(meta);
        }
        meta.content = content;
    };

    setTwitterTag('twitter:card', 'summary_large_image');
    setTwitterTag('twitter:title', data.title);
    setTwitterTag('twitter:description', data.description);
    setTwitterTag('twitter:image', data.imageUrl);

    // 更新页面标题
    document.title = `${data.title} - 渥帮 JUSTWEDO`;
}

/**
 * 检测是否在微信浏览器中
 */
export function isWeChatBrowser(): boolean {
    const ua = navigator.userAgent.toLowerCase();
    return ua.includes('micromessenger');
}

// A <web-view> inside a WeChat Mini Program is *also* a WeChat browser
// (isWeChatBrowser() above is true there too), but it can only navigate to
// domains on the mini program's 业务域名 whitelist — currently just
// fdrl.jhtsoft.cn, not justwedo.com. Any redirect-based OAuth flow (WeChat's
// own 网页授权, and this would equally hit Google/Apple) that bounces to
// justwedo.com breaks with WeChat's native "无法打开该页面" error instead of
// working. window.__wxjs_environment is set by the WeChat client itself
// (not something we configure) specifically to distinguish this case.
export function isWeChatMiniProgramWebview(): boolean {
    return (window as any).__wxjs_environment === 'miniprogram';
}

/**
 * 检测是否在移动端
 */
export function isMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}
