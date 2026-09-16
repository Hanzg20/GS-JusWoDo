import { QRCodeSVG } from "qrcode.react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { QR_LOGO_BASE64 } from "@/constants/assets";
import { useConfigStore } from "@/stores/configStore";

interface ShareCardProps {
    title: string;
    content: string;
    imageUrl?: string;
    authorName?: string;
    authorAvatar?: string;
    qrUrl: string;
    id?: string; // DOM ID for capture
    brandingTitle?: string;
    brandingSubtitle?: string;
}

export const ShareCard = ({
    title,
    content,
    imageUrl,
    authorName,
    authorAvatar,
    qrUrl,
    id = "share-card",
    brandingTitle = "渥帮 JUSTWEDO",
    brandingSubtitle
}: ShareCardProps) => {
    const { language } = useConfigStore();
    // Only one spot on the card should carry the tagline — repeating it
    // top and bottom said the same thing twice and wasted space. The top
    // (over the photo) is a glance-only watermark: name is enough to read
    // "this is JWD" at a glance, a full tagline there competes with the
    // photo for no real benefit. The bottom, right next to the QR code, is
    // the actual decision point — that's where a reason-to-scan line earns
    // its space, not a static slogan restating the brand name.
    //
    // Copy is the official 2026-09-15 brand tagline (see SEO.tsx's
    // defaultTitle for the same source-of-truth wording) — a value
    // statement, not a per-audience recruiting pitch like "找商家找达人找
    // 客户来渥帮"; that kind of enumeration fits a dedicated invite poster
    // whose whole purpose is recruitment, not a poster attached to one
    // specific piece of content.
    const footerTagline = brandingSubtitle ?? (language === 'zh' ? '连接邻里 · 发现专业' : 'Connect · Help · Grow');
    return (
        <div
            id={id}
            className="w-[375px] bg-white relative overflow-hidden"
            style={{
                fontFamily: "'Inter', system-ui, sans-serif",
                backgroundColor: '#ffffff' // Explicit for html2canvas
            }}
        >
            {/* 1. Immersive Header Image Area using Background Image to prevent stretching */}
            <div
                className="relative w-full aspect-[4/5] bg-gray-100 bg-cover bg-center bg-no-repeat"
                style={{
                    backgroundImage: imageUrl ? `url("${imageUrl}")` : undefined
                }}
            >
                {!imageUrl && (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-200 text-gray-400">
                        <span className="text-4xl mb-2">✨</span>
                        <span className="text-xs font-medium tracking-widest uppercase">JustWeDo Moment</span>
                    </div>
                )}

                {/* Gradient Overlay for Text Protection */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/70" />

                {/* Top Branding (White on Dark) — name only, a glance-only
                    watermark over the photo. The tagline lives at the
                    bottom instead, see footerTagline above. */}
                <div className="absolute top-6 left-6 flex items-center gap-2 z-10">
                    <div className="w-8 h-8 bg-white/20 backdrop-blur-md rounded-lg flex items-center justify-center border border-white/30 shadow-sm">
                        <img src="/logo.png" className="w-5 h-5 object-contain brightness-200 invert" alt="Logo" />
                    </div>
                    <span className="font-extrabold text-sm tracking-tight text-white drop-shadow-md">{brandingTitle}</span>
                </div>

                {/* Floating Title Card (Premium Magazine Style) — kept
                    deliberately compact so it doesn't eat too much of the
                    hero image's lower half; the image is the draw, the card
                    is a caption over it, not the other way around. The
                    excerpt line was dropped entirely (not just shrunk) so
                    the title can keep 3 full lines without the card growing
                    back to its original height — a real post title (tested
                    against a 40-char one) needs those 3 lines to avoid
                    getting cut off mid-sentence, and a fully-readable title
                    matters more on a poster than a redundant excerpt the
                    full page already shows. */}
                <div className="absolute bottom-0 left-0 right-0 p-5 z-20">
                    <div className="bg-white/95 backdrop-blur-xl p-3.5 pb-4 rounded-2xl shadow-2xl border border-white/50">
                        {/* Avatar + title share one row — avatar on the
                            left, title (still up to 3 full lines) and the
                            author name stacked to its right — instead of
                            a separate author-pill row stacked above the
                            title, which cost an extra row of height. */}
                        <div className="flex items-start gap-2.5">
                            <Avatar className="w-9 h-9 ring-2 ring-white shadow-sm flex-shrink-0 mt-0.5">
                                <AvatarImage src={authorAvatar} crossOrigin="anonymous" />
                                <AvatarFallback className="bg-gray-100 text-xs font-bold text-gray-500">
                                    {authorName?.charAt(0)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                                <h2 className="text-base font-black text-gray-900 leading-snug line-clamp-3 tracking-tight">
                                    {title}
                                </h2>
                                <span className="block mt-1 text-[10px] font-bold text-gray-500 uppercase tracking-wider truncate">
                                    {authorName || 'Gig Neighbor'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. Footer / QR Section */}
            <div className="p-6 mt-0 bg-white space-y-3">
                {/* Bottom branding — repeats the name (not the tagline)
                    from the top so the card still reads as "from JustWeDo"
                    if someone only sees this half (e.g. a cropped
                    screenshot, or scrolling past the hero image first).
                    The second line here is footerTagline, a reason-to-scan
                    line, not a repeat of the top's watermark. */}
                <div className="flex items-center gap-2">
                    <img src="/logo.png" className="w-6 h-6 rounded-md object-contain" alt="" />
                    <div className="flex flex-col leading-none">
                        <span className="font-extrabold text-sm text-gray-900 tracking-tight">{brandingTitle}</span>
                        {/* No uppercase/wide-tracking here — footerTagline
                            defaults to Chinese now, where both read oddly. */}
                        <span className="text-[10px] font-medium text-gray-400 tracking-wide mt-0.5">{footerTagline}</span>
                    </div>
                </div>
                <div className="bg-gray-50 rounded-2xl p-4 flex items-center justify-between border border-gray-100">
                    <div className="flex flex-col gap-1">
                        <span className="text-xs font-black text-gray-900 tracking-tight">SCAN TO VIEW</span>
                        <span className="text-[10px] text-gray-500 font-medium max-w-[140px]">
                            Long press to identify QR code and view details
                        </span>
                    </div>
                    <div className="bg-white p-1.5 rounded-xl shadow-sm border border-gray-100 flex-shrink-0">
                        <QRCodeSVG
                            value={qrUrl}
                            size={52}
                            level="H"
                            imageSettings={{
                                src: QR_LOGO_BASE64,
                                x: undefined,
                                y: undefined,
                                height: 16,
                                width: 16,
                                excavate: true,
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Decorative bottom bar */}
            <div className="h-1.5 w-full bg-gradient-to-r from-primary/80 to-primary/40" />
        </div>
    );
};
