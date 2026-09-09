// Supabase Edge Function: notify-offline-message
// Deploy: supabase functions deploy notify-offline-message
// (Renamed from wechat-notify-message 2026-09-08 once this grew a second,
// non-WeChat channel — the old name would have been misleading.)
//
// Fire-and-forget offline notification for chat: when a message is sent,
// the client calls this with just the messageId (not sender name/content —
// everything is re-derived server-side with the service-role key so a
// client can't fake who a notification appears to come from or forge its
// content). Tries two channels, in order, and stops at the first that
// applies:
//   1. WeChat template message, if the recipient has a wechat_openid on
//      file (logged in via WeChat at least once — see wechat-oauth-login).
//   2. SMS via the same Twilio/AWS-SNS relay already used by
//      notify-restock (see _shared/sms.ts) — for everyone else, if they
//      have a phone number on file.
// If neither applies, this is a silent no-op — there's genuinely no
// channel to reach that user outside the app yet, which is a known gap,
// not a bug.
//
// The WeChat path additionally requires the WECHAT_TEMPLATE_ID secret — a
// template selected/added in 微信公众平台 → 模板消息 → 模板库 (服务号-only
// feature; JWD's account was confirmed to be a 服务号 on 2026-09-08).
// Until that secret is set, WeChat-eligible recipients just fall through
// silently too (not to SMS — they have no phone requirement to fall back
// on, and spamming a WeChat user's phone as a substitute isn't the
// intent).

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { sendSMS } from '../_shared/sms.ts';

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const WECHAT_RELAY_URL = Deno.env.get("WECHAT_RELAY_URL"); // configured as the /signature endpoint
const WECHAT_RELAY_SECRET = Deno.env.get("WECHAT_RELAY_SECRET");
const WECHAT_TEMPLATE_ID = Deno.env.get("WECHAT_TEMPLATE_ID");
const SITE_URL = Deno.env.get("SITE_URL") || "https://justwedo.com";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function relayUrl(path: string): string {
    return WECHAT_RELAY_URL!.replace(/\/signature$/, path);
}

// WeChat's phone_number-type template field validates the shape (digits
// only, plausible length), not that it's a real/callable number — a
// stored phone like "(343) 777-9666" needs its formatting stripped, and
// a sender with no phone on file still needs *something* shaped like one.
function sanitizePhone(phone: string | null): string {
    const digitsOnly = (phone || '').replace(/\D/g, '');
    return digitsOnly.length >= 7 ? digitsOnly : '0000000000';
}

async function sendViaWeChat(openid: string, senderName: string, senderPhone: string | null, preview: string): Promise<boolean> {
    if (!WECHAT_TEMPLATE_ID || !WECHAT_RELAY_URL || !WECHAT_RELAY_SECRET) return false;
    // Must never throw out of this function — a relay hiccup or stale
    // deploy (e.g. /send-template-message not live yet on the relay) has
    // to fall through to the SMS leg below, not abort the whole handler.
    try {
        const now = new Date().toLocaleString('zh-CN', { timeZone: 'America/Toronto' });
        const relayRes = await fetch(relayUrl('/send-template-message'), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                secret: WECHAT_RELAY_SECRET,
                openid,
                templateId: WECHAT_TEMPLATE_ID,
                url: `${SITE_URL}/chat`,
                // Field names/shape are specific to template
                // 74v4Dpkw7LxhMwmeI7kc_GgugUTbiJ1bUbnTds1Scv4 ("工单处理通知",
                // 信息查询 category, added by the operator 2025-05-21 — no
                // enum-constrained fields this time, unlike the previous
                // template tried (const5, permanently blocked pending
                // WeChat's own review — see project memory
                // jwd_chat_v2_admin_presence_wechat_notify). Repurposed for
                // "you got a new chat message": 姓名→sender name, 地址→
                // message preview, 联系电话→sender phone, 上门时间→send time.
                // 工单编号 (character_string type) rejects Chinese/non-
                // alphanumeric content (confirmed via live test 2026-09-09
                // — errcode 47003 on Chinese text) so it just gets a fixed
                // ASCII label, not the preview. phone_number type also
                // rejects non-phone-shaped text (confirmed the same way),
                // so a real phone gets digit-stripped and a syntactically
                // phone-shaped placeholder is used when there isn't one —
                // WeChat validates the *shape*, not that it's real/callable.
                data: {
                    character_string1: { value: 'MSG' },
                    thing5: { value: senderName.slice(0, 20) },
                    thing16: { value: preview.slice(0, 20) || '新消息' },
                    phone_number32: { value: sanitizePhone(senderPhone) },
                    time46: { value: now },
                },
            }),
        });
        const text = await relayRes.text();
        const result = text ? JSON.parse(text) : null;
        if (!result || result.errcode !== 0) {
            console.warn("WeChat template send did not succeed:", relayRes.status, text);
        }
        return result?.errcode === 0;
    } catch (err) {
        console.error("sendViaWeChat failed:", err);
        return false;
    }
}

async function sendViaSms(phone: string, senderName: string, preview: string): Promise<boolean> {
    const message = `渥帮 JustWeDo: 你有一条来自 ${senderName} 的新消息 / New message from ${senderName}: ${preview}\n${SITE_URL}/chat`;
    const result = await sendSMS({ phoneNumber: phone, message });
    return result.success;
}

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { status: 200, headers: corsHeaders });
    }

    try {
        if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
            return new Response(JSON.stringify({ error: "Server misconfigured" }), {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const body = await req.json().catch(() => ({}));
        const messageId: string | undefined = body.messageId;
        if (!messageId) {
            return new Response(JSON.stringify({ error: "Missing 'messageId'" }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        const { data: message, error: messageError } = await supabase
            .from('messages')
            .select('conversation_id, sender_id, content')
            .eq('id', messageId)
            .single();
        if (messageError || !message) throw new Error(messageError?.message || "Message not found");

        const { data: conversation, error: convError } = await supabase
            .from('conversations')
            .select('participant_a, participant_b')
            .eq('id', message.conversation_id)
            .single();
        if (convError || !conversation) throw new Error(convError?.message || "Conversation not found");

        const recipientId = conversation.participant_a === message.sender_id
            ? conversation.participant_b
            : conversation.participant_a;

        const { data: recipient } = await supabase
            .from('user_profiles')
            .select('wechat_openid, phone')
            .eq('id', recipientId)
            .maybeSingle();

        if (!recipient) {
            return new Response(JSON.stringify({ skipped: "Recipient profile not found" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const { data: sender } = await supabase
            .from('user_profiles')
            .select('name, phone')
            .eq('id', message.sender_id)
            .maybeSingle();
        const senderName = sender?.name || 'Someone';
        const preview = String(message.content || '').slice(0, 40);

        let sent = false;
        let channel: 'wechat' | 'sms' | null = null;

        if (recipient.wechat_openid) {
            sent = await sendViaWeChat(recipient.wechat_openid, senderName, sender?.phone || null, preview);
            if (sent) channel = 'wechat';
        }
        if (!sent && recipient.phone) {
            sent = await sendViaSms(recipient.phone, senderName, preview);
            if (sent) channel = 'sms';
        }

        return new Response(JSON.stringify({ sent, channel }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    } catch (error) {
        // This is a side-channel notification, not the message send itself
        // — log and return 200-ish info rather than an error status, so a
        // failure here never reads to the caller as "your message failed".
        console.error("Error in notify-offline-message:", error);
        return new Response(JSON.stringify({ sent: false, error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
