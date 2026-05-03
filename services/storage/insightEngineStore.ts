import { supabase } from '../../lib/supabase';
import { logger } from '../../utils/logger';
import type {
  InsightCandidate,
  InsightCandidateSurface,
  PatternType,
} from '../insightsV2/types';

type Row = Record<string, unknown>;

export interface PersistedInsightSignalInput {
  sourceType: string;
  sourceId?: string | null;
  anchors?: string[];
  signalTypes?: string[];
  emotionalTags?: string[];
  lifeAreas?: string[];
  intensity?: number | null;
  confidence?: number | null;
}

export interface PersistedInsightSignal extends PersistedInsightSignalInput {
  id: string;
  createdAt: string;
}

export interface PersistedInsightCandidateInput {
  candidate: InsightCandidate;
  sourceSignalIds?: string[];
  activeFrom?: string;
  activeUntil?: string | null;
}

export interface PersistedInsightCandidate {
  id: string;
  candidate: InsightCandidate;
  sourceSignalIds: string[];
  activeFrom: string;
  activeUntil: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ShownInsightInput {
  candidateId?: string | null;
  paragraphId: string;
  paragraphBodyKey: string;
  majorDomain: string;
  subcategory: string;
  patternType: PatternType;
  surface: Exclude<InsightCandidateSurface, 'dreamInterpretation'>;
  shownAt?: string;
}

export interface ShownInsight extends ShownInsightInput {
  id: string;
  shownAt: string;
}

export type InsightFeedbackAction =
  | 'saved'
  | 'dismissed'
  | 'expanded'
  | 'journaled'
  | 'journaledFrom'
  | 'shared'
  | 'exported'
  | 'ignored'
  | 'helpful'
  | 'not_helpful'
  | 'ratedHelpful'
  | 'ratedNotHelpful';

export interface InsightFeedbackInput {
  shownInsightId: string;
  action: InsightFeedbackAction;
  value?: number | null;
}

export interface UserInsightMemoryInput {
  majorDomain: string;
  subcategory: string;
  patternType: PatternType;
  currentStrength?: number | null;
  previousStrength?: number | null;
  trend?: 'rising' | 'softening' | 'stable' | 'dormant' | 'shifting' | 'new' | null;
  firstSeenAt?: string | null;
  lastSeenAt?: string | null;
  timesSeen?: number;
  commonAnchors?: string[];
  commonSignalTypes?: string[];
}

export interface UserInsightMemory extends UserInsightMemoryInput {
  id: string;
  updatedAt: string;
}

async function getUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;

  const userId = data.session?.user?.id;
  if (!userId) throw new Error('Not authenticated');
  return userId;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}

function asOptionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

function asNullableNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function rowToSignal(row: Row): PersistedInsightSignal {
  return {
    id: String(row.id),
    sourceType: String(row.source_type),
    sourceId: row.source_id == null ? null : String(row.source_id),
    anchors: asStringArray(row.anchors),
    signalTypes: asStringArray(row.signal_types),
    emotionalTags: asStringArray(row.emotional_tags),
    lifeAreas: asStringArray(row.life_areas),
    intensity: asNullableNumber(row.intensity),
    confidence: asNullableNumber(row.confidence),
    createdAt: String(row.created_at),
  };
}

function rowToShownInsight(row: Row): ShownInsight {
  return {
    id: String(row.id),
    candidateId: row.candidate_id == null ? null : String(row.candidate_id),
    paragraphId: String(row.paragraph_id),
    paragraphBodyKey: String(row.paragraph_body_key),
    majorDomain: String(row.major_domain),
    subcategory: String(row.subcategory),
    patternType: row.pattern_type as PatternType,
    surface: row.surface as ShownInsight['surface'],
    shownAt: String(row.shown_at),
  };
}

function rowToMemory(row: Row): UserInsightMemory {
  return {
    id: String(row.id),
    majorDomain: String(row.major_domain),
    subcategory: String(row.subcategory),
    patternType: row.pattern_type as PatternType,
    currentStrength: asNullableNumber(row.current_strength),
    previousStrength: asNullableNumber(row.previous_strength),
    trend: row.trend as UserInsightMemoryInput['trend'],
    firstSeenAt: asOptionalString(row.first_seen_at) ?? null,
    lastSeenAt: asOptionalString(row.last_seen_at) ?? null,
    timesSeen: typeof row.times_seen === 'number' ? row.times_seen : 0,
    commonAnchors: asStringArray(row.common_anchors),
    commonSignalTypes: asStringArray(row.common_signal_types),
    updatedAt: String(row.updated_at),
  };
}

export async function saveInsightSignals(
  signals: readonly PersistedInsightSignalInput[],
): Promise<PersistedInsightSignal[]> {
  if (!signals.length) return [];
  const userId = await getUserId();

  const { data, error } = await supabase
    .from('insight_signals')
    .insert(signals.map(signal => ({
      user_id: userId,
      source_type: signal.sourceType,
      source_id: signal.sourceId ?? null,
      anchors: signal.anchors ?? [],
      signal_types: signal.signalTypes ?? [],
      emotional_tags: signal.emotionalTags ?? [],
      life_areas: signal.lifeAreas ?? [],
      intensity: signal.intensity ?? null,
      confidence: signal.confidence ?? null,
    })))
    .select('*');

  if (error) {
    logger.warn('[InsightEngineStore] Failed to save insight signals.', error);
    throw error;
  }

  return ((data ?? []) as Row[]).map(rowToSignal);
}

export async function saveInsightCandidates(
  candidates: readonly PersistedInsightCandidateInput[],
): Promise<string[]> {
  if (!candidates.length) return [];
  const userId = await getUserId();

  const { data, error } = await supabase
    .from('insight_candidates')
    .insert(candidates.map(({ candidate, sourceSignalIds = [], activeFrom, activeUntil }) => ({
      user_id: userId,
      major_domain: candidate.majorDomain,
      subcategory: candidate.subcategory,
      category: candidate.category,
      theory_lens: candidate.theoryLens,
      pattern_type_scores: candidate.patternTypeScores,
      selected_pattern_type: candidate.selectedPatternType,
      anchors: candidate.anchors,
      signal_types: candidate.signalTypes,
      tags: candidate.tags,
      strength: candidate.strength,
      confidence: candidate.confidence,
      allowed_surfaces: candidate.allowedSurfaces,
      source_signal_ids: sourceSignalIds,
      active_from: activeFrom ?? new Date().toISOString(),
      active_until: activeUntil ?? null,
    })))
    .select('id');

  if (error) {
    logger.warn('[InsightEngineStore] Failed to save insight candidates.', error);
    throw error;
  }

  return ((data ?? []) as Row[]).map(row => String(row.id));
}

export async function recordShownInsight(input: ShownInsightInput): Promise<ShownInsight> {
  const userId = await getUserId();

  const { data, error } = await supabase
    .from('shown_insights')
    .insert({
      user_id: userId,
      candidate_id: input.candidateId ?? null,
      paragraph_id: input.paragraphId,
      paragraph_body_key: input.paragraphBodyKey,
      major_domain: input.majorDomain,
      subcategory: input.subcategory,
      pattern_type: input.patternType,
      surface: input.surface,
      shown_at: input.shownAt ?? new Date().toISOString(),
    })
    .select('*')
    .single();

  if (error) {
    logger.warn('[InsightEngineStore] Failed to record shown insight.', error);
    throw error;
  }

  return rowToShownInsight(data as Row);
}

export async function getRecentShownInsights(limit = 100): Promise<ShownInsight[]> {
  const userId = await getUserId();

  const { data, error } = await supabase
    .from('shown_insights')
    .select('*')
    .eq('user_id', userId)
    .order('shown_at', { ascending: false })
    .limit(limit);

  if (error) {
    logger.warn('[InsightEngineStore] Failed to load shown insight history.', error);
    return [];
  }

  return ((data ?? []) as Row[]).map(rowToShownInsight);
}

export async function recordInsightFeedback(input: InsightFeedbackInput): Promise<void> {
  const userId = await getUserId();

  const { error } = await supabase
    .from('insight_feedback')
    .insert({
      user_id: userId,
      shown_insight_id: input.shownInsightId,
      action: input.action,
      value: input.value ?? null,
    });

  if (error) {
    logger.warn('[InsightEngineStore] Failed to record insight feedback.', error);
    throw error;
  }
}

export async function upsertUserInsightMemory(input: UserInsightMemoryInput): Promise<UserInsightMemory> {
  const userId = await getUserId();

  const { data, error } = await supabase
    .from('user_insight_memory')
    .upsert(
      {
        user_id: userId,
        major_domain: input.majorDomain,
        subcategory: input.subcategory,
        pattern_type: input.patternType,
        current_strength: input.currentStrength ?? null,
        previous_strength: input.previousStrength ?? null,
        trend: input.trend ?? null,
        first_seen_at: input.firstSeenAt ?? null,
        last_seen_at: input.lastSeenAt ?? null,
        times_seen: input.timesSeen ?? 0,
        common_anchors: input.commonAnchors ?? [],
        common_signal_types: input.commonSignalTypes ?? [],
      },
      { onConflict: 'user_id,major_domain,subcategory,pattern_type' },
    )
    .select('*')
    .single();

  if (error) {
    logger.warn('[InsightEngineStore] Failed to upsert insight memory.', error);
    throw error;
  }

  return rowToMemory(data as Row);
}

export async function getUserInsightMemory(limit = 100): Promise<UserInsightMemory[]> {
  const userId = await getUserId();

  const { data, error } = await supabase
    .from('user_insight_memory')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (error) {
    logger.warn('[InsightEngineStore] Failed to load insight memory.', error);
    return [];
  }

  return ((data ?? []) as Row[]).map(rowToMemory);
}

export const insightEngineStore = {
  saveInsightSignals,
  saveInsightCandidates,
  recordShownInsight,
  getRecentShownInsights,
  recordInsightFeedback,
  upsertUserInsightMemory,
  getUserInsightMemory,
};
