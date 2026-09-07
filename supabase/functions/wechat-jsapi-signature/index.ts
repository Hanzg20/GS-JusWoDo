// Supabase Edge Function: wechat-jsapi-signature
// Deploy: supabase functions deploy wechat-jsapi-signature
//
// Generates the appId/timestamp/nonceStr/signature package that the WeChat
// JS-SDK needs for wx.config() (see src/lib/wechatShare.ts). The signature
// is derived from a jsapi_ticket, which itself is derived from an
// access_token — both WeChat-side secrets that must never reach the
// browser, hence this server-side function.
//
// access_token and jsapi_ticket are both valid ~7200s and WeChat rate-limits
// how often they can be refreshed, so they're cached in module scope for the
// life of this warm function instance (mirrors the low-infra style of the
// other functions in this repo — no DB table for what's effectively a
// short-lived, single-value cache).

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const WECHAT_APP_ID = Deno.env.get("WECHAT_APP_ID");
const WECHAT_APP_SECRET = Deno.env.get("WECHAT_APP_SECRET");

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

let cachedTicket: { value: string; expiresAt: number } | null = null;

async function fetchAccessToken(): Promise<string> {
    const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${WECHAT_APP_ID}&secret=${WECHAT_APP_SECRET}`;
    const res = await fetch(url);
    const data = await res.json();
    if (!data.access_token) throw new Error(`WeChat token error: ${JSON.stringify(data)}`);
    return data.access_token;
}

async function fetchJsApiTicket(accessToken: string): Promise<string> {
    const url = `https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=${accessToken}&type=jsapi`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.errcode !== 0) throw new Error(`WeChat ticket error: ${JSON.stringify(data)}`);
    return data.ticket;
}

async function getJsApiTicket(): Promise<string> {
    const now = Date.now();
    if (cachedTicket && cachedTicket.expiresAt > now) return cachedTicket.value;

    const accessToken = await fetchAccessToken();
    const ticket = await fetchJsApiTicket(accessToken);
    // Refresh a few minutes early so we never serve a ticket WeChat has already expired.
    cachedTicket = { value: ticket, expiresAt: now + 7000 * 1000 };
    return ticket;
}

function randomNonceStr(len = 16): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let out = "";
    for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
    return out;
}

async function sha1Hex(input: string): Promise<string> {
    const digest = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(input));
    return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { status: 200, headers: corsHeaders });
    }

    try {
        if (!WECHAT_APP_ID || !WECHAT_APP_SECRET) {
            return new Response(JSON.stringify({ error: "Server misconfigured: missing WeChat credentials" }), {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const body = await req.json().catch(() => ({}));
        const targetUrl: string | undefined = body.url;
        if (!targetUrl) {
            return new Response(JSON.stringify({ error: "Missing 'url'" }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const ticket = await getJsApiTicket();
        const timestamp = Math.floor(Date.now() / 1000);
        const nonceStr = randomNonceStr();

        // WeChat spec: concatenate params as key=value pairs, sorted lexicographically
        // by key, then SHA1-hash the raw string. With exactly these 4 keys, alphabetical
        // order is jsapi_ticket, noncestr, timestamp, url.
        const raw = `jsapi_ticket=${ticket}&noncestr=${nonceStr}&timestamp=${timestamp}&url=${targetUrl}`;
        const signature = await sha1Hex(raw);

        return new Response(JSON.stringify({ appId: WECHAT_APP_ID, timestamp, nonceStr, signature }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("Error generating WeChat JS-SDK signature:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});

// Deploy Instructions:
// 1. supabase secrets set WECHAT_APP_ID=xxx WECHAT_APP_SECRET=xxx
// 2. supabase functions deploy wechat-jsapi-signature
