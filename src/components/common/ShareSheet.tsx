import { useRef, useState } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger, DrawerDescription } from "@/components/ui/drawer";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Link2, Download, Share2, Check, Image as ImageIcon, Loader2, ArrowLeft } from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import { ShareCard } from "./ShareCard";
import { useConfigStore } from "@/stores/configStore";
import { getShareUrl } from "@/utils/url";
import { QR_LOGO_BASE64 } from "@/constants/assets";
import { isWeChatBrowser } from "@/lib/wechatShare";

// Social platform icons as SVG components
const WeChatIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 0 1-.023-.156.49.49 0 0 1 .201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-6.656-6.088v-.035h-.406zm-1.961 3.445c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.969-.982z" />
    </svg>
);

const WeChatMomentsIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
        <circle cx="12" cy="8" r="1.5" />
        <circle cx="8" cy="14" r="1.5" />
        <circle cx="16" cy="14" r="1.5" />
        <path d="M12 10v6M9 13l3 3 3-3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const WhatsAppIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
);

interface ShareSheetProps {
    title: string;
    content: string;
    url?: string;
    imageUrl?: string;
    authorName?: string;
    authorAvatar?: string;
    trigger?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    brandingTitle?: string;
    brandingSubtitle?: string;
    // Set by pages that already call configWxShare() for this exact item
    // (ServiceDetail.tsx, CommunityPostDetail.tsx) — meaning WeChat's own
    // "···" menu is already configured with this item's real title/desc,
    // not generic site defaults. Only then is it safe to point the user at
    // "···" instead of generating a poster: it's the one truly one-tap
    // native share (a webpage button can never trigger WeChat's send-to-
    // contact UI itself, only configure what "···" produces), but pointing
    // at it when the page hasn't configured real content would show a
    // generic/wrong card instead.
    nativeShareReady?: boolean;
}

export function ShareSheet({
    title,
    content,
    url = window.location.href,
    imageUrl,
    authorName,
    authorAvatar,
    trigger,
    open,
    onOpenChange,
    brandingTitle,
    brandingSubtitle,
    nativeShareReady = false
}: ShareSheetProps) {
    const isDesktop = useMediaQuery("(min-width: 768px)");
    const { language } = useConfigStore();
    const [isOpen, setIsOpen] = useState(false);

    // Construct robust share URL
    // 1. Use URL prop if provided
    // 2. Use VITE_SITE_URL env var + current path if available (Good for prod/canonical)
    // 3. Fallback to window.location.href (cleaned of hash/queries if needed, but keeping simple for now)
    const getShareUrl = () => {
        if (url && url !== window.location.href) return url;

        const baseUrl = import.meta.env.VITE_SITE_URL || window.location.origin;
        // Construct canonical URL: Base + Path (strips query params by default for cleaner QR, unless logic demands otherwise)
        // For product details, ID is usually in path.
        const path = window.location.pathname;

        // Remove trailing slash if double
        const cleanPath = path.startsWith('/') && baseUrl.endsWith('/') ? path.slice(1) : path;
        return `${baseUrl}${cleanPath}`;
    };

    const shareUrl = getShareUrl();

    const hasControlledOpen = open !== undefined;
    const show = hasControlledOpen ? open : isOpen;
    const setShow = hasControlledOpen ? onOpenChange! : setIsOpen;

    const [copiedLink, setCopiedLink] = useState(false);
    const [copiedText, setCopiedText] = useState(false);

    // Poster State
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const cardRef = useRef<HTMLDivElement>(null);

    const combinedText = `【${title}】\n${content}\n----------------\n${language === 'zh' ? '链接' : 'Link'}：${shareUrl}`;

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopiedLink(true);
            toast.success(language === 'zh' ? "链接已复制" : "Link copied");
            setTimeout(() => setCopiedLink(false), 2000);
        } catch (err) {
            toast.error(language === 'zh' ? "复制失败" : "Copy failed");
        }
    };

    const handleCopyText = async () => {
        try {
            await navigator.clipboard.writeText(combinedText);
            setCopiedText(true);
            toast.success(language === 'zh' ? "口令文本已复制" : "Text copied");
            setTimeout(() => setCopiedText(false), 2000);
        } catch (err) {
            toast.error(language === 'zh' ? "复制失败" : "Copy failed");
        }
    };

    const handleGeneratePoster = async () => {
        setIsGenerating(true);
        try {
            const element = cardRef.current;
            if (!element) throw new Error("Card element not found");

            // Wait for images and layout
            await new Promise(resolve => setTimeout(resolve, 300));

            const canvas = await html2canvas(element, {
                useCORS: true,
                scale: 2,
                backgroundColor: '#ffffff',
                logging: false,
                width: 375,
                height: element.offsetHeight,
                windowWidth: 375,
                onclone: (clonedDoc) => {
                    const clonedElement = clonedDoc.querySelector('[data-share-card]');
                    if (clonedElement instanceof HTMLElement) {
                        clonedElement.style.visibility = 'visible';
                        clonedElement.style.position = 'static';
                        // Force QR render in clone if needed, but ShareCard handles it via props
                    }
                }
            });

            const dataUrl = canvas.toDataURL('image/png');
            setGeneratedImage(dataUrl);
            toast.success(language === 'zh' ? "海报生成成功" : "Poster generated");
        } catch (error) {
            console.error("Poster generation failed:", error);
            toast.error(language === 'zh' ? "海报生成失败，请重试" : "Failed to generate poster");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDownloadImage = () => {
        if (!generatedImage) return;
        const link = document.createElement('a');
        const safeTitle = title.slice(0, 10).replace(/[^a-z0-9\u4e00-\u9fa5]/gi, '_');
        link.href = generatedImage;
        link.download = `GigNeighbor_${safeTitle}_${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Social sharing handlers
    //
    // A page button can never trigger WeChat's own send-to-contact UI —
    // only a user tapping WeChat's native "···" menu can do that; JS-SDK
    // only lets us configure what "···" produces, not invoke it. So there
    // are exactly two options for "分享到微信"/"朋友圈", and which one is
    // right depends on whether "···" is actually available and correctly
    // configured for this exact item right now:
    //
    // - Inside WeChat's in-app browser, on a page that already called
    //   configWxShare() for this exact item (nativeShareReady — see
    //   ServiceDetail.tsx/CommunityPostDetail.tsx), "···" is the real
    //   one-tap native path with accurate item-specific content, so we just
    //   point the visitor at it instead of making them go through a manual
    //   generate-save-send flow.
    // - Everywhere else (not in WeChat's browser at all, or nativeShareReady
    //   is false because this page/card never configured "···" for this
    //   item — e.g. ProviderHero, CommunityCardV2 — so "···" would show
    //   generic/wrong content), "···" isn't a usable option, so fall back to
    //   generating the branded poster (ShareCard.tsx) for the visitor to
    //   save and send themselves. This was also the deliberate choice after
    //   real user feedback (2026-09-08) that an early attempt at routing
    //   "分享到微信" through "···" produced a card that read as generic/too
    //   small — since traced to that attempt not being gated on
    //   nativeShareReady, so "···" wasn't actually configured correctly yet.
    const canUseNativeMenu = nativeShareReady && isWeChatBrowser();

    const handleShareToWeChat = async () => {
        if (canUseNativeMenu) {
            toast.info(
                language === 'zh' ? "请点击右上角「···」分享给好友" : 'Tap "···" in the top-right corner to share',
                { duration: 4000 }
            );
            return;
        }
        if (!generatedImage) {
            await handleGeneratePoster();
        }
        toast.info(
            language === 'zh'
                ? "长按图片保存后，在微信中发送给好友"
                : "Save the image, then send it to a friend in WeChat",
            { duration: 4000 }
        );
    };

    const handleShareToMoments = async () => {
        if (canUseNativeMenu) {
            toast.info(
                language === 'zh' ? "请点击右上角「···」分享到朋友圈" : 'Tap "···" in the top-right corner to share to Moments',
                { duration: 4000 }
            );
            return;
        }
        if (!generatedImage) {
            await handleGeneratePoster();
        }
        toast.info(
            language === 'zh'
                ? "请保存海报后，在微信朋友圈中选择图片发送"
                : "Save the poster and share it in WeChat Moments",
            { duration: 4000 }
        );
    };

    const handleShareToWhatsApp = () => {
        const whatsappText = `${title}\n\n${content.slice(0, 200)}${content.length > 200 ? '...' : ''}\n\n${shareUrl}`;
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(whatsappText)}`;
        window.open(whatsappUrl, '_blank');
    };

    // Render share content (shared between Dialog and Drawer)
    const renderShareContent = () => (
        <div className="p-4 space-y-5">
            {/* Hidden Source Card */}
            <div
                className="fixed pointer-events-none opacity-0"
                style={{ left: '-9999px', top: '0' }}
            >
                <div ref={cardRef} data-share-card>
                    <ShareCard
                        title={title}
                        content={content}
                        imageUrl={imageUrl}
                        authorName={authorName || 'Gig Neighbor'}
                        authorAvatar={authorAvatar}
                        qrUrl={shareUrl}
                        brandingTitle={brandingTitle}
                        brandingSubtitle={brandingSubtitle}
                    />
                </div>
            </div>

            {generatedImage ? (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                    <div className="relative rounded-xl overflow-hidden shadow-lg border">
                        <img src={generatedImage} alt="Share Poster" className="w-full h-auto" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Button variant="outline" onClick={() => setGeneratedImage(null)}>
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            {language === 'zh' ? '返回选项' : 'Back'}
                        </Button>
                        <Button onClick={handleDownloadImage} className="font-bold">
                            <Download className="w-4 h-4 mr-2" />
                            {language === 'zh' ? '保存图片' : 'Save Image'}
                        </Button>
                    </div>
                    <p className="text-center text-xs text-muted-foreground">
                        {language === 'zh' ? '长按图片也可直接保存发送给朋友' : 'Long press image to save and share'}
                    </p>
                </div>
            ) : (
                <>
                    {/* Preview Card */}
                    <div className="bg-muted/30 rounded-xl p-3 flex gap-3 items-start">
                        <div className="w-16 h-16 bg-muted rounded-lg flex-shrink-0 overflow-hidden">
                            {imageUrl ? (
                                <img src={imageUrl} alt="preview" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-2xl">📝</div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0 space-y-0.5">
                            <h4 className="font-bold text-sm line-clamp-1">{title}</h4>
                            <p className="text-xs text-muted-foreground line-clamp-2">{content}</p>
                        </div>
                    </div>

                    {/* Social Platform Section */}
                    <div className="space-y-3">
                        <h5 className="text-xs font-semibold text-muted-foreground px-1">
                            {language === 'zh' ? '分享到' : 'Share to'}
                        </h5>
                        <div className="flex justify-center gap-6">
                            {/* WeChat */}
                            <button
                                onClick={handleShareToWeChat}
                                className="flex flex-col items-center gap-1.5 group"
                            >
                                <div className="w-12 h-12 rounded-full bg-[#07C160] text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
                                    <WeChatIcon />
                                </div>
                                <span className="text-xs font-medium">{language === 'zh' ? '微信' : 'WeChat'}</span>
                            </button>

                            {/* WeChat Moments */}
                            <button
                                onClick={handleShareToMoments}
                                className="flex flex-col items-center gap-1.5 group"
                            >
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#07C160] to-[#00a14b] text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
                                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                        <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
                                        <circle cx="7" cy="10" r="1.2" />
                                        <circle cx="12" cy="7" r="1.2" />
                                        <circle cx="17" cy="10" r="1.2" />
                                        <circle cx="9" cy="15" r="1.2" />
                                        <circle cx="15" cy="15" r="1.2" />
                                    </svg>
                                </div>
                                <span className="text-xs font-medium">{language === 'zh' ? '朋友圈' : 'Moments'}</span>
                            </button>

                            {/* WhatsApp */}
                            <button
                                onClick={handleShareToWhatsApp}
                                className="flex flex-col items-center gap-1.5 group"
                            >
                                <div className="w-12 h-12 rounded-full bg-[#25D366] text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
                                    <WhatsAppIcon />
                                </div>
                                <span className="text-xs font-medium">WhatsApp</span>
                            </button>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs">
                            <span className="bg-background px-2 text-muted-foreground">
                                {language === 'zh' ? '或' : 'or'}
                            </span>
                        </div>
                    </div>

                    {/* Utility Actions */}
                    <div className="grid grid-cols-3 gap-3">
                        <Button
                            variant="outline"
                            className="h-auto flex-col py-3 gap-1.5 border hover:bg-muted/50 transition-all"
                            onClick={handleCopyLink}
                        >
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${copiedLink ? 'bg-green-100 text-green-600' : 'bg-muted'}`}>
                                {copiedLink ? <Check className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
                            </div>
                            <span className="text-xs font-medium">{language === 'zh' ? '复制链接' : 'Copy Link'}</span>
                        </Button>

                        <Button
                            variant="outline"
                            className="h-auto flex-col py-3 gap-1.5 border hover:bg-muted/50 transition-all"
                            onClick={handleCopyText}
                        >
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${copiedText ? 'bg-green-100 text-green-600' : 'bg-muted'}`}>
                                {copiedText ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            </div>
                            <span className="text-xs font-medium">{language === 'zh' ? '复制口令' : 'Copy Text'}</span>
                        </Button>

                        <Button
                            variant="outline"
                            className="h-auto flex-col py-3 gap-1.5 border hover:bg-muted/50 transition-all"
                            onClick={handleGeneratePoster}
                            disabled={isGenerating}
                        >
                            <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                            </div>
                            <span className="text-xs font-medium">{language === 'zh' ? '生成海报' : 'Poster'}</span>
                        </Button>
                    </div>

                    {/* QR Code */}
                    <div className="flex justify-center pt-1">
                        <div className="flex flex-col items-center gap-1.5 opacity-60">
                            <div className="bg-white p-1.5 rounded-lg shadow-sm">
                                <QRCodeSVG
                                    value={shareUrl}
                                    size={48}
                                    level="H"
                                    imageSettings={{
                                        src: QR_LOGO_BASE64,
                                        x: undefined,
                                        y: undefined,
                                        height: 12,
                                        width: 12,
                                        excavate: true,
                                    }}
                                />
                            </div>
                            <span className="text-[10px] text-muted-foreground">{language === 'zh' ? '扫码查看' : 'Scan to view'}</span>
                        </div>
                    </div>
                </>
            )}

            <Button variant="ghost" className="w-full rounded-full text-muted-foreground" onClick={() => setShow(false)}>
                {language === 'zh' ? '关闭' : 'Close'}
            </Button>
        </div>
    );

    if (isDesktop) {
        return (
            <Dialog open={show} onOpenChange={setShow}>
                <DialogTrigger asChild>
                    {trigger || (
                        <Button variant="ghost" size="icon">
                            <Share2 className="w-5 h-5" />
                        </Button>
                    )}
                </DialogTrigger>
                <DialogContent className="sm:max-w-md rounded-3xl p-0">
                    <DialogHeader className="p-4 pb-0">
                        <DialogTitle className="text-center font-black text-lg">
                            {generatedImage
                                ? (language === 'zh' ? '保存海报' : 'Save Poster')
                                : (language === 'zh' ? '分享给邻居' : 'Share with Neighbors')}
                        </DialogTitle>
                        <DialogDescription className="sr-only">
                            {language === 'zh' ? '分享详情至社交平台或保存海报' : 'Share to social platforms or save poster'}
                        </DialogDescription>
                    </DialogHeader>
                    {renderShareContent()}
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Drawer open={show} onOpenChange={setShow}>
            <DrawerTrigger asChild>
                {trigger || (
                    <Button variant="ghost" size="icon">
                        <Share2 className="w-5 h-5" />
                    </Button>
                )}
            </DrawerTrigger>
            <DrawerContent className="rounded-t-3xl max-h-[85vh]">
                <DrawerHeader className="text-center pb-0">
                    <DrawerTitle className="font-black text-lg">
                        {generatedImage
                            ? (language === 'zh' ? '保存海报' : 'Save Poster')
                            : (language === 'zh' ? '分享给邻居' : 'Share with Neighbors')}
                    </DrawerTitle>
                    <DrawerDescription className="sr-only">
                        {language === 'zh' ? '分享详情至社交平台或保存海报' : 'Share to social platforms or save poster'}
                    </DrawerDescription>
                </DrawerHeader>
                <div className="overflow-y-auto">
                    {renderShareContent()}
                </div>
            </DrawerContent>
        </Drawer>
    );
}
