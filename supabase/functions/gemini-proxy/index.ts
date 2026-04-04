/**
 * Supabase Edge Function: gemini-proxy
 *
 * Securely proxies requests to the Google Gemini API.
 * The GEMINI_API_KEY secret lives here — never in the client bundle.
 *
 * Deploy:
 *   supabase functions deploy gemini-proxy
 *
 * Set secret:
 *   supabase secrets set GEMINI_API_KEY=AIza...
 *
 * Test locally:
 *   supabase functions serve gemini-proxy --env-file .env.local
 *
 * Accepted body:
 * {
 *   model: string,                  // e.g. "gemini-2.5-flash-lite"
 *   systemPrompt: string,
 *   userPrompt: string,
 *   generationConfig?: object,      // temperature, maxOutputTokens, etc.
 * }
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";

// ─── CORS ──────────────────────────────────────────────────────────────────────

const ALLOWED_ORIGIN = Deno.env.get("ALLOWED_ORIGIN") ?? "https://mysky.app";

const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ─── Config ────────────────────────────────────────────────────────────────────

const GEMINI_BASE_URL =
  "https://generativelanguage.googleapis.com/v1beta/models";
const REQUEST_TIMEOUT_MS = 25_000;

// ─── Allowlisted models ────────────────────────────────────────────────────────
// Only fast/cheap models are permitted. Clients cannot target expensive models.

const ALLOWED_MODELS = new Set([
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-1.5-flash",
  "gemini-1.5-flash-8b",
]);

// ─── Rate limiting ─────────────────────────────────────────────────────────────

const RATE_LIMIT_MAX = 20;        // max requests per window per user
const RATE_LIMIT_WINDOW = "1 hour";

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
    // If the rate-limit table/function doesn't exist yet, allow but log
    console.error("Gemini rate limit check failed:", error.code);
    return false;
  }

  return data === false;
}

// ─── Payload validation ────────────────────────────────────────────────────────

interface ProxyPayload {
  model: string;
  systemPrompt: string;
  userPrompt: string;
  generationConfig?: Record<string, unknown>;
}

const MAX_PROMPT_CHARS = 32_000; // ~8k tokens — well above app needs, blocks abuse

function validatePayload(body: unknown): ProxyPayload {
  if (!body || typeof body !== "object") throw new Error("Missing request body");
  const p = body as Record<string, unknown>;

  if (typeof p.model !== "string" || p.model.trim().length === 0) {
    throw new Error("Missing or invalid 'model'");
  }
  const model = p.model.trim();
  if (!ALLOWED_MODELS.has(model)) {
    throw new Error(`Model '${model}' is not permitted`);
  }
  if (typeof p.systemPrompt !== "string" || p.systemPrompt.trim().length === 0) {
    throw new Error("Missing 'systemPrompt'");
  }
  if (p.systemPrompt.length > MAX_PROMPT_CHARS) {
    throw new Error("systemPrompt exceeds maximum allowed length");
  }
  if (typeof p.userPrompt !== "string" || p.userPrompt.trim().length === 0) {
    throw new Error("Missing 'userPrompt'");
  }
  if (p.userPrompt.length > MAX_PROMPT_CHARS) {
    throw new Error("userPrompt exceeds maximum allowed length");
  }

  // Sanitize generationConfig: allow temperature override but cap maxOutputTokens
  // to prevent cost-abuse via artificially large requests.
  const MAX_OUTPUT_TOKENS = 4096;
  let generationConfig: Record<string, unknown> | undefined;
  if (p.generationConfig && typeof p.generationConfig === "object") {
    const cfg = p.generationConfig as Record<string, unknown>;
    generationConfig = { ...cfg };
    if (
      typeof generationConfig.maxOutputTokens === "number" &&
      generationConfig.maxOutputTokens > MAX_OUTPUT_TOKENS
    ) {
      generationConfig.maxOutputTokens = MAX_OUTPUT_TOKENS;
    }
  }

  return {
    model,
    systemPrompt: p.systemPrompt,
    userPrompt: p.userPrompt,
    generationConfig,
  };
}

// ─── Main handler ──────────────────────────────────────────────────────────────

serve(async (req: Request) => {
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
    // ── Auth: JWT verified by Supabase gateway ────────────────────────────────
    // Function is deployed WITHOUT --no-verify-jwt so only valid Supabase
    // sessions reach this handler.
    const authHeader = req.headers.get("authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "content-type": "application/json" },
        },
      );
    }

    // Verify the user identity — we don't store anything here but we confirm
    // the JWT is valid and get the user ID for logging.
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }

    // ── Rate limit ────────────────────────────────────────────────────────────
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );
    if (await isRateLimited(supabaseAdmin, user.id)) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Try again later." }),
        {
          status: 429,
          headers: { ...corsHeaders, "content-type": "application/json" },
        },
      );
    }

    // ── Parse + validate ──────────────────────────────────────────────────────
    let payload: ProxyPayload;
    try {
      const body = await req.json();
      payload = validatePayload(body);
    } catch (e: unknown) {
      return new Response(
        JSON.stringify({ error: (e as Error).message }),
        {
          status: 400,
          headers: { ...corsHeaders, "content-type": "application/json" },
        },
      );
    }

    // ── API key (server-side secret only) ─────────────────────────────────────
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      console.error("GEMINI_API_KEY secret is not set");
      return new Response(
        JSON.stringify({ error: "Gemini is not configured" }),
        {
          status: 503,
          headers: { ...corsHeaders, "content-type": "application/json" },
        },
      );
    }

    // ── Forward to Gemini ─────────────────────────────────────────────────────
    const url = `${GEMINI_BASE_URL}/${payload.model}:generateContent`;

    const geminiBody = {
      systemInstruction: {
        parts: [{ text: payload.systemPrompt }],
      },
      contents: [
        {
          parts: [{ text: payload.userPrompt }],
        },
      ],
      generationConfig: payload.generationConfig ?? {
        temperature: 0.7,
        maxOutputTokens: 2048,
        responseMimeType: "application/json",
      },
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    let geminiResponse: Response;
    try {
      geminiResponse = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify(geminiBody),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text().catch(() => "Unknown error");
      console.error(`[gemini-proxy] Gemini error ${geminiResponse.status}:`, errorText);

      // Pass rate-limit status through so the client can handle it
      if (geminiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "AI insights are at capacity right now. Please wait a minute and try again." }),
          {
            status: 429,
            headers: { ...corsHeaders, "content-type": "application/json" },
          },
        );
      }

      return new Response(
        JSON.stringify({ error: `Gemini API error: ${geminiResponse.status}` }),
        {
          status: 502,
          headers: { ...corsHeaders, "content-type": "application/json" },
        },
      );
    }

    const data = await geminiResponse.json();

    // Extract the generated text from Gemini's response envelope
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      console.error("[gemini-proxy] Empty candidate in response:", JSON.stringify(data));
      return new Response(
        JSON.stringify({ error: "No content returned from Gemini" }),
        {
          status: 502,
          headers: { ...corsHeaders, "content-type": "application/json" },
        },
      );
    }

    return new Response(JSON.stringify({ text }), {
      status: 200,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  } catch (err: unknown) {
    console.error("[gemini-proxy] Unhandled error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "content-type": "application/json" },
      },
    );
  }
});
