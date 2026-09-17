// Supabase Edge Function: wechat-content-check
// Deploy: supabase functions deploy wechat-content-check
//
// Runs WeChat's own free content-security checks (msgSecCheck for text,
// imgSecCheck for images) against UGC posted from inside the Mini
// Program's <web-view> — see the "用户生成内容场景信息安全声明" review
// question and project memory for why this is scoped to the Mini Program
// channel only: both checks require the acting user's Mini-Program-scoped
// openid, and WeChat rejects an openid with no recent mini-program
// session, so this can't cover UGC posted through the regular website.
//
// Called from the client (LitePost.tsx, Publish.tsx) only when
// isWeChatMiniProgramWebview() is true, right before actually publishing
// — never as a background/async check, so a flagged post never briefly
// goes live before being caught.
//
// Fails open on any infrastructure problem (relay down, WeChat API
// error, no wechat_mp_openid on file) rather than blocking a legitimate
// post over a check that couldn't run — this is a best-effort compliance
// layer on top of the existing report/admin-review system, not the only
// line of defense.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const WECHAT_RELAY_URL = Deno.env.get("WECHAT_RELAY_URL"); // configured as the /signature endpoint
const WECHAT_RELAY_SECRET = Deno.env.get("WECHAT_RELAY_SECRET");

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function relayUrl(path: string): string {
    return WECHAT_RELAY_URL!.replace(/\/signature$/, path);
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
        if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !WECHAT_RELAY_URL || !WECHAT_RELAY_SECRET) {
            // No relay configured yet — fail open (nothing to check against).
            return sendJson({ flagged: false, skipped: "Server misconfigured" });
        }

        const body = await req.json().catch(() => ({}));
        const userId: string | undefined = body.userId;
        const type: 'text' | 'image' | undefined = body.type;
        const content: string | undefined = body.content;
        const imageUrl: string | undefined = body.imageUrl;

        if (!userId || !type || (type === 'text' && !content) || (type === 'image' && !imageUrl)) {
            return sendJson({ flagged: false, skipped: "Missing required fields" });
        }

        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('wechat_mp_openid')
            .eq('id', userId)
            .maybeSingle();

        // No Mini-Program-scoped openid on file — this poster never
        // actually authenticated through the Mini Program (e.g. they're
        // just browsing the web-view without ever having logged in via
        // wx.login()), so there's no valid identity to run the check
        // under. Fail open rather than block a legitimate post.
        if (!profile?.wechat_mp_openid) {
            return sendJson({ flagged: false, skipped: "No wechat_mp_openid on file" });
        }

        if (type === 'text') {
            const res = await fetch(relayUrl('/msg-sec-check'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ secret: WECHAT_RELAY_SECRET, openid: profile.wechat_mp_openid, content }),
            });
            const result = await res.json();
            // v2 semantic check: result.result.suggest is 'pass'|'review'|'risky'.
            const suggest = result?.result?.suggest;
            return sendJson({ flagged: suggest === 'risky', reason: suggest !== 'pass' ? suggest : undefined });
        }

        // type === 'image'
        const res = await fetch(relayUrl('/img-sec-check'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ secret: WECHAT_RELAY_SECRET, imageUrl }),
        });
        const result = await res.json();
        // v1 binary check: errcode 0 = pass, anything else = flagged.
        return sendJson({ flagged: result?.errcode !== 0 });
    } catch (error) {
        console.error("Error in wechat-content-check:", error);
        // Same fail-open philosophy — an infra hiccup here must never
        // block someone from posting.
        return sendJson({ flagged: false, error: error.message });
    }
});

// Deploy Instructions:
// 1. Requires WECHAT_RELAY_URL / WECHAT_RELAY_SECRET (already set for the
//    other WeChat functions) plus the relay running with the
//    /msg-sec-check and /img-sec-check routes and miniprogramAppId/
//    miniprogramAppSecret in config.json.
// 2. supabase functions deploy wechat-content-check
