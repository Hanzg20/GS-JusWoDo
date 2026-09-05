import { useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, Heart, Share2, Flag } from "lucide-react";
import { ShareSheet } from "@/components/common/ShareSheet";
import { ReportDialog } from "@/components/common/ReportDialog";
import { useNavigate } from "react-router-dom";

interface ServiceHeroProps {
    listingId: string;
    images: string[];
    title: string;
    description: string;
    providerName?: string;
    providerId?: string;
    isLiked: boolean;
    onLikeToggle: () => void;
}

export function ServiceHero({
    listingId,
    images,
    title,
    description,
    providerName = "Gig Neighbor",
    providerId,
    isLiked,
    onLikeToggle
}: ServiceHeroProps) {
    const navigate = useNavigate();
    const [currentImage, setCurrentImage] = useState(0);

    const nextImage = () => setCurrentImage((prev) => (prev + 1) % images.length);
    const prevImage = () => setCurrentImage((prev) => (prev - 1 + images.length) % images.length);

    if (!images || images.length === 0) return null;

    return (
        <div className="relative h-80 md:h-[450px] bg-muted overflow-hidden">
            <img
                src={images[currentImage]}
                alt={title}
                className="w-full h-full object-cover transition-transform duration-1000"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-black/20" />

            {/* Glassmorphism Header */}
            <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-20">
                <button
                    onClick={() => navigate(-1)}
                    className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-xl border border-white/30 hover:bg-white/40 transition-all hover:scale-105 active:scale-95"
                >
                    <ArrowLeft className="w-5 h-5 text-white" />
                </button>
                <div className="flex gap-2">
                    <button
                        onClick={onLikeToggle}
                        className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-xl border border-white/30 hover:bg-white/40 transition-all hover:scale-105 active:scale-95"
                    >
                        <Heart className={`w-5 h-5 transition-colors ${isLiked ? 'fill-accent text-accent' : 'text-white'}`} />
                    </button>
                    <ShareSheet
                        title={title}
                        content={description}
                        imageUrl={images[currentImage]}
                        authorName={providerName}
                        authorAvatar={providerId ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${providerId}` : undefined}
                        trigger={
                            <button className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-xl border border-white/30 hover:bg-white/40 transition-all hover:scale-105 active:scale-95">
                                <Share2 className="w-5 h-5 text-white" />
                            </button>
                        }
                    />
                    <ReportDialog
                        targetType="LISTING"
                        targetId={listingId}
                        trigger={
                            <button className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-xl border border-white/30 hover:bg-white/40 transition-all hover:scale-105 active:scale-95">
                                <Flag className="w-5 h-5 text-white" />
                            </button>
                        }
                    />
                </div>
            </div>

            {/* Carousel Navigation */}
            {images.length > 1 && (
                <>
                    <button onClick={prevImage} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center hover:bg-black/50 transition-all z-10 hover:scale-110">
                        <ChevronLeft className="w-6 h-6 text-white" />
                    </button>
                    <button onClick={nextImage} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center hover:bg-black/50 transition-all z-10 hover:scale-110">
                        <ChevronRight className="w-6 h-6 text-white" />
                    </button>
                </>
            )}

            {/* Carousel Indicators */}
            {images.length > 1 && (
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-1.5 px-3 py-1.5 bg-black/30 backdrop-blur-md rounded-full border border-white/10 z-10">
                    {images.map((_, i) => (
                        <div
                            key={i}
                            onClick={() => setCurrentImage(i)}
                            className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${i === currentImage ? 'w-4 bg-primary' : 'w-1.5 bg-white/50'}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
