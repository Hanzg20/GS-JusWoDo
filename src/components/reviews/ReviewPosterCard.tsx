import { QRCodeSVG } from "qrcode.react";
import { QR_LOGO_BASE64 } from "@/constants/assets";

interface ReviewPosterCardProps {
    listingTitle: string;
    businessName?: string;
    reviewUrl: string;
    isZh: boolean;
    id?: string; // DOM id for html2canvas capture
}

// A printable "please review us" card — table-tent/counter-card style, the
// same idea as the small QR sign every Google Business Profile merchant
// prints out. A bare QR code with no context is easy to ignore; a headline
// plus a reason to bother is what actually gets a customer to pull out
// their phone.
export const ReviewPosterCard = ({
    listingTitle,
    businessName,
    reviewUrl,
    isZh,
    id = "review-poster-card",
}: ReviewPosterCardProps) => {
    return (
        <div
            id={id}
            className="w-[375px] bg-white relative overflow-hidden"
            style={{
                fontFamily: "'Inter', system-ui, sans-serif",
                backgroundColor: '#ffffff',
            }}
        >
            {/* Brand header bar */}
            <div className="bg-gradient-to-br from-primary to-primary/80 px-8 pt-8 pb-6 text-center">
                <div className="flex items-center justify-center gap-2 mb-6">
                    <div className="w-8 h-8 bg-white/20 backdrop-blur-md rounded-lg flex items-center justify-center border border-white/30">
                        <img src="/logo.png" className="w-5 h-5 object-contain brightness-200 invert" alt="" />
                    </div>
                    <span className="font-extrabold text-sm tracking-tight text-white">渥帮 JUSTWEDO</span>
                </div>
                <div className="text-3xl mb-2">⭐️⭐️⭐️⭐️⭐️</div>
                <h1 className="text-2xl font-black text-white leading-tight tracking-tight">
                    {isZh ? '喜欢我们的服务吗？' : 'Enjoyed our service?'}
                </h1>
                <p className="text-sm font-medium text-white/90 mt-2 leading-relaxed px-2">
                    {isZh
                        ? '扫码给个评价，您的一句话就是对本地生意最大的支持！'
                        : 'Scan to leave a review — your words are the biggest support for a local business!'}
                </p>
            </div>

            {/* QR + listing info */}
            <div className="px-8 pt-6 pb-8 flex flex-col items-center">
                <div className="bg-white p-3 rounded-2xl border-2 border-muted shadow-lg mb-5">
                    <QRCodeSVG
                        value={reviewUrl}
                        size={190}
                        level="H"
                        imageSettings={{
                            src: QR_LOGO_BASE64,
                            x: undefined,
                            y: undefined,
                            height: 36,
                            width: 36,
                            excavate: true,
                        }}
                    />
                </div>

                <h2 className="text-lg font-black text-gray-900 text-center leading-snug mb-2">
                    {listingTitle}
                </h2>
                {businessName && (
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                        {businessName}
                    </p>
                )}

                <div className="w-full mt-6 bg-gray-50 rounded-2xl px-4 py-3 text-center">
                    <p className="text-xs font-bold text-gray-500">
                        {isZh ? '打开手机相机，对准二维码扫一扫' : 'Open your phone camera and scan the code'}
                    </p>
                </div>
            </div>

            {/* Footer */}
            <div className="px-8 pb-8 text-center">
                <p className="text-[11px] font-medium text-gray-400">
                    {isZh ? '感谢您的支持 · Thank you for your support' : 'Thank you for supporting local business'}
                </p>
            </div>

            <div className="h-1.5 w-full bg-gradient-to-r from-primary/80 to-primary/40" />
        </div>
    );
};
