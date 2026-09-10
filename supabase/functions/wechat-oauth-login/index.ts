// Supabase Edge Function: wechat-oauth-login
// Deploy: supabase functions deploy wechat-oauth-login
//
// Bridges WeChat's 公众号网页授权 (OAuth2 web authorization) into a real
// Supabase session. Supabase has no built-in WeChat provider (unlike
// Google/Apple), so this does it by hand:
//   1. Exchange the `code` the browser got redirected back with for the
//      user's openid/nickname/avatar — via the relay (see wechat-relay/),
//      since this weixin.qq.com call may be IP-restricted the same way the
//      JS-SDK signature one was.
//   2. Find or create a Supabase Auth user for that openid (new users get
//      a synthetic email so auth.users' NOT NULL constraint is satisfied;
//      handle_new_oauth_user() — the same trigger Google/Apple signups go
//      through — populates their user_profiles row from user_metadata).
//      Skipped for mode:'silent' (see startSilentWeChatCheck() in
//      wechatAuth.ts) — that flow has no nickname/avatar to register a new
//      account with, so an unmatched openid just reports back {notFound:true}.
//   3. Mint a magic-link token for that user and hand it back — the
//      frontend calls supabase.auth.verifyOtp({ email, token, type:
//      'magiclink' }) with it to actually establish the session client-side.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const WECHAT_RELAY_URL = Deno.env.get("WECHAT_RELAY_URL"); // same secret as wechat-jsapi-signature, e.g. http://<ip>:8787/signature
const WECHAT_RELAY_SECRET = Deno.env.get("WECHAT_RELAY_SECRET");

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function oauthUserInfoUrl(): string {
    // WECHAT_RELAY_URL is configured as the /signature endpoint; the relay
    // also serves /oauth-userinfo on the same host/port.
    return WECHAT_RELAY_URL!.replace(/\/signature$/, '/oauth-userinfo');
}

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { status: 200, headers: corsHeaders });
    }

    try {
        if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !WECHAT_RELAY_URL || !WECHAT_RELAY_SECRET) {
            return new Response(JSON.stringify({ error: "Server misconfigured" }), {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const body = await req.json().catch(() => ({}));
        const code: string | undefined = body.code;
        // 'silent' = startSilentWeChatCheck()'s invisible snsapi_base
        // redirect (no consent screen, no nickname/avatar available) — an
        // unmatched openid there must NOT create an account, just report
        // back that this WeChat identity isn't registered yet. 'consent'
        // (the default, from the "微信登录" button's snsapi_userinfo flow)
        // has real profile data and can register a new user.
        const mode: 'silent' | 'consent' = body.mode === 'silent' ? 'silent' : 'consent';
        if (!code) {
            return new Response(JSON.stringify({ error: "Missing 'code'" }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // 1. Exchange code for openid/nickname/avatar via the relay.
        const relayRes = await fetch(oauthUserInfoUrl(), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code, secret: WECHAT_RELAY_SECRET }),
        });
        const userInfo = await relayRes.json();
        if (!relayRes.ok || userInfo.error) {
            throw new Error(userInfo.error || `Relay returned HTTP ${relayRes.status}`);
        }
        const { openid, unionid, nickname, headimgurl } = userInfo;
        if (!openid) throw new Error("WeChat did not return an openid");

        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        const syntheticEmail = `wx_${openid}@wechat.justwedo.com`;

        // 2. Find or create the auth user for this openid. unionid (when
        // present) is checked first — it's the identity shared with the
        // Mini Program (see wechat-miniprogram-login), so someone who
        // registered there first should land on that same account here too.
        const { data: existingProfile } = await supabase
            .from('user_profiles')
            .select('id, wechat_unionid')
            .or(unionid ? `wechat_openid.eq.${openid},wechat_unionid.eq.${unionid}` : `wechat_openid.eq.${openid}`)
            .maybeSingle();

        let userId: string;
        if (existingProfile) {
            userId = existingProfile.id;
            if (unionid && !existingProfile.wechat_unionid) {
                await supabase.from('user_profiles').update({ wechat_unionid: unionid }).eq('id', userId);
            }
        } else if (mode === 'silent') {
            return new Response(JSON.stringify({ notFound: true }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        } else {
            const { data: created, error: createError } = await supabase.auth.admin.createUser({
                email: syntheticEmail,
                email_confirm: true,
                user_metadata: {
                    full_name: nickname || undefined,
                    avatar_url: headimgurl || undefined,
                },
            });
            if (createError || !created?.user) {
                throw new Error(createError?.message || "Failed to create user");
            }
            userId = created.user.id;

            // handle_new_oauth_user() already inserted the user_profiles row —
            // just attach the openid (+ unionid, when present) so next login
            // finds it by the branch above.
            const { error: linkError } = await supabase
                .from('user_profiles')
                .update({ wechat_openid: openid, ...(unionid ? { wechat_unionid: unionid } : {}) })
                .eq('id', userId);
            if (linkError) throw new Error(`Failed to link wechat_openid: ${linkError.message}`);
        }

        // 3. Mint a magic-link token the frontend can redeem for a real session.
        const { data: linkData, error: linkGenError } = await supabase.auth.admin.generateLink({
            type: 'magiclink',
            email: syntheticEmail,
        });
        if (linkGenError || !linkData) {
            throw new Error(linkGenError?.message || "Failed to generate session link");
        }

        return new Response(JSON.stringify({
            email: syntheticEmail,
            tokenHash: linkData.properties.hashed_token,
        }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("Error in wechat-oauth-login:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});

// Deploy Instructions:
// 1. Requires WECHAT_RELAY_URL / WECHAT_RELAY_SECRET (already set for
//    wechat-jsapi-signature) plus the relay running the updated
//    relay-server.js with the /oauth-userinfo route.
// 2. supabase functions deploy wechat-oauth-login
