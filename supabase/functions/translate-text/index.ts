// Supabase Edge Function: translate-text
// Deploy: supabase functions deploy translate-text
//
// On-demand translation for arbitrary short text — powers the "翻译"
// action on a chat message in Chat.tsx. Unlike translate-listing (which
// backfills listing_masters columns and persists the result), this just
// returns a translation; nothing is written to the database. Same
// MyMemory-based approach (free, no API key), chunked for its ~500 byte
// cap — see translate-listing's header comment for why MyMemory over an
// LLM (keeps this feature at $0 cost; plain MT quality is fine for
// "can I understand what this neighbor just said").

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const CJK_RE = /[一-鿿]/;
const MAX_CHUNK_BYTES = 400;

function utf8ByteLength(s: string): number {
    return new TextEncoder().encode(s).length;
}

function splitIntoChunks(text: string): string[] {
    if (utf8ByteLength(text) <= MAX_CHUNK_BYTES) return [text];

    const pieces = text.split(/(?<=[。！？.!?\n])/);
    const chunks: string[] = [];
    let current = "";

    for (const piece of pieces) {
        const candidate = current + piece;
        if (utf8ByteLength(candidate) > MAX_CHUNK_BYTES && current) {
            chunks.push(current);
            current = piece;
        } else {
            current = candidate;
        }
    }
    if (current) chunks.push(current);

    return chunks.length > 0 ? chunks : [text];
}

async function translateChunk(text: string, langpair: string): Promise<string> {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langpair}`;
    const res = await fetch(url);
    const data = await res.json();
    if (!data.responseData || data.responseStatus !== 200) {
        throw new Error(`MyMemory error: ${data.responseDetails || data.responseStatus}`);
    }
    return data.responseData.translatedText;
}

async function translateText(text: string, langpair: string): Promise<string> {
    if (!text) return "";
    const chunks = splitIntoChunks(text);
    const translated: string[] = [];
    for (const chunk of chunks) {
        translated.push(await translateChunk(chunk, langpair));
    }
    return translated.join("");
}

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { status: 200, headers: corsHeaders });
    }

    try {
        const { text, targetLanguage } = await req.json();
        if (!text) {
            return new Response(JSON.stringify({ error: "Missing 'text'" }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // targetLanguage ('zh'|'en') is the viewer's current UI language,
        // sent by the caller — same reasoning as ai-support-reply's
        // `language` param: the caller knows the actual intent, and
        // inferring "which language do they want this translated INTO"
        // from the source text alone isn't well-defined. Falls back to
        // "the opposite of whatever the source looks like" if omitted.
        const sourceIsZh = CJK_RE.test(text);
        const wantZh = targetLanguage ? targetLanguage === 'zh' : !sourceIsZh;

        if (wantZh === sourceIsZh) {
            // Already in the requested language — nothing to translate.
            return new Response(JSON.stringify({ translated: text, skipped: true }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const langpair = wantZh ? "en|zh-CN" : "zh-CN|en";
        const translated = await translateText(text, langpair);

        return new Response(JSON.stringify({ translated }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("Error translating text:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
