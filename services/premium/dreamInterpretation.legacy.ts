/**
 * Dream Interpretation Engine — Premium Feature
 *
 * Generates personalized symbolic dream interpretations without AI or network calls.
 * Draws from:
 *   - The user's dream text (keyword → symbol extraction)
 *   - Their natal chart (silently — as a psychological profile only)
 *   - Recent daily check-ins (mood trend, tags, energy)
 *   - Recent journal entries (mood pattern)
 *   - The current sleep entry (quality, duration)
 *
 * Output is stable per entry: the same dream always produces the same interpretation.
 * Language is symbolic psychology — no astrology terminology surfaces in output.
 */

import { NatalChart } from '../astrology/types';
import { DailyCheckIn } from '../patterns/types';
import { JournalEntry, SleepEntry } from '../storage/models';
import {
  DREAM_SYMBOLS,
  extractSymbols,
  pickVariant,
} from '../../constants/dreamSymbols';
import { buildPersonalityProfile } from '../../constants/personalityProfiles';

// ─── Output Types ─────────────────────────────────────────────────────────────

export interface DreamInterpretation {
  /** Human-readable labels for symbols found, e.g. ["Water", "A house", "An unknown figure"] */
  symbolLabels: string[];
  /** Core symbolic reflection on what emerged */
  reflection: string;
  /** Personalized context from the user's real data */
  innerLandscape: string;
  /** A single open question to hold */
  somethingToSitWith: string;
  /** ISO timestamp when generated */
  generatedAt: string;
}

// ─── Internal Context Helpers ─────────────────────────────────────────────────

interface MoodContext {
  trend: 'quieter' | 'steady' | 'elevated' | 'variable';
  dominantTags: string[];
  avgMoodScore: number;
}

function analyzeMood(checkIns: DailyCheckIn[]): MoodContext {
  if (!checkIns.length) {
    return { trend: 'steady', dominantTags: [], avgMoodScore: 5 };
  }

  const recent = checkIns.slice(0, 14); // last 14 entries max
  const avgMoodScore =
    recent.reduce((sum, c) => sum + c.moodScore, 0) / recent.length;

  const tagCounts: Record<string, number> = {};
  for (const c of recent) {
    for (const tag of c.tags ?? []) {
      tagCounts[tag] = (tagCounts[tag] ?? 0) + 1;
    }
  }
  const dominantTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([tag]) => tag);

  let trend: MoodContext['trend'];
  if (avgMoodScore < 4) trend = 'quieter';
  else if (avgMoodScore < 6) trend = 'steady';
  else if (avgMoodScore >= 7.5) trend = 'elevated';
  else trend = 'variable';

  return { trend, dominantTags, avgMoodScore };
}

/** Human-readable phrase for the mood trend */
function moodTrendPhrase(ctx: MoodContext): string {
  switch (ctx.trend) {
    case 'quieter':
      return 'a quieter emotional stretch than usual';
    case 'elevated':
      return 'an emotionally active stretch';
    case 'variable':
      return 'a week of some emotional variation';
    default:
      return 'a fairly steady emotional stretch';
  }
}

/** Human-readable phrase describing notable tags */
function tagsPhrase(tags: string[]): string | null {
  const MAP: Record<string, string> = {
    anxiety: 'some undercurrent of tension',
    overwhelm: 'a sense of overwhelm',
    grief: 'something heavy being carried',
    loneliness: 'a thread of loneliness',
    clarity: 'moments of clarity',
    joy: 'some pockets of joy',
    creativity: 'a creative current',
    gratitude: 'a sense of gratitude',
    relationships: 'something stirring in your relationships',
    boundaries: 'a recurring theme around limits and needs',
    conflict: 'interpersonal friction',
    health: 'attention on your body',
    family: 'family on your mind',
    career: 'something in motion with your work',
    money: 'financial preoccupation',
    sleep: 'disrupted rest',
    rest: 'a need for more rest',
    social: 'a busy social context',
    work: 'work weighing on your mind',
    movement: 'physical movement in your rhythm',
    nature: 'time spent in nature',
    alone_time: 'a need for solitude',
    finances: 'financial weight',
    screens: 'digital overstimulation',
    kids: 'your kids on your mind',
    productivity: 'a drive to be productive',
    substances: 'substances as part of the picture',
    intimacy: 'intimacy as a theme',
    // Emotional quality tags (premium check-ins)
    eq_calm: 'a settled, calm quality',
    eq_anxious: 'an undercurrent of anxiety',
    eq_focused: 'a sense of focus and presence',
    eq_disconnected: 'a feeling of disconnection',
    eq_hopeful: 'a thread of hopefulness',
    eq_irritable: 'irritability surfacing',
    eq_grounded: 'a grounded, steady feeling',
    eq_scattered: 'a scattered, unfocused quality',
    eq_heavy: 'a heaviness you\'ve been carrying',
    eq_open: 'an open, receptive quality',
  };

  const found = tags.map(t => MAP[t]).filter(Boolean);
  if (found.length === 0) return null;
  if (found.length === 1) return found[0];
  return `${found.slice(0, -1).join(', ')} and ${found[found.length - 1]}`;
}

/** Describe journal mood pattern from last few entries */
function journalMoodPhrase(entries: JournalEntry[]): string | null {
  if (!entries.length) return null;

  const recent = entries.slice(0, 5);
  const moodCounts: Record<string, number> = {};
  for (const e of recent) {
    moodCounts[e.mood] = (moodCounts[e.mood] ?? 0) + 1;
  }
  const top = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

  const JOURNAL_MOOD_MAP: Record<string, string> = {
    calm: 'a quieter internal tone',
    soft: 'a gentle, open quality in your recent writing',
    okay: 'a middling, neither here nor there quality',
    heavy: 'something heavy recurring in your recent entries',
    stormy: 'some inner turbulence in your recent writing',
  };

  return JOURNAL_MOOD_MAP[top] ?? null;
}

/** Describe sleep quality in natural language */
function sleepQualityPhrase(entry: SleepEntry): string {
  const q = entry.quality;
  const h = entry.durationHours;

  let qualityPart = '';
  if (q === 1 || q === 2) qualityPart = 'a restless, difficult night';
  else if (q === 3) qualityPart = 'a middling night of sleep';
  else if (q === 4) qualityPart = 'a decent night of rest';
  else if (q === 5) qualityPart = 'a deep, restful night';
  else qualityPart = '';

  let durationPart = '';
  if (h !== undefined && h !== null) {
    if (h < 5.5) durationPart = ' — on the shorter side';
    else if (h > 8.5) durationPart = ' — a longer rest than usual';
  }

  return qualityPart + durationPart;
}

// ─── Reflection Builder ───────────────────────────────────────────────────────

/**
 * Build the main symbolic reflection from extracted symbols.
 * Uses the entry ID as a seed for stable, deterministic variant selection.
 */
function buildReflection(symbolKeys: string[], seed: string): string {
  if (!symbolKeys.length) {
    return 'Even without clear images to point to, dreams carry a texture — a feeling or atmosphere that tends to be the real message. What was the overall feeling of this dream, and where do you recognize it from in your waking life?';
  }

  const parts: string[] = [];

  for (const key of symbolKeys.slice(0, 3)) {
    const symbol = DREAM_SYMBOLS[key];
    if (!symbol) continue;
    const interpretation = pickVariant(symbol.interpretations, seed + key);
    parts.push(interpretation);
  }

  return parts.join(' ');
}

// ─── Inner Landscape Builder ──────────────────────────────────────────────────

/**
 * Build the personalized "inner landscape" section.
 * This is what makes the interpretation feel intelligent — it references
 * the user's actual data without ever sounding generic.
 */
function buildInnerLandscape(
  symbolKeys: string[],
  moodCtx: MoodContext,
  journalMood: string | null,
  sleepPhrase: string,
  dreamMood: string | undefined,
  profile: ReturnType<typeof buildPersonalityProfile> | null,
  seed: string,
): string {
  const parts: string[] = [];

  // ── Sleep context sentence ──────────────────────────────────────────────────────
  if (sleepPhrase) {
    parts.push(`This dream came during ${sleepPhrase}.`);
  }

  // ── Dream mood sentence (user-selected feeling) ──────────────────────────────
  if (dreamMood) {
    const DREAM_MOOD_PHRASES: Record<string, string> = {
      peaceful: 'The dream carried a peaceful, settled quality — as if something inside you was at rest.',
      anxious: 'There was an anxious undercurrent running through the dream — a tension that may be worth noticing.',
      surreal: 'The dream had a surreal, otherworldly quality — the kind that bends waking logic and invites a different way of seeing.',
      dark: 'There was a darkness to this dream — not necessarily bad, but heavy, like something unlit asking to be acknowledged.',
      vivid: 'The dream was unusually vivid — bright and alive in a way that suggests something was trying to be remembered.',
      confusing: 'The dream felt confusing and hard to follow — which sometimes means the real message is in the feeling, not the plot.',
    };
    const phrase = DREAM_MOOD_PHRASES[dreamMood];
    if (phrase) parts.push(phrase);
  }

  // ── Mood/week context sentence ────────────────────────────────────────────
  const moodPhrase = moodTrendPhrase(moodCtx);
  const tagPhrase = tagsPhrase(moodCtx.dominantTags);

  if (tagPhrase) {
    parts.push(`Your recent days have held ${moodPhrase} — with ${tagPhrase} threading through.`);
  } else {
    parts.push(`Your recent days have reflected ${moodPhrase}.`);
  }

  // ── Journal mood sentence (if available) ──────────────────────────────────
  if (journalMood) {
    parts.push(`Your writing lately has carried ${journalMood}.`);
  }

  // ── Symbol-specific personalization ──────────────────────────────────────
  const primaryKey = symbolKeys[0];
  const primarySymbol = primaryKey ? DREAM_SYMBOLS[primaryKey] : null;

  if (primarySymbol && profile) {
    const archetype = primarySymbol.archetype;

    // Shape the personalized sentence based on the archetype
    const ARCHETYPE_PHRASES: Record<string, string[]> = {
      Shadow: [
        `Given how you tend to ${profile.givenPhrase}, this kind of image may be asking you to turn toward something you've been moving around.`,
        `The shadow tends to arrive when something unacknowledged is ready to be seen. Given that you ${profile.emotionalStyle}, this may require more patience with yourself than urgency.`,
      ],
      Self: [
        `Given that you ${profile.coreMotivation}, this image may be pointing toward something genuinely yours — a direction or possibility still finding its form.`,
        `Something about this symbol feels oriented toward integration. Given your tendency to ${profile.givenPhrase}, that process may be quieter than it looks.`,
      ],
      Threshold: [
        `Threshold images often arrive during transitions. Given that you ${profile.wrestlingTheme}, this particular crossing may carry more weight than it first appears.`,
        `Something is changing. Given how you tend to ${profile.tensionResponse}, this kind of uncertainty may feel more unsettling than it actually is.`,
      ],
      Transformation: [
        `Transformation images tend to arrive before the change is consciously recognized. Given that you ${profile.emotionalStyle}, this may be processing something you haven't fully named yet.`,
        `Something is completing or being shed. Given that you ${profile.coreMotivation}, this may feel disorienting even as it's necessary.`,
      ],
      Integration: [
        `This image carries a quality of becoming whole. Given how you tend to ${profile.givenPhrase}, this kind of process tends to happen gradually and from the inside.`,
        `Something is being brought together. Given that you ${profile.connectionStyle}, the relational threads here may be part of what's integrating.`,
      ],
      Anima: [
        `Intuition-adjacent images tend to carry something you already know but haven't said aloud yet. Given that you ${profile.emotionalStyle}, this knowing may be worth sitting with.`,
      ],
      Persona: [
        `How you're being perceived — or fear you're being perceived — can be at the heart of this kind of image. Given that you ${profile.wrestlingTheme}, there may be a layer of self-judgment worth softening.`,
      ],
    };

    const phrases = ARCHETYPE_PHRASES[archetype];
    if (phrases) {
      parts.push(pickVariant(phrases, seed + 'archetype'));
    }
  } else if (profile) {
    // No dominant archetype — use a generic personalized bridge
    const bridges = [
      `Given that you ${profile.emotionalStyle}, dreams often arrive as atmosphere more than as clear narrative.`,
      `Given how you tend to ${profile.givenPhrase}, what surfaces in sleep can sometimes be what waking life doesn't have room for.`,
    ];
    parts.push(pickVariant(bridges, seed + 'bridge'));
  }

  return parts.join(' ');
}

// ─── Closing Question Builder ─────────────────────────────────────────────────

/**
 * Pick a closing "something to sit with" question, shaped by the primary archetype
 * and secondarily by the personality profile's wrestling theme.
 */
function buildClosingQuestion(
  symbolKeys: string[],
  profile: ReturnType<typeof buildPersonalityProfile> | null,
  seed: string,
): string {
  const primaryKey = symbolKeys[0];
  const symbol = primaryKey ? DREAM_SYMBOLS[primaryKey] : null;

  const ARCHETYPE_QUESTIONS: Record<string, string[]> = {
    Shadow: [
      'What in this dream are you most reluctant to look at directly? That is probably the part worth staying with.',
      'If the thing being avoided in this dream is a part of you — what is it, and what does it need from you?',
      'What would it mean to stop running from the thing this dream put in front of you?',
    ],
    Self: [
      'What part of this dream felt most like it was about the you who is still becoming?',
      'If this image is pointing toward something real in you — what is it, and what would it need to grow?',
      'What does this dream know about you that your waking mind is still catching up to?',
    ],
    Threshold: [
      'What transition is this dream holding that you haven\'t yet fully acknowledged?',
      'What is on the other side of the crossing this dream is describing?',
      'If something in your life is shifting right now — what would make this transition feel survivable?',
    ],
    Transformation: [
      'What version of yourself is completing, even if you haven\'t named it yet?',
      'What is being shed in your life right now? What is it making room for?',
      'What would it look like to cooperate with the change this dream is pointing toward?',
    ],
    Integration: [
      'What would it mean to accept the part of you this image reflects?',
      'What two parts of yourself might this dream be asking to meet each other?',
      'What in this dream represents something you\'ve been keeping separate that might belong together?',
    ],
    Anima: [
      'What do you know intuitively about this dream that your rational mind keeps questioning?',
      'What would you feel if you trusted the impression this dream left without analyzing it?',
    ],
    Persona: [
      'In what area of your life right now do you feel most like you\'re being evaluated?',
      'What would change if you were slightly less concerned with how you\'re being perceived?',
    ],
  };

  const archetype = symbol?.archetype;
  const questions = archetype ? ARCHETYPE_QUESTIONS[archetype] : null;

  if (questions) {
    return pickVariant(questions, seed + 'question');
  }

  // Generic fallback
  const fallbacks = [
    'What feeling did this dream leave you with — and where do you recognize that feeling from?',
    'If this dream were a question rather than a story, what would it be asking?',
    'What part of this dream keeps returning to you even now? That is usually the part worth staying with.',
  ];
  return pickVariant(fallbacks, seed + 'fallback');
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export interface DreamInterpretationInput {
  entry: SleepEntry;
  dreamText: string;             // already decrypted
  dreamMood?: string;            // how the dream felt (peaceful, anxious, surreal, dark, vivid, confusing)
  chart?: NatalChart | null;
  recentCheckIns: DailyCheckIn[];
  recentJournalEntries: JournalEntry[];
}

/**
 * Generate a symbolic dream interpretation from all available user data.
 *
 * Output is deterministic per entry: identical input always produces identical output.
 * No network calls, no AI — all assembly is local.
 */
export function generateDreamInterpretation(
  input: DreamInterpretationInput,
): DreamInterpretation {
  const { entry, dreamText, dreamMood, chart, recentCheckIns, recentJournalEntries } = input;

  // Seed for deterministic variant selection
  const seed = entry.id + (dreamText.slice(0, 20));

  // ── Extract symbols ────────────────────────────────────────────────────────
  const symbolKeys = extractSymbols(dreamText, 4);
  const symbolLabels = symbolKeys
    .map(key => DREAM_SYMBOLS[key]?.label)
    .filter(Boolean) as string[];

  // ── Build personality profile from chart (silent) ─────────────────────────
  const profile = chart ? buildPersonalityProfile(chart) : null;

  // ── Analyze contextual data ────────────────────────────────────────────────
  const moodCtx = analyzeMood(recentCheckIns);
  const journalMood = journalMoodPhrase(recentJournalEntries);
  const sleepPhrase = sleepQualityPhrase(entry);

  // ── Assemble sections ──────────────────────────────────────────────────────
  const reflection = buildReflection(symbolKeys, seed);
  const innerLandscape = buildInnerLandscape(
    symbolKeys,
    moodCtx,
    journalMood,
    sleepPhrase,
    dreamMood,
    profile,
    seed,
  );
  const somethingToSitWith = buildClosingQuestion(symbolKeys, profile, seed);

  return {
    symbolLabels,
    reflection,
    innerLandscape,
    somethingToSitWith,
    generatedAt: new Date().toISOString(),
  };
}
