/**
 * Gemini Dream Interpretation — AI-Enhanced Dream Insights
 *
 * Calls the gemini-proxy Supabase Edge Function (which securely holds the
 * GEMINI_API_KEY server-side) to generate a richer, narrative dream
 * interpretation. Designed to SUPPLEMENT — not replace — the existing
 * on-device dream engine.
 *
 * Privacy:
 *   - Only the dream text + selected feelings are sent to Gemini.
 *   - No PII, no natal chart, no user identifiers.
 *   - The API key never leaves the server.
 *
 * Output: { paragraph, question } matching the shape consumed by the UI.
 */

import { logger } from '../../utils/logger';
import { supabase } from '../../lib/supabase';
import type { SelectedFeeling } from './dreamTypes';
import { FEELING_MAP } from './dreamTypes';

// ─── Config ───────────────────────────────────────────────────────────────────

const GEMINI_MODEL = 'gemini-2.5-flash-lite';
const MAX_RETRIES = 2;
const RETRY_BASE_DELAY_MS = 800;
const RETRY_MAX_DELAY_MS = 6_000;

// ─── System Prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a dream interpreter for a personal growth app. Your approach is rooted in Jungian archetypal psychology, attachment theory, and somatic nervous system awareness — but you never name these frameworks or cite them.

═══ VOICE ═══

Write like a thoughtful friend who happens to understand dreams — not like a therapist, not like a textbook, not like a wellness influencer.

Second person ("you"). Warm. Grounded. Human.

Sentence rhythm matters. Mix short and long. Let the writing breathe:
  ✓ "The frustration you felt wasn't random. It may be pointing to a connection where you're doing the reaching but can't quite close the gap."
  ✗ "The frustration you experienced in the dream likely indicates that there may be a relationship dynamic in your waking life where you feel that your efforts to connect are not being reciprocated."

Vary sentence openings. Never start two consecutive sentences the same way. Good starters: "Something about...", "There's a reason...", "The fact that...", "You know that feeling of...", "[Symbol] in this dream is worth noticing.", "Whether it's...", "Your mind didn't stage this for no reason."

═══ BANNED PATTERNS ═══

Never use any of these:
- "This dream is a powerful reminder that…"
- "In summary…" / "Overall…" / "To sum up…"
- "It's important to remember that…" / "It's worth noting that…"
- "This suggests that…" as a sentence opener
- "The subconscious is trying to tell you…"
- "This dream symbolizes…"
- "Firstly…" / "Secondly…" / "Furthermore…" / "Moreover…" / "Additionally…"
- "In this dream, we see…"
- "Let's explore…" / "Let's unpack…"
- Starting with "So," or "Well,"

Never use these words: journey, powerful, tapestry, delve, resonate, embrace, navigate, unpack, realm, beacon, pivotal, landscape (metaphorical), profound, intricate, embark, unveil, unlock, harness.

Never stack hedges: "It may be that this could potentially reflect…" — use ONE hedge per clause maximum.

Never write a sentence longer than 35 words.

═══ CONTENT RULES ═══

1. Reference SPECIFIC imagery, people, settings, or actions from the dream. Don't stay abstract.
2. Interpret what the dream content might reflect about the dreamer's inner world, feelings, relationships, or current life themes.
3. Never diagnose, pathologize, or use clinical labels.
4. Never predict the future. Never claim the dream "means" exactly one thing.
5. If distress is present, validate the feeling. Close with one gentle somatic grounding note (breath, body, physical sensation). Keep it to one sentence — not a paragraph.
6. Write THREE flowing paragraphs. 10–15 sentences total. Each paragraph should build on the last — not repeat it.
   - Paragraph 1: Ground the reader in the dream's central scene, setting, or action. Interpret the core emotional atmosphere.
   - Paragraph 2: Draw out the symbols — at least 3, more when the dream is rich. Connect them to each other and to the dreamer's inner world. Don't list them; let one flow into the next.
   - Paragraph 3: Zoom out. What is this dream circling around at a life level? Close with warmth — not advice.
7. When the on-device analysis is provided as additional context, build on it — don't repeat it or rephrase it. Add a new angle, a deeper layer, or a connection the rule-based engine couldn't make.
8. When multiple symbols are provided, WEAVE them together into a cohesive narrative. Don't interpret each symbol in isolation — find the thread that connects them. What story do they tell when read together? What emotional or relational undercurrent runs through the combination? Let one symbol's interpretation naturally lead into the next so the reading flows like a single thought.
9. Interpret at least 3 symbols when available. If 5+ symbols are present, aim for 4–6. You don't need to cover every single one, but the interpretation should feel rich and thorough — not thin.

═══ REFLECTION QUESTION ═══

Must be specific to THIS dream. Reference a concrete detail from the narrative.

Good: "What does it feel like in your body when you think about who was on the other side of that door?"
Good: "If the water in your dream had something to say, what would it be?"
Bad: "How can you apply this insight to your daily life?"
Bad: "What emotions come up for you when you reflect on this dream?"
Bad: "What steps can you take to address the themes in this dream?"

═══ EXAMPLES OF THE RIGHT VOICE ═══

Example 1 (symbol-rich dream with school, mother, locked door, hallway):
"Your dream placed you in a school — a space your mind often reaches for when something about performance or evaluation is pressing. The hallway stretching endlessly has a quality of searching, of trying to get somewhere that keeps moving further away. That alone tells you something about where you are right now.

The locked door is hard to ignore. Paired with your mom being in the scene, it shifts the dream from a generic anxiety setting into something more personal. The door may represent a boundary — a conversation that hasn't happened, or a version of closeness you can't quite access. Your mother's presence suggests the stakes aren't abstract. This is about the kind of approval or understanding that shaped how you learned to measure yourself.

Something in your life right now is echoing this old pattern — the trying, the reaching, the finding it closed. Your mind built this whole scene to get your attention. It's not warning you. It's asking you to notice."

Example 2 (feeling-heavy dream with water, darkness, sinking):
"Something about the water stayed with you, and that's usually a sign it's connected to something real. The darkness around it deepens the feeling — this wasn't a calm lake or a sunlit shore. Your mind chose a version of water that felt heavy, enclosed, hard to see through.

The sinking sensation is your body's contribution to the dream. It's the physical version of a feeling you may be carrying — the sense that something is pulling you under, or that you're losing your footing in a situation that used to feel stable. Water in dreams often maps to emotional depth, and the fact that yours was dark suggests feelings you haven't fully looked at yet.

Even without a full storyline, the heaviness here has its own kind of clarity. Your mind didn't need a narrative to make the point — the feeling alone was the message. Whatever this is about, your body already knows."

Example 3 (distressing dream with being chased, forest, fog, childhood home):
"Being chased in a dream is one of the most physically intense experiences your mind can create. The urgency of it probably still echoes. The forest adds another layer — it's a place where visibility drops and instinct takes over. You couldn't see what was behind you, and that not-knowing is often the worst part.

The fog matters here. It's not just atmosphere — it's the feeling of not being able to think clearly about whatever is pressing on you. And the fact that the chase led you back to your childhood home is worth sitting with. Your mind took a present-tense threat and routed it to the past. Whatever you're avoiding right now may have roots somewhere older than the current situation.

None of this is a warning or a prediction. It's your mind trying to bring something forward — something you've probably been outrunning for a while. If your body is still holding tension from this one, a few slow breaths can help it land."

═══ RESPONSE FORMAT ═══

Return strict JSON. No markdown. No code fences. No extra text.
Separate the three paragraphs with \\n\\n inside the "paragraph" field.
{
  "paragraph": "First paragraph...\\n\\nSecond paragraph...\\n\\nThird paragraph...",
  "question": "Your reflection question here."
}`;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GeminiDreamResult {
  paragraph: string;
  question: string;
  generatedAt: string;
}

export interface GeminiDreamInput {
  dreamText: string;
  feelings?: SelectedFeeling[];
  /** Optional on-device interpretation to provide as additional context */
  onDeviceSummary?: string;
  /** Symbols extracted from the dream text by the on-device engine */
  symbols?: { word: string; category: string; description?: string }[];
  /** Interpretive themes derived from trigger analysis */
  interpretiveThemes?: string[];
  /** Pattern analysis from the on-device engine */
  patternAnalysis?: {
    primaryPattern: string;
    undercurrentLabel: string;
    endingType: string;
  };
}

// ─── Availability ─────────────────────────────────────────────────────────────

/** Gemini is available only when the user has a valid Supabase session. */
export function isGeminiAvailable(hasAuthenticatedSession: boolean): boolean {
  return hasAuthenticatedSession;
}

// ─── Build User Prompt ────────────────────────────────────────────────────────

function buildUserPrompt(input: GeminiDreamInput): string {
  const parts: string[] = [];

  parts.push(`Dream narrative:\n"${input.dreamText}"`);

  if (input.feelings && input.feelings.length > 0) {
    const feelingLabels = input.feelings
      .map(f => {
        const def = FEELING_MAP[f.id];
        const label = def?.label ?? f.id;
        return f.intensity >= 4 ? `${label} (strong)` : label;
      })
      .join(', ');
    parts.push(`Feelings during the dream: ${feelingLabels}`);
  }

  if (input.symbols && input.symbols.length > 0) {
    const symbolLines = input.symbols.map(s =>
      s.description ? `- ${s.word} (${s.category}): ${s.description}` : `- ${s.word} (${s.category})`
    ).join('\n');
    parts.push(`Symbols identified in the dream:\n${symbolLines}`);
  }

  if (input.interpretiveThemes && input.interpretiveThemes.length > 0) {
    parts.push(`Interpretive themes: ${input.interpretiveThemes.join(', ')}`);
  }

  if (input.patternAnalysis) {
    const pa = input.patternAnalysis;
    parts.push(`Dream pattern: ${pa.primaryPattern} — undercurrent: ${pa.undercurrentLabel}, ending: ${pa.endingType}`);
  }

  if (input.onDeviceSummary) {
    parts.push(`Additional context from on-device analysis:\n${input.onDeviceSummary}`);
  }

  return parts.join('\n\n');
}

function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function computeRetryDelayMs(attempt: number): number {
  const expDelay = Math.min(RETRY_BASE_DELAY_MS * 2 ** attempt, RETRY_MAX_DELAY_MS);
  const jitter = Math.floor(Math.random() * 250);
  return expDelay + jitter;
}

function getFriendlyRateLimitMessage(): string {
  return 'AI insights are at capacity right now. Please wait a minute and try again.';
}

function getFriendlyAuthMessage(): string {
  return 'Sign in to use AI dream insights.';
}

async function ensureGeminiDreamSession(): Promise<void> {
  try {
    const { data: current } = await supabase.auth.getSession();
    const token = current.session?.access_token;
    if (!token) {
      throw new Error(getFriendlyAuthMessage());
    }
    // Proactively refresh if the token is expired or expires within 60 seconds
    const expiresAt = current.session?.expires_at;
    if (expiresAt && expiresAt - Math.floor(Date.now() / 1000) < 60) {
      logger.info('[GeminiDream] Token expired or near-expiry, refreshing session...');
      const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError || !refreshed.session?.access_token) {
        logger.warn('[GeminiDream] Session refresh failed; AI dream insights unavailable.', refreshError);
        throw new Error(getFriendlyAuthMessage());
      }
    }
  } catch (error) {
    if (error instanceof Error && error.message === getFriendlyAuthMessage()) {
      throw error;
    }
    logger.warn('[GeminiDream] Failed to read Supabase session; AI dream insights unavailable.', error);
    throw new Error(getFriendlyAuthMessage());
  }
}

// ─── Client-side Rate Limiter ────────────────────────────────────────────────

const MIN_CALL_INTERVAL_MS = 10_000; // 10 seconds between calls
let lastCallTimestamp = 0;

// ─── Gemini API Call ──────────────────────────────────────────────────────────

export async function generateGeminiDreamInterpretation(
  input: GeminiDreamInput,
): Promise<GeminiDreamResult> {
  if (!input.dreamText || input.dreamText.trim().length === 0) {
    throw new Error('Dream text is required for interpretation.');
  }

  await ensureGeminiDreamSession();

  const now = Date.now();
  if (now - lastCallTimestamp < MIN_CALL_INTERVAL_MS) {
    throw new Error(getFriendlyRateLimitMessage());
  }
  lastCallTimestamp = now;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      const { data, error } = await supabase.functions.invoke('gemini-proxy', {
        body: {
          model: GEMINI_MODEL,
          systemPrompt: SYSTEM_PROMPT,
          userPrompt: buildUserPrompt(input),
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
            responseMimeType: 'application/json',
          },
        },
      });

      if (error) {
        const status = (error as any)?.context?.status ?? 0;
        const message = (error as any)?.message ?? String(error);

        if (status === 401 || status === 403) {
          logger.warn('[GeminiDream] Edge function unauthorized; AI dream insights require sign-in.');
          throw new Error(getFriendlyAuthMessage());
        }

        logger.error('[GeminiDream] Edge function error:', status, message);

        if (status === 429) throw new Error(getFriendlyRateLimitMessage());

        const retriable = status === 0 || status === 408 || status === 503 || status >= 500;
        if (retriable && attempt < MAX_RETRIES) {
          await wait(computeRetryDelayMs(attempt));
          continue;
        }
        throw new Error(message);
      }

      const text: string = data?.text;
      if (!text) {
        logger.error('[GeminiDream] No text in edge function response');
        throw new Error('No content returned from Gemini');
      }

      // Strip markdown fences and extract the JSON object
      let jsonText = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
      const firstBrace = jsonText.indexOf('{');
      const lastBrace = jsonText.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace > firstBrace) {
        jsonText = jsonText.slice(firstBrace, lastBrace + 1);
      }

      let parsed: any;
      try {
        parsed = JSON.parse(jsonText);
      } catch {
        logger.error('[GeminiDream] JSON parse failed, raw text:', text);
        throw new Error('AI response was malformed. Tap RE-INTERPRET to try again.');
      }

      if (!parsed.paragraph || !parsed.question) {
        throw new Error('Invalid response structure from Gemini');
      }

      return {
        paragraph: String(parsed.paragraph),
        question: String(parsed.question),
        generatedAt: new Date().toISOString(),
      };
    } catch (error: any) {
      // Don't retry user-facing errors or exhausted retries
      const isNetwork = error instanceof TypeError;
      if (isNetwork && attempt < MAX_RETRIES) {
        await wait(computeRetryDelayMs(attempt));
        continue;
      }
      if (isNetwork) {
        throw new Error('Could not reach AI insights. Please check your connection and try again.');
      }
      throw error;
    }
  }

  throw new Error('AI insights are temporarily unavailable. Please try again soon.');
}
