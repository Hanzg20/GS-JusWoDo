/**
 * Social Media Link Parsing Utilities
 */

export interface EmbedInfo {
    type: 'youtube' | 'spotify' | 'bilibili' | 'xiaohongshu' | 'unknown';
    id: string;
    embedUrl: string;
    thumbnailUrl?: string; // High-quality cover image for sharing cards/posters
    originalUrl?: string;
}

/**
 * Parses a string (typically post content or a dedicated media field) to detect
 * embedded social media links.
 * 
 * Supports: 
 * - YouTube (Videos, Shorts)
 * - Bilibili (BV IDs)
 * - Spotify (Tracks, Albums, Playlists)
 * - Xiaohongshu (Explore/Discovery links)
 * 
 * @param content The text content to scan for links
 * @returns EmbedInfo object if a supported link is found, otherwise null
 */
export const parseEmbedLink = (content: string): EmbedInfo | null => {
    if (!content) return null;

    // YouTube Regex (Support long, short, and shorts)
    const ytRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/;
    const ytMatch = content.match(ytRegex);
    if (ytMatch) {
        return {
            type: 'youtube',
            id: ytMatch[1],
            embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}`,
            thumbnailUrl: `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`,
            originalUrl: `https://www.youtube.com/watch?v=${ytMatch[1]}`
        };
    }

    // Bilibili Regex (BV ID)
    const biliRegex = /(?:https?:\/\/)?(?:www\.)?bilibili\.com\/video\/(BV[a-zA-Z0-9]+)/;
    const biliMatch = content.match(biliRegex);
    if (biliMatch) {
        return {
            type: 'bilibili',
            id: biliMatch[1],
            embedUrl: `//player.bilibili.com/player.html?bvid=${biliMatch[1]}&page=1&high_quality=1&danmaku=0`,
            // B站不提供通过 ID 直接构造封面的 API，只能用通用占位图或引导识别
            thumbnailUrl: 'https://static.hdslb.com/images/favicon.ico'
        };
    }

    // Spotify Regex
    const spotRegex = /https:\/\/open\.spotify\.com\/(track|album|playlist)\/([a-zA-Z0-9]+)/;
    const spotMatch = content.match(spotRegex);
    if (spotMatch) {
        return {
            type: 'spotify',
            id: spotMatch[2],
            embedUrl: `https://open.spotify.com/embed/${spotMatch[1]}/${spotMatch[2]}`,
            thumbnailUrl: 'https://open.spotifycdn.com/cdn/images/og-image.54cf092c.png'
        };
    }

    // Xiaohongshu (Little Red Book) - Support explore links with long params
    const xhsRegex = /https?:\/\/(?:www\.)?xiaohongshu\.com\/(?:explore|discovery)\/([a-zA-Z0-9]+)/;
    const xhsMatch = content.match(xhsRegex);
    if (xhsMatch) {
        return {
            type: 'xiaohongshu',
            id: xhsMatch[1],
            embedUrl: '', // XHS doesn't support easy iframes
            originalUrl: xhsMatch[0] // We keep the base URL for the card
        };
    }

    return null;
};
