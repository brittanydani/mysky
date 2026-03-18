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

export interface SomaticEntry {
  id: string;
  date: string; // ISO string from new Date().toISOString()
  region: string;
  emotion: string;
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

export interface SelfKnowledgeContext {
  coreValues: CoreValuesData | null;
  archetypeProfile: ArchetypeProfile | null;
  cognitiveStyle: CognitiveScores | null;
  somaticEntries: SomaticEntry[];
  triggers: TriggerData | null;
  relationshipPatterns: RelationshipPatternEntry[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Storage keys  (must match the keys used in each screen)
// ─────────────────────────────────────────────────────────────────────────────

const STORAGE_KEYS = {
  coreValues:           '@mysky:core_values',
  archetypeProfile:     '@mysky:archetype_profile',
  cognitiveStyle:       '@mysky:cognitive_style',
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
    somaticEntries,
    triggers,
    relationshipPatterns,
  ] = await Promise.all([
    readJson<CoreValuesData>(STORAGE_KEYS.coreValues),
    readEncryptedJson<ArchetypeProfile>(STORAGE_KEYS.archetypeProfile),
    readEncryptedJson<CognitiveScores>(STORAGE_KEYS.cognitiveStyle),
    readEncryptedJson<SomaticEntry[]>(STORAGE_KEYS.somaticEntries),
    loadTriggerData(),
    readEncryptedJson<RelationshipPatternEntry[]>(STORAGE_KEYS.relationshipPatterns),
  ]);

  return {
    coreValues,
    archetypeProfile,
    cognitiveStyle,
    somaticEntries: somaticEntries ?? [],
    triggers,
    relationshipPatterns: relationshipPatterns ?? [],
  };
}
