/**
 * Self-Knowledge Context Loader
 *
 * Reads all six self-knowledge AsyncStorage stores and returns a unified,
 * typed context object. Used by the cross-reference engine and daily loop
 * to personalise insights with the user's own profile data.
 *
 * All reads are fire-and-forget-safe: any parse error or missing key
 * returns null/[] rather than throwing.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { EncryptedAsyncStorage } from '../storage/encryptedAsyncStorage';
import {
  getReflectionSummary,
  ReflectionAnswer,
} from './dailyReflectionService';

// ─────────────────────────────────────────────────────────────────────────────
// Types  (mirror the interfaces defined in each screen — kept here as the
//         single source of truth for downstream consumers)
// ─────────────────────────────────────────────────────────────────────────────

export type ArchetypeKey = 'hero' | 'caregiver' | 'seeker' | 'sage' | 'rebel';

export interface CoreValuesData {
  selected: string[];
  topFive: string[];
}

export interface ArchetypeProfile {
  dominant: ArchetypeKey;
  /** Raw vote counts per archetype (5 prompts total) */
  scores: Record<ArchetypeKey, number>;
  completedAt: string;
}

export interface CognitiveScores {
  /** 1 = Big Picture ··· 5 = Detail First */
  scope: number;
  /** 1 = Visual / Spatial ··· 5 = Verbal / Analytical */
  processing: number;
  /** 1 = Quick / Intuitive ··· 5 = Careful / Deliberate */
  decisions: number;
}

export type IntelligenceDimensionId =
  | 'linguistic' | 'logical' | 'musical' | 'spatial' | 'kinesthetic'
  | 'interpersonal' | 'intrapersonal' | 'naturalistic' | 'existential';

export interface IntelligenceProfile {
  /** 1–5 score per dimension */
  [key: string]: unknown;
  linguistic?: number;
  logical?: number;
  musical?: number;
  spatial?: number;
  kinesthetic?: number;
  interpersonal?: number;
  intrapersonal?: number;
  naturalistic?: number;
  existential?: number;
}

export interface SomaticEntry {
  id: string;
  date: string; // ISO string from new Date().toISOString()
  region: string;
  emotion: string;
  sensation?: string;
  intensity: number; // 1–5
  note?: string;
}

export interface TriggerData {
  drains: string[];
  restores: string[];
}

export interface RelationshipPatternEntry {
  id: string;
  date: string;
  note: string;
  tags: string[];
}

export interface DailyReflectionSummary {
  totalAnswers: number;
  totalDays: number;
  streak: number;
  byCategory: Record<string, number>;
  recentAnswers: ReflectionAnswer[];
  /** All unique YYYY-MM-DD dates the user has sealed reflections */
  reflectionDates: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// SQLite-derived summaries (optional — populated by enrichSelfKnowledgeContext)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Lightweight summary of journal entry history.
 * Derived from SQLite journal_entries so screens that already load those
 * can call enrichSelfKnowledgeContext() without a second DB round-trip.
 */
export interface JournalSummary {
  totalEntries: number;
  /** YYYY-MM-DD dates where mood was 'heavy' or 'stormy' */
  heavyDays: string[];
  /** All journal entry dates (YYYY-MM-DD) */
  allDates: string[];
}

/**
 * Lightweight summary of sleep/dream history.
 * dreamFeelingIds are the raw feeling ID strings from dreamFeelings JSON.
 * dreamThemes are DreamTheme values from dreamMetadata JSON.
 */
export interface DreamSummary {
  totalWithDreams: number;
  /** Top feeling IDs by frequency (e.g. 'anxious', 'chased', 'betrayed') */
  topFeelingIds: string[];
  /** Dream themes appearing 2+ times (e.g. 'conflict', 'transformation') */
  topThemes: string[];
  /** Average sleep quality 1–5, null if fewer than 3 entries with quality */
  avgQuality: number | null;
  /** All sleep entry dates (YYYY-MM-DD) */
  allDates: string[];
}

export interface SelfKnowledgeContext {
  coreValues: CoreValuesData | null;
  archetypeProfile: ArchetypeProfile | null;
  cognitiveStyle: CognitiveScores | null;
  somaticEntries: SomaticEntry[];
  triggers: TriggerData | null;
  relationshipPatterns: RelationshipPatternEntry[];
  dailyReflections: DailyReflectionSummary | null;
  intelligenceProfile: IntelligenceProfile | null;
  /** Set by enrichSelfKnowledgeContext() after SQLite data is loaded */
  journalSummary?: JournalSummary | null;
  /** Set by enrichSelfKnowledgeContext() after SQLite data is loaded */
  dreamSummary?: DreamSummary | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Storage keys  (must match the keys used in each screen)
// ─────────────────────────────────────────────────────────────────────────────

const STORAGE_KEYS = {
  coreValues:           '@mysky:core_values',
  archetypeProfile:     '@mysky:archetype_profile',
  cognitiveStyle:       '@mysky:cognitive_style',
  intelligenceProfile:  '@mysky:intelligence_profile',
  somaticEntries:       '@mysky:somatic_entries',
  triggerEvents:        '@mysky:trigger_events',
  relationshipPatterns: '@mysky:relationship_patterns',
} as const;

// Raw shape written by trigger-log.tsx
interface TriggerEvent {
  id: string;
  timestamp: number;
  mode: 'drain' | 'nourish';
  event: string;
  nsState: string;
  sensations: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

async function readJson<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

/** Like readJson but reads from encrypted storage (for sensitive personal data). */
async function readEncryptedJson<T>(key: string): Promise<T | null> {
  try {
    const raw = await EncryptedAsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

/**
 * Reads TriggerEvent[] saved by the Trigger Log screen and converts it to
 * the TriggerData shape (drains / restores string arrays) expected by the
 * insights engine.  Deduplicates event descriptions so each unique label
 * appears only once.
 */
async function loadTriggerData(): Promise<TriggerData | null> {
  const events = await readEncryptedJson<TriggerEvent[]>(STORAGE_KEYS.triggerEvents);
  if (!events || !Array.isArray(events) || events.length === 0) return null;

  const drains = [
    ...new Set(
      events
        .filter(e => e.mode === 'drain' && typeof e.event === 'string' && e.event.trim())
        .map(e => e.event.trim()),
    ),
  ];
  const restores = [
    ...new Set(
      events
        .filter(e => e.mode === 'nourish' && typeof e.event === 'string' && e.event.trim())
        .map(e => e.event.trim()),
    ),
  ];

  if (!drains.length && !restores.length) return null;
  return { drains, restores };
}

// ─────────────────────────────────────────────────────────────────────────────
// Public loader
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Load all self-knowledge profile data in parallel.
 * Safe to call on every screen focus — reads are O(1) from local storage.
 */
export async function loadSelfKnowledgeContext(): Promise<SelfKnowledgeContext> {
  const [
    coreValues,
    archetypeProfile,
    cognitiveStyle,
    intelligenceProfile,
    somaticEntries,
    triggers,
    relationshipPatterns,
    reflectionSummary,
  ] = await Promise.all([
    readEncryptedJson<CoreValuesData>(STORAGE_KEYS.coreValues),
    readEncryptedJson<ArchetypeProfile>(STORAGE_KEYS.archetypeProfile),
    readEncryptedJson<CognitiveScores>(STORAGE_KEYS.cognitiveStyle),
    readEncryptedJson<IntelligenceProfile>(STORAGE_KEYS.intelligenceProfile),
    readEncryptedJson<SomaticEntry[]>(STORAGE_KEYS.somaticEntries),
    loadTriggerData(),
    readEncryptedJson<RelationshipPatternEntry[]>(STORAGE_KEYS.relationshipPatterns),
    getReflectionSummary().catch(() => null),
  ]);

  return {
    coreValues,
    archetypeProfile,
    cognitiveStyle,
    intelligenceProfile,
    somaticEntries: somaticEntries ?? [],
    triggers,
    relationshipPatterns: relationshipPatterns ?? [],
    dailyReflections: reflectionSummary,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// SQLite enrichment (call after loading journal + sleep entries from localDb)
// ─────────────────────────────────────────────────────────────────────────────

interface RawJournalEntry {
  date: string;          // YYYY-MM-DD
  mood?: string;         // 'calm' | 'soft' | 'okay' | 'heavy' | 'stormy'
  isDeleted?: boolean;
}

interface RawSleepEntry {
  date: string;          // YYYY-MM-DD
  quality?: number;      // 1–5
  dreamFeelings?: string; // JSON array of { id: string } or string[]
  dreamMetadata?: string; // JSON { theme?: DreamTheme, ... }
  isDeleted?: boolean;
}

/**
 * Derives JournalSummary and DreamSummary from pre-loaded SQLite rows and
 * merges them into the context. Safe to call with empty arrays.
 *
 * Use this in screens that already load journal/sleep entries to avoid a
 * second DB round-trip.
 */
export function enrichSelfKnowledgeContext(
  ctx: SelfKnowledgeContext,
  journalEntries: RawJournalEntry[],
  sleepEntries: RawSleepEntry[],
): SelfKnowledgeContext {
  // ── Journal summary ──────────────────────────────────────────────────────
  const liveJournal = journalEntries.filter(e => !e.isDeleted);
  const HEAVY_MOODS = new Set(['heavy', 'stormy']);
  const heavyDays = [
    ...new Set(
      liveJournal
        .filter(e => e.mood && HEAVY_MOODS.has(e.mood))
        .map(e => e.date.slice(0, 10)),
    ),
  ];

  const journalSummary: JournalSummary = {
    totalEntries: liveJournal.length,
    heavyDays,
    allDates: [...new Set(liveJournal.map(e => e.date.slice(0, 10)))],
  };

  // ── Dream summary ────────────────────────────────────────────────────────
  const liveSleep = sleepEntries.filter(e => !e.isDeleted);
  const withDreams = liveSleep.filter(e => e.dreamFeelings || e.dreamMetadata);

  // Count feeling IDs
  const feelingCount: Record<string, number> = {};
  for (const entry of withDreams) {
    if (!entry.dreamFeelings) continue;
    try {
      const feelings = JSON.parse(entry.dreamFeelings) as Array<{ id?: string } | string>;
      for (const f of feelings) {
        const id = typeof f === 'string' ? f : f.id;
        if (id) feelingCount[id] = (feelingCount[id] ?? 0) + 1;
      }
    } catch { /* skip malformed */ }
  }

  // Count dream themes
  const themeCount: Record<string, number> = {};
  for (const entry of withDreams) {
    if (!entry.dreamMetadata) continue;
    try {
      const meta = JSON.parse(entry.dreamMetadata) as { theme?: string };
      if (meta.theme) themeCount[meta.theme] = (themeCount[meta.theme] ?? 0) + 1;
    } catch { /* skip malformed */ }
  }

  const topFeelingIds = Object.entries(feelingCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id]) => id);

  const topThemes = Object.entries(themeCount)
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .map(([theme]) => theme);

  const qualityEntries = liveSleep
    .map(e => e.quality)
    .filter((q): q is number => q != null && q >= 1 && q <= 5);

  const avgQuality =
    qualityEntries.length >= 3
      ? qualityEntries.reduce((a, b) => a + b, 0) / qualityEntries.length
      : null;

  const dreamSummary: DreamSummary = {
    totalWithDreams: withDreams.length,
    topFeelingIds,
    topThemes,
    avgQuality,
    allDates: [...new Set(liveSleep.map(e => e.date.slice(0, 10)))],
  };

  return { ...ctx, journalSummary, dreamSummary };
}
