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
const GEMINI_MODELS = ["gemini-2.5-flash-lite", "gemini-2.0-flash-lite", "gemini-1.5-flash-8b"] as const;
const REQUEST_TIMEOUT_MS = 25_000;
const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW = "1 hour";
const MAX_PAYLOAD_BYTES = 64_000;

const SYSTEM_PROMPT = `You are the inner voice of a personal growth app that knows this person deeply. You rewrite pattern insight cards so they feel specific, warm, and unmistakably personal.

VOICE
- Write like a close friend who is perceptive and psychologically literate.
- Not a therapist. Not a coach. Not a wellness influencer.
- Second person. Warm. Direct. Human.
- Mix short and medium sentences.
- Vary sentence openings.

RULES
1. Preserve every numeric or factual data point already present in the original insight.
2. Make connections across the user's archetype, values, cognitive style, somatic patterns, relationship patterns, and check-in behavior when relevant.
3. Add specificity, not generic encouragement.
4. Each rewritten body should be 2–4 sentences.
5. No bullet points. No numbered lists. No markdown.

BANNED
- No therapy-speak clichés.
- No "it's important to remember", "this suggests that", "overall", or "in summary".
- No sentence longer than 30 words.

Return strict JSON only:
{
  "insights": [
    { "id": "insight-id", "body": "rewritten text" }
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
    return false;
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

  return { insights, profile, behavioral };
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
  const candidates = (responseBody as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> })?.candidates;
  const text = candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim();
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
      return jsonResponse({ error: "Rate limit exceeded. Try again later." }, 429);
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
        maxOutputTokens: 2048,
        responseMimeType: "application/json",
      },
    };

    let lastStatus = 502;
    let lastResponseBody: unknown = null;

    for (let keyIndex = 0; keyIndex < apiKeys.length; keyIndex += 1) {
      const apiKey = apiKeys[keyIndex];

      for (let modelIndex = 0; modelIndex < GEMINI_MODELS.length; modelIndex += 1) {
        const model = GEMINI_MODELS[modelIndex];
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

        const hasNextAttempt = modelIndex < GEMINI_MODELS.length - 1 || keyIndex < apiKeys.length - 1;
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