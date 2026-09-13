import { useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Check, Download, Star, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import { useConfigStore } from "@/stores/configStore";
import { getShareUrl } from "@/utils/url";
import { QR_LOGO_BASE64 } from "@/constants/assets";
import { ReviewPosterCard } from "./ReviewPosterCard";

interface ReviewQrDialogProps {
    listingId: string;
    listingTitle: string;
    businessName?: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

// Google Business Profile lets a merchant generate a QR code / short link
// that customers scan to leave a review directly, no prior "verified
// order" required — this is JWD's equivalent, pointed at
// /leave-review/:listingId (see LeaveReview.tsx). The "download" action
// produces a printable card (ReviewPosterCard) rather than a bare QR image
// — a QR code with no context sitting on a counter gets ignored; a
// headline and a reason to bother is what actually gets scanned.
export function ReviewQrDialog({ listingId, listingTitle, businessName, open, onOpenChange }: ReviewQrDialogProps) {
    const { language } = useConfigStore();
    const isZh = language === 'zh';
    const [copied, setCopied] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [posterImage, setPosterImage] = useState<string | null>(null);
    const posterRef = useRef<HTMLDivElement>(null);

    const reviewUrl = getShareUrl(`/leave-review/${listingId}`);

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(reviewUrl);
            setCopied(true);
            toast.success(isZh ? '链接已复制' : 'Link copied');
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error(isZh ? '复制失败' : 'Copy failed');
        }
    };

    const handleGeneratePoster = async () => {
        setIsGenerating(true);
        try {
            const element = posterRef.current;
            if (!element) throw new Error("Poster element not found");

            await new Promise(resolve => setTimeout(resolve, 300));

            const canvas = await html2canvas(element, {
                useCORS: true,
                scale: 2,
                backgroundColor: '#ffffff',
                logging: false,
                width: 375,
                height: element.offsetHeight,
                windowWidth: 375,
            });

            setPosterImage(canvas.toDataURL('image/png'));
        } catch (error) {
            console.error("Poster generation failed:", error);
            toast.error(isZh ? '海报生成失败，请重试' : 'Failed to generate poster, please try again');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDownloadPoster = () => {
        if (!posterImage) return;
        const link = document.createElement('a');
        const safeTitle = listingTitle.slice(0, 20).replace(/[^a-z0-9一-龥]/gi, '_');
        link.href = posterImage;
        link.download = `JustWeDo_Review_${safeTitle}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleClose = (next: boolean) => {
        if (!next) setPosterImage(null);
        onOpenChange(next);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-sm rounded-3xl overflow-hidden">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-lg font-black">
                        <Star className="w-5 h-5 text-secondary fill-secondary" />
                        {isZh ? '获取客户评价' : 'Get Customer Reviews'}
                    </DialogTitle>
                    <DialogDescription>
                        {isZh
                            ? `把这张海报打印出来或分享给客户，方便TA直接为「${listingTitle}」留下评价——不需要TA在平台内下单。`
                            : `Print this card or share it with customers — they can leave a review for "${listingTitle}" directly, no platform order required.`}
                    </DialogDescription>
                </DialogHeader>

                {/* Hidden source poster used only for html2canvas capture */}
                <div className="fixed pointer-events-none opacity-0" style={{ left: '-9999px', top: 0 }}>
                    <div ref={posterRef}>
                        <ReviewPosterCard
                            listingTitle={listingTitle}
                            businessName={businessName}
                            reviewUrl={reviewUrl}
                            isZh={isZh}
                        />
                    </div>
                </div>

                <div className="flex flex-col items-center gap-4 py-2 min-w-0">
                    {posterImage ? (
                        <div className="w-full space-y-4 animate-in fade-in slide-in-from-bottom-4">
                            <div className="relative rounded-xl overflow-hidden shadow-lg border">
                                <img src={posterImage} alt="Review poster" className="w-full h-auto" />
                            </div>
                            <div className="grid grid-cols-2 gap-3 w-full">
                                <Button variant="outline" onClick={() => setPosterImage(null)} className="rounded-xl font-bold">
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    {isZh ? '返回' : 'Back'}
                                </Button>
                                <Button onClick={handleDownloadPoster} className="rounded-xl font-bold">
                                    <Download className="w-4 h-4 mr-2" />
                                    {isZh ? '保存图片' : 'Save Image'}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="bg-white p-3 rounded-2xl border shadow-sm">
                                <QRCodeSVG
                                    value={reviewUrl}
                                    size={220}
                                    level="H"
                                    includeMargin={false}
                                    imageSettings={{
                                        src: QR_LOGO_BASE64,
                                        x: undefined,
                                        y: undefined,
                                        height: 40,
                                        width: 40,
                                        excavate: true,
                                    }}
                                />
                            </div>

                            <div className="w-full min-w-0 overflow-hidden bg-muted/30 rounded-xl px-3 py-2 text-xs font-mono text-muted-foreground truncate text-center">
                                {reviewUrl}
                            </div>

                            <div className="grid grid-cols-2 gap-3 w-full">
                                <Button variant="outline" onClick={handleCopyLink} className="rounded-xl font-bold">
                                    {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                                    {isZh ? '复制链接' : 'Copy Link'}
                                </Button>
                                <Button onClick={handleGeneratePoster} disabled={isGenerating} className="rounded-xl font-bold">
                                    {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                                    {isZh ? '生成打印海报' : 'Get Poster'}
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
