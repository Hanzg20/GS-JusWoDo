// Supabase Edge Function: grok-content-moderation
// Deploy: supabase functions deploy grok-content-moderation
//
// Runs AI-powered content safety & fraud moderation using Grok / Groq / OpenAI
// against User Generated Content (posts, services, comments) across Web & Mini Program.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const XAI_API_KEY = Deno.env.get("XAI_API_KEY") || Deno.env.get("GROK_API_KEY");
const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Local fallback regex for high-risk fraud, adult content & spam when AI key isn't set
const HIGH_RISK_LOCAL_PATTERNS = [
    // 色情 / 黄色 / 招嫖 / 擦边 / 福利引流
    /色情/i, /招嫖/i, /约炮/i, /约啪/i, /裸聊/i, /黄片/i, /看片/i, /福利视频/i, /私信领福利/i, /妹子上门/i, /上门服务.*微信/i, /情色/i, /成人用品/i, /嫖娼/i, /同城交友约/i, /同城妹子/i,
    // 地下金融与诈骗
    /私下换汇/i, /高价收加币/i, /低价换RMB/i, /对冲换汇/i, /出加币.*汇率/i,
    // 兼职与黑产
    /日赚.*元/i, /无门槛兼职/i, /刷单.*兼职/i, /代考.*代写/i, /包吃包住.*高薪/i,
    // 赌博/黑彩
    /地下赌场/i, /博彩.*网址/i, /彩票.*开挂/i
];

function checkLocalFallback(text: string): { flagged: boolean; reason?: string } {
    for (const pattern of HIGH_RISK_LOCAL_PATTERNS) {
        if (pattern.test(text)) {
            return {
                flagged: true,
                reason: "内容包含涉嫌色情、广告或违规的信息，请重新编辑后再发布。",
            };
        }
    }
    return { flagged: false };
}

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { status: 200, headers: corsHeaders });
    }

    try {
        const body = await req.json().catch(() => ({}));
        const content: string | undefined = body.content || body.text;

        if (!content || typeof content !== "string" || !content.trim()) {
            return new Response(JSON.stringify({ flagged: false }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const textToAudit = content.trim().substring(0, 3000);

        // System prompt for Grok / LLM Moderator
        const systemPrompt = `你是一个加拿大华人社区平台（渥帮JWD）的高级内容安全与风控审核员。
请严格审查用户提交的社区发帖、服务介绍或评论文本。
重点识别并拦截以下违规分类：
1. 【各类黄色与色情信息】：包含色情描写、露骨性暗示、同城招嫖、上门服务暗语、裸聊、色情视频/图片引流（如“看片”、“福利视频”、“私信领福利”）、成人用品违法推销、情色约啪等；
2. 【地下金融与诈骗】：私下换汇、高价收加币、对冲换汇套利诈骗；
3. 【兼职与黑产诈骗】：兼职刷单、日赚千元、代考代写、包吃包住高薪套路；
4. 【违法赌博与毒品】：地下赌场、网赌博彩、彩票开挂、违法物品；
5. 【垃圾广告与恶意攻击】：批量营销导流暗号、恶意人身攻击、政治敏感言论。

若判定内容存在上述任何违规，请务必设置 flagged 为 true。
请严格仅输出一个 JSON 对象，不得添加 Markdown 标记（如 \`\`\`json ）或其他前导结尾文字：
{"flagged": true, "reason": "包含涉嫌色情、招嫖或违规信息"} 或 {"flagged": false}`;

        let aiResponseText = "";

        // 1. Try Grok / xAI API
        if (XAI_API_KEY) {
            const res = await fetch("https://api.x.ai/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${XAI_API_KEY}`,
                },
                body: JSON.stringify({
                    model: "grok-2-mini",
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: textToAudit }
                    ],
                    temperature: 0.1,
                })
            });
            if (res.ok) {
                const data = await res.json();
                aiResponseText = data.choices?.[0]?.message?.content || "";
            }
        }

        // 2. Try Groq API (OpenAI compatible) if Grok is not configured
        if (!aiResponseText && GROQ_API_KEY) {
            const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${GROQ_API_KEY}`,
                },
                body: JSON.stringify({
                    model: "llama-3.3-70b-versatile",
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: textToAudit }
                    ],
                    temperature: 0.1,
                })
            });
            if (res.ok) {
                const data = await res.json();
                aiResponseText = data.choices?.[0]?.message?.content || "";
            }
        }

        // 3. Try OpenAI API if Groq/Grok not configured
        if (!aiResponseText && OPENAI_API_KEY) {
            const res = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${OPENAI_API_KEY}`,
                },
                body: JSON.stringify({
                    model: "gpt-4o-mini",
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: textToAudit }
                    ],
                    temperature: 0.1,
                })
            });
            if (res.ok) {
                const data = await res.json();
                aiResponseText = data.choices?.[0]?.message?.content || "";
            }
        }

        // Parse AI response if available
        if (aiResponseText) {
            try {
                const cleanedJson = aiResponseText.replace(/```json/gi, '').replace(/```/g, '').trim();
                const parsed = JSON.parse(cleanedJson);
                return new Response(JSON.stringify({
                    flagged: !!parsed.flagged,
                    reason: parsed.reason || (parsed.flagged ? "包含不适合公开发布的敏感信息" : undefined)
                }), {
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                });
            } catch (e) {
                console.error("Failed to parse AI response JSON:", aiResponseText);
            }
        }

        // Fallback to local regex matching if no AI API responded
        const fallbackResult = checkLocalFallback(textToAudit);
        return new Response(JSON.stringify(fallbackResult), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (error: any) {
        console.error("Error in grok-content-moderation:", error);
        // Fail open to avoid blocking valid posts during network glitches
        return new Response(JSON.stringify({ flagged: false, error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
