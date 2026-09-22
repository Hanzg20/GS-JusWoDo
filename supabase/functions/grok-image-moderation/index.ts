// Supabase Edge Function: grok-image-moderation
// Deploy: supabase functions deploy grok-image-moderation

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Simple local fallback patterns for image URLs or filenames indicating NSFW content
const IMAGE_HIGH_RISK_PATTERNS = [
  /porn|sex|裸|黄片|成人电影|adult|nsfw|情色/i,
];

function checkImageLocalFallback(url: string): { flagged: boolean; reason?: string } {
  for (const pattern of IMAGE_HIGH_RISK_PATTERNS) {
    if (pattern.test(url)) {
      return { flagged: true, reason: "图片内容涉嫌色情或违规" };
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
    const imageUrl: string | undefined = body.imageUrl || body.url;

    if (!imageUrl) {
      return new Response(JSON.stringify({ flagged: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Local regex fast path (always run)
    const localCheck = checkImageLocalFallback(imageUrl);
    if (localCheck.flagged) {
      return new Response(JSON.stringify(localCheck), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Placeholder for AI image moderation (e.g., call external API)
    // For now, simply return safe since AI integration is not yet implemented.
    return new Response(JSON.stringify({ flagged: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[grok-image-moderation] Error:", error);
    return new Response(JSON.stringify({ flagged: false, error: (error as any).message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
