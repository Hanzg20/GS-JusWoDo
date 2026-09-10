import { parseEmbedLink } from "@/lib/embedUtils";
import { isWeChatMiniProgramWebview } from "@/lib/wechatShare";
import { useConfigStore } from "@/stores/configStore";

interface MediaEmbedProps {
    content: string;
    className?: string;
    isCover?: boolean;
}

export const MediaEmbed = ({ content, className = "", isCover = false }: MediaEmbedProps) => {
    const embed = parseEmbedLink(content);
    const { language } = useConfigStore();

    if (!embed) return null;

    const containerClasses = isCover
        ? `relative w-full aspect-video overflow-hidden ${className}`
        : `relative w-full aspect-video rounded-xl overflow-hidden shadow-sm my-3 ${className}`;

    // The Mini Program's <web-view> enforces its 业务域名 whitelist on all
    // cross-origin content, nested iframes included. YouTube and Spotify are
    // both GFW-blocked on mainland networks anyway and could never be added
    // to that whitelist (needs ICP备案, impossible for either). A quiet
    // inline note is enough — this isn't a broken feature to route around,
    // just a platform the mini-program can't reach. Bilibili is unaffected
    // (mainland-accessible, not blocked) and keeps its real player below.
    if ((embed.type === 'youtube' || embed.type === 'spotify') && isWeChatMiniProgramWebview()) {
        return (
            <div className={`${containerClasses} flex items-center justify-center bg-muted`}>
                <span className="text-xs text-muted-foreground">
                    {language === 'zh' ? '视频暂无法播放' : 'Video unavailable here'}
                </span>
            </div>
        );
    }

    if (embed.type === 'youtube') {
        return (
            <div className={containerClasses}>
                <iframe
                    src={embed.embedUrl}
                    title="YouTube video player"
                    className="absolute inset-0 w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                ></iframe>
            </div>
        );
    }

    if (embed.type === 'bilibili') {
        return (
            <div className={containerClasses}>
                <iframe
                    src={embed.embedUrl}
                    title="Bilibili video player"
                    className="absolute inset-0 w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                ></iframe>
            </div>
        );
    }

    if (embed.type === 'spotify') {
        return (
            <div className={isCover ? `w-full ${className}` : `w-full rounded-xl overflow-hidden shadow-sm my-3 ${className}`}>
                <iframe
                    src={embed.embedUrl}
                    width="100%"
                    height={isCover ? "352" : "152"}
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                    className="border-none"
                ></iframe>
            </div>
        );
    }

    if (embed.type === 'xiaohongshu') {
        return (
            <a
                href={embed.originalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={isCover
                    ? `flex flex-col items-center justify-center p-8 bg-red-50 hover:bg-red-100 transition-all group/xhs ${className}`
                    : `flex items-center gap-3 p-4 bg-red-50 hover:bg-red-100 border border-red-100 rounded-2xl transition-all my-3 group/xhs ${className}`
                }
            >
                <div className="w-16 h-16 bg-red-500 rounded-3xl flex items-center justify-center text-white text-2xl font-bold shrink-0 shadow-lg group-hover/xhs:scale-110 transition-transform mb-4">
                    书
                </div>
                <div className="text-center">
                    <div className="text-lg font-bold text-red-900">在小红书上查看该动态</div>
                    <div className="text-xs text-red-700/70 truncate max-w-[200px] mx-auto mt-1">{embed.originalUrl}</div>
                </div>
            </a>
        );
    }

    return null;
};
