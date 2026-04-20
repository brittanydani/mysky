/**
 * Supabase Edge Function: reflection-insights
 *
 * Securely proxies reflection insight requests to the Anthropic API.
 * The ANTHROPIC_API_KEY lives here — never in the client bundle.
 *
 * Deploy (JWT verified by Supabase gateway — do NOT use --no-verify-jwt):
 *   supabase functions deploy reflection-insights
 *
 * Set secret:
 *   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
 *
 * Test locally:
 *   supabase functions serve reflection-insights --env-file .env.local
 *
 * Requires migration: 20260301_reflection_rate_limit.sql
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";

// ─── CORS headers ─────────────────────────────────────────────────────────────

// Allow the Expo dev server during local development, restrict to app origin
// in production. Supabase JWT verification is still the primary auth gate.
const ALLOWED_ORIGIN = Deno.env.get("ALLOWED_ORIGIN") ?? "https://mysky.app";

const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ─── Rate limiting (Supabase table — persists across cold starts) ─────────────

const RATE_LIMIT_MAX = 5; // max requests per window
const RATE_LIMIT_WINDOW = "1 hour"; // PostgreSQL interval

/**
 * Check + increment rate limit using the reflection_rate_limit table.
 * Uses an upsert with a server-side timestamp so clients can't manipulate it.
 * Returns true if the user is over the limit.
 */
async function isRateLimited(
  supabaseAdmin: ReturnType<typeof createClient>,
  userId: string,
): Promise<boolean> {
  // Call the RPC function that atomically checks + increments
  const { data, error } = await supabaseAdmin.rpc("check_reflection_rate_limit", {
    p_user_id: userId,
    p_max_requests: RATE_LIMIT_MAX,
    p_window_interval: RATE_LIMIT_WINDOW,
  });

  if (error) {
    console.error("Rate limit check failed:", error.code);
    return true;
  }

  // RPC returns true if the request is ALLOWED, false if blocked
  return data === false;
}

// ─── Payload validation ───────────────────────────────────────────────────────

interface ReflectionPayload {
  timeWindowLabel: string;
  mood: { trend: string; avg: number | null; delta: number | null };
  stress: { trend: string; avg: number | null; delta: number | null };
  energy: { trend: string; avg: number | null; delta: number | null };
  energyMood?: {
    correlation: number | null;
    interpretationHint?: string;
  };
  restores: {
    sampleSizeDays: number;
    top: { tag: string; label: string; liftMood: number }[];
    drains: { tag: string; label: string; liftMood: number }[];
  };
}

const MAX_PAYLOAD_BYTES = 64_000; // generous for stats data, blocks oversized abuse

function validatePayload(body: unknown): ReflectionPayload {
  if (!body || typeof body !== "object") {
    throw new Error("Missing request body");
  }

  const p = body as Record<string, unknown>;

  // Guard against oversized payloads before any further processing
  const payloadSize = new TextEncoder().encode(JSON.stringify(p)).length;
  if (payloadSize > MAX_PAYLOAD_BYTES) {
    throw new Error("Request payload too large");
  }

  if (typeof p.timeWindowLabel !== "string") {
    throw new Error("Missing timeWindowLabel");
  }

  for (const key of ["mood", "stress", "energy"] as const) {
    const metric = p[key];
    if (!metric || typeof metric !== "object") {
      throw new Error(`Missing ${key} object`);
    }
    const m = metric as Record<string, unknown>;
    if (!["up", "down", "flat", "stable"].includes(String(m.trend))) {
      throw new Error(`Invalid ${key}.trend`);
    }
  }

  if (!p.restores || typeof p.restores !== "object") {
    throw new Error("Missing restores object");
  }

  return p as unknown as ReflectionPayload;
}

// ─── Prompts (server-side — never exposed to client) ──────────────────────────

function buildSystemPrompt(): string {
  return `You write short, private, emotionally intelligent reflections for a journaling app.

Your job is to mirror the user's lived experience from their data — not to explain the data and not to give advice.

STYLE (non-negotiable):
- Sound like a real person wrote it. Not like AI. Not like therapy-speak. Not like a wellness blog.
- Short lines. Natural rhythm. Some fragments are okay.
- No "you should", "consider", "it may help", "remember to", "try to".
- No clichés (self-care, journey, prioritize, lean into, hold space, nervous system).
- No diagnosing. No certainty. No moralizing.
- Don't over-explain. Don't summarize charts. Don't list features.
- Avoid perfectly balanced phrasing. Allow slight imperfection and warmth.
- Write like you're texting a close friend who knows you well — but you're not trying to fix them.

PERSONALITY:
- Quietly observant. Respectful. Intimate but not invasive.
- Feels like someone who's been paying attention to this person.

OUTPUT RULES:
- Return ONLY valid JSON matching the provided schema.
- Keep each line under 18 words.
- No emojis.
- No headers inside the text.

JSON SCHEMA:
{
  "observations": ["string", "string", "string"],
  "insights": ["string", "string"],
  "restores": ["string", "string"],
  "micro_line": "string"
}

observations: 2-4 short lines about what you notice in their patterns.
insights: 1-2 lines — something they might not have seen yet.
restores: 1-2 lines about what seems to restore them, based on tag data.
micro_line: one single sentence. The kind of thing you'd text a close friend.`;
}

function buildUserPrompt(payload: ReflectionPayload): string {
  return `Write the user's Growth copy based on this data.

Important:
- Use the tag correlations to make "What restores you" feel specific and true.
- If data is thin, say that gently without sounding technical.
- No advice. No coaching. No motivational tone.

Good (human):
- "You're managing. But you're not really exhaling."
- "It's been heavier lately. Even if you're still functioning."
- "Your quiet seems to matter more than you admit."

Bad (AI):
- "Consider prioritizing rest."
- "This may indicate your nervous system is dysregulated."
- "It's important to practice self-care."

DATA:
${JSON.stringify(payload)}`;
}

// ─── Main handler ─────────────────────────────────────────────────────────────

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }

  try {
    // ── Auth: Supabase verifies the JWT at the gateway level ────────────────
    // Because we deploy WITHOUT --no-verify-jwt, only requests with a valid
    // Supabase JWT reach this function. We create a client using the user's
    // token to read their verified identity.
    const authHeader = req.headers.get("authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "content-type": "application/json" },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const userToken = authHeader.replace("Bearer ", "");

    // Create a client with the user's JWT to read their identity
    const supabaseUser = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { authorization: `Bearer ${userToken}` } },
    });

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        {
          status: 401,
          headers: { ...corsHeaders, "content-type": "application/json" },
        }
      );
    }

    const userId = user.id;

    // ── Rate limit (Supabase table — survives cold starts) ──────────────────
    // Use the service role client for rate-limit writes (RLS bypass)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    if (await isRateLimited(supabaseAdmin, userId)) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Try again later." }),
        {
          status: 429,
          headers: { ...corsHeaders, "content-type": "application/json" },
        }
      );
    }

    // ── Validate payload ────────────────────────────────────────────────────
    const body = await req.json();
    const payload = validatePayload(body);

    // ── Read API key from environment ───────────────────────────────────────
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      console.error("ANTHROPIC_API_KEY not set");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        {
          status: 500,
          headers: { ...corsHeaders, "content-type": "application/json" },
        }
      );
    }

    // ── Call Anthropic API ──────────────────────────────────────────────────
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);
    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 1200,
        system: buildSystemPrompt(),
        messages: [{ role: "user", content: buildUserPrompt(payload) }],
      }),
    });
    clearTimeout(timeout);

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text().catch(() => "");
      console.error(`Anthropic API error: ${anthropicRes.status} ${errText}`);
      return new Response(
        JSON.stringify({ error: "AI service temporarily unavailable" }),
        {
          status: 502,
          headers: { ...corsHeaders, "content-type": "application/json" },
        }
      );
    }

    // ── Parse Anthropic response ────────────────────────────────────────────
    const anthropicData = (await anthropicRes.json()) as {
      content?: { type: string; text?: string }[];
    };

    const textBlock = anthropicData?.content?.find(
      (b) => b.type === "text"
    );
    const rawText = textBlock?.text ?? "";

    // Try to parse the JSON from Claude's response
    let parsed: unknown;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      // Claude sometimes wraps JSON in markdown code blocks
      const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch?.[1]) {
        parsed = JSON.parse(jsonMatch[1].trim());
      } else {
        throw new Error("Could not parse AI response as JSON");
      }
    }

    // ── Validate response shape ─────────────────────────────────────────────
    const result = parsed as Record<string, unknown>;
    if (
      !Array.isArray(result.observations) ||
      !Array.isArray(result.insights) ||
      !Array.isArray(result.restores) ||
      typeof result.micro_line !== "string"
    ) {
      throw new Error("AI response missing required fields");
    }

    const output = {
      observations: (result.observations as unknown[]).map(String),
      insights: (result.insights as unknown[]).map(String),
      restores: (result.restores as unknown[]).map(String),
      micro_line: String(result.micro_line),
    };

    return new Response(JSON.stringify(output), {
      status: 200,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  } catch (err) {
    console.error("reflection-insights error:", err);
    return new Response(JSON.stringify({ error: "Unable to generate reflection insights" }), {
      status: 500,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }
});
