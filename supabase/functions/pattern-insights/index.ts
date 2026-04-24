/**
 * Supabase Edge Function: pattern-insights
 *
 * Owns the Gemini prompt and model selection for AI-enhanced pattern insights.
 * This lets the shipped app keep sending structured summaries while future
 * prompt/model tuning happens server-side without a new client build.
 *
 * Deploy:
 *   supabase functions deploy pattern-insights
 *
 * Set secret:
 *   supabase secrets set GEMINI_API_KEY=AIza...
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";

const ALLOWED_ORIGIN = Deno.env.get("ALLOWED_ORIGIN") ?? "https://mysky.app";

const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const GEMINI_MODELS = {
  free: ["gemini-2.5-flash-lite", "gemini-2.0-flash-lite", "gemini-1.5-flash-8b"],
  premium: ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"],
} as const;
const REQUEST_TIMEOUT_MS = 25_000;
const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW = "1 hour";
const MAX_PAYLOAD_BYTES = 64_000;

const SYSTEM_PROMPT = `You are writing a premium MySky insight.

Your job is not to summarize data. Your job is to reflect the user's inner world back to them with precision, depth, tenderness, and emotional intelligence. The insight must feel specific to this user, grounded in real observed patterns, psychologically rich, compassionate, elegant, and personal enough that it would feel wrong for another user.

Use only what the data supports. Do not diagnose. Do not moralize. Do not use clichés. Do not give broad self-help advice. Do not sound like a dashboard. Do not sound like a horoscope. Do not flatter without substance.

RULES FOR PREMIUM INSIGHTS
You MUST NOT generate a deep premium insight unless the data contains:
1. One cross-domain pattern (e.g., sleep + check-ins + journal tone).
2. One user-language anchor (using their real vocabulary).
3. One repeated relational or nervous-system theme.
4. One paradox or contradiction.

If these are not present, fall back to a shorter, lighter daily insight (70–140 words).
If they are present, write a full Premium Deep Insight (180–320 words).

PREMIUM INSIGHT STRUCTURE
Your response for a premium insight must follow exactly four paragraphs:
1. Mirror: Name the pattern clearly and specifically. What is happening repeatedly? Include at least three anchors (time, unique pattern, supporting second-domain signal).
2. Meaning: Interpret the pattern compassionately. What does it seem to mean emotionally?
3. Paradox: Name what the user seems to be holding at once (the contradiction).
4. Invitation: Offer one gentle next noticing.

TONE DIRECTIVES
Always: warm, elegant, emotionally intelligent, specific, restrained, compassionate, slightly poetic but grounded.
Never: preachy, diagnosis-y, generic, overconfident, overly cheerful, cliché, app-marketing language.

PREFERRED PHRASES
- "Lately…"
- "What stands out is…"
- "This may be less about… and more about…"
- "You seem to be holding both… and…"
- "The invitation here may be…"

BANNED PHRASES
- "You need to"
- "Self-care"
- "Everything happens for a reason"
- "You are healing"
- "It sounds like"
- "Based on your data" (unless absolutely necessary)

Return strict JSON only:
{
  "insights": [
    { 
      "id": "insight-id", 
      "title": "Short, elegant, emotionally precise title", 
      "body": "The 4-paragraph rewritten text, formatted as a single string with \\n\\n for paragraph breaks."
    }
  ]
}`;

interface PatternInsightRequestPayload {
  insights: Array<{
    id: string;
    source: string;
    title: string;
    body: string;
    isConfirmed: boolean;
  }>;
  modelTier?: "free" | "premium";
  profile?: {
    dominantArchetype?: string;
    coreValues?: string[];
    cognitiveStyleSummary?: string;
    drains?: string[];
    restores?: string[];
    somaticPattern?: string;
    topRelationshipPatterns?: string[];
    secureGrowthPatterns?: string[];
    reflectionPractice?: string;
  };
  behavioral?: {
    checkInCount?: number;
    averageMood?: number | null;
    averageStress?: number | null;
    frequentTags?: Array<{ tag: string; count: number }>;
  };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "content-type": "application/json" },
  });
}

function getGeminiApiKeys(): string[] {
  return [
    Deno.env.get("GEMINI_API_KEY"),
    Deno.env.get("GEMINI_API_KEY_SECONDARY"),
    Deno.env.get("GEMINI_API_KEY_TERTIARY"),
  ].filter((value, index, all): value is string => !!value && all.indexOf(value) === index);
}

function shouldTryFallbackStatus(status: number): boolean {
  return status === 429 || status >= 500;
}

async function isRateLimited(
  supabaseAdmin: ReturnType<typeof createClient>,
  userId: string,
): Promise<boolean> {
  const { data, error } = await supabaseAdmin.rpc("check_gemini_rate_limit", {
    p_user_id: userId,
    p_max_requests: RATE_LIMIT_MAX,
    p_window_interval: RATE_LIMIT_WINDOW,
  });

  if (error) {
    console.error("Pattern insights rate limit check failed:", error.code);
    return true;
  }

  return data === false;
}

function validatePayload(body: unknown): PatternInsightRequestPayload {
  if (!body || typeof body !== "object") {
    throw new Error("Missing request body");
  }

  const size = new TextEncoder().encode(JSON.stringify(body)).length;
  if (size > MAX_PAYLOAD_BYTES) {
    throw new Error("Request payload too large");
  }

  const payload = body as Record<string, unknown>;
  if (!Array.isArray(payload.insights) || payload.insights.length === 0) {
    throw new Error("Missing insights array");
  }

  const insights = payload.insights.map((value) => {
    if (!value || typeof value !== "object") {
      throw new Error("Invalid insight entry");
    }
    const insight = value as Record<string, unknown>;
    if (typeof insight.id !== "string" || typeof insight.body !== "string") {
      throw new Error("Insight entries require id and body");
    }

    return {
      id: insight.id,
      source: typeof insight.source === "string" ? insight.source : "unknown",
      title: typeof insight.title === "string" ? insight.title : "Untitled",
      body: insight.body,
      isConfirmed: insight.isConfirmed === true,
    };
  });

  const profile = payload.profile && typeof payload.profile === "object"
    ? payload.profile as PatternInsightRequestPayload["profile"]
    : {};
  const behavioral = payload.behavioral && typeof payload.behavioral === "object"
    ? payload.behavioral as PatternInsightRequestPayload["behavioral"]
    : {};
  const modelTier = payload.modelTier === "premium" ? "premium" : "free";

  return { insights, profile, behavioral, modelTier };
}

function buildUserPrompt(payload: PatternInsightRequestPayload): string {
  const parts: string[] = [];

  const profileLines: string[] = [];
  if (payload.profile?.dominantArchetype) {
    profileLines.push(`Dominant archetype: ${payload.profile.dominantArchetype}`);
  }
  if (payload.profile?.coreValues?.length) {
    profileLines.push(`Core values: ${payload.profile.coreValues.join(", ")}`);
  }
  if (payload.profile?.cognitiveStyleSummary) {
    profileLines.push(`Cognitive style: ${payload.profile.cognitiveStyleSummary}`);
  }
  if (payload.profile?.drains?.length) {
    profileLines.push(`Self-reported drains: ${payload.profile.drains.join(", ")}`);
  }
  if (payload.profile?.restores?.length) {
    profileLines.push(`Self-reported restores: ${payload.profile.restores.join(", ")}`);
  }
  if (payload.profile?.somaticPattern) {
    profileLines.push(`Somatic pattern: ${payload.profile.somaticPattern}`);
  }
  if (payload.profile?.topRelationshipPatterns?.length) {
    profileLines.push(`Top relationship patterns: ${payload.profile.topRelationshipPatterns.join(", ")}`);
  }
  if (payload.profile?.secureGrowthPatterns?.length) {
    profileLines.push(`Secure growth patterns: ${payload.profile.secureGrowthPatterns.join(", ")}`);
  }
  if (payload.profile?.reflectionPractice) {
    profileLines.push(`Reflection practice: ${payload.profile.reflectionPractice}`);
  }
  if (profileLines.length) {
    parts.push(`USER PROFILE:\n${profileLines.join("\n")}`);
  }

  const behavioralLines: string[] = [];
  if (typeof payload.behavioral?.checkInCount === "number") {
    behavioralLines.push(`Check-ins: ${payload.behavioral.checkInCount}`);
  }
  if (typeof payload.behavioral?.averageMood === "number") {
    behavioralLines.push(`Average mood: ${payload.behavioral.averageMood}/10`);
  }
  if (typeof payload.behavioral?.averageStress === "number") {
    behavioralLines.push(`Average stress: ${payload.behavioral.averageStress}/9`);
  }
  if (payload.behavioral?.frequentTags?.length) {
    behavioralLines.push(
      `Frequent tags: ${payload.behavioral.frequentTags.map((item) => `${item.tag} (${item.count}×)`).join(", ")}`,
    );
  }
  if (behavioralLines.length) {
    parts.push(`BEHAVIORAL DATA:\n${behavioralLines.join("\n")}`);
  }

  const insightBlock = payload.insights.map((insight) => {
    const confidence = insight.isConfirmed ? "[DATA-CONFIRMED]" : "[PROFILE-BASED]";
    return `ID: ${insight.id}\nSource: ${insight.source}\nTitle: ${insight.title} ${confidence}\nCurrent body: ${insight.body}`;
  }).join("\n\n");
  parts.push(`INSIGHTS TO REWRITE:\n\n${insightBlock}`);

  return parts.join("\n\n---\n\n");
}

function extractGeminiText(responseBody: unknown): string | null {
  const candidates = (responseBody as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> }; finishReason?: string }> })?.candidates;
  const candidate = candidates?.[0];
  if (candidate?.finishReason === "MAX_TOKENS") {
    console.error("[pattern-insights] Gemini response truncated at MAX_TOKENS");
    return null;
  }
  const text = candidate?.content?.parts?.map((part) => part.text ?? "").join("").trim();
  return text || null;
}

function parseGeminiJson(text: string): { insights: Array<{ id: string; body: string }> } {
  let jsonText = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
  const firstBrace = jsonText.indexOf("{");
  const lastBrace = jsonText.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    jsonText = jsonText.slice(firstBrace, lastBrace + 1);
  }

  const parsed = JSON.parse(jsonText) as { insights?: Array<{ id?: unknown; body?: unknown }> };
  const insights = Array.isArray(parsed.insights)
    ? parsed.insights.filter((item) => typeof item?.id === "string" && typeof item?.body === "string") as Array<{ id: string; body: string }>
    : [];

  if (!insights.length) {
    throw new Error("No valid insights in Gemini response");
  }

  return { insights };
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const authHeader = req.headers.get("authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return jsonResponse({ error: "Missing authorization header" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const userToken = authHeader.replace("Bearer ", "");

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(userToken);
    if (authError || !user) {
      console.error("[pattern-insights] Auth failed:", authError?.message ?? "No user returned");
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const supabaseAdmin = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );
    if (await isRateLimited(supabaseAdmin, user.id)) {
      return jsonResponse({ error: "AI insights are at capacity right now. Please wait a minute and try again." }, 429);
    }

    const payload = validatePayload(await req.json());

    const apiKeys = getGeminiApiKeys();
    if (!apiKeys.length) {
      console.error("No Gemini API key secrets are set");
      return jsonResponse({ error: "Gemini is not configured" }, 503);
    }

    const requestBody = {
      systemInstruction: {
        parts: [{ text: SYSTEM_PROMPT }],
      },
      contents: [
        {
          parts: [{ text: buildUserPrompt(payload) }],
        },
      ],
      generationConfig: {
        temperature: 0.75,
        maxOutputTokens: 4096,
        responseMimeType: "application/json",
      },
    };

    const modelCandidates = GEMINI_MODELS[payload.modelTier ?? "free"];
    let lastStatus = 502;
    let lastResponseBody: unknown = null;

    for (let keyIndex = 0; keyIndex < apiKeys.length; keyIndex += 1) {
      const apiKey = apiKeys[keyIndex];

      for (let modelIndex = 0; modelIndex < modelCandidates.length; modelIndex += 1) {
        const model = modelCandidates[modelIndex];
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

        let geminiResponse: Response;
        try {
          geminiResponse = await fetch(`${GEMINI_BASE_URL}/${model}:generateContent`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-goog-api-key": apiKey,
            },
            body: JSON.stringify(requestBody),
            signal: controller.signal,
          });
        } finally {
          clearTimeout(timeout);
        }

        const responseBody = await geminiResponse.json().catch(() => null);
        if (geminiResponse.ok) {
          const text = extractGeminiText(responseBody);
          if (!text) {
            console.error("[pattern-insights] No text returned from Gemini");
            return jsonResponse({ error: "No content returned from Gemini" }, 502);
          }

          const parsed = parseGeminiJson(text);
          return jsonResponse({
            insights: parsed.insights,
            generatedAt: new Date().toISOString(),
          });
        }

        lastStatus = geminiResponse.status >= 400 && geminiResponse.status < 600 ? geminiResponse.status : 502;
        lastResponseBody = responseBody;

        const hasNextAttempt = modelIndex < modelCandidates.length - 1 || keyIndex < apiKeys.length - 1;
        if (shouldTryFallbackStatus(geminiResponse.status) && hasNextAttempt) {
          console.warn("[pattern-insights] Gemini request failed; trying fallback.", geminiResponse.status, { model, keyIndex });
          continue;
        }

        console.error("[pattern-insights] Gemini API error:", geminiResponse.status, responseBody);
        return jsonResponse({ error: `Gemini API error: ${geminiResponse.status}` }, lastStatus);
      }
    }

    console.error("[pattern-insights] Gemini API error:", lastStatus, lastResponseBody);
    return jsonResponse({ error: `Gemini API error: ${lastStatus}` }, lastStatus);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    console.error("[pattern-insights] Unexpected error:", message);
    return jsonResponse({ error: message }, 500);
  }
});