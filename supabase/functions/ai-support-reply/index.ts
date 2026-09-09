// Supabase Edge Function: ai-support-reply
// Deploy: supabase functions deploy ai-support-reply
//
// Fire-and-forget: whenever any chat message is sent, the client also
// calls this with just the messageId (same defensive pattern as
// notify-offline-message — everything else is re-derived server-side).
// This function only actually does something when the message's recipient
// is 渥帮客服 (SUPPORT_USER_ID, see src/config/support.ts) and the sender
// isn't itself — i.e. a real user messaged support. It then asks Groq's
// free-tier API (OpenAI-compatible; open-weight Llama models, not Gemini —
// see the 2026-09-09 conversation history: Gemini 3.x's free-tier
// Flash/Flash-Lite models were tested extensively with two separate API
// keys and consistently ignored systemInstruction, hallucinating an
// unrelated persona/topic on nearly every call — a known, externally
// corroborated regression in that model generation, not a prompt-wording
// problem) for a reply, grounded in a hand-written knowledge base below
// (not the app's actual help-center copy, some of which describes
// aspirational features — e.g. an escrow system — that aren't live yet;
// this prompt is deliberately fact-checked against the real platform
// state instead), and inserts the reply as a message from the support
// account.
//
// No online/offline detection — this replies to every message sent to
// support, full stop. For a small/solo operation an "AI-first, human
// checks in later via /admin/messages" model is simpler than tracking
// staff presence, and can be revisited if that stops being true.
//
// Requires the GROQ_API_KEY secret (free tier, from console.groq.com — no
// credit card needed). Until it's set, this is a silent no-op, same as
// notify-offline-message's WECHAT_TEMPLATE_ID gate.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
const GROQ_MODEL = "llama-3.3-70b-versatile";
const SUPPORT_USER_ID = 'b364c065-6143-4c11-b3ca-74c8494a526a'; // keep in sync with src/config/support.ts

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Deliberately fact-checked against the real platform state (2026-09-08),
// not copied from HelpCenter.tsx's FAQ copy, which describes some
// not-yet-live features (e.g. "金豆托管机制" escrow) as if already active.
// Update this if real platform behavior changes (e.g. PAYMENTS_ENABLED
// flips true and a real escrow/payment flow ships).
const SYSTEM_PROMPT = `你是渥帮 JustWeDo（渥太华本地生活服务平台）的智能客服"渥帮客服"。请用简洁、友好的语气回答用户问题，并使用用户提问所用的语言（中文或英文）回复，不要中英混杂。

关于渥帮 JustWeDo 的真实平台信息（回答时必须严格基于以下事实，不要编造未提及的政策、功能或时限）：
- 渥帮是 GoldSky Technologies 旗下面向渥太华地区的本地生活服务平台。
- 平台核心板块：商户服务（本地专业服务/商户，如清洁、维修、宠物美容等）、邻里互助（社区求助、跑腿、推荐、资讯）、二手闲置（个人闲置物品买卖/赠送），首页还有产品、任务、租赁等分类。
- 目前平台【没有】站内支付托管或担保交易机制——交易的付款方式、时间、地点由买卖双方自行在聊天中协商确定，平台不参与资金环节，也不提供退款保证。如果用户问"钱有没有保障"，如实说明目前是这个状态，不要暗示有担保。
- 用户可以在具体服务/商品详情页点击"Chat"或"联系"按钮直接和商家/邻居发起聊天。
- 如果用户反映和某个商家/邻居之间有纠纷、投诉，或者需要人工客服介入，回复"已经记录，人工客服会尽快跟进处理"，不要承诺具体的处理时限、赔偿方案或调查结果。
- 遇到你不确定、平台信息里没有提到的问题（具体价格、优惠活动、认证审核细节等），如实说"这个我暂时不确定，会请人工客服跟进确认"，绝对不要猜测或编造答案。
- 回复保持简短，2-4 句话为宜，不要用"作为一个AI"这类自我暴露的措辞，以"渥帮客服"的身份自然回复。`;

function sendJson(data: unknown, status = 200): Response {
    return new Response(JSON.stringify(data), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
}

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { status: 200, headers: corsHeaders });
    }

    try {
        if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
            return sendJson({ error: "Server misconfigured" }, 500);
        }
        if (!GROQ_API_KEY) {
            return sendJson({ skipped: "GROQ_API_KEY not configured yet" });
        }

        const body = await req.json().catch(() => ({}));
        const messageId: string | undefined = body.messageId;
        if (!messageId) return sendJson({ error: "Missing 'messageId'" }, 400);

        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        const { data: message, error: messageError } = await supabase
            .from('messages')
            .select('conversation_id, sender_id, content')
            .eq('id', messageId)
            .single();
        if (messageError || !message) throw new Error(messageError?.message || "Message not found");

        // Only reply to messages actually sent TO support, and never reply
        // to support's own messages (would otherwise be a trivial
        // infinite loop — this message store action fires for every send,
        // AI replies included, if this function were ever called on them).
        if (message.sender_id === SUPPORT_USER_ID) {
            return sendJson({ skipped: "Message was from support itself" });
        }

        const { data: conversation, error: convError } = await supabase
            .from('conversations')
            .select('participant_a, participant_b')
            .eq('id', message.conversation_id)
            .single();
        if (convError || !conversation) throw new Error(convError?.message || "Conversation not found");

        const recipientId = conversation.participant_a === message.sender_id
            ? conversation.participant_b
            : conversation.participant_a;
        if (recipientId !== SUPPORT_USER_ID) {
            return sendJson({ skipped: "Not a message to support" });
        }

        // Last 10 messages for light conversational context — this is a
        // support chat, not a long-running thread, so a full history
        // isn't needed and would just cost more tokens.
        const { data: history } = await supabase
            .from('messages')
            .select('sender_id, content')
            .eq('conversation_id', message.conversation_id)
            .order('created_at', { ascending: false })
            .limit(10);
        const orderedHistory = (history || []).reverse();

        const chatMessages = [
            { role: 'system', content: SYSTEM_PROMPT },
            ...orderedHistory
                .filter(m => m.content) // skip non-text (image/location/quote) messages the model can't read
                .map(m => ({
                    role: m.sender_id === SUPPORT_USER_ID ? 'assistant' : 'user',
                    content: m.content,
                })),
        ];

        const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${GROQ_API_KEY}`,
            },
            body: JSON.stringify({
                model: GROQ_MODEL,
                messages: chatMessages,
            }),
        });
        const groqData = await groqRes.json();
        const replyText: string | undefined = groqData?.choices?.[0]?.message?.content;

        if (!groqRes.ok || !replyText) {
            console.error("Groq reply generation failed:", groqRes.status, JSON.stringify(groqData));
            return sendJson({ replied: false, error: "AI generation failed" });
        }

        const { error: insertError } = await supabase
            .from('messages')
            .insert({
                conversation_id: message.conversation_id,
                sender_id: SUPPORT_USER_ID,
                content: replyText.trim(),
                message_type: 'TEXT',
                metadata: { isAI: true },
            });
        if (insertError) throw new Error(insertError.message);

        return sendJson({ replied: true });
    } catch (error) {
        // Same philosophy as notify-offline-message: this is a side
        // effect of sending a message, not the send itself — never let a
        // failure here read as "your message failed to send".
        console.error("Error in ai-support-reply:", error);
        return sendJson({ replied: false, error: error.message });
    }
});
