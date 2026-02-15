// Supabase Edge Function: generate-embedding
// Deploy: supabase functions deploy generate-embedding

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

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
        const body = await req.json();

        // Handle both direct calls (text) and Webhook calls (record)
        let text = body.text;
        let listingId = body.listingId;

        // If called by Supabase Webhook
        if (body.record) {
            const r = body.record;
            // Concatenate relevant fields for embedding
            text = `${r.title_zh || ''} ${r.title_en || r.title_zh || ''} ${r.description_zh || ''} ${r.description_en || ''}`;
            listingId = r.id;
        }

        if (!text) {
            return new Response(JSON.stringify({ error: "Missing 'text' or 'record' parameter" }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // Generate Embedding
        let embedding: number[] = [];
        if (OPENAI_API_KEY) {
            const embeddingResponse = await fetch("https://api.openai.com/v1/embeddings", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${OPENAI_API_KEY}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    model: "text-embedding-3-small",
                    input: text.substring(0, 8000), // OpenAI limit
                    dimensions: 384,
                }),
            });

            const embeddingData = await embeddingResponse.json();
            if (embeddingData.error) throw new Error(embeddingData.error.message);
            embedding = embeddingData.data[0].embedding;
        } else {
            console.warn("OPENAI_API_KEY not set. Using zero vector.");
            embedding = Array(384).fill(0);
        }

        // If listingId is present, update the database directly
        if (listingId && SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
            const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
            const { error: updateError } = await supabase
                .from('listing_masters')
                .update({ embedding })
                .eq('id', listingId);

            if (updateError) throw updateError;
            console.log(`Successfully updated embedding for listing: ${listingId}`);
        }

        return new Response(JSON.stringify({ embedding, listingId }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("Error generating embedding:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});

// Deploy Instructions:
// 1. Install Supabase CLI: npm install -g supabase
// 2. Login: supabase login
// 3. Link project: supabase link --project-ref your-project-ref
// 4. Deploy: supabase functions deploy generate-embedding
// 5. Set secret: supabase secrets set OPENAI_API_KEY=sk-...
