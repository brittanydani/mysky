/**
 * Pattern Insight Engine — Orchestrator
 *
 * The three-layer system:
 *   Layer 1: Normalize inputs → DailySignalRecord[]
 *   Layer 2: Detect patterns → PatternCandidate[] (scored)
 *   Layer 3: Generate insights → PatternInsight[]
 *
 * Entry point: runPatternInsightEngine(input)
 *
 * Data sources consumed:
 *   - DailyCheckIn[]         (mood, energy, stress, tags, astro context)
 *   - JournalEntry[]         (NLP keywords, sentiment from encrypted summaries)
 *   - SleepEntry[]           (hours, quality, dream text / metadata)
 *
 * Pure computation — no I/O. Caller loads data, this engine processes it.
 */

import type { DailyCheckIn } from '../patterns/types';
import type { JournalEntry, SleepEntry } from '../storage/models';
import { normalizeKeywords, normalizePeople, normalizeTags, extractDreamKeywords } from './themeNormalization';
import { generateAllCandidates } from './patternCandidates';
import { scoreAllCandidates, filterByThreshold, selectDiverseInsights, type InsightTier } from './patternScoring';
import { candidatesToInsights } from './insightTemplates';
import type { PatternCandidate } from './patternCandidates';
import type { PatternInsight } from './insightTemplates';

// ─────────────────────────────────────────────────────────────────────────────
// Layer 1 types — DailySignalRecord
// ─────────────────────────────────────────────────────────────────────────────

export interface DailySignalRecord {
  dayKey: string; // YYYY-MM-DD

  mood?: number;        // 1–9
  energy?: number;      // 1–9
  stress?: number;      // 1–9

  sleepHours?: number;
  sleepQuality?: number; // 1–5 stored as 1–9 scaled
  dreamRating?: number;  // 1–5 stored as 1–9 scaled

  tags: string[];            // normalized tag keys
  journalKeywords: string[]; // normalized theme concepts
  dreamKeywords: string[];   // normalized dream symbols
  people: string[];          // normalized person tokens

  journalSentiment?: number;  // -1 to 1
  dreamSentiment?: number;

  hasJournal: boolean;
  hasDream: boolean;

  // Derived booleans (computed from raw values)
  isLowMood: boolean;
  isHighMood: boolean;
  isLowSleep: boolean;
  isHighEnergyLowMood: boolean;
  isMoodToneMismatch: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Engine input / output
// ─────────────────────────────────────────────────────────────────────────────

export interface PatternEngineInput {
  checkIns: DailyCheckIn[];
  journalEntries: JournalEntry[];
  sleepEntries: SleepEntry[];
}

export interface PatternEngineResult {
  /** Final ranked insights, ready for display */
  insights: PatternInsight[];
  /** All scored candidates (for debugging / advanced views) */
  allCandidates: PatternCandidate[];
  /** Normalized daily records built from raw data */
  records: DailySignalRecord[];
  /** Metadata */
  generatedAt: string;
  totalRecords: number;
  totalCandidatesGenerated: number;
  totalCandidatesAboveThreshold: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Convert EnergyLevel enum to 1–9 numeric */
function energyToNum(e: string): number {
  if (e === 'high') return 9;
  if (e === 'low') return 2;
  return 5; // medium
}

/** Convert StressLevel enum to 1–9 numeric */
function stressToNum(s: string): number {
  if (s === 'high') return 9;
  if (s === 'low') return 2;
  return 5; // medium
}

/** Scale a 1–5 quality rating to 1–9 */
function qualityToNine(q: number): number {
  return Math.round(1 + (q - 1) * 2);
}

/**
 * Parse NLP keywords from an encrypted JSON string (already decrypted by DB layer).
 * Returns [] on any parse failure.
 */
function parseKeywordsField(field: string | undefined): string[] {
  if (!field) return [];
  try {
    const parsed = JSON.parse(field) as { keywords?: string[] };
    return parsed.keywords ?? [];
  } catch {
    return [];
  }
}

/**
 * Parse sentiment from an encrypted JSON string.
 * Returns null on any parse failure.
 */
function parseSentimentField(field: string | undefined): number | null {
  if (!field) return null;
  try {
    const parsed = JSON.parse(field) as { sentiment?: number };
    return typeof parsed.sentiment === 'number' ? parsed.sentiment : null;
  } catch {
    return null;
  }
}

/**
 * Simple name extractor from journal text.
 * Looks for capitalized words (2+ chars) that are not at sentence start.
 * Very conservative — avoids false positives.
 */
function extractPeopleFromText(text: string): string[] {
  if (!text || text.length === 0) return [];
  // Match capitalized words not at the start of a sentence
  const candidates = text.match(/(?<![.!?]\s)(?<!\n)\b([A-Z][a-z]{2,})\b/g) ?? [];
  // Filter out common non-name capitalized words
  const NON_NAMES = new Set([
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
    'January', 'February', 'March', 'April', 'June', 'July', 'August',
    'September', 'October', 'November', 'December',
    'The', 'This', 'That', 'But', 'And', 'For', 'With', 'From',
    'Today', 'Yesterday', 'Tomorrow', 'Just', 'Really', 'Very',
  ]);
  return candidates.filter(w => !NON_NAMES.has(w)).slice(0, 5);
}

// ─────────────────────────────────────────────────────────────────────────────
// Layer 1: Build DailySignalRecord[]
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Merge check-ins, journal entries, and sleep entries into one normalized
 * DailySignalRecord per calendar day.
 *
 * Multiple check-ins on the same day are averaged.
 * Journal NLP summaries are unioned across entries for the same day.
 * Sleep is matched to its day key.
 */
export function buildDailySignalRecords(input: PatternEngineInput): DailySignalRecord[] {
  const { checkIns, journalEntries, sleepEntries } = input;

  // ── Index check-ins by dayKey ─────────────────────────────────────────────
  const checkInsByDay = new Map<string, DailyCheckIn[]>();
  for (const ci of checkIns) {
    if (!checkInsByDay.has(ci.date)) checkInsByDay.set(ci.date, []);
    checkInsByDay.get(ci.date)!.push(ci);
  }

  // ── Index journal entries by date ─────────────────────────────────────────
  const journalByDay = new Map<string, JournalEntry[]>();
  for (const je of journalEntries) {
    if (!journalByDay.has(je.date)) journalByDay.set(je.date, []);
    journalByDay.get(je.date)!.push(je);
  }

  // ── Index sleep entries by date ───────────────────────────────────────────
  const sleepByDay = new Map<string, SleepEntry[]>();
  for (const se of sleepEntries) {
    if (!sleepByDay.has(se.date)) sleepByDay.set(se.date, []);
    sleepByDay.get(se.date)!.push(se);
  }

  // ── Collect all day keys ──────────────────────────────────────────────────
  const allDayKeys = new Set([
    ...checkInsByDay.keys(),
    ...journalByDay.keys(),
    ...sleepByDay.keys(),
  ]);

  const records: DailySignalRecord[] = [];

  for (const dayKey of allDayKeys) {
    const dayCIs = checkInsByDay.get(dayKey) ?? [];
    const dayJournals = journalByDay.get(dayKey) ?? [];
    const daySleep = sleepByDay.get(dayKey) ?? [];

    // Skip days with no check-ins (can't form a meaningful mood record)
    if (dayCIs.length === 0 && dayJournals.length === 0) continue;

    // ── Mood / energy / stress (average across check-ins) ────────────────────
    let moodAvg: number | undefined;
    let energyAvg: number | undefined;
    let stressAvg: number | undefined;

    if (dayCIs.length > 0) {
      const moods = dayCIs.map(c => c.moodScore);
      const energies = dayCIs.map(c => energyToNum(c.energyLevel));
      const stresses = dayCIs.map(c => stressToNum(c.stressLevel));
      moodAvg = moods.reduce((s, v) => s + v, 0) / moods.length;
      energyAvg = energies.reduce((s, v) => s + v, 0) / energies.length;
      stressAvg = stresses.reduce((s, v) => s + v, 0) / stresses.length;
    }

    // ── Tags (union, normalized) ──────────────────────────────────────────────
    const tagSet = new Set<string>();
    for (const ci of dayCIs) {
      for (const t of normalizeTags(ci.tags)) tagSet.add(t);
    }

    // ── Journal NLP (union of keywords, average sentiment) ──────────────────
    const keywordSet = new Set<string>();
    const sentiments: number[] = [];
    const journalPeople: string[] = [];

    for (const je of dayJournals) {
      // Parse and normalize NLP keyword summaries (stored encrypted, decrypted by DB)
      const rawKeywords = parseKeywordsField(je.contentKeywords);
      for (const kw of normalizeKeywords(rawKeywords)) keywordSet.add(kw);

      // Parse sentiment
      const sent = parseSentimentField(je.contentSentiment);
      if (sent !== null) sentiments.push(sent);

      // Extract people from journal content (if decrypted — not prefixed with ENC)
      if (je.content && !je.content.startsWith('ENC')) {
        const extracted = extractPeopleFromText(je.content);
        journalPeople.push(...normalizePeople(extracted));
      }
    }

    const journalSentiment = sentiments.length > 0
      ? sentiments.reduce((s, v) => s + v, 0) / sentiments.length
      : undefined;

    // ── Sleep ────────────────────────────────────────────────────────────────
    // Use most recent sleep entry for the night
    const sleepEntry = daySleep.length > 0
      ? daySleep.sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
      : null;

    let sleepHours: number | undefined;
    let sleepQuality: number | undefined;
    let dreamKeywordsArr: string[] = [];
    let hasDream = false;

    if (sleepEntry) {
      sleepHours = sleepEntry.durationHours;
      sleepQuality = sleepEntry.quality !== undefined
        ? qualityToNine(sleepEntry.quality)
        : undefined;

      // Dream content
      const dreamText = sleepEntry.dreamText ?? '';
      if (dreamText.length > 0 && !dreamText.startsWith('ENC')) {
        hasDream = true;
        dreamKeywordsArr = extractDreamKeywords(dreamText);
      }

      // dreamMetadata overallTheme (decrypted JSON)
      if (sleepEntry.dreamMetadata && !sleepEntry.dreamMetadata.startsWith('ENC')) {
        try {
          const meta = JSON.parse(sleepEntry.dreamMetadata) as { overallTheme?: string };
          if (meta.overallTheme) {
            hasDream = true;
            // Treat overall theme as an additional dream keyword
            const normalized = meta.overallTheme.toLowerCase().trim();
            if (!dreamKeywordsArr.includes(normalized)) dreamKeywordsArr.push(normalized);
          }
        } catch { /* ignore */ }
      }

      // dreamFeelings as extra mood signal for hasDream
      if (sleepEntry.dreamFeelings && !sleepEntry.dreamFeelings.startsWith('ENC')) {
        hasDream = true;
      }
    }

    // ── People: normalize (dedup) ─────────────────────────────────────────────
    const peopleSet = new Set<string>(normalizePeople(journalPeople));
    const people = [...peopleSet];

    // ── Derived booleans ──────────────────────────────────────────────────────
    const isLowMood = moodAvg !== undefined && moodAvg < 4;
    const isHighMood = moodAvg !== undefined && moodAvg > 7;
    const isLowSleep = sleepHours !== undefined && sleepHours < 6;
    const isHighEnergyLowMood =
      energyAvg !== undefined && moodAvg !== undefined &&
      energyAvg >= 7 && moodAvg <= 4;
    const isMoodToneMismatch =
      moodAvg !== undefined && journalSentiment !== undefined &&
      moodAvg >= 7 && journalSentiment <= -0.25;

    records.push({
      dayKey,
      mood: moodAvg !== undefined ? parseFloat(moodAvg.toFixed(2)) : undefined,
      energy: energyAvg !== undefined ? parseFloat(energyAvg.toFixed(2)) : undefined,
      stress: stressAvg !== undefined ? parseFloat(stressAvg.toFixed(2)) : undefined,
      sleepHours,
      sleepQuality,
      tags: [...tagSet],
      journalKeywords: [...keywordSet],
      dreamKeywords: dreamKeywordsArr,
      people,
      journalSentiment,
      hasJournal: dayJournals.length > 0,
      hasDream,
      isLowMood,
      isHighMood,
      isLowSleep,
      isHighEnergyLowMood,
      isMoodToneMismatch,
    });
  }

  // Sort ascending by dayKey
  return records.sort((a, b) => a.dayKey.localeCompare(b.dayKey));
}

// ─────────────────────────────────────────────────────────────────────────────
// Novelty / deduplication guard
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Suppress insights whose IDs appeared in a previous run,
 * unless the new finalScore is meaningfully higher (>0.08 improvement).
 */
export function applyNoveltyFilter(
  insights: PatternInsight[],
  previouslyShownIds: Set<string>,
  previousScores: Map<string, number>,
): PatternInsight[] {
  return insights.filter(ins => {
    if (!previouslyShownIds.has(ins.id)) return true;
    const prevScore = previousScores.get(ins.id) ?? 0;
    return ins.finalScore - prevScore > 0.08;
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Main entry point
// ─────────────────────────────────────────────────────────────────────────────

export interface RunPatternEngineOptions {
  /** Minimum tier to include in results. Defaults to 'emerging' (0.50). */
  minTier?: InsightTier;
  /** Max number of insights to return. Defaults to 5. */
  maxInsights?: number;
  /** IDs shown in the last run (for novelty suppression). */
  previouslyShownIds?: Set<string>;
  /** Scores from last run (for novelty suppression). */
  previousScores?: Map<string, number>;
}

/**
 * Run the full Pattern Insight Engine pipeline.
 *
 * Stage 1: Build normalized DailySignalRecords
 * Stage 2: Generate all pattern candidates across windows
 * Stage 3: Score each candidate (5 dimensions)
 * Stage 4: Filter by threshold, select diverse top-N
 * Stage 5: Convert to PatternInsight text
 */
export function runPatternInsightEngine(
  input: PatternEngineInput,
  opts: RunPatternEngineOptions = {},
): PatternEngineResult {
  const {
    minTier = 'emerging',
    maxInsights = 5,
    previouslyShownIds = new Set(),
    previousScores = new Map(),
  } = opts;

  // Stage 1: Normalize
  const records = buildDailySignalRecords(input);

  // Stage 2: Generate candidates
  const rawCandidates = generateAllCandidates(records);

  // Stage 3: Score
  const scoredCandidates = scoreAllCandidates(rawCandidates);

  // Stage 4: Filter + diversify
  const aboveThreshold = filterByThreshold(scoredCandidates, minTier);
  const selected = selectDiverseInsights(aboveThreshold, maxInsights);

  // Stage 5: Convert to insights
  let insights = candidatesToInsights(selected);

  // Apply novelty filter if caller provides previous state
  if (previouslyShownIds.size > 0) {
    insights = applyNoveltyFilter(insights, previouslyShownIds, previousScores);
  }

  return {
    insights,
    allCandidates: scoredCandidates,
    records,
    generatedAt: new Date().toISOString(),
    totalRecords: records.length,
    totalCandidatesGenerated: rawCandidates.length,
    totalCandidatesAboveThreshold: aboveThreshold.length,
  };
}
