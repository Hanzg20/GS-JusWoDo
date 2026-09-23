import { useNavigate } from "react-router-dom";
import { ListingMaster } from "@/types/domain";
import { MapPin, Heart, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { useState } from "react";
import { thumbUrl } from "@/lib/imageUrl";

interface NearbyHotServicesProps {
  listings: ListingMaster[];
  title?: string;
  subtitle?: string;
}

/**
 * Nearby Hot Services Component
 * Horizontal scrollable list of service cards with distance and favorite button
 */
export function NearbyHotServices({ 
  listings, 
  title = "附近热门服务",
  subtitle = "基于您的位置推荐"
}: NearbyHotServicesProps) {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // Calculate distance (mock for now, should use PostGIS in production)
  const getDistance = (listing: ListingMaster): number => {
    // Mock distance calculation
    return Math.random() * 5; // 0-5km
  };

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (listings.length === 0) {
    return null;
  }

  return (
    <section className="py-6">
      <div className="container">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-foreground">
              {title}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
          </div>
          <button
            onClick={() => navigate('/category/service')}
            className="text-sm font-semibold text-primary hover:underline flex items-center gap-1"
          >
            查看全部
            <span>→</span>
          </button>
        </div>

        {/* Horizontal Scrollable Cards */}
        <div className="overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
          <div className="flex gap-4 min-w-max">
            {listings.slice(0, 10).map((listing, index) => {
              const distance = getDistance(listing);
              const isFavorite = favorites.has(listing.id);
              const isUrgent = listing.tags?.includes('urgent') || false;

              return (
                <motion.div
                  key={listing.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => navigate(`/service/${listing.id}`)}
                  className="relative w-64 md:w-72 flex-shrink-0 card-warm overflow-hidden cursor-pointer group"
                >
                  {/* Image */}
                  <div className="relative aspect-video overflow-hidden bg-muted/50">
                    <img
                      src={listing.images[0] ? thumbUrl(listing.images[0], 640) : '/placeholder.svg'}
                      loading="lazy"
                      alt={listing.titleEn || listing.titleZh}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    
                    {/* Distance Badge */}
                    <div className="absolute top-2 left-2">
                      <Badge className="bg-primary/90 text-white border-none px-2 py-1 text-xs font-bold flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {distance.toFixed(1)}km
                      </Badge>
                    </div>

                    {/* Urgent Tag */}
                    {isUrgent && (
                      <div className="absolute top-2 right-12">
                        <Badge className="bg-red-500 text-white border-none px-2 py-1 text-xs font-bold">
                          急单
                        </Badge>
                      </div>
                    )}

                    {/* Favorite Button */}
                    <button
                      onClick={(e) => toggleFavorite(listing.id, e)}
                      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors shadow-sm"
                    >
                      <Heart
                        className={`w-4 h-4 transition-colors ${
                          isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="p-3">
                    <h3 className="font-bold text-sm line-clamp-2 mb-1 group-hover:text-primary transition-colors">
                      {listing.titleEn || listing.titleZh}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {listing.descriptionEn || listing.descriptionZh}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

// Hide scrollbar but keep functionality
const style = document.createElement('style');
style.textContent = `
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`;
if (!document.head.querySelector('style[data-scrollbar-hide]')) {
  style.setAttribute('data-scrollbar-hide', 'true');
  document.head.appendChild(style);
}


