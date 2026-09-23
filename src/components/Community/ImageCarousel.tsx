import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { thumbUrl } from '@/lib/imageUrl';

// Feed cards are ~half the phone width; 480px covers 2x-density screens.
// Tapping opens the post detail, which loads the full image.
const CARD_WIDTH = 480;

interface ImageCarouselProps {
  images: string[];
  onImageClick?: (index: number) => void;
  showArrows?: boolean;
}

export const ImageCarousel = ({ images, onImageClick, showArrows = true }: ImageCarouselProps) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    skipSnaps: false,
    align: 'center'
  });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState<Record<number, boolean>>({});

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const scrollTo = useCallback((index: number) => {
    if (emblaApi) emblaApi.scrollTo(index);
  }, [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi, onSelect]);

  // 没有图片，显示占位图
  if (images.length === 0) {
    return (
      <div className="relative w-full overflow-hidden bg-muted flex items-center justify-center" style={{ minHeight: '200px' }}>
        <div className="text-center text-muted-foreground">
          <svg className="w-16 h-16 mx-auto mb-2 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-sm">暂无图片</p>
        </div>
      </div>
    );
  }

  // 单张图片，不显示轮播
  if (images.length === 1) {
    return (
      <div
        className="relative w-full overflow-hidden cursor-pointer"
        onClick={() => onImageClick?.(0)}
      >
        {!isImageLoaded[0] && (
          <div className="absolute inset-0 bg-gradient-to-br from-muted via-muted/80 to-muted animate-pulse" />
        )}
        <img
          src={thumbUrl(images[0], CARD_WIDTH)}
          alt="Post image"
          loading="lazy"
          decoding="async"
          onLoad={() => setIsImageLoaded(prev => ({ ...prev, 0: true }))}
          className={`w-full h-auto object-cover transition-opacity duration-300 ${isImageLoaded[0] ? 'opacity-100' : 'opacity-0'
            }`}
          style={{ maxHeight: '400px' }}
        />
      </div>
    );
  }

  return (
    <div className="relative w-full group">
      {/* Embla 容器 */}
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {images.map((image, index) => (
            <div
              key={index}
              className="relative flex-[0_0_100%] min-w-0"
              onClick={() => onImageClick?.(index)}
            >
              {!isImageLoaded[index] && (
                <div className="absolute inset-0 bg-gradient-to-br from-muted via-muted/80 to-muted animate-pulse" />
              )}
              <img
                src={thumbUrl(image, CARD_WIDTH)}
                alt={`Image ${index + 1}`}
                loading={index === 0 ? "eager" : "lazy"}
                decoding="async"
                onLoad={() => setIsImageLoaded(prev => ({ ...prev, [index]: true }))}
                className={`w-full h-auto object-cover cursor-pointer transition-opacity duration-300 ${isImageLoaded[index] ? 'opacity-100' : 'opacity-0'
                  }`}
                style={{ maxHeight: '400px' }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* 左右箭头 - 仅在hover时显示 */}
      <AnimatePresence>
        {showArrows && canScrollPrev && (
          <motion.button
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            onClick={(e) => {
              e.stopPropagation();
              scrollPrev();
            }}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-black/80"
          >
            <ChevronLeft className="w-5 h-5" />
          </motion.button>
        )}

        {showArrows && canScrollNext && (
          <motion.button
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            onClick={(e) => {
              e.stopPropagation();
              scrollNext();
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-black/80"
          >
            <ChevronRight className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* 圆点指示器 - 更加精致 */}
      <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1 z-10">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={(e) => {
              e.stopPropagation();
              scrollTo(index);
            }}
            className={`transition-all duration-300 rounded-full ${index === selectedIndex
              ? 'w-4 h-1 bg-white shadow-sm'
              : 'w-1 h-1 bg-white/40 hover:bg-white/60'
              }`}
            aria-label={`Go to image ${index + 1}`}
          />
        ))}
      </div>

      {/* 图片计数器 (右上角) */}
      <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-white px-2.5 py-1 rounded-lg text-xs font-medium z-10">
        {selectedIndex + 1} / {images.length}
      </div>
    </div>
  );
};
