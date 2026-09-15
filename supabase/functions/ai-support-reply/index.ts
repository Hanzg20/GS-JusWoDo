// Supabase Edge Function: ai-support-reply
// Deploy: supabase functions deploy ai-support-reply
//
// Fire-and-forget: whenever any chat message is sent, the client also
// calls this with just the messageId (same defensive pattern as
// notify-offline-message — everything else is re-derived server-side).
// This function only actually does something when the message's recipient
// is 小海狸 (SUPPORT_USER_ID, see src/config/support.ts) and the sender
// isn't itself — i.e. a real user messaged support. It then asks Groq's
// free-tier API (OpenAI-compatible; open-weight Llama models, not Gemini —
// see the 2026-09-09 conversation history: Gemini 3.x's free-tier
// Flash/Flash-Lite models were tested extensively with two separate API
// keys and consistently ignored systemInstruction, hallucinating an
// unrelated persona/topic on nearly every call — a known, externally
// corroborated regression in that model generation, not a prompt-wording
// problem) for a reply, grounded in the ai_knowledge_base table (see
// buildSystemPrompt() below — not the app's actual help-center copy,
// some of which describes aspirational features, e.g. an escrow system,
// that aren't live yet; the seeded knowledge base rows are deliberately
// fact-checked against the real platform state instead), and inserts the
// reply as a message from the support account.
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
const GROQ_MODEL = "openai/gpt-oss-120b"; // OpenAI's own open-weight model on Groq's free tier — validated 2026-09-09 for both speed and accurate use of the injected 渥帮 context (see project memory)
const SUPPORT_USER_ID = 'b364c065-6143-4c11-b3ca-74c8494a526a'; // keep in sync with src/config/support.ts

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// How to behave — stays hardcoded (rarely changes, and changing tone/
// safety rules should go through a code review, not a casual DB edit).
// What to know — lives in the ai_knowledge_base table instead (see
// supabase/migrations/20260909_ai_knowledge_base.sql) so the operator can
// add/edit platform facts via /admin/knowledge-base without a deploy.
//
// Renamed from "渥帮客服" to "小海狸" 2026-09-14 — user feedback was that
// the old persona read as too official/serious for what's meant to be a
// friendly neighborhood chat, not a corporate helpdesk. Beaver: Canada's
// national animal, industrious/helpful connotation, distinct from the
// existing 邻里圈 mascot 小螺号. The personality rewrite below is the whole
// point of the change, not just the name — the anti-hallucination
// grounding rule is the one thing that must stay exactly as strict as
// before regardless of how warm/playful the rest of the tone gets.
const PROMPT_INSTRUCTIONS = `你是渥帮 JustWeDo（渥太华本地生活服务平台）的"小海狸"——一只热心肠、脑子转得快的小海狸，负责在渥帮陪邻居们聊天、答疑解惑。用英文回复时就自称"Beaver"就行。

说话不要端着，像个熟络的热心邻居，可以偶尔卖个萌、开个小玩笑，语气活泼一点没关系，但绝不是没正经——遇到正事得靠谱。回复保持简短自然，2-4 句话为宜，不要说"作为一个AI"这类自我暴露的话，也别用"尊敬的用户您好"这种死板客套的客服腔，就用"小海狸"自己的语气自然接话。

除了回答平台相关的问题，用户打个招呼、闲聊两句、随口感慨一下天气心情，都可以自然接住聊几句，不用每次都硬往平台功能上拽。

但有一条底线绝对不能松：凡是涉及平台具体信息的回答，必须严格基于下面"平台信息"部分给出的事实，不能编造没提到的政策、功能或时限。遇到平台信息里没提到、自己拿不准的问题（具体价格、优惠活动、认证审核细节等），要老实说"这个我还真不确定，让人工客服跟进给你确认哈"，绝对不能靠猜或编答案糊弄过去。`;

// `language` ('zh'/'en') is the asker's own current UI language setting,
// passed by the client (see messageStore.ts) — more reliable than
// inferring from the message text (ambiguous for short messages, and a
// user can type in a different language than their UI is set to). Falls
// back to text-inference phrasing if the client didn't send one (e.g. an
// old cached bundle mid-deploy).
function languageInstruction(language?: string): string {
    if (language === 'zh') return '请用中文回复。';
    if (language === 'en') return 'Reply in English.';
    return '请使用用户提问所用的语言（中文或英文）回复。';
}

async function buildSystemPrompt(supabase: ReturnType<typeof createClient>, language?: string): Promise<string> {
    const { data: facts } = await supabase
        .from('ai_knowledge_base')
        .select('content')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

    const factList = (facts || []).map(f => `- ${f.content}`).join('\n');
    return `${PROMPT_INSTRUCTIONS}\n\n${languageInstruction(language)}\n\n平台信息：\n${factList}`;
}

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
        const language: string | undefined = body.language;
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
        const systemPrompt = await buildSystemPrompt(supabase, language);

        const chatMessages = [
            { role: 'system', content: systemPrompt },
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
