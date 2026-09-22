import { supabase } from '@/lib/supabase';
import { checkMiniProgramContent, isWeChatMiniProgramWebview } from '@/lib/wechatShare';

/**
 * 通用 Grok AI 内容风控与安全校验工具
 * 覆盖社区发帖 (LitePost)、服务发布 (Publish)、社区评论 (CommunityPostDetail) 等输入入口
 */
export async function checkGrokContentSafety(
    userId: string,
    content: string
): Promise<{ flagged: boolean; reason?: string }> {
    if (!content || !content.trim()) {
        return { flagged: false };
    }

    try {
        // 1. 如果在微信小程序内部，优先叠加调用微信官方 API 检测
        if (isWeChatMiniProgramWebview()) {
            const wxCheck = await checkMiniProgramContent(userId, { type: 'text', content });
            if (wxCheck.flagged) {
                return {
                    flagged: true,
                    reason: wxCheck.reason || '内容未能通过微信安全审查，请修改后再试。',
                };
            }
        }

        // 2. 调用 Grok / Groq / AI 风控 Edge Function (全面覆盖 Web + 移动端)
        const { data, error } = await supabase.functions.invoke('grok-content-moderation', {
            body: { userId, content },
        });

        if (error) {
            console.warn('[checkGrokContentSafety] Moderation function error, failing open:', error);
            return { flagged: false };
        }

        if (data && data.flagged) {
            return {
                flagged: true,
                reason: data.reason || '包含不符合社区安全规范的敏感或涉嫌广告/诈骗信息。',
            };
        }

        return { flagged: false };
    } catch (err) {
        console.error('[checkGrokContentSafety] Exception during content check:', err);
        // Fail open to avoid blocking legit users on minor network glitches
        return { flagged: false };
    }
}

// New image safety check
export async function checkImageSafety(
    userId: string,
    imageUrl: string
): Promise<{ flagged: boolean; reason?: string }> {
    if (!imageUrl) {
        return { flagged: false };
    }
    try {
        const { data, error } = await supabase.functions.invoke('grok-image-moderation', {
            body: { userId, imageUrl },
        });
        if (error) {
            console.warn('[checkImageSafety] Moderation function error, failing open:', error);
            return { flagged: false };
        }
        if (data && data.flagged) {
            return { flagged: true, reason: data.reason };
        }
        return { flagged: false };
    } catch (err) {
        console.error('[checkImageSafety] Exception during image check:', err);
        return { flagged: false };
    }
}
