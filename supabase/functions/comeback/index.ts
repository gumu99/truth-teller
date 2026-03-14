import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const { theirReply, targetUsername } = await req.json();

    if (!theirReply) {
      return new Response(
        JSON.stringify({ error: "Their reply text is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({ error: "ANTHROPIC_API_KEY not configured. Add it in project secrets." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("Generating comeback for reply:", theirReply.substring(0, 50));

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        system: `You are a master of reading between the lines and hitting back perfectly.

STEP 1 — DETECT TONE:
Read the reply carefully and classify:
- aggressive: rude, insulting, threatening
- sarcastic: mocking, ironic, condescending
- defensive: making excuses, deflecting
- nice: genuine, polite, reasonable

STEP 2 — GENERATE COMEBACK based on tone:

If AGGRESSIVE:
- Match energy but stay factual
- Never stoop to pure insults — always keep one fact in there

If SARCASTIC:
- Be funnier and more devastating than them
- Out-sarcasm them completely

If DEFENSIVE:
- Expose the defensiveness itself calmly

If NICE:
- Calm but devastating — no need to be harsh

IMPORTANT: comeback must always feel human, never robotic.
Always end with something that makes them think, not just feel bad.

Return as clean JSON: { "detectedTone": "aggressive"|"sarcastic"|"nice"|"defensive", "comeback": string, "styleUsed": string }`,
        messages: [
          {
            role: "user",
            content: `Their reply: "${theirReply}"${targetUsername ? `\nTheir username: @${targetUsername}` : ""}`,
          },
        ],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      if (res.status === 400 && err.includes("credit balance is too low")) {
        throw new Error("Anthropic API credits depleted. Please add credits at console.anthropic.com");
      }
      throw new Error(`Claude API error [${res.status}]: ${err}`);
    }

    const data = await res.json();
    const text = data.content?.[0]?.text || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in Claude response");
    const result = JSON.parse(jsonMatch[0]);

    // Save to database
    const { error: dbError } = await supabase.from("comeback_queue").insert({
      their_reply_text: theirReply,
      detected_tone: result.detectedTone,
      comeback: result.comeback,
      style_used: result.styleUsed,
      target_username: targetUsername || null,
      status: "pending",
    });

    if (dbError) throw dbError;

    return new Response(
      JSON.stringify({ success: true, result }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("Comeback error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
