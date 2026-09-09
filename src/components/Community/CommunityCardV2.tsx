import { Link, useNavigate } from "react-router-dom";
import { Heart, MessageCircle, Share2, Layers, MapPin, Shield, Calendar, CheckCircle2 } from "lucide-react";
import { CommunityPost, FACT_TYPE_CONFIG, CONSENSUS_LEVEL_HINTS, ConsensusLevel } from "@/types/community";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { useState } from "react";
import { useCommunityPostStore } from "@/stores/communityPostStore";
import { useAuthStore } from "@/stores/authStore";
import { useConfigStore } from "@/stores/configStore";
import { toast } from "sonner";
import { ImageCarousel } from "./ImageCarousel";
import { ImageViewer } from "./ImageViewer";
import { HashtagText } from "./HashtagText";
import { MediaEmbed } from "./MediaEmbed";
import { ShareSheet } from "@/components/common/ShareSheet";

interface CommunityCardV2Props {
  post: CommunityPost;
  onDoubleTap?: () => void;
}

export const CommunityCardV2 = ({ post, onDoubleTap }: CommunityCardV2Props) => {
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();
  const { language } = useConfigStore();
  const { likePost, unlikePost } = useCommunityPostStore();
  const [showLikeExplosion, setShowLikeExplosion] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [viewerInitialIndex, setViewerInitialIndex] = useState(0);

  // 处理双击点赞
  const handleDoubleTap = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!currentUser) {
      toast.error(language === 'zh' ? '请先登录' : 'Please login first');
      return;
    }

    if (!post.isLikedByMe) {
      // 触发点赞
      likePost(post.id, currentUser.id);

      // 显示爆炸动画
      setShowLikeExplosion(true);
      setTimeout(() => setShowLikeExplosion(false), 600);

      // 回调
      onDoubleTap?.();
    }
  };

  // 处理单击点赞按钮
  const handleLikeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!currentUser) {
      toast.error(language === 'zh' ? '请先登录' : 'Please login first');
      return;
    }

    if (post.isLikedByMe) {
      unlikePost(post.id, currentUser.id);
    } else {
      likePost(post.id, currentUser.id);
    }
  };

  // 获取类型配置
  const getTypeConfig = () => {
    const configs = {
      SECOND_HAND: {
        label: language === 'zh' ? '🎒 二手' : '🎒 Used',
        bgClass: 'bg-green-500/90',
      },
      WANTED: {
        label: language === 'zh' ? '🔍 求购' : '🔍 Wanted',
        bgClass: 'bg-orange-500/90',
      },
      GIVEAWAY: {
        label: language === 'zh' ? '🎁 免费' : '🎁 Free',
        bgClass: 'bg-purple-500/90',
      },
      EVENT: {
        label: language === 'zh' ? '🎉 活动' : '🎉 Event',
        bgClass: 'bg-blue-500/90',
      },
      HELP: {
        label: language === 'zh' ? '🤝 互助' : '🤝 Help',
        bgClass: 'bg-red-500/90',
      },
      GENERAL: {
        label: language === 'zh' ? '📝 分享' : '📝 Share',
        bgClass: 'bg-gray-500/90',
      },
    };

    return configs[post.postType] || configs.GENERAL;
  };

  const typeConfig = getTypeConfig();
  const coverImage = post.images[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=60';
  const hasMultipleImages = post.images.length > 1;

  // 共识等级样式配置
  const getConsensusLevelConfig = (level: ConsensusLevel) => {
    const configs: Record<ConsensusLevel, { color: string; bgColor: string; icon: string }> = {
      HIGH: { color: 'text-green-600', bgColor: 'bg-green-500/10', icon: '✓✓' },
      MEDIUM: { color: 'text-blue-600', bgColor: 'bg-blue-500/10', icon: '✓' },
      LOW: { color: 'text-gray-500', bgColor: 'bg-gray-500/10', icon: '?' },
      CONTROVERSIAL: { color: 'text-orange-600', bgColor: 'bg-orange-500/10', icon: '⚡' },
      PENDING: { color: 'text-amber-600', bgColor: 'bg-amber-500/10', icon: '⏳' },
    };
    return configs[level] || configs.PENDING;
  };

  // 处理图片点击
  const handleImageClick = (index: number) => {
    setViewerInitialIndex(index);
    setShowImageViewer(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="masonry-card group"
    >
      <div
        onClick={() => {
          if (!window.getSelection()?.toString()) {
            navigate(`/community/${post.id}`);
          }
        }}
        className={`block cursor-pointer rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 ${post.isFact
          ? 'border-2 border-amber-300 bg-gradient-to-b from-amber-50/30 to-white'
          : 'border border-border/40 bg-white'
          }`}
      >
        {/* 图片区域 - Compact 4:5 or 1:1 Aspect Ratio Focus */}
        <div className="relative w-full overflow-hidden bg-muted" onDoubleClick={handleDoubleTap}>
          {post.images.length > 0 ? (
            <ImageCarousel images={post.images} onImageClick={handleImageClick} showArrows={false} />
          ) : (
            <MediaEmbed content={post.mediaUrl || ""} isCover={true} />
          )}

          {/* Badge Overlays - Top left, minimal */}
          <div className="absolute top-2 left-2 z-20 flex flex-col gap-1" onClick={(e) => e.stopPropagation()}>
            <Badge className={`${typeConfig.bgClass} text-white border-none shadow-sm text-[9px] font-bold px-1.5 py-0.5 rounded-md`}>
              {typeConfig.label.split(' ')[1] || typeConfig.label}
            </Badge>
            {post.isFact && (
              <Badge className="bg-amber-500/90 text-white border-none shadow-sm text-[9px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                <Shield className="w-2.5 h-2.5" />
                {language === 'zh' ? '真言' : 'Fact'}
              </Badge>
            )}
          </div>

          {/* Image Count Indicator - Top right */}
          {hasMultipleImages && (
            <div className="absolute top-2 right-2 z-20 bg-black/30 backdrop-blur-md text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold">
              {post.images.length}
            </div>
          )}

          {/* Price Hint Overlay - Bottom left */}
          {post.priceHint && (
            <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm text-white px-2 py-0.5 rounded-lg text-xs font-black z-20">
              ${(post.priceHint / 100).toFixed(0)}
            </div>
          )}

          {/* Like Explosion Animation */}
          {showLikeExplosion && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center pointer-events-none z-30"
              initial={{ scale: 0, opacity: 0 }}
              animate={{
                scale: [0, 1.5, 1],
                opacity: [0, 1, 0],
              }}
              transition={{ duration: 0.6 }}
            >
              <Heart className="w-16 h-16 fill-red-500 text-red-500 drop-shadow-2xl" />
            </motion.div>
          )}
        </div>

        {/* 内容区域 - Compact Padding */}
        <div className="p-2.5 space-y-1.5">
          {/* Title - Bold, compact */}
          {post.title && (
            <h3 className="font-bold text-sm leading-[1.3] line-clamp-2 text-foreground break-words">
              {post.title}
            </h3>
          )}

          {/* Snippet - Optional if title exists, or just show snippet if no title */}
          {!post.title && (
            <p className="text-xs text-muted-foreground leading-snug line-clamp-2">
              {post.content}
            </p>
          )}

          {/* Minimal Consensus Strip (if Fact) */}
          {post.isFact && post.consensus && (
            <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden flex">
              <div className="bg-green-500" style={{ width: `${(post.consensus.agree / (post.consensus.totalVotes || 1)) * 100}%` }} />
              <div className="bg-blue-400" style={{ width: `${(post.consensus.partial / (post.consensus.totalVotes || 1)) * 100}%` }} />
              <div className="bg-orange-400" style={{ width: `${(post.consensus.disagree / (post.consensus.totalVotes || 1)) * 100}%` }} />
            </div>
          )}

          {/* Bottom Bar: RED Style Author & Likes */}
          <div className="flex items-center justify-between pt-1">
            {/* Author */}
            <div className="flex items-center gap-1.5 min-w-0" onClick={(e) => e.stopPropagation()}>
              <Avatar className="w-5 h-5">
                <AvatarImage src={post.author?.avatar} loading="lazy" />
                <AvatarFallback className="text-[8px] bg-primary/10 text-primary">
                  {post.author?.name?.[0]}
                </AvatarFallback>
              </Avatar>
              <span className="text-[10px] text-muted-foreground font-semibold truncate">
                {post.author?.name}
              </span>
            </div>

            {/* Like Counter Only (Xiaohongshu style) */}
            <button
              onClick={handleLikeClick}
              className="flex items-center gap-1 text-muted-foreground/80 relative z-20"
            >
              <Heart
                className={`w-3.5 h-3.5 transition-all ${post.isLikedByMe
                  ? 'fill-red-500 text-red-500'
                  : ''
                  }`}
              />
              <span className="text-[10px] font-bold">
                {post.likeCount > 0 ? (post.likeCount > 999 ? '999+' : post.likeCount) : (language === 'zh' ? '赞' : 'Like')}
              </span>
            </button>
          </div>
        </div>
      </div>

      <ImageViewer
        images={post.images}
        initialIndex={viewerInitialIndex}
        isOpen={showImageViewer}
        onClose={() => setShowImageViewer(false)}
      />
    </motion.div>
  );
};
