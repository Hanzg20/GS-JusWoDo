import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useConfigStore } from "@/stores/configStore";
import { thumbUrl } from "@/lib/imageUrl";

interface PromoSlide {
    id: string;
    imageUrl: string;
    titleEn: string;
    titleZh: string;
    descEn?: string;
    descZh?: string;
    ctaLink?: string;
}

// Demo promotional slides - replace with actual data from your backend
const demoSlides: PromoSlide[] = [
    {
        id: "1",
        imageUrl: "https://images.unsplash.com/photo-1556911220-bff31c812dba?w=800&auto=format&fit=crop",
        titleEn: "JUSTWEDO – Ottawa Neighbor Help",
        titleZh: "渥帮：渥太华有事，找渥帮",
        descEn: "Your community toolbox for neighborly help.",
        descZh: "渥太华邻里互助的便民工具箱",
        ctaLink: "/about"
    },
    {
        id: "2",
        imageUrl: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&auto=format&fit=crop",
        titleEn: "New Neighbors Welcome",
        titleZh: "新邻居欢迎礼",
        descEn: "Get 100 bonus beans on first order",
        descZh: "首单获赠100豆币",
        ctaLink: "/services"
    },
    {
        id: "3",
        imageUrl: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&auto=format&fit=crop",
        titleEn: "Trusted Local Experts",
        titleZh: "值得信赖的本地专家",
        descEn: "Verified providers in your community",
        descZh: "社区认证服务商",
        ctaLink: "/services?verified=true"
    }
];

export const PromoBanner = () => {
    const { language } = useConfigStore();
    const [currentSlide, setCurrentSlide] = useState(0);
    const [autoPlay, setAutoPlay] = useState(true);

    const slides = demoSlides; // Replace with actual data fetch

    // Auto-rotate every 5 seconds
    useEffect(() => {
        if (!autoPlay) return;

        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 5000);

        return () => clearInterval(interval);
    }, [autoPlay, slides.length]);

    const goToSlide = (index: number) => {
        setCurrentSlide(index);
        setAutoPlay(false);
        // Resume autoplay after 10 seconds
        setTimeout(() => setAutoPlay(true), 10000);
    };

    const goToPrev = () => {
        setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
        setAutoPlay(false);
        setTimeout(() => setAutoPlay(true), 10000);
    };

    const goToNext = () => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
        setAutoPlay(false);
        setTimeout(() => setAutoPlay(true), 10000);
    };

    const currentSlideData = slides[currentSlide];

    return (
        <div className="relative w-full h-44 sm:h-48 md:h-56 overflow-hidden bg-gradient-to-br from-muted/30 to-muted/10">
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentSlide}
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.7, ease: "easeInOut" }}
                    className="absolute inset-0"
                >
                    {/* Background Image */}
                    <div className="absolute inset-0">
                        <img
                            src={thumbUrl(currentSlideData.imageUrl, 1080)}
                            alt={language === 'zh' ? currentSlideData.titleZh : currentSlideData.titleEn}
                            className="w-full h-full object-cover"
                        />
                        {/* Gradient Overlay - stronger on mobile */}
                        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/20 md:from-black/70 md:via-black/50 md:to-transparent" />
                    </div>

                    {/* Content */}
                    <div className="relative container h-full flex items-center px-4 sm:px-6">
                        <motion.div
                            initial={{ x: -50, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.2, duration: 0.5 }}
                            className="max-w-xl text-white space-y-1.5 sm:space-y-2 md:space-y-3"
                        >
                            <h2 className="text-xl sm:text-2xl md:text-3xl font-black leading-tight">
                                {language === 'zh' ? currentSlideData.titleZh : currentSlideData.titleEn}
                            </h2>
                            {(currentSlideData.descEn || currentSlideData.descZh) && (
                                <p className="text-xs sm:text-sm md:text-base text-white/90 font-medium">
                                    {language === 'zh' ? currentSlideData.descZh : currentSlideData.descEn}
                                </p>
                            )}
                            {currentSlideData.ctaLink && (
                                <motion.a
                                    href={currentSlideData.ctaLink}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="inline-block mt-2 sm:mt-3 px-4 sm:px-6 py-2 sm:py-2.5 text-sm sm:text-base bg-primary text-primary-foreground font-bold rounded-lg sm:rounded-xl shadow-lg hover:shadow-xl transition-shadow"
                                >
                                    {language === 'zh' ? '立即查看' : 'View Now'}
                                </motion.a>
                            )}
                        </motion.div>
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Navigation Arrows - smaller on mobile */}
            <button
                onClick={goToPrev}
                className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg backdrop-blur-sm transition-all hover:scale-110 z-10"
                aria-label="Previous slide"
            >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-foreground" />
            </button>
            <button
                onClick={goToNext}
                className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg backdrop-blur-sm transition-all hover:scale-110 z-10"
                aria-label="Next slide"
            >
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-foreground" />
            </button>

            {/* Dot Indicators - smaller on mobile */}
            <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 sm:gap-2 z-10">
                {slides.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => goToSlide(index)}
                        className={`transition-all duration-300 rounded-full ${index === currentSlide
                            ? 'w-6 sm:w-8 h-1.5 sm:h-2 bg-white'
                            : 'w-1.5 sm:w-2 h-1.5 sm:h-2 bg-white/50 hover:bg-white/75'
                            }`}
                        aria-label={`Go to slide ${index + 1}`}
                    />
                ))}
            </div>
        </div>
    );
};
