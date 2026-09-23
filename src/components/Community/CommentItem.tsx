/**
 * CommentItem - 评论项组件
 * 支持嵌套回复、点赞功能
 */
import { useState } from "react";
import { CommunityComment } from "@/types/community";
import { useConfigStore } from "@/stores/configStore";
import { useAuthStore } from "@/stores/authStore";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Heart, MessageCircle, ChevronDown, ChevronUp } from "lucide-react";
import { UserLevelBadge } from "./UserLevelBadge";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { promptLogin } from "@/components/common/LoginRequired";

interface CommentItemProps {
    comment: CommunityComment;
    onLike: (commentId: string) => Promise<void>;
    onReply: (parentCommentId: string, content: string) => Promise<void>;
    depth?: number;
    maxDepth?: number;
    className?: string;
}

export function CommentItem({
    comment,
    onLike,
    onReply,
    depth = 0,
    maxDepth = 2,
    className = '',
}: CommentItemProps) {
    const { language } = useConfigStore();
    const navigate = useNavigate();
    const { currentUser } = useAuthStore();
    const [showReplyInput, setShowReplyInput] = useState(false);
    const [replyContent, setReplyContent] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showReplies, setShowReplies] = useState(depth < 1);
    const [isLiking, setIsLiking] = useState(false);

    const getTimeAgo = (dateString: string) => {
        const now = new Date();
        const past = new Date(dateString);
        const diffMs = now.getTime() - past.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffMins < 1) return language === 'zh' ? '刚刚' : 'Just now';
        if (diffMins < 60) return `${diffMins}${language === 'zh' ? '分钟前' : 'm'}`;
        if (diffHours < 24) return `${diffHours}${language === 'zh' ? '小时前' : 'h'}`;
        if (diffDays < 7) return `${diffDays}${language === 'zh' ? '天前' : 'd'}`;
        return past.toLocaleDateString();
    };

    const handleLike = async () => {
        if (!currentUser) {
            promptLogin(navigate, language === 'zh', language === 'zh' ? '请先登录' : 'Please login first');
            return;
        }
        if (isLiking) return;

        setIsLiking(true);
        try {
            await onLike(comment.id);
        } catch (error: any) {
            toast.error(error.message || (language === 'zh' ? '操作失败' : 'Failed'));
        } finally {
            setIsLiking(false);
        }
    };

    const handleSubmitReply = async () => {
        if (!currentUser) {
            promptLogin(navigate, language === 'zh', language === 'zh' ? '请先登录' : 'Please login first');
            return;
        }
        if (!replyContent.trim()) return;

        setIsSubmitting(true);
        try {
            await onReply(comment.id, replyContent);
            setReplyContent("");
            setShowReplyInput(false);
            toast.success(language === 'zh' ? '回复成功' : 'Reply sent');
        } catch (error: any) {
            toast.error(error.message || (language === 'zh' ? '回复失败' : 'Reply failed'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const hasReplies = comment.replies && comment.replies.length > 0;
    const canNestReplies = depth < maxDepth;

    return (
        <div className={`${className}`}>
            <div className="flex gap-3">
                {/* Avatar */}
                <Avatar className={`${depth === 0 ? 'w-9 h-9' : 'w-7 h-7'} mt-0.5 shrink-0`}>
                    <AvatarImage src={comment.author?.avatar} />
                    <AvatarFallback className="text-xs">
                        {comment.author?.name?.charAt(0)}
                    </AvatarFallback>
                </Avatar>

                {/* Comment Content */}
                <div className="flex-1 min-w-0">
                    {/* Author Info */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-sm">{comment.author?.name}</span>
                        {comment.author?.level && (
                            <UserLevelBadge level={comment.author.level} size="sm" showTooltip={false} />
                        )}
                        <span className="text-xs text-muted-foreground">
                            {getTimeAgo(comment.createdAt)}
                        </span>
                    </div>

                    {/* Comment Text */}
                    <p className="text-sm text-foreground/90 mt-1 whitespace-pre-wrap break-words">
                        {comment.content}
                    </p>

                    {/* Actions */}
                    <div className="flex items-center gap-4 mt-2">
                        {/* Like Button */}
                        <button
                            onClick={handleLike}
                            disabled={isLiking}
                            className={`text-xs flex items-center gap-1 transition-colors ${
                                comment.isLikedByMe
                                    ? 'text-red-500'
                                    : 'text-muted-foreground hover:text-red-500'
                            }`}
                        >
                            <Heart className={`w-3.5 h-3.5 ${comment.isLikedByMe ? 'fill-current' : ''}`} />
                            {comment.likeCount > 0 && <span>{comment.likeCount}</span>}
                        </button>

                        {/* Reply Button (only if nesting is allowed) */}
                        {canNestReplies && (
                            <button
                                onClick={() => setShowReplyInput(!showReplyInput)}
                                className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                            >
                                <MessageCircle className="w-3.5 h-3.5" />
                                {language === 'zh' ? '回复' : 'Reply'}
                            </button>
                        )}

                        {/* Show/Hide Replies Toggle */}
                        {hasReplies && (
                            <button
                                onClick={() => setShowReplies(!showReplies)}
                                className="text-xs text-primary font-medium flex items-center gap-0.5"
                            >
                                {showReplies ? (
                                    <>
                                        <ChevronUp className="w-3.5 h-3.5" />
                                        {language === 'zh' ? '收起' : 'Hide'}
                                    </>
                                ) : (
                                    <>
                                        <ChevronDown className="w-3.5 h-3.5" />
                                        {language === 'zh' ? `${comment.replies!.length} 条回复` : `${comment.replies!.length} replies`}
                                    </>
                                )}
                            </button>
                        )}
                    </div>

                    {/* Reply Input */}
                    <AnimatePresence>
                        {showReplyInput && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-3 space-y-2 overflow-hidden"
                            >
                                <Textarea
                                    placeholder={language === 'zh' ? `回复 @${comment.author?.name}...` : `Reply to @${comment.author?.name}...`}
                                    className="min-h-[60px] text-sm resize-none rounded-xl"
                                    value={replyContent}
                                    onChange={(e) => setReplyContent(e.target.value)}
                                />
                                <div className="flex justify-end gap-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            setShowReplyInput(false);
                                            setReplyContent("");
                                        }}
                                    >
                                        {language === 'zh' ? '取消' : 'Cancel'}
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={handleSubmitReply}
                                        disabled={!replyContent.trim() || isSubmitting}
                                        className="rounded-full"
                                    >
                                        {isSubmitting
                                            ? (language === 'zh' ? '发送中...' : 'Sending...')
                                            : (language === 'zh' ? '发送' : 'Send')}
                                    </Button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Nested Replies */}
                    <AnimatePresence>
                        {showReplies && hasReplies && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-3 space-y-3 pl-1 border-l-2 border-gray-100 overflow-hidden"
                            >
                                {comment.replies!.map(reply => (
                                    <CommentItem
                                        key={reply.id}
                                        comment={reply}
                                        onLike={onLike}
                                        onReply={onReply}
                                        depth={depth + 1}
                                        maxDepth={maxDepth}
                                        className="pl-3"
                                    />
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}

export default CommentItem;
