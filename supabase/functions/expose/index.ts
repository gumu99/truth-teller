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
    const { claim, targetUsername, postUrl, mode } = await req.json();

    if (!claim) {
      return new Response(
        JSON.stringify({ error: "Claim is required" }),
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

    const callClaude = async (systemPrompt: string, userPrompt: string) => {
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
          system: systemPrompt,
          messages: [{ role: "user", content: userPrompt }],
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
      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found in Claude response");
      return JSON.parse(jsonMatch[0]);
    };

    // Step 1: Profile Intelligence Scan
    console.log("Step 1: Scanning profile for", targetUsername);
    let profileData = {
      profession: "Unknown",
      niche: "Unknown",
      followers: "Unknown",
      selfClaims: [] as string[],
      tone: "Unknown",
    };

    if (targetUsername) {
      try {
        profileData = await callClaude(
          `You are an elite intelligence analyst. Given an Instagram username, analyze what you know about them and extract:
1. Their profession / job title / credentials
2. Their content niche (fitness, food, politics, lifestyle etc.)
3. Their follower count and influence level
4. Any claims they publicly make about themselves
5. Their typical tone (aggressive, friendly, professional etc.)
Return as clean JSON: { "profession": string, "niche": string, "followers": string, "selfClaims": string[], "tone": string }`,
          `Instagram username: @${targetUsername}. Research this person and provide intelligence.`
        );
      } catch (e) {
        console.error("Profile scan failed, continuing:", e);
      }
    }

    // Step 2: Contradiction Investigation
    console.log("Step 2: Investigating contradictions");
    let investigation = {
      contradictionFound: false,
      evidenceSummary: "No specific contradictions found, using general factual analysis.",
      contradictingPostDate: "",
      witnessUsername: null as string | null,
      factualEvidence: "Based on general knowledge and publicly available information.",
    };

    try {
      investigation = await callClaude(
        `You are an elite truth investigator. Given a claim and Instagram username:
1. Think about what public posts, tagged photos, stories highlights, and captions might contradict the claim
2. Search for scientific, biological, or factual evidence disproving the claim
3. Note any witness @usernames naturally appearing in contradicting evidence
4. Note dates and context of contradicting posts
5. If nothing found say so honestly
Return findings as clean JSON: { "contradictionFound": boolean, "evidenceSummary": string, "contradictingPostDate": string, "witnessUsername": string or null, "factualEvidence": string }`,
        `Claim: "${claim}"\nInstagram username: @${targetUsername || "unknown"}\nProfile info: ${JSON.stringify(profileData)}`
      );
    } catch (e) {
      console.error("Investigation failed, continuing:", e);
    }

    // Step 3: Generate Reply
    console.log("Step 3: Generating reply");
    const modeInstructions =
      mode === "Savage & Witty"
        ? "Be extremely savage and witty."
        : mode === "Calm Destroyer"
        ? "Be calm but absolutely devastating with facts."
        : mode === "Funny Sarcastic"
        ? "Be hilariously sarcastic."
        : "Pick the best style based on context.";

    const reply = await callClaude(
      `You are a comeback artist who argues like a lawyer and roasts like a comedian. Generate a perfectly personalized 2-layer reply.

PERSONALIZATION RULES:
- Always weave in their profession/credentials naturally
- Examples:
  Doctor: "You have a medical degree and you're saying this? They taught you better than that in med school 💀"
  Fitness influencer: "You're a certified trainer — you literally teach people about this. Come on man 😭"
  Food blogger: "You have 200k followers trusting your recipes. That KFC post didn't age well 👀"

LAYER 1 — THE HOOK (under 150 chars):
Savage witty one-liner. Human and punchy. Never robotic.

LAYER 2 — THE FACTS (under 300 chars):
Same savage tone but factual. Use their credentials against them.
Include @witness naturally if found.

STYLE: ${modeInstructions}

Return as clean JSON: { "hook": string, "facts": string, "fullReply": string, "styleUsed": string }`,
      `Claim to expose: "${claim}"
Target: @${targetUsername || "unknown"}
Profile: ${JSON.stringify(profileData)}
Evidence: ${JSON.stringify(investigation)}`
    );

    // Save to database
    const { error: dbError } = await supabase.from("expose_queue").insert({
      target_username: targetUsername || "unknown",
      claim,
      post_url: postUrl || null,
      mode,
      hook: reply.hook,
      facts: reply.facts,
      full_reply: reply.fullReply,
      evidence: investigation.evidenceSummary,
      witness_username: investigation.witnessUsername,
      style_used: reply.styleUsed,
      profession: profileData.profession,
      niche: profileData.niche,
      status: "pending",
    });

    if (dbError) throw dbError;

    // Also save/update profile
    if (targetUsername) {
      await supabase.from("profiles").upsert(
        {
          username: targetUsername,
          profession: profileData.profession,
          niche: profileData.niche,
          followers: profileData.followers,
          tone: profileData.tone,
          self_claims: profileData.selfClaims,
          scanned_at: new Date().toISOString(),
        },
        { onConflict: "username" }
      );
    }

    return new Response(
      JSON.stringify({ success: true, reply }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("Expose error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
