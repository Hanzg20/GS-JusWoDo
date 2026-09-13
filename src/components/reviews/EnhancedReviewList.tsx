import React, { useState, useEffect } from 'react';
import { Star, ThumbsUp, Heart, MessageSquare, ShieldCheck, Flag, MoreHorizontal, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ReportDialog } from '@/components/common/ReportDialog';
import { Review, ReviewReaction } from '@/types/domain';
import { repositoryFactory } from '@/services/repositories/factory';
import { format } from 'date-fns';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';

interface EnhancedReviewListProps {
    listingId: string;
    // The listing provider's real auth user id (ProviderProfile.userId), NOT
    // listing_masters.provider_id / review.providerId (that's provider_profiles.id).
    // Needed to tell whether the logged-in visitor IS this provider, so they can reply.
    providerUserId?: string;
}

export const EnhancedReviewList: React.FC<EnhancedReviewListProps> = ({ listingId, providerUserId }) => {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyText, setReplyText] = useState('');
    const [submittingReply, setSubmittingReply] = useState(false);
    const { currentUser } = useAuthStore();
    const reviewRepo = repositoryFactory.getReviewRepository();
    const isOwner = !!currentUser && !!providerUserId && currentUser.id === providerUserId;

    const loadReviews = async () => {
        try {
            const data = await reviewRepo.getByListing(listingId);
            setReviews(data);
        } catch (error) {
            console.error('Failed to load reviews:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadReviews();
    }, [listingId]);

    const handleReaction = async (reviewId: string, type: ReviewReaction['type']) => {
        if (!currentUser) return;
        try {
            const review = reviews.find(r => r.id === reviewId);
            const existingReaction = review?.reactions?.find(rc => rc.userId === currentUser.id && rc.type === type);

            if (existingReaction) {
                await reviewRepo.removeReaction(reviewId, currentUser.id, type);
            } else {
                await reviewRepo.addReaction(reviewId, currentUser.id, type);
            }

            // Reload reviews to get updated reaction counts
            await loadReviews();
        } catch (error) {
            console.error('Reaction failed:', error);
        }
    };

    const handleSubmitReply = async (review: Review) => {
        if (!currentUser || !replyText.trim()) return;
        setSubmittingReply(true);
        try {
            await reviewRepo.submitReply(review.id, review.providerId, replyText.trim());
            setReplyText('');
            setReplyingTo(null);
            await loadReviews();
        } catch (error) {
            console.error('Failed to submit reply:', error);
            toast.error('Failed to post reply. Please try again.');
        } finally {
            setSubmittingReply(false);
        }
    };

    if (loading) return <div className="p-4 text-center text-muted-foreground animate-pulse font-black uppercase tracking-widest text-[10px]">Loading neighbor reviews...</div>;

    if (reviews.length === 0) return (
        <div className="p-12 text-center rounded-[40px] bg-muted/20 border-2 border-dashed border-muted/30">
            <MessageSquare className="w-12 h-12 text-muted/30 mx-auto mb-4" />
            <h3 className="text-sm font-black text-muted-foreground uppercase tracking-widest">No Stories Yet</h3>
            <p className="text-[11px] font-bold text-muted-foreground/50 mt-1 max-w-[200px] mx-auto">Be the first neighbor to share a story about this service!</p>
        </div>
    );

    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-sm font-black uppercase tracking-widest text-foreground flex items-center gap-2">
                    <div className="w-1.5 h-4 bg-primary rounded-full shadow-glow-sm" />
                    Neighbor Stories
                    <Badge variant="outline" className="ml-2 bg-primary/5 text-primary border-none text-[10px] font-black h-5 px-1.5">{reviews.length}</Badge>
                </h3>
                <div className="flex items-center gap-1.5">
                    <Star className="w-4 h-4 fill-secondary text-secondary" />
                    <span className="text-sm font-black text-foreground">{avgRating.toFixed(1)}</span>
                    <span className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest">/ 5</span>
                </div>
            </div>

            <div className="grid gap-6">
                {reviews.map((review) => (
                    <Card key={review.id} className="p-6 border-none shadow-sm card-warm relative overflow-hidden bg-white/50 backdrop-blur-sm group hover:shadow-warm transition-all duration-300">
                        {review.isNeighborStory && (
                            <div className="absolute top-0 right-0">
                                <Badge className="bg-accent text-white rounded-bl-3xl border-none text-[9px] font-black tracking-widest uppercase py-1.5 px-4 shadow-sm">
                                    <Heart className="w-3 h-3 mr-1.5 fill-white" /> Neighbor Story
                                </Badge>
                            </div>
                        )}

                        <div className="flex items-start gap-4 mb-5">
                            <Avatar className="w-12 h-12 rounded-2xl shadow-card border border-white">
                                <AvatarImage src={review.buyerAvatar} loading="lazy" />
                                <AvatarFallback className="bg-primary/10 text-primary font-black uppercase text-xs">
                                    {review.buyerName?.substring(0, 2) || 'NB'}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                    <h4 className="font-black text-sm text-foreground tracking-tight">{review.buyerName}</h4>
                                    <span className="text-[9px] font-black text-muted-foreground/50 uppercase tracking-widest leading-none">
                                        {format(new Date(review.createdAt), 'MMM dd')}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1 mt-0.5">
                                    {[1, 2, 3, 4, 5].map((s) => (
                                        <Star key={s} className={`w-3 h-3 ${s <= review.rating ? 'fill-secondary text-secondary' : 'text-muted/30'}`} />
                                    ))}
                                    {Object.keys(review.ratingDimensions || {}).length > 0 && (
                                        <div className="flex gap-2 ml-4">
                                            {Object.entries(review.ratingDimensions).map(([dim, val]) => (
                                                <Badge key={dim} variant="outline" className="text-[8px] font-black text-muted-foreground/60 uppercase tracking-tighter bg-muted/20 border-none h-4 px-1.5">
                                                    {dim} {val}
                                                </Badge>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <p className="text-sm text-muted-foreground font-medium leading-relaxed mb-6 whitespace-pre-wrap">
                            {review.content}
                        </p>

                        {/* Media Gallery */}
                        {review.media && Array.isArray(review.media) && review.media.length > 0 && (
                            <div className="flex gap-3 mb-6 overflow-x-auto pb-2 scrollbar-none">
                                {review.media.map((url, i) => (
                                    <div key={i} className="min-w-[140px] h-[140px] rounded-[32px] overflow-hidden border border-white shadow-card shrink-0 group/img cursor-pointer">
                                        <img
                                            src={url}
                                            className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-500"
                                            alt="Review media"
                                            loading="lazy"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/140?text=Image+Error';
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex items-center justify-between mt-4">
                            <div className="flex gap-3">
                                <button
                                    onClick={() => handleReaction(review.id, 'HELPFUL')}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${review.reactions?.some(rc => rc.userId === currentUser?.id && rc.type === 'HELPFUL') ? 'bg-primary text-white shadow-glow-sm' : 'bg-muted/50 text-muted-foreground hover:bg-muted'}`}
                                >
                                    <ThumbsUp className="w-3.5 h-3.5" />
                                    <span>Helpful {review.reactions?.filter(r => r.type === 'HELPFUL').length || ''}</span>
                                </button>
                                <button
                                    onClick={() => handleReaction(review.id, 'WARMTH')}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${review.reactions?.some(rc => rc.userId === currentUser?.id && rc.type === 'WARMTH') ? 'bg-accent text-white shadow-glow-sm' : 'bg-muted/50 text-muted-foreground hover:bg-muted'}`}
                                >
                                    <Heart className="w-3.5 h-3.5" />
                                    <span>Warm {review.reactions?.filter(r => r.type === 'WARMTH').length || ''}</span>
                                </button>
                            </div>

                            {currentUser && currentUser.id !== review.buyerId && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button className="p-2 rounded-full text-muted-foreground/50 hover:bg-muted/50 hover:text-muted-foreground transition-all">
                                            <MoreHorizontal className="w-4 h-4" />
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <ReportDialog
                                            targetType="REVIEW"
                                            targetId={review.id}
                                            trigger={
                                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive">
                                                    <Flag className="w-3.5 h-3.5 mr-2" /> Report
                                                </DropdownMenuItem>
                                            }
                                        />
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                        </div>

                        {review.replies && review.replies.length > 0 && (
                            <div className="mt-6 p-5 rounded-[32px] bg-primary/5 border border-primary/10 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-3 opacity-5">
                                    <ShieldCheck className="w-16 h-16 text-primary" />
                                </div>
                                <div className="flex items-center gap-2 mb-2">
                                    <Badge className="bg-primary/20 text-primary text-[9px] font-black uppercase tracking-widest border-none px-2 h-4">Provider's Reply</Badge>
                                </div>
                                {review.replies.map((reply) => (
                                    <p key={reply.id} className="text-xs font-bold text-foreground/80 leading-relaxed italic">
                                        "{reply.content}"
                                    </p>
                                ))}
                            </div>
                        )}

                        {isOwner && (!review.replies || review.replies.length === 0) && (
                            replyingTo === review.id ? (
                                <div className="mt-6 p-5 rounded-[32px] bg-muted/20 border border-muted/30 space-y-3">
                                    <Textarea
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        placeholder="Reply to this review as the provider..."
                                        className="min-h-[80px] resize-none rounded-2xl text-sm"
                                        autoFocus
                                    />
                                    <div className="flex gap-2 justify-end">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="rounded-xl text-xs font-bold"
                                            onClick={() => { setReplyingTo(null); setReplyText(''); }}
                                            disabled={submittingReply}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            size="sm"
                                            className="rounded-xl text-xs font-bold"
                                            onClick={() => handleSubmitReply(review)}
                                            disabled={!replyText.trim() || submittingReply}
                                        >
                                            {submittingReply ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Post Reply'}
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setReplyingTo(review.id)}
                                    className="mt-4 text-[10px] font-black uppercase tracking-widest text-primary hover:underline"
                                >
                                    Reply as provider
                                </button>
                            )
                        )}
                    </Card>
                ))}
            </div>
        </div>
    );
};
