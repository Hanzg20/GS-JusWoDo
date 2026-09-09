// Supabase Edge Function: create-welcome-conversation
// Deploy: supabase functions deploy create-welcome-conversation
//
// Seeds a new user's chat list with a conversation with 渥帮客服 (see
// src/config/support.ts for the account id) plus a canned welcome
// message, so a first-time visitor to /chat sees something instead of an
// empty list. Runs with the service-role key because the welcome message
// must appear to genuinely come from the support account — a normal
// client-side insert can only ever set sender_id = auth.uid() (its own
// RLS policy: "Users can send messages to their conversations"), so a
// browser session can't send a message as another account itself.
//
// Idempotent: safe to call every time Chat.tsx loads with zero
// conversations — does nothing if the conversation already exists.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const SUPPORT_USER_ID = 'b364c065-6143-4c11-b3ca-74c8494a526a'; // keep in sync with src/config/support.ts

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const WELCOME_MESSAGE = "欢迎来到渥帮 JustWeDo！有任何问题都可以在这里给我们留言。\nWelcome to JustWeDo! Feel free to message us here with any questions.";

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
        const userId: string | undefined = body.userId;
        if (!userId) {
            return new Response(JSON.stringify({ error: "Missing 'userId'" }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }
        if (userId === SUPPORT_USER_ID) {
            // The support account itself has no chat list to seed.
            return new Response(JSON.stringify({ skipped: true }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        const { data: existing } = await supabase
            .from('conversations')
            .select('id')
            .or(`and(participant_a.eq.${userId},participant_b.eq.${SUPPORT_USER_ID}),and(participant_a.eq.${SUPPORT_USER_ID},participant_b.eq.${userId})`)
            .maybeSingle();

        if (existing) {
            return new Response(JSON.stringify({ conversationId: existing.id, created: false }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const { data: conversation, error: convError } = await supabase
            .from('conversations')
            .insert({ participant_a: userId, participant_b: SUPPORT_USER_ID })
            .select('id')
            .single();
        if (convError || !conversation) throw new Error(convError?.message || "Failed to create conversation");

        const { error: msgError } = await supabase
            .from('messages')
            .insert({
                conversation_id: conversation.id,
                sender_id: SUPPORT_USER_ID,
                content: WELCOME_MESSAGE,
                message_type: 'TEXT',
            });
        if (msgError) throw new Error(msgError.message);

        return new Response(JSON.stringify({ conversationId: conversation.id, created: true }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("Error in create-welcome-conversation:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
