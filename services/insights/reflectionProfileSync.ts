/**
 * Reflection Profile Sync
 *
 * Applies accumulated daily reflection answers to the three Inner World profiles:
 *   - Archetype Profile  (@mysky:archetype_profile)
 *   - Cognitive Style    (@mysky:cognitive_style)
 *   - Core Values        (@mysky:core_values)
 *
 * Called automatically when a user seals a reflection category so that the
 * daily questions meaningfully influence the profile screens over time.
 */

import { EncryptedAsyncStorage } from '../storage/encryptedAsyncStorage';
import { loadSomaticEntries } from '../storage/selfKnowledgeStore';
import {
  getAnswersByCategory,
  getDraftAnswersByCategory,
  loadReflections,
  ReflectionAnswer,
  ReflectionDraftAnswer,
} from './dailyReflectionService';
import { ReflectionCategory } from '../../constants/dailyReflectionQuestions';

// ─────────────────────────────────────────────────────────────────────────────
// Archetypes sync
// ─────────────────────────────────────────────────────────────────────────────

type ArchetypeKey = 'hero' | 'caregiver' | 'seeker' | 'sage' | 'rebel';

interface ArchetypeSyncOptions {
  includeDrafts?: boolean;
}

type CombinedReflectionAnswer = ReflectionAnswer | ReflectionDraftAnswer;

async function getCombinedReflectionAnswers(
  category: ReflectionCategory,
  includeDrafts = false,
): Promise<CombinedReflectionAnswer[]> {
  const [sealedAnswers, draftAnswers] = await Promise.all([
    getAnswersByCategory(category),
    includeDrafts ? getDraftAnswersByCategory(category) : Promise.resolve([] as ReflectionDraftAnswer[]),
  ]);

  const answerMap = new Map<string, CombinedReflectionAnswer>();
  for (const answer of sealedAnswers) {
    answerMap.set(`${answer.date}:${answer.category}:${answer.questionId}`, answer);
  }
  for (const answer of draftAnswers) {
    answerMap.set(`${answer.date}:${answer.category}:${answer.questionId}`, answer);
  }

  return [...answerMap.values()];
}

function getEmptyArchetypeScores(): Record<ArchetypeKey, number> {
  return {
    hero: 0,
    caregiver: 0,
    seeker: 0,
    sage: 0,
    rebel: 0,
  };
}

function extractQuizScores(existing: unknown): Record<ArchetypeKey, number> {
  const parsed = existing as {
    quizScores?: Partial<Record<ArchetypeKey, number>>;
    scores?: Partial<Record<ArchetypeKey, number>>;
  } | null;

  if (parsed?.quizScores) {
    return { ...getEmptyArchetypeScores(), ...parsed.quizScores };
  }

  if (parsed?.scores) {
    const merged = { ...getEmptyArchetypeScores(), ...parsed.scores };
    const total = Object.values(merged).reduce((sum, value) => sum + value, 0);
    if (total === 5) return merged;
  }

  return getEmptyArchetypeScores();
}

/**
 * Maps the explicitly archetype-coded question IDs to their archetype.
 * Broader Jungian prompts beyond id 149 are handled separately and routed
 * toward the user's current dominant pattern so every answered prompt counts.
 */
function archetypeForQuestionId(id: number): ArchetypeKey | null {
  if (id >= 0 && id <= 29) return 'hero';
  if (id >= 30 && id <= 59) return 'caregiver';
  if (id >= 60 && id <= 89) return 'seeker';
  if (id >= 90 && id <= 119) return 'sage';
  if (id >= 120 && id <= 149) return 'rebel';
  return null;
}

function getDominantArchetype(scores: Record<ArchetypeKey, number>): ArchetypeKey {
  return (Object.entries(scores) as [ArchetypeKey, number][])
    .reduce<[ArchetypeKey, number]>(
      (best, current) => (current[1] > best[1] ? current : best),
      ['hero', -1],
    )[0];
}

/**
 * Recomputes the dominant archetype from all-time reflection answers and
 * saves the result back to the archetype profile store.
 *
 * If the user has also completed the quiz, quiz votes are weighted 2× over
 * reflection scaleValues so explicit quiz answers remain the primary signal.
 * If no quiz has been taken, reflection data alone drives the dominant.
 */
export async function syncArchetypeProfileFromReflections(
  options: ArchetypeSyncOptions = {},
): Promise<void> {
  try {
    const answers = await getCombinedReflectionAnswers('archetypes', options.includeDrafts);
    if (answers.length === 0) return;

    const raw = await EncryptedAsyncStorage.getItem('@mysky:archetype_profile');
    const existing = raw ? JSON.parse(raw) : null;
    const quizScores = extractQuizScores(existing);
    const totalQuizVotes = Object.values(quizScores).reduce((a, b) => a + b, 0);
    const fallbackArchetype: ArchetypeKey = existing?.dominant ?? (totalQuizVotes > 0 ? getDominantArchetype(quizScores) : 'hero');

    // Accumulate reflection scores per archetype.
    // `countByArchetype` drives the visible score breakdown so each answered
    // daily prompt adds exactly one vote. `weightedByArchetype` preserves the
    // user's response intensity for dominant/trend calculations.
    const sumByArchetype = getEmptyArchetypeScores();
    const countByArchetype = getEmptyArchetypeScores();

    for (const ans of answers) {
      const archetype = archetypeForQuestionId(ans.questionId) ?? fallbackArchetype;
      sumByArchetype[archetype] += ans.scaleValue ?? 0;
      countByArchetype[archetype]++;
    }

    // Combine: quiz gets 2x weight vs reflection vote share.
    const totalReflectionVotes = Object.values(countByArchetype).reduce((a, b) => a + b, 0);
    const combined = getEmptyArchetypeScores();
    for (const key of Object.keys(combined) as ArchetypeKey[]) {
      const quizNorm = totalQuizVotes > 0 ? quizScores[key] / totalQuizVotes : 0;
      const reflectionNorm = totalReflectionVotes > 0 ? countByArchetype[key] / totalReflectionVotes : 0;
      combined[key] = totalQuizVotes > 0
        ? quizNorm * 2 + reflectionNorm
        : reflectionNorm;
    }

    const dominant = getDominantArchetype(combined);

    const displayScores = getEmptyArchetypeScores();
    for (const key of Object.keys(displayScores) as ArchetypeKey[]) {
      displayScores[key] = quizScores[key] + countByArchetype[key];
    }

    const updated = {
      ...(existing ?? {}),
      dominant,
      scores: displayScores,
      quizScores,
      reflectionScores: countByArchetype,
      reflectionWeightedScores: sumByArchetype,
      completedAt: existing?.completedAt ?? new Date().toISOString(),
    };

    await EncryptedAsyncStorage.setItem('@mysky:archetype_profile', JSON.stringify(updated));
  } catch {
    // Graceful fallback — never crash the seal flow
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Cognitive Style sync
// ─────────────────────────────────────────────────────────────────────────────

type DimensionKey = 'scope' | 'processing' | 'decisions';

interface DimensionSignal {
  dim: DimensionKey;
  /**
   * +1 = pulls toward the right pole:
   *   scope      → Detail First
   *   processing → Verbal & Analytical
   *   decisions  → Careful & Deliberate
   * -1 = pulls toward the left pole:
   *   scope      → Big Picture
   *   processing → Visual & Spatial
   *   decisions  → Quick & Intuitive
   */
  dir: 1 | -1;
}

const COGNITIVE_RANGE_FALLBACKS: Array<{ range: [number, number]; dim: DimensionKey }> = [
  { range: [0, 29], dim: 'decisions' },
  { range: [30, 59], dim: 'processing' },
  { range: [60, 89], dim: 'scope' },
  { range: [90, 119], dim: 'processing' },
  { range: [120, 149], dim: 'decisions' },
  { range: [150, 179], dim: 'scope' },
  { range: [180, 209], dim: 'processing' },
  { range: [210, 239], dim: 'processing' },
  { range: [240, 269], dim: 'decisions' },
  { range: [270, 299], dim: 'processing' },
  { range: [300, 329], dim: 'scope' },
  { range: [330, 364], dim: 'processing' },
];

function fallbackDimensionForQuestionId(id: number): DimensionKey | null {
  const match = COGNITIVE_RANGE_FALLBACKS.find(({ range }) => id >= range[0] && id <= range[1]);
  return match?.dim ?? null;
}

function fallbackDirectionForDimension(
  dim: DimensionKey,
  manualScores: Partial<Record<DimensionKey, number>>,
  existingScores: Partial<Record<DimensionKey, number>>,
): 1 | -1 {
  const baseline = manualScores[dim] ?? existingScores[dim] ?? 3;
  return baseline >= 3 ? 1 : -1;
}

/**
 * Subset of cognitive question IDs that clearly indicate a dimension and
 * direction. Each question was chosen because high agreement (Very True)
 * unambiguously points to one pole of its dimension.
 */
const COGNITIVE_SIGNAL_MAP: Record<number, DimensionSignal> = {
  // Decisions (Quick/Intuitive ↔ Careful/Deliberate)
  1:   { dim: 'decisions', dir: 1 },  // "I deliberate carefully before committing"
  2:   { dim: 'decisions', dir: -1 }, // "I trust my gut feeling"
  3:   { dim: 'decisions', dir: -1 }, // "Quick decisions work out well for me"
  7:   { dim: 'decisions', dir: 1 },  // "I lead with thinking rather than feeling"
  10:  { dim: 'decisions', dir: 1 },  // "I gather sufficient info before committing"
  17:  { dim: 'decisions', dir: 1 },  // "Reliable decision-making strategy under pressure"
  29:  { dim: 'decisions', dir: -1 }, // "Time pressure improves my decision quality"
  121: { dim: 'decisions', dir: -1 }, // "My gut instinct proves right even when data suggests otherwise"
  125: { dim: 'decisions', dir: 1 },  // "Analysis paralysis prevents me from acting"
  139: { dim: 'decisions', dir: 1 },  // "Deep satisfaction in thorough analysis"
  145: { dim: 'decisions', dir: 1 },  // "I sleep on important decisions"
  149: { dim: 'decisions', dir: -1 }, // "I trust my first thought and act on it"
  // Scope (Big Picture ↔ Detail First)
  33:  { dim: 'scope', dir: -1 },     // "I prefer getting the big picture first"
  64:  { dim: 'scope', dir: 1 },      // "I break large problems into smaller pieces"
  71:  { dim: 'scope', dir: -1 },     // "I approach top-down, starting with big picture"
  // Processing (Visual/Spatial ↔ Verbal/Analytical)
  31:  { dim: 'processing', dir: -1 }, // "I organise information visually in my mind"
  37:  { dim: 'processing', dir: -1 }, // "I prefer narrative over structured data"
  42:  { dim: 'processing', dir: -1 }, // "I think primarily in images rather than words"
  44:  { dim: 'processing', dir: 1 },  // "I am comfortable with numbers and quantitative data"
  181: { dim: 'processing', dir: 1 },  // "I think most effectively in writing"
  198: { dim: 'processing', dir: 1 },  // "I build arguments using logic rather than emotion"
};

/**
 * Derives a 1–5 score for each dimension from all-time cognitive reflection
 * answers. Blends with any manually-set scores (manual weighted 60%,
 * reflection 40%) so user-set values stay sticky but drift over time.
 *
 * Dimensions that have never been manually set are populated from reflection
 * data alone, letting users see a live profile even before completing the quiz.
 */
export async function syncCognitiveStyleFromReflections(
  options: ArchetypeSyncOptions = {},
): Promise<void> {
  try {
    const answers = await getCombinedReflectionAnswers('cognitive', options.includeDrafts);
    if (answers.length === 0) return;

    const raw = await EncryptedAsyncStorage.getItem('@mysky:cognitive_style');
    const existing: Partial<Record<DimensionKey, number>> & {
      manualScores?: Partial<Record<DimensionKey, number>>;
      reflectionScores?: Partial<Record<DimensionKey, number>>;
    } = raw ? JSON.parse(raw) : {};

    const manualScores: Partial<Record<DimensionKey, number>> = existing.manualScores ?? {
      scope: existing.scope,
      processing: existing.processing,
      decisions: existing.decisions,
    };

    // Accumulate directional signal per dimension
    const dimSums: Record<DimensionKey, number> = { scope: 0, processing: 0, decisions: 0 };
    const dimCounts: Record<DimensionKey, number> = { scope: 0, processing: 0, decisions: 0 };

    for (const ans of answers) {
      const signal = COGNITIVE_SIGNAL_MAP[ans.questionId];
      const fallbackDim = fallbackDimensionForQuestionId(ans.questionId);
      if (!signal && !fallbackDim) continue;

      const dim = signal?.dim ?? fallbackDim!;
      const dir = signal?.dir ?? fallbackDirectionForDimension(dim, manualScores, existing);
      const sv = ans.scaleValue ?? 0; // 0–3
      dimSums[dim] += dir * sv;
      dimCounts[dim]++;
    }

    // Convert to suggested 1–5 scores (center=3, range driven by avg signal)
    const suggested: Partial<Record<DimensionKey, number>> = {};
    for (const dim of ['scope', 'processing', 'decisions'] as DimensionKey[]) {
      if (dimCounts[dim] === 0) continue;
      const avg = dimSums[dim] / (dimCounts[dim] * 3); // normalised to –1 … +1
      suggested[dim] = Math.min(5, Math.max(1, Math.round(3 + avg * 2)));
    }

    if (Object.keys(suggested).length === 0) return;

    const merged: Partial<Record<DimensionKey, number>> = {
      scope: existing.scope,
      processing: existing.processing,
      decisions: existing.decisions,
    };
    for (const dim of Object.keys(suggested) as DimensionKey[]) {
      if (manualScores[dim] !== undefined) {
        // Blend: manual stays dominant but nudges gradually
        merged[dim] = Math.round(manualScores[dim]! * 0.6 + suggested[dim]! * 0.4);
      } else {
        merged[dim] = suggested[dim];
      }
    }

    await EncryptedAsyncStorage.setItem('@mysky:cognitive_style', JSON.stringify({
      ...existing,
      ...merged,
      manualScores,
      reflectionScores: suggested,
    }));
  } catch {
    // Graceful fallback
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Core Values sync
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Maps ranges of values question IDs (by theme) to the value labels they
 * indicate. High agreement with a theme's questions auto-selects the
 * corresponding values in the Core Values screen.
 */
export const VALUES_THEME_MAP: { range: [number, number]; values: string[] }[] = [
  // Purpose & meaning → Purpose, Presence, Faith (spiritual/existential grounding)
  { range: [0, 29],   values: ['Purpose', 'Presence', 'Faith'] },
  // Priorities & trade-offs → Balance, Integrity, Excellence (deliberate living & standards), Simplicity (trade-offs often lead here)
  { range: [30, 59],  values: ['Balance', 'Integrity', 'Excellence', 'Simplicity'] },
  // Authenticity & self-expression → Honesty, Courage, Integrity, Expression, Humor (self-expression includes lightness)
  { range: [60, 89],  values: ['Honesty', 'Courage', 'Integrity', 'Expression', 'Humor'] },
  // Relationships & connection → Connection, Loyalty, Compassion, Belonging, Family
  { range: [90, 119], values: ['Connection', 'Loyalty', 'Compassion', 'Belonging', 'Family'] },
  // Growth & resilience → Growth, Courage, Mastery, Excellence
  { range: [120, 149], values: ['Growth', 'Courage', 'Mastery', 'Excellence'] },
  // Boundaries & energy → Autonomy, Balance, Health (protection of energy = health)
  { range: [150, 179], values: ['Autonomy', 'Balance', 'Health'] },
  // Creativity & expression → Creativity, Play, Curiosity, Expression, Humor, Nature (nature as inspiration)
  { range: [180, 209], values: ['Creativity', 'Play', 'Curiosity', 'Expression', 'Humor', 'Nature'] },
  // Justice & ethics → Integrity, Courage, Justice, Service, Leadership (ethical responsibility = leadership)
  { range: [210, 239], values: ['Integrity', 'Courage', 'Justice', 'Service', 'Leadership'] },
  // Freedom & independence → Freedom, Autonomy, Adventure, Nature (freedom in the natural world)
  { range: [240, 269], values: ['Freedom', 'Autonomy', 'Adventure', 'Nature'] },
  // Security & stability → Security, Stability, Abundance, Health (material safety = abundance + health)
  { range: [270, 299], values: ['Security', 'Stability', 'Abundance', 'Health'] },
  // Compassion & care → Compassion, Connection, Family, Service, Belonging
  { range: [300, 329], values: ['Compassion', 'Connection', 'Family', 'Service', 'Belonging'] },
  // Legacy & depth → Purpose, Presence, Wisdom, Mastery, Leadership, Faith, Excellence
  { range: [330, 364], values: ['Purpose', 'Presence', 'Wisdom', 'Mastery', 'Leadership', 'Faith', 'Excellence'] },
  // Nature (365–374)
  { range: [365, 374], values: ['Nature'] },
  // Family (375–384)
  { range: [375, 384], values: ['Family', 'Belonging'] },
  // Health (385–394)
  { range: [385, 394], values: ['Health', 'Balance'] },
  // Belonging (395–404)
  { range: [395, 404], values: ['Belonging', 'Connection'] },
  // Excellence (405–414)
  { range: [405, 414], values: ['Excellence', 'Mastery', 'Integrity'] },
  // Leadership (415–424)
  { range: [415, 424], values: ['Leadership', 'Service', 'Courage'] },
  // Simplicity (425–434)
  { range: [425, 434], values: ['Simplicity', 'Balance'] },
  // Humor (435–444)
  { range: [435, 444], values: ['Humor', 'Play'] },
  // Abundance (445–454)
  { range: [445, 454], values: ['Abundance', 'Security'] },
  // Faith (455–464)
  { range: [455, 464], values: ['Faith', 'Purpose'] },
];

/** Minimum average scaleValue (0–3) for a theme to auto-select its values. */
export const AGREEMENT_THRESHOLD = 2;

/**
 * Auto-selects Core Values that are strongly indicated by reflection answers.
 * Only adds values — never removes existing selections or touches the Top 5.
 * A value is added when the user's average agreement with questions in the
 * corresponding theme is ≥ 2 ("True" on the agreement scale).
 */
export async function syncCoreValuesFromReflections(
  options: ArchetypeSyncOptions = {},
): Promise<void> {
  try {
    const answers = await getCombinedReflectionAnswers('values', options.includeDrafts);
    if (answers.length === 0) return;

    // Collect values indicated by strong agreement with theme questions
    const indicatedValues = new Set<string>();
    for (const theme of VALUES_THEME_MAP) {
      const themeAnswers = answers.filter(
        a => a.questionId >= theme.range[0] && a.questionId <= theme.range[1],
      );
      if (themeAnswers.length === 0) continue;
      const avg = themeAnswers.reduce((s, a) => s + (a.scaleValue ?? 0), 0) / themeAnswers.length;
      if (avg >= AGREEMENT_THRESHOLD) {
        theme.values.forEach(v => indicatedValues.add(v));
      }
    }

    if (indicatedValues.size === 0) return;

    // Load existing selections
    const raw = await EncryptedAsyncStorage.getItem('@mysky:core_values');
    const existing: { selected: string[]; topFive: string[] } = raw
      ? JSON.parse(raw)
      : { selected: [], topFive: [] };

    const newSelected = [...existing.selected];
    let changed = false;
    for (const val of indicatedValues) {
      if (!newSelected.includes(val)) {
        newSelected.push(val);
        changed = true;
      }
    }

    if (!changed) return;

    await EncryptedAsyncStorage.setItem(
      '@mysky:core_values',
      JSON.stringify({ selected: newSelected, topFive: existing.topFive }),
    );
  } catch {
    // Graceful fallback
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Somatic cross-reference
// ─────────────────────────────────────────────────────────────────────────────

export interface SomaticCorrelation {
  category: 'values' | 'archetypes' | 'cognitive' | 'overall';
  topEmotion: string;
  count: number;
}

interface RawSomaticEntry {
  date: string; // ISO string
  emotion: string;
  intensity: number;
}

const SOMATIC_MIN_SUPPORT_DAYS = 2;
const SOMATIC_MIN_LIFT = 0.15;

function getOverallSomaticCorrelation(
  reflectionDates: string[],
  somaticByDate: Map<string, Set<string>>,
): SomaticCorrelation | null {
  const overallCounts = new Map<string, number>();

  for (const date of reflectionDates) {
    const sameDayEmotions = somaticByDate.get(date) ?? new Set<string>();
    for (const emotion of sameDayEmotions) {
      overallCounts.set(emotion, (overallCounts.get(emotion) ?? 0) + 1);
    }
  }

  const ranked = [...overallCounts.entries()]
    .filter(([, count]) => count >= SOMATIC_MIN_SUPPORT_DAYS)
    .sort((a, b) => b[1] - a[1]);

  if (ranked.length === 0) return null;

  const [topEmotion, count] = ranked[0];
  return { category: 'overall', topEmotion, count };
}

function normalizeEmotionLabel(emotion: string): string | null {
  const normalized = emotion.trim();
  return normalized.length > 0 ? normalized : null;
}

function getDominantEmotionLabelsByDate(entries: RawSomaticEntry[]): Map<string, Set<string>> {
  const dailyEmotionIntensity = new Map<string, Map<string, number>>();

  for (const entry of entries) {
    const emotion = normalizeEmotionLabel(entry.emotion);
    if (!emotion) continue;

    const day = entry.date.slice(0, 10);
    const dayEmotions = dailyEmotionIntensity.get(day) ?? new Map<string, number>();
    const nextIntensity = Math.max(dayEmotions.get(emotion) ?? 0, entry.intensity ?? 0);
    dayEmotions.set(emotion, nextIntensity);
    dailyEmotionIntensity.set(day, dayEmotions);
  }

  const dominantByDate = new Map<string, Set<string>>();
  for (const [day, emotions] of dailyEmotionIntensity.entries()) {
    let maxIntensity = -1;
    for (const intensity of emotions.values()) {
      if (intensity > maxIntensity) maxIntensity = intensity;
    }

    const dominant = new Set<string>();
    for (const [emotion, intensity] of emotions.entries()) {
      if (intensity === maxIntensity) dominant.add(emotion);
    }

    if (dominant.size > 0) {
      dominantByDate.set(day, dominant);
    }
  }

  return dominantByDate;
}

// ─────────────────────────────────────────────────────────────────────────────
// Intelligence Profile sync
// ─────────────────────────────────────────────────────────────────────────────

type IntelligenceDimension =
  | 'linguistic' | 'logical' | 'musical' | 'spatial'
  | 'kinesthetic' | 'interpersonal' | 'intrapersonal'
  | 'naturalistic' | 'existential';

const INTELLIGENCE_DIMENSIONS: IntelligenceDimension[] = [
  'linguistic', 'logical', 'musical', 'spatial', 'kinesthetic',
  'interpersonal', 'intrapersonal', 'naturalistic', 'existential',
];

/**
 * Maps intelligence question ID ranges to their dimension.
 * Each block of 40 questions (45 for existential) targets one intelligence.
 */
function intelligenceDimensionForQuestionId(id: number): IntelligenceDimension | null {
  if (id >= 0 && id <= 39) return 'linguistic';
  if (id >= 40 && id <= 79) return 'logical';
  if (id >= 80 && id <= 119) return 'musical';
  if (id >= 120 && id <= 159) return 'spatial';
  if (id >= 160 && id <= 199) return 'kinesthetic';
  if (id >= 200 && id <= 239) return 'interpersonal';
  if (id >= 240 && id <= 279) return 'intrapersonal';
  if (id >= 280 && id <= 319) return 'naturalistic';
  if (id >= 320 && id <= 364) return 'existential';
  return null;
}

interface IntelligenceProfile {
  [key: string]: unknown;
  manualScores?: Partial<Record<IntelligenceDimension, number>>;
  reflectionScores?: Partial<Record<IntelligenceDimension, number>>;
}

/**
 * Derives 1–5 scores for each intelligence dimension from all-time
 * intelligence reflection answers. Blends with manually-set scores
 * (manual 60%, reflection 40%) so user-set values stay sticky but
 * drift over time as daily reflections accumulate.
 *
 * Dimensions that have never been manually set are populated from reflection
 * data alone, letting users see a live profile even before completing the quiz.
 */
export async function syncIntelligenceFromReflections(
  options: ArchetypeSyncOptions = {},
): Promise<void> {
  try {
    const answers = await getCombinedReflectionAnswers('intelligence', options.includeDrafts);
    if (answers.length === 0) return;

    const raw = await EncryptedAsyncStorage.getItem('@mysky:intelligence_profile');
    const existing: IntelligenceProfile = raw ? JSON.parse(raw) : {};

    const manualScores: Partial<Record<IntelligenceDimension, number>> =
      existing.manualScores ?? {};

    // Accumulate average scaleValue per dimension
    const dimSums: Record<IntelligenceDimension, number> = {} as Record<IntelligenceDimension, number>;
    const dimCounts: Record<IntelligenceDimension, number> = {} as Record<IntelligenceDimension, number>;
    for (const dim of INTELLIGENCE_DIMENSIONS) {
      dimSums[dim] = 0;
      dimCounts[dim] = 0;
    }

    for (const ans of answers) {
      const dim = intelligenceDimensionForQuestionId(ans.questionId);
      if (!dim) continue;
      const sv = ans.scaleValue ?? 0; // 0–3
      dimSums[dim] += sv;
      dimCounts[dim]++;
    }

    // Convert to suggested 1–5 scores (avg 0–3 mapped to 1–5)
    const suggested: Partial<Record<IntelligenceDimension, number>> = {};
    for (const dim of INTELLIGENCE_DIMENSIONS) {
      if (dimCounts[dim] === 0) continue;
      const avg = dimSums[dim] / dimCounts[dim]; // 0–3
      suggested[dim] = Math.min(5, Math.max(1, Math.round(1 + (avg / 3) * 4)));
    }

    if (Object.keys(suggested).length === 0) return;

    const merged: Partial<Record<IntelligenceDimension, number>> = {};
    for (const dim of INTELLIGENCE_DIMENSIONS) {
      const existingScore = existing[dim] as number | undefined;
      if (suggested[dim] === undefined) {
        if (existingScore !== undefined) merged[dim] = existingScore;
        continue;
      }
      if (manualScores[dim] !== undefined) {
        merged[dim] = Math.round(manualScores[dim]! * 0.6 + suggested[dim]! * 0.4);
      } else {
        merged[dim] = suggested[dim];
      }
    }

    await EncryptedAsyncStorage.setItem('@mysky:intelligence_profile', JSON.stringify({
      ...existing,
      ...merged,
      manualScores,
      reflectionScores: suggested,
    }));
  } catch {
    // Graceful fallback
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Somatic cross-reference
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Finds body emotions that are specifically overrepresented on the days a user
 * sealed each reflection category, compared with reflection days overall.
 *
 * This uses day-level presence rather than raw entry counts so a single noisy
 * day cannot dominate the result, and it suppresses category rows when the
 * signal is too generic across all reflection activity.
 */
export async function getSomaticReflectionCorrelations(): Promise<SomaticCorrelation[]> {
  try {
    const [reflData, somaticEntries] = await Promise.all([
      loadReflections(),
      loadSomaticEntries(),
    ]);
    const answers = (reflData as { answers?: Array<{ category: string; date: string; scaleValue?: number }> }).answers ?? [];

    // Index the dominant somatic emotions by calendar date (YYYY-MM-DD)
    const somaticByDate = getDominantEmotionLabelsByDate(somaticEntries);

    const CATEGORIES = ['values', 'archetypes', 'cognitive'] as const;
    const results: SomaticCorrelation[] = [];
    const reflectionDates = [...new Set(answers.map((a) => a.date))];

    if (reflectionDates.length === 0) return [];

    const baselineEmotionDays = new Map<string, number>();
    for (const date of reflectionDates) {
      const sameDayEmotions = somaticByDate.get(date) ?? new Set<string>();
      for (const emotion of sameDayEmotions) {
        baselineEmotionDays.set(emotion, (baselineEmotionDays.get(emotion) ?? 0) + 1);
      }
    }

    for (const cat of CATEGORIES) {
      // Unique sealed dates for this category
      const catDates = [...new Set(
        answers
          .filter((a) => a.category === cat)
          .map((a) => a.date),
      )];

      if (catDates.length < SOMATIC_MIN_SUPPORT_DAYS) continue;

      const emotionCount = new Map<string, number>();
      for (const date of catDates) {
        const sameDayEmotions = somaticByDate.get(date) ?? new Set<string>();
        for (const emotion of sameDayEmotions) {
          emotionCount.set(emotion, (emotionCount.get(emotion) ?? 0) + 1);
        }
      }

      if (emotionCount.size === 0) continue;

      const ranked = [...emotionCount.entries()]
        .map(([emotion, count]) => {
          const categoryRate = count / catDates.length;
          const baselineRate = (baselineEmotionDays.get(emotion) ?? 0) / reflectionDates.length;
          return {
            emotion,
            count,
            lift: categoryRate - baselineRate,
            categoryRate,
          };
        })
        .filter(({ count, lift }) => count >= SOMATIC_MIN_SUPPORT_DAYS && lift >= SOMATIC_MIN_LIFT)
        .sort((a, b) => {
          if (b.lift !== a.lift) return b.lift - a.lift;
          if (b.count !== a.count) return b.count - a.count;
          return b.categoryRate - a.categoryRate;
        });

      if (ranked.length === 0) continue;

      const { emotion: topEmotion, count } = ranked[0];

      results.push({ category: cat, topEmotion, count });
    }

    if (results.length > 0) return results;

    const overall = getOverallSomaticCorrelation(reflectionDates, somaticByDate);
    return overall ? [overall] : [];
  } catch {
    return [];
  }
}
