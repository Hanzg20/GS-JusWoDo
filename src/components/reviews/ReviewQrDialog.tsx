import { useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { QRCodeCanvas } from "qrcode.react";
import { Copy, Check, Download, Star } from "lucide-react";
import { toast } from "sonner";
import { useConfigStore } from "@/stores/configStore";
import { getShareUrl } from "@/utils/url";
import { QR_LOGO_BASE64 } from "@/constants/assets";

interface ReviewQrDialogProps {
    listingId: string;
    listingTitle: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

// Google Business Profile lets a merchant generate a QR code / short link
// that customers scan to leave a review directly, no prior "verified
// order" required — this is JWD's equivalent, pointed at
// /leave-review/:listingId (see LeaveReview.tsx), meant to be printed at
// the counter or sent in a text after a job is done.
export function ReviewQrDialog({ listingId, listingTitle, open, onOpenChange }: ReviewQrDialogProps) {
    const { language } = useConfigStore();
    const isZh = language === 'zh';
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [copied, setCopied] = useState(false);

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

    const handleDownload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const link = document.createElement('a');
        const safeTitle = listingTitle.slice(0, 20).replace(/[^a-z0-9一-龥]/gi, '_');
        link.href = canvas.toDataURL('image/png');
        link.download = `JustWeDo_Review_QR_${safeTitle}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-sm rounded-3xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-lg font-black">
                        <Star className="w-5 h-5 text-secondary fill-secondary" />
                        {isZh ? '获取客户评价' : 'Get Customer Reviews'}
                    </DialogTitle>
                    <DialogDescription>
                        {isZh
                            ? `把这个二维码分享给完成服务的客户，方便TA直接为「${listingTitle}」留下评价——不需要TA在平台内下单。`
                            : `Share this with customers after a job for "${listingTitle}" — they can leave a review directly, no platform order required.`}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col items-center gap-4 py-2">
                    <div className="bg-white p-3 rounded-2xl border shadow-sm">
                        <QRCodeCanvas
                            ref={canvasRef}
                            value={reviewUrl}
                            size={220}
                            level="H"
                            includeMargin={false}
                            imageSettings={{
                                src: QR_LOGO_BASE64,
                                height: 40,
                                width: 40,
                                excavate: true,
                            }}
                        />
                    </div>

                    <div className="w-full bg-muted/30 rounded-xl px-3 py-2 text-xs font-mono text-muted-foreground truncate text-center">
                        {reviewUrl}
                    </div>

                    <div className="grid grid-cols-2 gap-3 w-full">
                        <Button variant="outline" onClick={handleCopyLink} className="rounded-xl font-bold">
                            {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                            {isZh ? '复制链接' : 'Copy Link'}
                        </Button>
                        <Button onClick={handleDownload} className="rounded-xl font-bold">
                            <Download className="w-4 h-4 mr-2" />
                            {isZh ? '保存二维码' : 'Save QR Code'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
