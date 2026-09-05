// Supabase Edge Function: translate-listing
// Deploy: supabase functions deploy translate-listing
//
// Posting forms only collect one language (see Publish.tsx), so a fresh
// listing has title_zh === title_en and description_zh === description_en.
// This function detects that "untranslated" state and backfills the missing
// language, leaving the author's original text untouched. It's safe to call
// after every create/update: once translated the two columns differ, so a
// repeat call for the same content is a no-op — and if a provider later
// edits the listing back to single-language, the next call will naturally
// re-translate it.
//
// Uses MyMemory (api.mymemory.translated.net) — free, no signup/API key,
// chosen over OpenAI to keep this feature at $0 cost. Quality is plain MT
// (not LLM-level), and it caps each request at ~500 bytes, so longer text
// is chunked and translated piece by piece.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const CJK_RE = /[一-鿿]/;
const MAX_CHUNK_BYTES = 400; // stay well under MyMemory's ~500 byte cap

function utf8ByteLength(s: string): number {
    return new TextEncoder().encode(s).length;
}

// Split on sentence/whitespace boundaries so we don't cut a chunk mid-word.
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

    // A single "sentence" longer than the byte cap (no punctuation at all)
    // falls through to here untouched — better to send it as one oversized
    // chunk than to lose it; MyMemory will just truncate its reply.
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
        const body = await req.json();
        const masterId: string | undefined = body.masterId || body.record?.id;

        if (!masterId) {
            return new Response(JSON.stringify({ error: "Missing 'masterId'" }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
            return new Response(JSON.stringify({ error: "Server misconfigured" }), {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        const { data: master, error: fetchError } = await supabase
            .from('listing_masters')
            .select('id, title_zh, title_en, description_zh, description_en')
            .eq('id', masterId)
            .single();

        if (fetchError) throw fetchError;

        const titleSame = (master.title_zh || '') === (master.title_en || '');
        const descSame = (master.description_zh || '') === (master.description_en || '');

        if (!titleSame && !descSame) {
            return new Response(JSON.stringify({ skipped: true, reason: "already bilingual" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const sourceTitle = master.title_zh || master.title_en || '';
        const sourceDescription = master.description_zh || master.description_en || '';
        const sourceIsZh = CJK_RE.test(sourceTitle) || CJK_RE.test(sourceDescription);
        const langpair = sourceIsZh ? "zh-CN|en" : "en|zh-CN";

        const [translatedTitle, translatedDescription] = await Promise.all([
            translateText(sourceTitle, langpair),
            translateText(sourceDescription, langpair),
        ]);

        if (!translatedTitle) {
            throw new Error("Translation returned empty title");
        }

        const update = sourceIsZh
            ? { title_en: translatedTitle, description_en: translatedDescription }
            : { title_zh: translatedTitle, description_zh: translatedDescription };

        const { error: updateError } = await supabase
            .from('listing_masters')
            .update(update)
            .eq('id', masterId);

        if (updateError) throw updateError;

        console.log(`Translated listing ${masterId} via ${langpair}`);
        return new Response(JSON.stringify({ translated: true, masterId, ...update }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("Error translating listing:", error);
        // Never let a translation failure surface as a hard error to the
        // caller — Publish.tsx fires this without blocking the publish flow.
        return new Response(JSON.stringify({ error: error.message }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});

// Deploy Instructions:
// 1. supabase functions deploy translate-listing
// No secrets required — MyMemory's public API needs no key.
