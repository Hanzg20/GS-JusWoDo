import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useCommunityPostStore } from "@/stores/communityPostStore";
import { useAuthStore } from "@/stores/authStore";
import { useConfigStore } from "@/stores/configStore";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, MapPin, Clock, Heart, MessageCircle, Share2, MoreVertical, Briefcase, Trash2, Edit2, Shield, Calendar, Bookmark, ChevronLeft, ChevronRight, Send, X } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { CommunityPostType, FACT_TYPE_CONFIG, ConsensusVoteType } from "@/types/community";
import { ShareSheet } from "@/components/common/ShareSheet";
import { ReportDialog } from "@/components/common/ReportDialog";
import { LitePost } from "@/components/Community/LitePost";
import { MediaEmbed } from "@/components/Community/MediaEmbed";
import { HashtagText } from "@/components/Community/HashtagText";
import { ConsensusBar } from "@/components/Community/ConsensusBar";
import { FactVoteButtons } from "@/components/Community/FactVoteButtons";
import { UserLevelBadge } from "@/components/Community/UserLevelBadge";
import { CommentItem } from "@/components/Community/CommentItem";
import { parseEmbedLink } from "@/lib/embedUtils";
import { updateOpenGraphTags, configWxShare, isWeChatBrowser } from "@/lib/wechatShare";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const CommunityPostDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const {
        currentPost,
        currentPostComments,
        isLoadingDetail,
        fetchPostDetail,
        likePost,
        unlikePost,
        addComment,
        deletePost,
        voteOnFact,
        savePost,
        unsavePost,
        likeComment,
        unlikeComment
    } = useCommunityPostStore();
    const { currentUser } = useAuthStore();
    const { language } = useConfigStore();

    const [commentText, setCommentText] = useState("");
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);
    const [isShareOpen, setIsShareOpen] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isLikeAnimating, setIsLikeAnimating] = useState(false);
    const commentInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (id) {
            fetchPostDetail(id);
        }
    }, [id, fetchPostDetail]);

    // 配置微信分享和 Open Graph 标签
    useEffect(() => {
        if (!currentPost) return;

        const embed = currentPost.mediaUrl ? parseEmbedLink(currentPost.mediaUrl) : null;
        const shareImageUrl = (currentPost.images && currentPost.images.length > 0)
            ? currentPost.images[0]
            : embed?.thumbnailUrl || `${window.location.origin}/logo.png`;

        const shareData = {
            title: currentPost.title || currentPost.content.slice(0, 30) + '...',
            description: currentPost.content.slice(0, 100) + (currentPost.content.length > 100 ? '...' : ''),
            imageUrl: shareImageUrl,
            url: window.location.href
        };

        // 更新 Open Graph 标签 (对 Twitter/Facebook 等有效)
        updateOpenGraphTags(shareData);

        // 如果在微信浏览器中，配置微信 JS-SDK 分享
        if (isWeChatBrowser()) {
            configWxShare(shareData);
        }
    }, [currentPost]);

    // Loading skeleton - Instagram style
    if (isLoadingDetail || !currentPost) {
        return (
            <div className="min-h-screen bg-black">
                {/* Header skeleton */}
                <div className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl">
                    <div className="flex items-center justify-between px-4 py-3">
                        <Skeleton className="h-8 w-8 rounded-full bg-white/10" />
                        <Skeleton className="h-4 w-24 bg-white/10" />
                        <Skeleton className="h-8 w-8 rounded-full bg-white/10" />
                    </div>
                </div>
                {/* Image skeleton */}
                <div className="pt-14">
                    <Skeleton className="aspect-square w-full bg-white/5" />
                </div>
                {/* Content skeleton */}
                <div className="p-4 space-y-4">
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full bg-white/10" />
                        <Skeleton className="h-4 w-32 bg-white/10" />
                    </div>
                    <Skeleton className="h-4 w-full bg-white/10" />
                    <Skeleton className="h-4 w-2/3 bg-white/10" />
                </div>
            </div>
        );
    }

    const getTimeAgo = (dateString: string) => {
        const now = new Date();
        const past = new Date(dateString);
        const diffMs = now.getTime() - past.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

        if (diffHours < 1) return language === 'zh' ? '刚刚' : 'Just now';
        if (diffHours < 24) return language === 'zh' ? `${diffHours}小时前` : `${diffHours}h`;
        const days = Math.floor(diffHours / 24);
        if (days < 7) return language === 'zh' ? `${days}天前` : `${days}d`;
        return language === 'zh' ? `${Math.floor(days / 7)}周前` : `${Math.floor(days / 7)}w`;
    };

    const handleLike = async () => {
        if (!currentUser) return toast.error(language === 'zh' ? '请先登录' : 'Please login first');

        // Trigger animation
        setIsLikeAnimating(true);
        setTimeout(() => setIsLikeAnimating(false), 300);

        if (currentPost.isLikedByMe) {
            await unlikePost(currentPost.id, currentUser.id);
        } else {
            await likePost(currentPost.id, currentUser.id);
        }
    };

    const handleDoubleTapLike = () => {
        if (!currentPost.isLikedByMe && currentUser) {
            handleLike();
        }
    };

    const handleSubmitComment = async () => {
        if (!currentUser) return toast.error(language === 'zh' ? '请先登录' : 'Please login first');
        if (!commentText.trim()) return;

        setIsSubmittingComment(true);
        try {
            await addComment(currentUser.id, {
                postId: currentPost.id,
                content: commentText
            });
            setCommentText("");
            toast.success(language === 'zh' ? "评论已发布" : "Comment posted");
        } catch (error) {
            toast.error(language === 'zh' ? "评论失败" : "Failed to comment");
        } finally {
            setIsSubmittingComment(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm(language === 'zh' ? "确定要删除这条动态吗？删除后不可恢复。" : "Delete this post? This cannot be undone.")) return;
        try {
            await deletePost(currentPost.id);
            toast.success(language === 'zh' ? "动态已删除" : "Post deleted");
            navigate('/community');
        } catch (error) {
            toast.error(language === 'zh' ? "删除失败" : "Failed to delete");
        }
    };

    const handleConvertToService = () => {
        navigate(`/publish?from_post=${currentPost.id}`);
    };

    const handleVote = async (voteType: ConsensusVoteType) => {
        if (!currentUser) {
            toast.error(language === 'zh' ? '请先登录' : 'Please login first');
            return;
        }
        await voteOnFact(currentPost.id, currentUser.id, voteType);
    };

    const handleSave = async () => {
        if (!currentUser) {
            toast.error(language === 'zh' ? '请先登录' : 'Please login first');
            return;
        }
        if (currentPost.isSavedByMe) {
            await unsavePost(currentPost.id, currentUser.id);
            toast.success(language === 'zh' ? '已取消收藏' : 'Unsaved');
        } else {
            await savePost(currentPost.id, currentUser.id);
            toast.success(language === 'zh' ? '已收藏' : 'Saved');
        }
    };

    const focusCommentInput = () => {
        commentInputRef.current?.focus();
    };

    const isOwner = currentUser?.id === currentPost.authorId;
    const hasImages = currentPost.images && currentPost.images.length > 0;
    const hasVideo = currentPost.mediaUrl && parseEmbedLink(currentPost.mediaUrl);
    const totalSlides = (hasImages ? currentPost.images!.length : 0) + (hasVideo ? 1 : 0);

    // Get share image
    const embed = currentPost.mediaUrl ? parseEmbedLink(currentPost.mediaUrl) : null;
    const effectiveImageUrl = hasImages ? currentPost.images![0] : embed?.thumbnailUrl;

    return (
        <div className="min-h-screen bg-background pb-24">
            {/* Immersive Header - Xiaohongshu style */}
            <div className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl transition-all border-b border-border/10">
                <div className="flex items-center justify-between px-3 py-1.5 max-w-lg mx-auto h-12">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-8 w-8 rounded-full hover:bg-muted">
                        <ChevronLeft className="w-6 h-6" />
                    </Button>

                    <div className="flex items-center gap-2 flex-grow mx-2">
                        <Avatar className="w-8 h-8 border border-white shadow-sm">
                            <AvatarImage src={currentPost.author?.avatar} />
                            <AvatarFallback>{currentPost.author?.name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col min-w-0">
                            <span className="font-black text-xs truncate leading-tight">{currentPost.author?.name}</span>
                            {currentPost.author?.levelIcon && (
                                <span className="text-[9px] text-primary font-bold">{currentPost.author.levelIcon} Explorer</span>
                            )}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            className="ml-auto h-6 rounded-full px-3 text-[10px] font-black border-primary text-primary hover:bg-primary/5"
                        >
                            {language === 'zh' ? '关注' : 'Follow'}
                        </Button>
                    </div>

                    <div className="flex items-center gap-1">
                        <ShareSheet
                            title={currentPost.title || "分享内容"}
                            content={currentPost.content}
                            url={window.location.href}
                            imageUrl={currentPost.images?.[0]}
                            authorName={currentPost.author?.name}
                            authorAvatar={currentPost.author?.avatar}
                            trigger={
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                                    <Share2 className="w-4 h-4" />
                                </Button>
                            }
                        />
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                                    <MoreVertical className="w-4 h-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-2xl min-w-[160px] p-2">
                                {isOwner ? (
                                    <>
                                        <LitePost
                                            postId={currentPost.id}
                                            initialData={{
                                                content: currentPost.content,
                                                images: currentPost.images,
                                                price: currentPost.priceHint,
                                                postType: currentPost.postType,
                                                nodeId: currentPost.nodeId
                                            }}
                                            trigger={
                                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="gap-2 cursor-pointer rounded-xl py-2.5 font-bold text-sm">
                                                    <Edit2 className="w-4 h-4" /> {language === 'zh' ? '编辑动态' : 'Edit Post'}
                                                </DropdownMenuItem>
                                            }
                                        />
                                        <DropdownMenuItem onClick={handleConvertToService} className="gap-2 cursor-pointer rounded-xl py-2.5 font-bold text-sm">
                                            <Briefcase className="w-4 h-4" /> {language === 'zh' ? '升级为专业服务' : 'Promote to Service'}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={handleDelete} className="gap-2 text-red-500 focus:text-red-500 cursor-pointer rounded-xl py-2.5 font-bold text-sm">
                                            <Trash2 className="w-4 h-4" /> {language === 'zh' ? '下架删除' : 'Remove Post'}
                                        </DropdownMenuItem>
                                    </>
                                ) : (
                                    <ReportDialog
                                        targetType="COMMUNITY_POST"
                                        targetId={currentPost.id}
                                        trigger={
                                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="gap-2 cursor-pointer rounded-xl py-2.5 font-bold text-sm">
                                                <Shield className="w-4 h-4" /> {language === 'zh' ? '投诉举报' : 'Report'}
                                            </DropdownMenuItem>
                                        }
                                    />
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="pt-12 max-w-lg mx-auto">
                {/* Immersive Media Carousel (RED Style - 4:5 optimized) */}
                {(hasImages || hasVideo) && (
                    <div className="relative bg-muted/30 group" onDoubleClick={handleDoubleTapLike}>
                        <div className="aspect-[4/5] relative overflow-hidden">
                            {hasImages && currentImageIndex < currentPost.images!.length ? (
                                <motion.img
                                    key={currentImageIndex}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    src={currentPost.images![currentImageIndex]}
                                    alt=""
                                    className="w-full h-full object-cover"
                                />
                            ) : hasVideo ? (
                                <MediaEmbed content={currentPost.mediaUrl || ""} isCover={false} />
                            ) : null}

                            {/* Double tap heart animation */}
                            <AnimatePresence>
                                {isLikeAnimating && (
                                    <motion.div
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: [0, 1.2, 1], opacity: [0, 1, 0] }}
                                        exit={{ opacity: 0 }}
                                        className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
                                    >
                                        <Heart className="w-24 h-24 text-red-500 fill-red-500 drop-shadow-2xl" />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Navigation Overlay */}
                        {totalSlides > 1 && (
                            <div className="absolute inset-y-0 inset-x-0 flex items-center justify-between px-2 pointer-events-none">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(i => Math.max(0, i - 1)); }}
                                    className={`pointer-events-auto h-8 w-8 rounded-full bg-black/20 backdrop-blur-md text-white border-none hover:bg-black/40 transition-opacity ${currentImageIndex === 0 ? 'opacity-0' : 'opacity-100'}`}
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(i => Math.min(totalSlides - 1, i + 1)); }}
                                    className={`pointer-events-auto h-8 w-8 rounded-full bg-black/20 backdrop-blur-md text-white border-none hover:bg-black/40 transition-opacity ${currentImageIndex === totalSlides - 1 ? 'opacity-0' : 'opacity-100'}`}
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </Button>
                            </div>
                        )}

                        {/* Indicators */}
                        {totalSlides > 1 && (
                            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 z-20">
                                {Array.from({ length: totalSlides }).map((_, i) => (
                                    <div
                                        key={i}
                                        className={`h-1 rounded-full transition-all duration-300 ${i === currentImageIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/40'}`}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Page Tracker */}
                        <div className="absolute top-4 right-4 bg-black/30 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] text-white font-black z-10">
                            {currentImageIndex + 1} / {totalSlides}
                        </div>
                    </div>
                )}

                {/* Post Content Details */}
                <div className="px-5 py-6 space-y-6">
                    {/* Title & Description */}
                    <div className="space-y-3">
                        {currentPost.title && (
                            <h1 className="text-xl font-black text-foreground leading-tight tracking-tight">
                                {currentPost.title}
                            </h1>
                        )}
                        <HashtagText
                            text={currentPost.content}
                            className="text-base text-foreground/90 leading-relaxed font-medium"
                        />
                    </div>

                    {/* Pricing Display (RED Style focused) */}
                    {currentPost.priceHint !== undefined && currentPost.priceHint > 0 && (
                        <div className="flex items-center gap-2 p-3 rounded-2xl bg-primary/5 border border-primary/10">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                <Shield className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                                <p className="text-[10px] font-black text-primary/60 uppercase tracking-widest">{language === 'zh' ? '预估价值 / 酬劳' : 'Estimated Value / Reward'}</p>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-2xl font-black text-primary">${(currentPost.priceHint / 100).toFixed(0)}</span>
                                    <span className="text-xs font-bold text-primary/60">CAD</span>
                                    {currentPost.priceNegotiable && (
                                        <Badge variant="secondary" className="ml-2 text-[10px] font-black bg-white rounded-md border-primary/10 text-primary">
                                            {language === 'zh' ? '支持议价' : 'Negotiable'}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tags Cloud */}
                    {currentPost.tags && currentPost.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {currentPost.tags.map(tag => (
                                <Link
                                    to={`/community?tag=${tag}`}
                                    key={tag}
                                    className="px-3 py-1 bg-muted/50 hover:bg-muted text-muted-foreground rounded-full text-xs font-bold transition-colors"
                                >
                                    # {tag}
                                </Link>
                            ))}
                        </div>
                    )}

                    {/* Verification & Consensus - RED Enhanced */}
                    {currentPost.isFact && currentPost.factData && (
                        <div className="rounded-[24px] bg-[#FFF9F0] border border-amber-200/40 p-5 space-y-4 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-white">
                                        <Shield className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black text-amber-900">{language === 'zh' ? '全城公测 · 真言校验' : 'Open Consensus · JustTalk'}</h3>
                                        <p className="text-[10px] font-medium text-amber-700/60 uppercase tracking-widest">{language === 'zh' ? '基于社区共识算法的真实性校验' : 'Authenticity verification via community'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-white/60 p-2.5 rounded-xl">
                                    <p className="text-[9px] font-black text-amber-700/50 uppercase mb-1">{language === 'zh' ? '事件类型' : 'Event Type'}</p>
                                    <div className="flex items-center gap-1.5 font-bold text-xs text-amber-900">
                                        {FACT_TYPE_CONFIG[currentPost.factData.factType]?.icon}
                                        {language === 'zh' ? FACT_TYPE_CONFIG[currentPost.factData.factType]?.zh : FACT_TYPE_CONFIG[currentPost.factData.factType]?.en}
                                    </div>
                                </div>
                                <div className="bg-white/60 p-2.5 rounded-xl">
                                    <p className="text-[9px] font-black text-amber-700/50 uppercase mb-1">{language === 'zh' ? '发生时间' : 'Occurred At'}</p>
                                    <div className="flex items-center gap-1.5 font-bold text-xs text-amber-900">
                                        <Calendar className="w-3.5 h-3.5" />
                                        {currentPost.factData.occurredAt}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white/60 p-3 rounded-xl">
                                <p className="text-[9px] font-black text-amber-700/50 uppercase mb-1">{language === 'zh' ? '发生地点' : 'Location'}</p>
                                <div className="flex items-center gap-1.5 font-bold text-xs text-amber-900">
                                    <MapPin className="w-3.5 h-3.5" />
                                    {currentPost.factData.location}
                                </div>
                            </div>

                            {/* Consensus Details */}
                            {currentPost.consensus && (
                                <div className="pt-2 space-y-4">
                                    <ConsensusBar consensus={currentPost.consensus} showLabels={true} size="md" />
                                    <div className="bg-white p-4 rounded-3xl border border-amber-100/50 shadow-sm">
                                        <p className="text-center text-xs font-black text-amber-900/40 mb-3 uppercase tracking-widest">{language === 'zh' ? '您认为此消息真实吗？' : 'Do you verify this post?'}</p>
                                        <FactVoteButtons postId={currentPost.id} currentVote={currentPost.myVote} onVote={handleVote} />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Metadata Footer */}
                    <div className="flex flex-col gap-2 pt-2 pb-4 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                        <div className="flex items-center gap-4">
                            <span>{getTimeAgo(currentPost.createdAt)}</span>
                            {currentPost.locationText && <span>{currentPost.locationText}</span>}
                        </div>
                        <p>{language === 'zh' ? '禁止未授权转载' : 'Unauthorized reproduction prohibited'}</p>
                    </div>

                    <div className="h-px bg-border/50" />

                    {/* Comments Section */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="font-black text-sm tracking-tight">
                                {language === 'zh' ? '评论' : 'Comments'}
                                <span className="ml-1 text-muted-foreground font-bold">{currentPost.commentCount}</span>
                            </h3>
                        </div>

                        {currentPostComments.length > 0 ? (
                            <div className="space-y-6">
                                {currentPostComments.map(comment => (
                                    <CommentItem
                                        key={comment.id}
                                        comment={comment}
                                        onLike={async (cid) => {
                                            if (!currentUser) {
                                                toast.error(language === 'zh' ? '请先登录' : 'Login');
                                                return;
                                            }
                                            const target = currentPostComments.find(c => c.id === cid);
                                            if (target?.isLikedByMe) {
                                                await unlikeComment(cid, currentUser.id);
                                            } else {
                                                await likeComment(cid, currentUser.id);
                                            }
                                        }}
                                        onReply={async (pid, txt) => {
                                            if (!currentUser) {
                                                toast.error(language === 'zh' ? '请先登录' : 'Login');
                                                return;
                                            }
                                            await addComment(currentUser.id, { postId: currentPost.id, content: txt, parentCommentId: pid });
                                        }}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="py-10 text-center space-y-3">
                                <div className="w-12 h-12 rounded-full bg-muted mx-auto flex items-center justify-center">
                                    <MessageCircle className="w-6 h-6 text-muted-foreground/40" />
                                </div>
                                <p className="text-xs font-bold text-muted-foreground/60 tracking-wider">
                                    {language === 'zh' ? '此时无声胜有声，快来抢占沙发' : 'No comments yet. Share your thoughts!'}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* RED-Style Sticky Bottom Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-border/50 z-50 safe-area-bottom">
                <div className="max-w-lg mx-auto px-4 py-2.5 flex items-center gap-4">
                    {/* Compact Comment Input */}
                    <div className="flex-1 relative flex items-center">
                        <Input
                            ref={commentInputRef}
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSubmitComment()}
                            placeholder={language === 'zh' ? '说点什么...' : 'Say something...'}
                            className="bg-muted/60 border-none rounded-full h-10 pl-4 pr-10 text-sm font-bold focus-visible:ring-1 focus-visible:ring-primary/20"
                        />
                        <button
                            disabled={!commentText.trim() || isSubmittingComment}
                            onClick={handleSubmitComment}
                            className="absolute right-3 text-primary disabled:opacity-30 p-1"
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Stats Icons */}
                    <div className="flex items-center gap-5 pr-2">
                        <button onClick={handleLike} className="group flex flex-col items-center gap-0.5">
                            <Heart className={`w-[22px] h-[22px] transition-all ${currentPost.isLikedByMe ? 'fill-red-500 text-red-500 scale-110' : 'text-foreground'}`} />
                            <span className="text-[9px] font-black">{currentPost.likeCount || (language === 'zh' ? '点赞' : 'Like')}</span>
                        </button>
                        <button onClick={handleSave} className="group flex flex-col items-center gap-0.5">
                            <Bookmark className={`w-[22px] h-[22px] transition-all ${currentPost.isSavedByMe ? 'fill-[#FFD700] text-[#FFD700] scale-110' : 'text-foreground'}`} />
                            <span className="text-[9px] font-black">{currentPost.saveCount || (language === 'zh' ? '收藏' : 'Save')}</span>
                        </button>
                        <button onClick={focusCommentInput} className="group flex flex-col items-center gap-0.5">
                            <MessageCircle className="w-[22px] h-[22px] text-foreground" />
                            <span className="text-[9px] font-black">{currentPost.commentCount || (language === 'zh' ? '评论' : 'Chat')}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CommunityPostDetail;
