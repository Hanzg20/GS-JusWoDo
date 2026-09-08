import { QRCodeSVG } from "qrcode.react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { QR_LOGO_BASE64 } from "@/constants/assets";

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
    brandingSubtitle = "Discover Your Neighborhood"
}: ShareCardProps) => {
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

                {/* Top Branding (White on Dark) */}
                <div className="absolute top-6 left-6 flex items-center gap-2 z-10">
                    <div className="w-8 h-8 bg-white/20 backdrop-blur-md rounded-lg flex items-center justify-center border border-white/30 shadow-sm">
                        <img src="/logo.png" className="w-5 h-5 object-contain brightness-200 invert" alt="Logo" />
                    </div>
                    <div className="flex flex-col text-white drop-shadow-md">
                        <span className="font-extrabold text-sm tracking-tight leading-none">{brandingTitle}</span>
                        <span className="text-[9px] font-medium opacity-80 tracking-widest uppercase mt-0.5">{brandingSubtitle}</span>
                    </div>
                </div>

                {/* Floating Title Card (Premium Magazine Style) */}
                <div className="absolute bottom-0 left-0 right-0 p-6 z-20">
                    <div className="bg-white/95 backdrop-blur-xl p-5 pb-8 rounded-2xl shadow-2xl border border-white/50">
                        {/* Author Pill */}
                        <div className="flex items-center gap-2 mb-3">
                            <Avatar className="w-5 h-5 ring-2 ring-white shadow-sm flex-shrink-0">
                                <AvatarImage src={authorAvatar} crossOrigin="anonymous" />
                                <AvatarFallback className="bg-gray-100 text-[8px] font-bold text-gray-500">
                                    {authorName?.charAt(0)}
                                </AvatarFallback>
                            </Avatar>
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider line-clamp-1 leading-relaxed max-w-[220px] py-0.5">
                                {authorName || 'Gig Neighbor'}
                            </span>
                        </div>

                        {/* Title - Increased bottom spacing and line height stability */}
                        <h2 className="text-xl font-black text-gray-900 leading-normal mb-2 line-clamp-3 tracking-tight pb-1">
                            {title}
                        </h2>

                        {/* Short Excerpt */}
                        <p className="text-xs font-medium text-gray-500 line-clamp-2 leading-relaxed">
                            {content}
                        </p>
                    </div>
                </div>
            </div>

            {/* 3. Footer / QR Section */}
            <div className="p-6 mt-0 bg-white space-y-3">
                {/* Bottom branding — repeats the logo/name from the top so
                    the card still reads as "from JustWeDo" if someone only
                    sees this half (e.g. a cropped screenshot, or scrolling
                    past the hero image first) — the whole point of this
                    poster over a plain link is that it's recognizable at a
                    glance, 小红书-style. */}
                <div className="flex items-center gap-2">
                    <img src="/logo.png" className="w-6 h-6 rounded-md object-contain" alt="" />
                    <div className="flex flex-col leading-none">
                        <span className="font-extrabold text-sm text-gray-900 tracking-tight">{brandingTitle}</span>
                        <span className="text-[9px] font-medium text-gray-400 tracking-widest uppercase mt-0.5">{brandingSubtitle}</span>
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
