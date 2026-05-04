/**
 * Supabase Edge Function: knowledge-insights
 *
 * Refines already-selected local insight cards with Gemini.
 * The local rules engine remains the source of truth for pattern detection.
 *
 * Deploy:
 *   supabase functions deploy knowledge-insights
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
const REQUEST_TIMEOUT_MS = 25_000;
const RATE_LIMIT_MAX = 30;
const RATE_LIMIT_WINDOW = "1 hour";
const MAX_PAYLOAD_BYTES = 48_000;
const MAX_INSIGHTS = 3;
const MAX_EVIDENCE_PER_INSIGHT = 4;
const GEMINI_MODELS = {
  free: ["gemini-2.5-flash-lite", "gemini-2.0-flash-lite", "gemini-1.5-flash-8b"],
  premium: ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"],
} as const;

const SYSTEM_PROMPT = `You refine daily insight cards for a personal growth app.

The app has already selected the pattern using a local deterministic engine. Your job is only to improve the language so it feels specific, grounded, and human.

Rules:
- Preserve the original psychological meaning, pattern, evidence, and level of certainty.
- Do not invent events, memories, causes, diagnoses, trauma history, predictions, or advice.
- Do not mention therapy, clinical language, AI, models, algorithms, or the local engine.
- Write in second person.
- Keep the tone warm, precise, emotionally intelligent, and non-mystical.
- Keep each insight concise enough for a mobile card.
- Use evidence snippets only as grounding context. Do not quote sensitive fragments unless the original card already did.
- The prompt must be a single reflective question tied to the insight.
- Return only insight IDs that were provided.
- If the local card is already strong, you may preserve its content with light edits.

Return strict JSON only:
{
  "insights": [
    {
      "id": "same id as input",
      "title": "5 to 8 words",
      "observation": "One sentence. What stands out today.",
      "pattern": "Two to four sentences. The deeper pattern without overclaiming.",
      "reframe": {
        "shame": "One short phrase or sentence naming the misread.",
        "clarity": "One short sentence naming the clearer read."
      },
      "prompt": "One specific reflection question."
    }
  ]
}`;

interface InsightPayload {
  id: string;
  slot: string;
  title: string;
  observation: string;
  pattern: string;
  reframe: {
    shame: string;
    clarity: string;
  };
  prompt: string;
  patternKey: string;
  angleKey?: string;
  confidence: string;
  movement: string;
  evidence: Array<{
    source: string;
    date: string;
    label?: string;
    phrase?: string;
    signal?: string;
    intensity?: number;
  }>;
}

interface KnowledgeInsightRequestPayload {
  modelTier: keyof typeof GEMINI_MODELS;
  surface: "today" | "patterns";
  date: string;
  insights: InsightPayload[];
}

interface RefinedInsight {
  id: string;
  title: string;
  observation: string;
  pattern: string;
  reframe: {
    shame: string;
    clarity: string;
  };
  prompt: string;
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
  supabaseAdmin: {
    rpc: (
      fn: string,
      args: Record<string, unknown>,
    ) => PromiseLike<{ data: unknown; error: { code?: string } | null }>;
  },
  userId: string,
): Promise<boolean> {
  const { data, error } = await supabaseAdmin.rpc("check_gemini_rate_limit", {
    p_user_id: userId,
    p_max_requests: RATE_LIMIT_MAX,
    p_window_interval: RATE_LIMIT_WINDOW,
  });

  if (error) {
    console.error("[knowledge-insights] Rate limit check failed:", error.code);
    return true;
  }

  return data === false;
}

function cleanString(value: unknown, maxLength: number): string {
  if (typeof value !== "string") return "";
  return value.trim().replace(/\s+/g, " ").slice(0, maxLength);
}

function validateInsight(value: unknown): InsightPayload | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  const id = cleanString(raw.id, 120);
  const title = cleanString(raw.title, 120);
  const observation = cleanString(raw.observation, 500);
  const pattern = cleanString(raw.pattern, 900);
  const prompt = cleanString(raw.prompt, 260);
  const patternKey = cleanString(raw.patternKey, 160);

  if (!id || !title || !observation || !pattern || !prompt || !patternKey) {
    return null;
  }

  const reframe = raw.reframe && typeof raw.reframe === "object"
    ? raw.reframe as Record<string, unknown>
    : {};
  const evidence = Array.isArray(raw.evidence)
    ? raw.evidence.slice(0, MAX_EVIDENCE_PER_INSIGHT).map((anchor) => {
      const source = cleanString((anchor as Record<string, unknown>)?.source, 80);
      const date = cleanString((anchor as Record<string, unknown>)?.date, 40);
      return {
        source,
        date,
        label: cleanString((anchor as Record<string, unknown>)?.label, 120) || undefined,
        phrase: cleanString((anchor as Record<string, unknown>)?.phrase, 180) || undefined,
        signal: cleanString((anchor as Record<string, unknown>)?.signal, 120) || undefined,
        intensity: typeof (anchor as Record<string, unknown>)?.intensity === "number"
          ? (anchor as Record<string, number>).intensity
          : undefined,
      };
    }).filter(anchor => anchor.source && anchor.date)
    : [];

  return {
    id,
    slot: cleanString(raw.slot, 80) || "whatMySkyNoticed",
    title,
    observation,
    pattern,
    reframe: {
      shame: cleanString(reframe.shame, 240),
      clarity: cleanString(reframe.clarity, 280),
    },
    prompt,
    patternKey,
    angleKey: cleanString(raw.angleKey, 160) || undefined,
    confidence: cleanString(raw.confidence, 40) || "emerging",
    movement: cleanString(raw.movement, 40) || "new",
    evidence,
  };
}

function validatePayload(body: unknown): KnowledgeInsightRequestPayload {
  if (!body || typeof body !== "object") {
    throw new Error("Missing request body");
  }

  const size = new TextEncoder().encode(JSON.stringify(body)).length;
  if (size > MAX_PAYLOAD_BYTES) {
    throw new Error("Request payload too large");
  }

  const raw = body as Record<string, unknown>;
  const insights = Array.isArray(raw.insights)
    ? raw.insights.slice(0, MAX_INSIGHTS).map(validateInsight).filter((item): item is InsightPayload => !!item)
    : [];

  if (!insights.length) {
    throw new Error("At least one insight is required");
  }

  return {
    modelTier: raw.modelTier === "premium" ? "premium" : "free",
    surface: raw.surface === "patterns" ? "patterns" : "today",
    date: cleanString(raw.date, 60) || new Date().toISOString(),
    insights,
  };
}

function buildUserPrompt(payload: KnowledgeInsightRequestPayload): string {
  const insightText = payload.insights.map((insight, index) => {
    const evidence = insight.evidence.length
      ? insight.evidence.map(anchor => (
        `- ${anchor.source} ${anchor.date}: ${[
          anchor.label,
          anchor.phrase,
          anchor.signal,
          typeof anchor.intensity === "number" ? `intensity ${anchor.intensity}` : "",
        ].filter(Boolean).join(" | ")}`
      )).join("\n")
      : "- none";

    return [
      `Insight ${index + 1}`,
      `id: ${insight.id}`,
      `slot: ${insight.slot}`,
      `patternKey: ${insight.patternKey}`,
      insight.angleKey ? `angleKey: ${insight.angleKey}` : "",
      `confidence: ${insight.confidence}`,
      `movement: ${insight.movement}`,
      `title: ${insight.title}`,
      `observation: ${insight.observation}`,
      `pattern: ${insight.pattern}`,
      `reframe shame: ${insight.reframe.shame}`,
      `reframe clarity: ${insight.reframe.clarity}`,
      `prompt: ${insight.prompt}`,
      `evidence:\n${evidence}`,
    ].filter(Boolean).join("\n");
  }).join("\n\n");

  return [
    `surface: ${payload.surface}`,
    `date: ${payload.date}`,
    "Refine these already-selected insight cards without changing the detected pattern.",
    insightText,
  ].join("\n\n");
}

function extractGeminiText(responseBody: unknown): string | null {
  const candidates = (responseBody as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> }; finishReason?: string }> })?.candidates;
  const candidate = candidates?.[0];
  if (candidate?.finishReason === "MAX_TOKENS") {
    console.error("[knowledge-insights] Gemini response truncated at MAX_TOKENS");
    return null;
  }
  const text = candidate?.content?.parts?.map(part => part.text ?? "").join("").trim();
  return text || null;
}

function parseGeminiJson(text: string, allowedIds: Set<string>): RefinedInsight[] {
  let jsonText = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
  const firstBrace = jsonText.indexOf("{");
  const lastBrace = jsonText.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    jsonText = jsonText.slice(firstBrace, lastBrace + 1);
  }

  const parsed = JSON.parse(jsonText) as { insights?: unknown };
  if (!Array.isArray(parsed.insights)) {
    throw new Error("Invalid knowledge insight response structure");
  }

  return parsed.insights.map((item): RefinedInsight | null => {
    if (!item || typeof item !== "object") return null;
    const raw = item as Record<string, unknown>;
    const id = cleanString(raw.id, 120);
    if (!allowedIds.has(id)) return null;

    const reframe = raw.reframe && typeof raw.reframe === "object"
      ? raw.reframe as Record<string, unknown>
      : {};

    const refined: RefinedInsight = {
      id,
      title: cleanString(raw.title, 100),
      observation: cleanString(raw.observation, 420),
      pattern: cleanString(raw.pattern, 760),
      reframe: {
        shame: cleanString(reframe.shame, 240),
        clarity: cleanString(reframe.clarity, 280),
      },
      prompt: cleanString(raw.prompt, 240),
    };

    if (!refined.title || !refined.observation || !refined.pattern || !refined.prompt) {
      return null;
    }

    return refined;
  }).filter((item): item is RefinedInsight => !!item);
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
      console.error("[knowledge-insights] Auth failed:", authError?.message ?? "No user returned");
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const supabaseAdmin = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );
    if (await isRateLimited(supabaseAdmin, user.id)) {
      return jsonResponse({ error: "AI insight refinement is at capacity right now. Please wait a minute and try again." }, 429);
    }

    const payload = validatePayload(await req.json());
    const apiKeys = getGeminiApiKeys();
    if (!apiKeys.length) {
      console.error("[knowledge-insights] No Gemini API key secrets are set");
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
        temperature: 0.25,
        maxOutputTokens: 3072,
        responseMimeType: "application/json",
      },
    };

    const modelCandidates = GEMINI_MODELS[payload.modelTier];
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
            console.error("[knowledge-insights] No text returned from Gemini");
            return jsonResponse({ error: "No content returned from Gemini" }, 502);
          }

          const insights = parseGeminiJson(text, new Set(payload.insights.map(insight => insight.id)));
          return jsonResponse({
            insights,
            generatedAt: new Date().toISOString(),
          });
        }

        lastStatus = geminiResponse.status >= 400 && geminiResponse.status < 600 ? geminiResponse.status : 502;
        lastResponseBody = responseBody;

        const hasNextAttempt = modelIndex < modelCandidates.length - 1 || keyIndex < apiKeys.length - 1;
        if (shouldTryFallbackStatus(geminiResponse.status) && hasNextAttempt) {
          console.warn("[knowledge-insights] Gemini request failed; trying fallback.", geminiResponse.status, { model, keyIndex });
          continue;
        }

        console.error("[knowledge-insights] Gemini API error:", geminiResponse.status, responseBody);
        if (lastStatus === 429) {
          return jsonResponse({ error: "AI insight refinement is at capacity right now. Please wait a minute and try again." }, 429);
        }
        return jsonResponse({ error: `Gemini API error: ${geminiResponse.status}` }, lastStatus);
      }
    }

    console.error("[knowledge-insights] Gemini API error:", lastStatus, lastResponseBody);
    if (lastStatus === 429) {
      return jsonResponse({ error: "AI insight refinement is at capacity right now. Please wait a minute and try again." }, 429);
    }
    return jsonResponse({ error: `Gemini API error: ${lastStatus}` }, lastStatus);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    console.error("[knowledge-insights] Unexpected error:", message);
    return jsonResponse({ error: message }, 500);
  }
});
