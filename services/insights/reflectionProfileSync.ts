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
import { getAnswersByCategory } from './dailyReflectionService';

// ─────────────────────────────────────────────────────────────────────────────
// Archetypes sync
// ─────────────────────────────────────────────────────────────────────────────

type ArchetypeKey = 'hero' | 'caregiver' | 'seeker' | 'sage' | 'rebel';

/**
 * Maps archetype question IDs to their archetype.
 * Questions beyond id 149 cover shadow/integration themes and don't map to a
 * single archetype, so they are ignored for scoring purposes.
 */
function archetypeForQuestionId(id: number): ArchetypeKey | null {
  if (id >= 0 && id <= 29) return 'hero';
  if (id >= 30 && id <= 59) return 'caregiver';
  if (id >= 60 && id <= 89) return 'seeker';
  if (id >= 90 && id <= 119) return 'sage';
  if (id >= 120 && id <= 149) return 'rebel';
  return null;
}

/**
 * Recomputes the dominant archetype from all-time reflection answers and
 * saves the result back to the archetype profile store.
 *
 * If the user has also completed the quiz, quiz votes are weighted 2× over
 * reflection scaleValues so explicit quiz answers remain the primary signal.
 * If no quiz has been taken, reflection data alone drives the dominant.
 */
export async function syncArchetypeProfileFromReflections(): Promise<void> {
  try {
    const answers = await getAnswersByCategory('archetypes');
    if (answers.length === 0) return;

    // Accumulate reflection scores per archetype
    const sumByArchetype: Record<ArchetypeKey, number> = {
      hero: 0, caregiver: 0, seeker: 0, sage: 0, rebel: 0,
    };
    const countByArchetype: Record<ArchetypeKey, number> = {
      hero: 0, caregiver: 0, seeker: 0, sage: 0, rebel: 0,
    };

    for (const ans of answers) {
      const archetype = archetypeForQuestionId(ans.questionId);
      if (!archetype) continue;
      sumByArchetype[archetype] += ans.scaleValue ?? 0;
      countByArchetype[archetype]++;
    }

    // Normalize each archetype to 0–1 based on average agreement
    const reflectionNorm: Record<ArchetypeKey, number> = {
      hero: 0, caregiver: 0, seeker: 0, sage: 0, rebel: 0,
    };
    for (const key of Object.keys(reflectionNorm) as ArchetypeKey[]) {
      const count = countByArchetype[key];
      if (count > 0) {
        reflectionNorm[key] = sumByArchetype[key] / (count * 3); // scaleValue max is 3
      }
    }

    // Load existing profile
    const raw = await EncryptedAsyncStorage.getItem('@mysky:archetype_profile');
    const existing = raw ? JSON.parse(raw) : null;

    // Load quiz scores if the user has completed the quiz
    const quizScores: Record<ArchetypeKey, number> = existing?.scores ?? {
      hero: 0, caregiver: 0, seeker: 0, sage: 0, rebel: 0,
    };
    const totalQuizVotes = Object.values(quizScores).reduce((a, b) => a + b, 0);

    // Combine: quiz get 2× weight vs reflection
    const combined: Record<ArchetypeKey, number> = {
      hero: 0, caregiver: 0, seeker: 0, sage: 0, rebel: 0,
    };
    for (const key of Object.keys(combined) as ArchetypeKey[]) {
      const quizNorm = totalQuizVotes > 0 ? quizScores[key] / totalQuizVotes : 0;
      combined[key] = totalQuizVotes > 0
        ? quizNorm * 2 + reflectionNorm[key] * 1
        : reflectionNorm[key];
    }

    const dominant = (Object.entries(combined) as [ArchetypeKey, number][])
      .reduce<[ArchetypeKey, number]>(
        (best, curr) => curr[1] > best[1] ? curr : best,
        ['hero', -1],
      )[0];

    // When the user has never taken the quiz, populate scores from reflection norms
    // scaled to the 0–5 quiz range so the bar chart is meaningful.
    const displayScores: Record<ArchetypeKey, number> = totalQuizVotes > 0
      ? quizScores
      : (Object.keys(reflectionNorm) as ArchetypeKey[]).reduce((acc, key) => {
          acc[key] = Math.round(reflectionNorm[key] * 5);
          return acc;
        }, { hero: 0, caregiver: 0, seeker: 0, sage: 0, rebel: 0 });

    const updated = {
      ...(existing ?? {}),
      dominant,
      scores: displayScores,
      reflectionScores: sumByArchetype,
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
export async function syncCognitiveStyleFromReflections(): Promise<void> {
  try {
    const answers = await getAnswersByCategory('cognitive');
    if (answers.length === 0) return;

    // Accumulate directional signal per dimension
    const dimSums: Record<DimensionKey, number> = { scope: 0, processing: 0, decisions: 0 };
    const dimCounts: Record<DimensionKey, number> = { scope: 0, processing: 0, decisions: 0 };

    for (const ans of answers) {
      const signal = COGNITIVE_SIGNAL_MAP[ans.questionId];
      if (!signal) continue;
      const sv = ans.scaleValue ?? 0; // 0–3
      dimSums[signal.dim] += signal.dir * sv;
      dimCounts[signal.dim]++;
    }

    // Convert to suggested 1–5 scores (center=3, range driven by avg signal)
    const suggested: Partial<Record<DimensionKey, number>> = {};
    for (const dim of ['scope', 'processing', 'decisions'] as DimensionKey[]) {
      if (dimCounts[dim] === 0) continue;
      const avg = dimSums[dim] / (dimCounts[dim] * 3); // normalised to –1 … +1
      suggested[dim] = Math.min(5, Math.max(1, Math.round(3 + avg * 2)));
    }

    if (Object.keys(suggested).length === 0) return;

    // Load existing manual scores
    const raw = await EncryptedAsyncStorage.getItem('@mysky:cognitive_style');
    const existing: Partial<Record<DimensionKey, number>> = raw ? JSON.parse(raw) : {};

    const merged: Partial<Record<DimensionKey, number>> = { ...existing };
    for (const dim of Object.keys(suggested) as DimensionKey[]) {
      if (existing[dim] !== undefined) {
        // Blend: manual stays dominant but nudges gradually
        merged[dim] = Math.round(existing[dim]! * 0.6 + suggested[dim]! * 0.4);
      } else {
        merged[dim] = suggested[dim];
      }
    }

    await EncryptedAsyncStorage.setItem('@mysky:cognitive_style', JSON.stringify(merged));
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
export async function syncCoreValuesFromReflections(): Promise<void> {
  try {
    const answers = await getAnswersByCategory('values');
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
  category: 'values' | 'archetypes' | 'cognitive';
  topEmotion: string;
  count: number;
}

interface RawSomaticEntry {
  date: string; // ISO string
  emotion: string;
  intensity: number;
}

/**
 * Finds which body emotions most frequently appear on the same calendar days
 * that a user sealed each reflection category. Returns one correlation per
 * category, only when there is at least two co-occurring somatic entries.
 */
export async function getSomaticReflectionCorrelations(): Promise<SomaticCorrelation[]> {
  try {
    const [reflRaw, somaticRaw] = await Promise.all([
      EncryptedAsyncStorage.getItem('@mysky:daily_reflections'),
      EncryptedAsyncStorage.getItem('@mysky:somatic_entries'),
    ]);
    if (!reflRaw || !somaticRaw) return [];

    const reflData = JSON.parse(reflRaw) as { answers?: RawSomaticEntry[] };
    const answers = (reflData as { answers?: Array<{ category: string; date: string; scaleValue?: number }> }).answers ?? [];
    const somaticEntries: RawSomaticEntry[] = JSON.parse(somaticRaw);

    // Index somatic entries by calendar date (YYYY-MM-DD)
    const somaticByDate = new Map<string, RawSomaticEntry[]>();
    for (const e of somaticEntries) {
      const day = e.date.slice(0, 10);
      const list = somaticByDate.get(day) ?? [];
      list.push(e);
      somaticByDate.set(day, list);
    }

    const CATEGORIES = ['values', 'archetypes', 'cognitive'] as const;
    const results: SomaticCorrelation[] = [];

    for (const cat of CATEGORIES) {
      // Unique sealed dates for this category
      const catDates = [...new Set(
        answers
          .filter((a) => a.category === cat)
          .map((a) => a.date),
      )];

      const emotionCount = new Map<string, number>();
      for (const date of catDates) {
        const same = somaticByDate.get(date) ?? [];
        for (const entry of same) {
          emotionCount.set(entry.emotion, (emotionCount.get(entry.emotion) ?? 0) + 1);
        }
      }

      if (emotionCount.size === 0) continue;

      const [topEmotion, count] = [...emotionCount.entries()].sort((a, b) => b[1] - a[1])[0];
      if (count < 2) continue;

      results.push({ category: cat, topEmotion, count });
    }

    return results;
  } catch {
    return [];
  }
}
