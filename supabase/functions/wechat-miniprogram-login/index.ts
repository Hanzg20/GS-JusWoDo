// Supabase Edge Function: wechat-miniprogram-login
// Deploy: supabase functions deploy wechat-miniprogram-login
//
// Bridges the WeChat Mini Program's *native* wx.login() into a real
// Supabase session — a different, simpler mechanism than 公众号网页授权
// (wechat-oauth-login): wx.login() is a pure API call from the mini-program
// shell (no redirect), so it never hits the web-view's 业务域名 domain
// whitelist the way the 公众号 OAuth flow does.
//   1. Exchange the `code` for openid/unionid — via the relay's
//      /miniprogram-session route (this WeChat call may be IP-restricted the
//      same way the others are, see wechat-relay/).
//   2. Find the Supabase Auth user for this identity — matched primarily by
//      wechat_unionid, since the Mini Program and 公众号 are bound under the
//      same 微信开放平台 account (unionid is shared across both; openid is
//      not — each "app" gets its own). Falls back to wechat_openid for
//      idempotency with a prior mini-program-only login.
//   3. `createIfMissing: false` (the silent auto-login on mini-program
//      launch, mirroring startSilentWeChatCheck()) reports {found:false}
//      for an unmatched identity rather than registering anyone — this
//      wx.login() call never shows a consent screen, so silently creating
//      an account nobody asked for isn't appropriate here either.
//      `createIfMissing: true` (the explicit "微信一键登录" button tap) does
//      register a new account — jscode2session gives no nickname/avatar, so
//      new accounts get a generic placeholder name the user can change later.
//   4. Mint a magic-link token for that user and hand it back — the
//      frontend calls supabase.auth.verifyOtp({ token_hash, type: 'email' })
//      with it, same redemption pattern as every other WeChat login path.

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

function miniprogramSessionUrl(): string {
    return WECHAT_RELAY_URL!.replace(/\/signature$/, '/miniprogram-session');
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
        const createIfMissing: boolean = body.createIfMissing === true;
        if (!code) {
            return new Response(JSON.stringify({ error: "Missing 'code'" }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // 1. Exchange code for openid/unionid via the relay.
        const relayRes = await fetch(miniprogramSessionUrl(), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code, secret: WECHAT_RELAY_SECRET }),
        });
        const session = await relayRes.json();
        if (!relayRes.ok || session.error) {
            throw new Error(session.error || `Relay returned HTTP ${relayRes.status}`);
        }
        const { openid, unionid } = session;
        if (!openid) throw new Error("WeChat did not return an openid");

        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        const syntheticEmail = `mp_${openid}@wechat.justwedo.com`;

        // 2. Find the existing account, if any — unionid first (shared
        // identity with 公众号 login), openid as a fallback.
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
        } else if (!createIfMissing) {
            return new Response(JSON.stringify({ found: false }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        } else {
            const { data: created, error: createError } = await supabase.auth.admin.createUser({
                email: syntheticEmail,
                email_confirm: true,
                user_metadata: {
                    // jscode2session carries no profile info — generic
                    // placeholder name, matching the "邻居" naming spirit
                    // used elsewhere; the user can set a real nickname later.
                    full_name: `邻居${openid.slice(-4)}`,
                },
            });
            if (createError || !created?.user) {
                throw new Error(createError?.message || "Failed to create user");
            }
            userId = created.user.id;

            const { error: linkError } = await supabase
                .from('user_profiles')
                .update({ wechat_openid: openid, ...(unionid ? { wechat_unionid: unionid } : {}) })
                .eq('id', userId);
            if (linkError) throw new Error(`Failed to link wechat identity: ${linkError.message}`);
        }

        // 3. Resolve the account's real email — a fresh signup uses the
        // synthetic one just created, but an *existing* match could be any
        // kind of account (normal email signup, 公众号 WeChat login, etc.),
        // so look its actual email up by id rather than guessing.
        let emailForLink = syntheticEmail;
        if (existingProfile) {
            const { data: userRecord, error: getUserErr } = await supabase.auth.admin.getUserById(userId);
            if (getUserErr || !userRecord?.user?.email) {
                throw new Error(getUserErr?.message || "Could not resolve account email");
            }
            emailForLink = userRecord.user.email;
        }

        // 4. Mint a magic-link token the frontend can redeem for a real session.
        const { data: linkData, error: linkGenError } = await supabase.auth.admin.generateLink({
            type: 'magiclink',
            email: emailForLink,
        });
        if (linkGenError || !linkData) {
            throw new Error(linkGenError?.message || "Failed to generate session link");
        }

        return new Response(JSON.stringify({
            tokenHash: linkData.properties.hashed_token,
        }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("Error in wechat-miniprogram-login:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});

// Deploy Instructions:
// 1. Requires WECHAT_RELAY_URL / WECHAT_RELAY_SECRET (already set for
//    wechat-jsapi-signature) plus the relay running the updated
//    relay-server.js with the /miniprogram-session route, and the relay's
//    config.json carrying miniprogramAppId/miniprogramAppSecret.
// 2. supabase functions deploy wechat-miniprogram-login
