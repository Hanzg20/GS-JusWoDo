// Supabase Edge Function: wechat-jsapi-signature
// Deploy: supabase functions deploy wechat-jsapi-signature
//
// Generates the appId/timestamp/nonceStr/signature package that the WeChat
// JS-SDK needs for wx.config() (see src/lib/wechatShare.ts).
//
// WeChat's access_token API only accepts requests from IPs in the official
// account's IP白名单, and Supabase Edge Functions have no fixed outbound
// IP (confirmed empirically: consecutive calls came from different AWS
// IPs), so this function can't call weixin.qq.com directly. Instead it
// forwards to a small relay (see wechat-relay/ in the repo root) running on
// a server whose IP IS whitelisted, which does the actual WeChat calls and
// returns the finished signature package.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const WECHAT_RELAY_URL = Deno.env.get("WECHAT_RELAY_URL"); // e.g. http://101.200.62.54:8787/signature
const WECHAT_RELAY_SECRET = Deno.env.get("WECHAT_RELAY_SECRET");

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { status: 200, headers: corsHeaders });
    }

    try {
        if (!WECHAT_RELAY_URL || !WECHAT_RELAY_SECRET) {
            return new Response(JSON.stringify({ error: "Server misconfigured: missing WECHAT_RELAY_URL/WECHAT_RELAY_SECRET" }), {
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

        const relayRes = await fetch(WECHAT_RELAY_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: targetUrl, secret: WECHAT_RELAY_SECRET }),
        });
        const data = await relayRes.json();
        if (!relayRes.ok || data.error) {
            throw new Error(data.error || `Relay returned HTTP ${relayRes.status}`);
        }

        return new Response(JSON.stringify(data), {
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
// 1. Deploy wechat-relay/ (see its README.md) on a server whose IP is in
//    the WeChat 公众平台 IP白名单.
// 2. supabase secrets set WECHAT_RELAY_URL=http://<relay-ip>:8787/signature WECHAT_RELAY_SECRET=<same value as relay's config.json sharedSecret>
// 3. supabase functions deploy wechat-jsapi-signature
