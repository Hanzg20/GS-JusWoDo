import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";
import { Review, ListingMaster } from "@/types/domain";
import { getTranslation } from "@/stores/listingStore";
import { useConfigStore } from "@/stores/configStore";

interface ProviderReviewsTabProps {
    reviews: Review[];
    listings: ListingMaster[];
}

export function ProviderReviewsTab({ reviews, listings }: ProviderReviewsTabProps) {
    const { language } = useConfigStore();
    const t = {
        noReviews: language === 'zh' ? '暂无评价' : 'No reviews yet',
        from: language === 'zh' ? '来自服务' : 'From',
        neighborStory: language === 'zh' ? '邻里故事' : 'Neighbor Story',
    };

    if (reviews.length === 0) {
        return (
            <Card className="p-12 text-center">
                <p className="text-muted-foreground">{t.noReviews}</p>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {reviews.map((review) => {
                const serviceListing = listings.find(l => l.id === review.listingId);
                return (
                    <Card key={review.id} className="p-6">
                        {/* Review Header */}
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <Avatar>
                                    <AvatarImage src={review.buyerAvatar} />
                                    <AvatarFallback>{review.buyerName?.[0] || 'N'}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-semibold">{review.buyerName || 'Neighbor'}</p>
                                    <div className="flex items-center gap-2">
                                        <div className="flex">
                                            {Array.from({ length: 5 }).map((_, i) => (
                                                <Star
                                                    key={i}
                                                    className={`w-4 h-4 ${i < review.rating
                                                        ? 'text-amber-500 fill-amber-500'
                                                        : 'text-muted stroke-muted'
                                                        }`}
                                                />
                                            ))}
                                        </div>
                                        <span className="text-xs text-muted-foreground">
                                            {new Date(review.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {serviceListing && (
                                <Link
                                    to={`/service/${serviceListing.id}`}
                                    className="text-xs text-primary hover:underline"
                                >
                                    {t.from}: {getTranslation(serviceListing, 'title', language === 'zh' ? 'Zh' : 'En')}
                                </Link>
                            )}
                        </div>

                        {/* Review Content */}
                        <p className="text-sm leading-relaxed mb-4">{review.content}</p>

                        {/* Media Gallery */}
                        {review.media && Array.isArray(review.media) && review.media.length > 0 && (
                            <div className="flex gap-3 mb-4 overflow-x-auto pb-2 scrollbar-none">
                                {review.media.map((url, i) => (
                                    <div key={i} className="min-w-[120px] h-[120px] rounded-2xl overflow-hidden border border-muted/20 shadow-sm shrink-0 group/img cursor-pointer">
                                        <img
                                            src={url}
                                            className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-500"
                                            alt="Review media"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/120?text=Image+Error';
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Neighbor Story Badge */}
                        {review.isNeighborStory && (
                            <Badge variant="secondary" className="mt-3">
                                ⭐ {t.neighborStory}
                            </Badge>
                        )}
                    </Card>
                );
            })}
        </div>
    );
}
