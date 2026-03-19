/**
 * Gemini Dream Interpretation — AI-Enhanced Dream Insights
 *
 * Calls Google Gemini API (free tier) to generate a richer, narrative
 * dream interpretation. Designed to SUPPLEMENT — not replace — the
 * existing on-device dream engine.
 *
 * Privacy:
 *   - Only the dream text + selected feelings are sent to Gemini.
 *   - No PII, no natal chart, no user identifiers.
 *   - The API key is stored as an Expo env variable (EXPO_PUBLIC_GEMINI_API_KEY).
 *
 * Output: { paragraph, question } matching the shape consumed by the UI.
 */

import { logger } from '../../utils/logger';
import type { SelectedFeeling } from './dreamTypes';
import { FEELING_MAP } from './dreamTypes';

// ─── Config ───────────────────────────────────────────────────────────────────

const GEMINI_MODEL = 'gemini-2.5-flash-lite';
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const REQUEST_TIMEOUT_MS = 15_000;

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

// ─── API Key ──────────────────────────────────────────────────────────────────

function getApiKey(): string | null {
  const key = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  if (!key || key.trim().length === 0) return null;
  return key.trim();
}

/** Returns true when the Gemini API key is configured. */
export function isGeminiAvailable(): boolean {
  return getApiKey() !== null;
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

// ─── Gemini API Call ──────────────────────────────────────────────────────────

export async function generateGeminiDreamInterpretation(
  input: GeminiDreamInput,
): Promise<GeminiDreamResult> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('Gemini API key not configured. Set EXPO_PUBLIC_GEMINI_API_KEY in your environment.');
  }

  if (!input.dreamText || input.dreamText.trim().length === 0) {
    throw new Error('Dream text is required for interpretation.');
  }

  const url = `${GEMINI_BASE_URL}/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const body = {
    systemInstruction: {
      parts: [{ text: SYSTEM_PROMPT }],
    },
    contents: [
      {
        parts: [{ text: buildUserPrompt(input) }],
      },
    ],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 2048,
      responseMimeType: 'application/json',
    },
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      logger.error('[GeminiDream] API error:', response.status, errorText);
      if (response.status === 429) {
        throw new Error('AI insights are resting — try again in a few minutes.');
      }
      throw new Error(`Gemini API returned ${response.status}`);
    }

    const data = await response.json();

    // Extract the text content from Gemini's response structure
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      logger.error('[GeminiDream] No text in response:', JSON.stringify(data));
      throw new Error('No content returned from Gemini');
    }

    // Parse the JSON response
    const parsed = JSON.parse(text);

    if (!parsed.paragraph || !parsed.question) {
      throw new Error('Invalid response structure from Gemini');
    }

    return {
      paragraph: String(parsed.paragraph),
      question: String(parsed.question),
      generatedAt: new Date().toISOString(),
    };
  } catch (error: any) {
    if (error.name === 'AbortError') {
      logger.error('[GeminiDream] Request timed out');
      throw new Error('Dream interpretation request timed out. Please try again.');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
