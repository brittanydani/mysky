import {
  deleteUserPreference,
  getUserPreference,
  saveUserPreference,
} from '../../storage/userProfileService';
import type {
  GeneratedInsightIntensity,
  GeneratedInsightTone,
  GeneratedInsightWriterShape,
  GeneratedInsightParagraph,
} from '../../insights/generatedInsightParagraphs';
import type { GeneratedInsight as KnowledgeGeneratedInsight } from '../../insights/types/knowledgeEngine';
import type {
  InsightCandidateSurface,
  InsightCategory,
  InsightDataSource,
  PatternType,
} from '../types';
import { logger } from '../../../utils/logger';

const OUTCOME_EVENTS_KEY = 'msky_insight_outcome_events_v1';
const FEEDBACK_PROFILE_KEY = 'msky_insight_feedback_profile_v1';
const MAX_OUTCOME_EVENTS = 500;

export type InsightOutcomeType =
  | 'shown'
  | 'saved'
  | 'expanded'
  | 'dismissed'
  | 'journaledFrom'
  | 'shared'
  | 'exported'
  | 'ignored'
  | 'ratedHelpful'
  | 'ratedNotHelpful';

export type InsightOutcomeSurface =
  | InsightCandidateSurface
  | 'insightsTab'
  | 'archiveMap'
  | 'dailyCard';

export interface InsightOutcomeEvent {
  id: string;
  outcome: InsightOutcomeType;
  occurredAt: string;
  insightId?: string;
  paragraphId?: string;
  patternKey?: string;
  category?: InsightCategory;
  majorDomain?: string;
  subcategory?: string;
  patternType?: PatternType;
  writerShape?: GeneratedInsightWriterShape;
  tone?: GeneratedInsightTone;
  intensity?: GeneratedInsightIntensity;
  surface?: InsightOutcomeSurface;
  sourceTypes?: InsightDataSource[];
  sentenceCount?: number;
  hasPracticalPrompt?: boolean;
}

export interface InsightOutcomeInput extends Omit<InsightOutcomeEvent, 'id' | 'occurredAt'> {
  id?: string;
  occurredAt?: string;
}

export interface InsightFeedbackProfile {
  version: 1;
  updatedAt: string;
  eventCount: number;
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
  writerShapeWeights: Partial<Record<GeneratedInsightWriterShape, number>>;
  patternTypeWeights: Partial<Record<PatternType, number>>;
  majorDomainWeights: Record<string, number>;
  subcategoryWeights: Record<string, number>;
  categoryWeights: Partial<Record<InsightCategory, number>>;
  toneWeights: Partial<Record<GeneratedInsightTone, number>>;
  sentenceCountWeights: Record<string, number>;
  practicalPromptWeight: number;
  preferred: {
    writerShapes: GeneratedInsightWriterShape[];
    patternTypes: PatternType[];
    majorDomains: string[];
    subcategories: string[];
    tones: GeneratedInsightTone[];
    sentenceCounts: number[];
    avoidsPracticalPrompts: boolean;
  };
}

const OUTCOME_WEIGHTS: Record<InsightOutcomeType, number> = {
  shown: 0,
  saved: 2.4,
  expanded: 1.4,
  dismissed: -2.2,
  journaledFrom: 3,
  shared: 2.6,
  exported: 2.2,
  ignored: -1.3,
  ratedHelpful: 3.4,
  ratedNotHelpful: -3.4,
};

const POSITIVE_OUTCOMES = new Set<InsightOutcomeType>([
  'saved',
  'expanded',
  'journaledFrom',
  'shared',
  'exported',
  'ratedHelpful',
]);

const NEGATIVE_OUTCOMES = new Set<InsightOutcomeType>([
  'dismissed',
  'ignored',
  'ratedNotHelpful',
]);

function emptyProfile(updatedAt = new Date().toISOString()): InsightFeedbackProfile {
  return {
    version: 1,
    updatedAt,
    eventCount: 0,
    positiveCount: 0,
    negativeCount: 0,
    neutralCount: 0,
    writerShapeWeights: {},
    patternTypeWeights: {},
    majorDomainWeights: {},
    subcategoryWeights: {},
    categoryWeights: {},
    toneWeights: {},
    sentenceCountWeights: {},
    practicalPromptWeight: 0,
    preferred: {
      writerShapes: [],
      patternTypes: [],
      majorDomains: [],
      subcategories: [],
      tones: [],
      sentenceCounts: [],
      avoidsPracticalPrompts: false,
    },
  };
}

function addWeight<T extends string>(
  weights: Partial<Record<T, number>> | Record<string, number>,
  key: T | string | undefined,
  amount: number,
): void {
  if (!key || !Number.isFinite(amount) || amount === 0) return;
  const writable = weights as Record<string, number | undefined>;
  writable[key] = Number(((writable[key] ?? 0) + amount).toFixed(4));
}

function sortedPositiveKeys<T extends string>(
  weights: Partial<Record<T, number>> | Record<string, number>,
  limit: number,
): T[] {
  return Object.entries(weights)
    .filter(([, weight]) => typeof weight === 'number' && weight > 0.4)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, limit)
    .map(([key]) => key as T);
}

function eventRecencyMultiplier(event: InsightOutcomeEvent, now: Date): number {
  const occurredAt = new Date(event.occurredAt).getTime();
  if (!Number.isFinite(occurredAt)) return 1;
  const daysOld = Math.max(0, (now.getTime() - occurredAt) / 86_400_000);
  return Math.max(0.35, Math.exp(-daysOld / 90));
}

function hasPracticalStyle(event: InsightOutcomeEvent): boolean {
  return Boolean(
    event.hasPracticalPrompt ||
    event.writerShape === 'practicalCapacity' ||
    event.tone === 'practical',
  );
}

function sentenceCount(text: string): number {
  return text.match(/[.!?](?=\s|$)/g)?.length ?? 0;
}

function eventId(event: InsightOutcomeInput): string {
  if (event.id?.trim()) return event.id;
  const stamp = event.occurredAt ?? new Date().toISOString();
  const target = event.paragraphId ?? event.insightId ?? event.patternKey ?? 'insight';
  return `${stamp}:${event.outcome}:${target}:${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeEvent(event: InsightOutcomeInput): InsightOutcomeEvent {
  const occurredAt = event.occurredAt ?? new Date().toISOString();
  return {
    ...event,
    id: eventId({ ...event, occurredAt }),
    occurredAt,
    sourceTypes: event.sourceTypes ? Array.from(new Set(event.sourceTypes)) : undefined,
  };
}

function isRecentDuplicate(
  event: InsightOutcomeEvent,
  existing: InsightOutcomeEvent,
): boolean {
  if (event.outcome !== existing.outcome) return false;
  if (event.paragraphId && existing.paragraphId !== event.paragraphId) return false;
  if (!event.paragraphId && event.insightId && existing.insightId !== event.insightId) return false;
  if (event.surface !== existing.surface) return false;

  const eventTime = new Date(event.occurredAt).getTime();
  const existingTime = new Date(existing.occurredAt).getTime();
  if (!Number.isFinite(eventTime) || !Number.isFinite(existingTime)) return false;
  return Math.abs(eventTime - existingTime) <= 6 * 60 * 60 * 1000;
}

export function buildInsightFeedbackProfile(
  events: readonly InsightOutcomeEvent[],
  now: Date = new Date(),
): InsightFeedbackProfile {
  const profile = emptyProfile(now.toISOString());
  const ordered = [...events].sort((a, b) => (
    new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime()
  ));

  profile.eventCount = ordered.length;

  for (const event of ordered) {
    if (POSITIVE_OUTCOMES.has(event.outcome)) profile.positiveCount += 1;
    else if (NEGATIVE_OUTCOMES.has(event.outcome)) profile.negativeCount += 1;
    else profile.neutralCount += 1;

    const weighted = OUTCOME_WEIGHTS[event.outcome] * eventRecencyMultiplier(event, now);
    if (weighted === 0) continue;

    addWeight(profile.writerShapeWeights, event.writerShape, weighted);
    addWeight(profile.patternTypeWeights, event.patternType, weighted);
    addWeight(profile.majorDomainWeights, event.majorDomain, weighted);
    addWeight(profile.subcategoryWeights, event.subcategory, weighted);
    addWeight(profile.categoryWeights, event.category, weighted);
    addWeight(profile.toneWeights, event.tone, weighted);
    addWeight(profile.sentenceCountWeights, event.sentenceCount ? String(event.sentenceCount) : undefined, weighted);

    if (hasPracticalStyle(event)) {
      profile.practicalPromptWeight = Number((profile.practicalPromptWeight + weighted).toFixed(4));
    }
  }

  profile.preferred = {
    writerShapes: sortedPositiveKeys<GeneratedInsightWriterShape>(profile.writerShapeWeights, 4),
    patternTypes: sortedPositiveKeys<PatternType>(profile.patternTypeWeights, 4),
    majorDomains: sortedPositiveKeys<string>(profile.majorDomainWeights, 6),
    subcategories: sortedPositiveKeys<string>(profile.subcategoryWeights, 8),
    tones: sortedPositiveKeys<GeneratedInsightTone>(profile.toneWeights, 4),
    sentenceCounts: sortedPositiveKeys<string>(profile.sentenceCountWeights, 2)
      .map(value => Number(value))
      .filter(value => Number.isFinite(value)),
    avoidsPracticalPrompts: profile.practicalPromptWeight < -1,
  };

  return profile;
}

function normalizedPreferenceWeight(value: number | undefined, divisor: number): number {
  if (!value) return 0;
  return Math.max(-1, Math.min(1, value / divisor));
}

export function insightFeedbackScoreForParagraph(
  paragraph: Pick<
    GeneratedInsightParagraph,
    | 'writerShape'
    | 'patternType'
    | 'majorDomain'
    | 'insightSubcategory'
    | 'category'
    | 'tone'
    | 'body'
  >,
  profile?: InsightFeedbackProfile | null,
): number {
  if (!profile || profile.eventCount === 0) return 0;
  const count = sentenceCount(paragraph.body);
  const practicalStyle = paragraph.writerShape === 'practicalCapacity' || paragraph.tone === 'practical';

  return Number((
    normalizedPreferenceWeight(profile.writerShapeWeights[paragraph.writerShape], 5) * 10 +
    normalizedPreferenceWeight(profile.patternTypeWeights[paragraph.patternType], 5) * 12 +
    normalizedPreferenceWeight(profile.majorDomainWeights[paragraph.majorDomain], 7) * 8 +
    normalizedPreferenceWeight(profile.subcategoryWeights[paragraph.insightSubcategory], 7) * 7 +
    normalizedPreferenceWeight(profile.categoryWeights[paragraph.category], 7) * 5 +
    normalizedPreferenceWeight(profile.toneWeights[paragraph.tone], 5) * 4 +
    normalizedPreferenceWeight(profile.sentenceCountWeights[String(count)], 5) * 3 +
    (practicalStyle ? normalizedPreferenceWeight(profile.practicalPromptWeight, 5) * 6 : 0)
  ).toFixed(4));
}

export async function getInsightOutcomeEvents(): Promise<InsightOutcomeEvent[]> {
  try {
    return await getUserPreference<InsightOutcomeEvent[]>(OUTCOME_EVENTS_KEY, []);
  } catch {
    return [];
  }
}

export async function getInsightFeedbackProfile(): Promise<InsightFeedbackProfile> {
  try {
    const cached = await getUserPreference<InsightFeedbackProfile | null>(FEEDBACK_PROFILE_KEY, null);
    if (cached?.version === 1) return cached;

    const events = await getInsightOutcomeEvents();
    const profile = buildInsightFeedbackProfile(events);
    await saveUserPreference(FEEDBACK_PROFILE_KEY, profile);
    return profile;
  } catch {
    return emptyProfile();
  }
}

export async function recordInsightOutcome(
  input: InsightOutcomeInput,
): Promise<InsightFeedbackProfile> {
  const event = normalizeEvent(input);

  try {
    const existingEvents = await getInsightOutcomeEvents();
    const duplicate = existingEvents.find(existing => isRecentDuplicate(event, existing));
    if (duplicate) {
      return getInsightFeedbackProfile();
    }

    const events = [event, ...existingEvents]
      .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
      .slice(0, MAX_OUTCOME_EVENTS);
    const profile = buildInsightFeedbackProfile(events);

    await saveUserPreference(OUTCOME_EVENTS_KEY, events);
    await saveUserPreference(FEEDBACK_PROFILE_KEY, profile);
    return profile;
  } catch (error) {
    logger.warn('[InsightOutcomeFeedback] Failed to record insight outcome:', error);
    return getInsightFeedbackProfile();
  }
}

export async function resetInsightOutcomeFeedback(): Promise<void> {
  await Promise.all([
    deleteUserPreference(OUTCOME_EVENTS_KEY).catch(() => {}),
    deleteUserPreference(FEEDBACK_PROFILE_KEY).catch(() => {}),
  ]);
}

export function insightOutcomeFromGeneratedInsight(
  insight: KnowledgeGeneratedInsight,
  outcome: InsightOutcomeType,
  options: {
    surface?: InsightOutcomeSurface;
    occurredAt?: string;
  } = {},
): InsightOutcomeInput {
  const body = `${insight.observation} ${insight.pattern}`.trim();
  return {
    outcome,
    occurredAt: options.occurredAt,
    insightId: insight.id,
    paragraphId: insight.paragraphId,
    patternKey: insight.patternKey,
    category: insight.category as InsightCategory | undefined,
    majorDomain: insight.majorDomain,
    subcategory: insight.insightSubcategory,
    patternType: insight.patternType as PatternType | undefined,
    writerShape: insight.writerShape as GeneratedInsightWriterShape | undefined,
    tone: insight.paragraphTone as GeneratedInsightTone | undefined,
    intensity: insight.paragraphIntensity as GeneratedInsightIntensity | undefined,
    surface: options.surface ?? 'today',
    sentenceCount: insight.sentenceCount ?? sentenceCount(body),
    hasPracticalPrompt: insight.hasPracticalPrompt,
  };
}

export async function recordGeneratedInsightOutcome(
  insight: KnowledgeGeneratedInsight,
  outcome: InsightOutcomeType,
  options: {
    surface?: InsightOutcomeSurface;
    occurredAt?: string;
  } = {},
): Promise<InsightFeedbackProfile> {
  return recordInsightOutcome(insightOutcomeFromGeneratedInsight(insight, outcome, options));
}
