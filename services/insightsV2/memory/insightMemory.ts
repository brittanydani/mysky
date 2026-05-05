import {
  getUserPreference,
  saveUserPreference,
} from '../../storage/userProfileService';
import type { GeneratedInsight as KnowledgeGeneratedInsight } from '../../insights/types/knowledgeEngine';
import type {
  PremiumPatternItem,
  PremiumThisWeekPatternItem,
  PremiumWeeklyDeepDiveItem,
} from '../adapters/premiumPatterns';
import { patternParagraphBodyKey } from '../paragraphBodyKey';
import type {
  ArchivePatternScore,
  InsightCategory,
  InsightDataSource,
  PatternConfidence,
  PatternMovement,
  PatternType,
} from '../types';
import { logger } from '../../../utils/logger';

const INSIGHT_MEMORY_KEY = 'msky_longitudinal_insight_memory_v1';
const MAX_MEMORY_SNAPSHOTS = 700;

export type InsightMemorySurface =
  | 'today'
  | 'patterns'
  | 'weeklyDeepDive'
  | 'thisWeek';

export type InsightMemoryTrendKind =
  | 'emerging'
  | 'returning'
  | 'increasing'
  | 'softening'
  | 'stable'
  | 'noLongerPrimary'
  | 'sleepLinked'
  | 'bodyLinked'
  | 'crossDomainLink';

export interface InsightMemorySnapshot {
  id: string;
  observedAt: string;
  weekKey: string;
  surface: InsightMemorySurface;
  rank: number;
  isPrimary: boolean;
  patternKey: string;
  title: string;
  category: InsightCategory;
  score: number;
  confidence: PatternConfidence;
  movement: PatternMovement;
  majorDomain?: string;
  insightSubcategory?: string;
  patternType?: PatternType;
  paragraphId?: string;
  writerShape?: string;
  paragraphTone?: string;
  sources: InsightDataSource[];
  relatedSignals: string[];
  anchors: string[];
  bodyKey?: string;
}

export interface InsightMemoryTrend {
  id: string;
  kind: InsightMemoryTrendKind;
  patternKey?: string;
  title: string;
  category?: InsightCategory;
  majorDomain?: string;
  insightSubcategory?: string;
  patternType?: PatternType;
  currentScore?: number;
  previousScore?: number;
  delta?: number;
  weeksSeen?: number;
  lastSeenAt?: string;
  relatedSignals: string[];
  sourceTypes: InsightDataSource[];
  linkedDomains?: string[];
  summary: string;
}

export interface InsightMemoryProfile {
  version: 1;
  updatedAt: string;
  snapshots: InsightMemorySnapshot[];
  trends: InsightMemoryTrend[];
  whatChangedSinceLastWeek: string[];
}

function emptyMemory(updatedAt = new Date().toISOString()): InsightMemoryProfile {
  return {
    version: 1,
    updatedAt,
    snapshots: [],
    trends: [],
    whatChangedSinceLastWeek: [],
  };
}

function unique<T extends string>(values: Array<T | string | undefined | null>): string[] {
  return Array.from(new Set(values.filter((value): value is string => typeof value === 'string' && value.trim().length > 0)));
}

function weekKeyForDate(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : new Date(value);
  const safeDate = Number.isFinite(date.getTime()) ? date : new Date();
  const utc = new Date(Date.UTC(
    safeDate.getUTCFullYear(),
    safeDate.getUTCMonth(),
    safeDate.getUTCDate(),
  ));
  const day = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((utc.getTime() - yearStart.getTime()) / 86_400_000) + 1) / 7);
  return `${utc.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

function timestamp(value: string): number {
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function confidenceScore(confidence: PatternConfidence): number {
  if (confidence === 'veryStrong') return 90;
  if (confidence === 'strong') return 72;
  if (confidence === 'moderate') return 56;
  return 36;
}

function scoreFromPercent(value: number | undefined, confidence: PatternConfidence): number {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.max(0, Math.min(100, value));
  return confidenceScore(confidence);
}

function movementFromDelta(delta: number | undefined): PatternMovement {
  if (delta == null) return 'new';
  if (delta >= 5) return 'intensifying';
  if (delta <= -5) return 'softening';
  return 'repeating';
}

function normalizeSignals(values: Array<string | undefined> = []): string[] {
  return unique(values.map(value => value?.replace(/[_-]+/g, ' ').trim().toLowerCase())).slice(0, 16);
}

function sourceFromEvidenceSource(source: unknown): InsightDataSource | null {
  if (typeof source !== 'string') return null;
  if (source === 'astrology') return 'natalChart';
  return source as InsightDataSource;
}

function snapshotId(snapshot: Omit<InsightMemorySnapshot, 'id'>): string {
  return [
    snapshot.weekKey,
    snapshot.surface,
    snapshot.patternKey,
    snapshot.paragraphId ?? snapshot.rank,
  ].join(':');
}

function normalizeSnapshot(snapshot: Omit<InsightMemorySnapshot, 'id'>): InsightMemorySnapshot {
  return {
    ...snapshot,
    id: snapshotId(snapshot),
    sources: unique(snapshot.sources) as InsightDataSource[],
    relatedSignals: normalizeSignals(snapshot.relatedSignals),
    anchors: normalizeSignals(snapshot.anchors),
  };
}

function snapshotBodyKey(body: string | undefined): string | undefined {
  if (!body?.trim()) return undefined;
  return patternParagraphBodyKey(body);
}

export function insightMemorySnapshotFromGeneratedInsight(
  insight: KnowledgeGeneratedInsight,
  options: {
    observedAt?: string;
    surface?: InsightMemorySurface;
    rank?: number;
  } = {},
): InsightMemorySnapshot | null {
  const observedAt = options.observedAt ?? insight.createdAt ?? new Date().toISOString();
  const category = insight.category as InsightCategory | undefined;
  if (!category || !insight.patternKey) return null;

  const body = `${insight.observation} ${insight.pattern}`.trim();
  const sources = unique(
    insight.evidence
      .map(evidence => sourceFromEvidenceSource(evidence.source))
      .filter((source): source is InsightDataSource => !!source),
  ) as InsightDataSource[];

  return normalizeSnapshot({
    observedAt,
    weekKey: weekKeyForDate(observedAt),
    surface: options.surface ?? 'today',
    rank: options.rank ?? 0,
    isPrimary: (options.rank ?? 0) === 0,
    patternKey: insight.patternKey,
    title: insight.title,
    category,
    score: confidenceScore(insight.confidence),
    confidence: insight.confidence,
    movement: insight.movement as PatternMovement,
    majorDomain: insight.majorDomain,
    insightSubcategory: insight.insightSubcategory,
    patternType: insight.patternType as PatternType | undefined,
    paragraphId: insight.paragraphId,
    writerShape: insight.writerShape,
    paragraphTone: insight.paragraphTone,
    sources,
    relatedSignals: insight.evidence
      .map(evidence => evidence.signal)
      .filter((signal): signal is string => !!signal),
    anchors: [],
    bodyKey: snapshotBodyKey(body),
  });
}

export function insightMemorySnapshotFromPremiumPattern(
  item: PremiumPatternItem,
  options: {
    observedAt?: string;
    surface?: InsightMemorySurface;
    rank?: number;
    isPrimary?: boolean;
  } = {},
): InsightMemorySnapshot {
  const observedAt = options.observedAt ?? item.lastSeenAt ?? new Date().toISOString();
  return normalizeSnapshot({
    observedAt,
    weekKey: weekKeyForDate(observedAt),
    surface: options.surface ?? 'patterns',
    rank: options.rank ?? 0,
    isPrimary: options.isPrimary ?? (options.rank ?? 0) === 0,
    patternKey: item.patternKey,
    title: item.title,
    category: item.category,
    score: scoreFromPercent(item.score, item.confidence),
    confidence: item.confidence,
    movement: item.movement,
    majorDomain: item.majorDomain,
    insightSubcategory: item.insightSubcategory,
    patternType: item.patternType,
    paragraphId: item.paragraphId,
    writerShape: item.writerShape,
    paragraphTone: item.paragraphTone,
    sources: item.sourceCoverage as InsightDataSource[],
    relatedSignals: item.relatedSignals,
    anchors: [
      ...(item.matchedAnchors ?? []),
      ...(item.specificityAnchor ? [item.specificityAnchor] : []),
    ],
    bodyKey: snapshotBodyKey(item.body),
  });
}

export function insightMemorySnapshotFromThisWeekPattern(
  item: PremiumThisWeekPatternItem,
  options: {
    observedAt?: string;
    rank?: number;
  } = {},
): InsightMemorySnapshot | null {
  if (item.isEmptyState) return null;
  const observedAt = options.observedAt ?? new Date().toISOString();
  return normalizeSnapshot({
    observedAt,
    weekKey: weekKeyForDate(observedAt),
    surface: 'thisWeek',
    rank: options.rank ?? 0,
    isPrimary: true,
    patternKey: item.patternKey,
    title: item.title,
    category: item.category,
    score: confidenceScore(item.confidence),
    confidence: item.confidence,
    movement: item.movement,
    sources: [],
    relatedSignals: [],
    anchors: [],
    bodyKey: snapshotBodyKey(item.body),
  });
}

export function insightMemorySnapshotFromWeeklyDeepDive(
  item: PremiumWeeklyDeepDiveItem,
  options: {
    observedAt?: string;
    rank?: number;
  } = {},
): InsightMemorySnapshot | null {
  if (item.isEmptyState) return null;
  const observedAt = options.observedAt ?? new Date().toISOString();
  return normalizeSnapshot({
    observedAt,
    weekKey: weekKeyForDate(observedAt),
    surface: 'weeklyDeepDive',
    rank: options.rank ?? 0,
    isPrimary: (options.rank ?? 0) === 0,
    patternKey: item.patternKey,
    title: item.title,
    category: item.category,
    score: confidenceScore(item.confidence),
    confidence: item.confidence,
    movement: item.movement,
    sources: [],
    relatedSignals: [],
    anchors: [],
    bodyKey: snapshotBodyKey(item.body),
  });
}

function weekIndex(weekKey: string): number {
  const match = weekKey.match(/^(\d{4})-W(\d{2})$/);
  if (!match) return 0;
  return Number(match[1]) * 60 + Number(match[2]);
}

function snapshotsByPattern(snapshots: InsightMemorySnapshot[]): Map<string, InsightMemorySnapshot[]> {
  const grouped = new Map<string, InsightMemorySnapshot[]>();
  for (const snapshot of snapshots) {
    const items = grouped.get(snapshot.patternKey) ?? [];
    items.push(snapshot);
    grouped.set(snapshot.patternKey, items);
  }
  for (const items of grouped.values()) {
    items.sort((a, b) => weekIndex(a.weekKey) - weekIndex(b.weekKey) || timestamp(a.observedAt) - timestamp(b.observedAt));
  }
  return grouped;
}

function latestByWeek(snapshots: InsightMemorySnapshot[]): InsightMemorySnapshot[] {
  const latest = new Map<string, InsightMemorySnapshot>();
  for (const snapshot of snapshots) {
    const existing = latest.get(snapshot.weekKey);
    if (!existing || timestamp(snapshot.observedAt) >= timestamp(existing.observedAt)) {
      latest.set(snapshot.weekKey, snapshot);
    }
  }
  return [...latest.values()].sort((a, b) => weekIndex(a.weekKey) - weekIndex(b.weekKey));
}

function trendSummary(kind: InsightMemoryTrendKind, latest: InsightMemorySnapshot, previous?: InsightMemorySnapshot): string {
  if (kind === 'increasing') {
    return `${latest.title} is increasing compared with its last stored read.`;
  }
  if (kind === 'softening') {
    return `${latest.title} is still present, but the stored signal is softer than before.`;
  }
  if (kind === 'returning') {
    return `${latest.title} has returned after at least one week out of the foreground.`;
  }
  if (kind === 'noLongerPrimary') {
    return `${latest.title} is no longer the main pattern in the current read.`;
  }
  if (kind === 'sleepLinked') {
    return `${latest.title} keeps pairing with sleep, rest, or recovery signals.`;
  }
  if (kind === 'bodyLinked') {
    return `${latest.title} keeps pairing with body tension or sensation.`;
  }
  if (previous) {
    return `${latest.title} is repeating at a similar level to the previous read.`;
  }
  return `${latest.title} is new enough in memory to watch before making a bigger story from it.`;
}

function hasSleepLink(snapshot: InsightMemorySnapshot): boolean {
  const haystack = [
    ...snapshot.sources,
    ...snapshot.relatedSignals,
    ...snapshot.anchors,
    snapshot.category,
  ].join(' ');
  return /\b(sleep|rest|recovery|fatigue|depletion|low sleep|capacity)\b/i.test(haystack);
}

function hasBodyLink(snapshot: InsightMemorySnapshot): boolean {
  const haystack = [
    ...snapshot.sources,
    ...snapshot.relatedSignals,
    ...snapshot.anchors,
    snapshot.category,
  ].join(' ');
  return /\b(body|bodymap|somatic|chest|breath|jaw|gut|throat|tension|sensation|shoulder)\b/i.test(haystack);
}

function trendForPattern(items: InsightMemorySnapshot[], currentWeekKey: string): InsightMemoryTrend[] {
  const weekly = latestByWeek(items);
  const latest = weekly[weekly.length - 1];
  if (!latest) return [];

  const previous = weekly[weekly.length - 2];
  const delta = previous ? latest.score - previous.score : undefined;
  const gap = previous ? weekIndex(latest.weekKey) - weekIndex(previous.weekKey) : 0;
  const kind: InsightMemoryTrendKind = previous
    ? gap > 1
      ? 'returning'
      : delta != null && delta >= 5
        ? 'increasing'
        : delta != null && delta <= -5
          ? 'softening'
          : 'stable'
    : 'emerging';
  const trends: InsightMemoryTrend[] = [
    {
      id: `${latest.patternKey}:${kind}`,
      kind,
      patternKey: latest.patternKey,
      title: latest.title,
      category: latest.category,
      majorDomain: latest.majorDomain,
      insightSubcategory: latest.insightSubcategory,
      patternType: latest.patternType,
      currentScore: latest.score,
      previousScore: previous?.score,
      delta,
      weeksSeen: weekly.length,
      lastSeenAt: latest.observedAt,
      relatedSignals: latest.relatedSignals,
      sourceTypes: latest.sources,
      summary: trendSummary(kind, latest, previous),
    },
  ];

  const lastPrimary = [...weekly].reverse().find(snapshot => snapshot.isPrimary);
  if (lastPrimary && lastPrimary.weekKey !== currentWeekKey && latest.weekKey === currentWeekKey) {
    trends.push({
      id: `${latest.patternKey}:noLongerPrimary`,
      kind: 'noLongerPrimary',
      patternKey: latest.patternKey,
      title: latest.title,
      category: latest.category,
      majorDomain: latest.majorDomain,
      insightSubcategory: latest.insightSubcategory,
      patternType: latest.patternType,
      currentScore: latest.score,
      previousScore: lastPrimary.score,
      delta: latest.score - lastPrimary.score,
      weeksSeen: weekly.length,
      lastSeenAt: latest.observedAt,
      relatedSignals: latest.relatedSignals,
      sourceTypes: latest.sources,
      summary: trendSummary('noLongerPrimary', latest),
    });
  }

  if (weekly.filter(hasSleepLink).length >= 2) {
    trends.push({
      id: `${latest.patternKey}:sleepLinked`,
      kind: 'sleepLinked',
      patternKey: latest.patternKey,
      title: latest.title,
      category: latest.category,
      majorDomain: latest.majorDomain,
      insightSubcategory: latest.insightSubcategory,
      patternType: latest.patternType,
      currentScore: latest.score,
      weeksSeen: weekly.length,
      lastSeenAt: latest.observedAt,
      relatedSignals: latest.relatedSignals,
      sourceTypes: latest.sources,
      summary: trendSummary('sleepLinked', latest),
    });
  }

  if (weekly.filter(hasBodyLink).length >= 2) {
    trends.push({
      id: `${latest.patternKey}:bodyLinked`,
      kind: 'bodyLinked',
      patternKey: latest.patternKey,
      title: latest.title,
      category: latest.category,
      majorDomain: latest.majorDomain,
      insightSubcategory: latest.insightSubcategory,
      patternType: latest.patternType,
      currentScore: latest.score,
      weeksSeen: weekly.length,
      lastSeenAt: latest.observedAt,
      relatedSignals: latest.relatedSignals,
      sourceTypes: latest.sources,
      summary: trendSummary('bodyLinked', latest),
    });
  }

  return trends;
}

function sharedContextKey(snapshot: InsightMemorySnapshot): string[] {
  return unique([
    ...snapshot.relatedSignals,
    ...snapshot.anchors,
    snapshot.patternType,
  ]).slice(0, 20);
}

function crossDomainTrends(snapshots: InsightMemorySnapshot[], currentWeekKey: string): InsightMemoryTrend[] {
  const current = snapshots.filter(snapshot => snapshot.weekKey === currentWeekKey && snapshot.majorDomain);
  const prior = snapshots.filter(snapshot => snapshot.weekKey !== currentWeekKey && snapshot.majorDomain);
  const trends: InsightMemoryTrend[] = [];

  for (const latest of current) {
    const latestContext = new Set(sharedContextKey(latest));
    if (!latestContext.size) continue;
    const linked = prior.find(snapshot =>
      snapshot.majorDomain &&
      snapshot.majorDomain !== latest.majorDomain &&
      sharedContextKey(snapshot).some(key => latestContext.has(key)),
    );
    if (!linked) continue;
    const linkedDomains = unique([linked.majorDomain, latest.majorDomain]);
    trends.push({
      id: `${linked.majorDomain}:${latest.majorDomain}:${latest.patternKey}:crossDomainLink`,
      kind: 'crossDomainLink',
      patternKey: latest.patternKey,
      title: latest.title,
      category: latest.category,
      majorDomain: latest.majorDomain,
      insightSubcategory: latest.insightSubcategory,
      patternType: latest.patternType,
      currentScore: latest.score,
      previousScore: linked.score,
      delta: latest.score - linked.score,
      weeksSeen: 2,
      lastSeenAt: latest.observedAt,
      relatedSignals: unique([...latest.relatedSignals, ...linked.relatedSignals]),
      sourceTypes: unique([...latest.sources, ...linked.sources]) as InsightDataSource[],
      linkedDomains,
      summary: `${latest.title} now shares signals with a previous ${linked.category} thread.`,
    });
  }

  return trends.slice(0, 6);
}

export function deriveInsightMemoryTrends(
  snapshots: readonly InsightMemorySnapshot[],
  now: string | Date = new Date(),
): InsightMemoryTrend[] {
  const currentWeekKey = weekKeyForDate(now);
  const recentSnapshots = [...snapshots]
    .filter(snapshot => weekIndex(snapshot.weekKey) >= weekIndex(currentWeekKey) - 26);
  const grouped = snapshotsByPattern(recentSnapshots);
  const trends = [
    ...Array.from(grouped.values()).flatMap(items => trendForPattern(items, currentWeekKey)),
    ...crossDomainTrends(recentSnapshots, currentWeekKey),
  ];

  return trends
    .sort((a, b) => {
      const kindWeight = (kind: InsightMemoryTrendKind): number => {
        if (kind === 'increasing' || kind === 'softening') return 5;
        if (kind === 'crossDomainLink') return 4;
        if (kind === 'sleepLinked' || kind === 'bodyLinked') return 3;
        if (kind === 'returning' || kind === 'noLongerPrimary') return 2;
        return 1;
      };
      return kindWeight(b.kind) - kindWeight(a.kind)
        || Math.abs(b.delta ?? 0) - Math.abs(a.delta ?? 0)
        || timestamp(b.lastSeenAt ?? '') - timestamp(a.lastSeenAt ?? '');
    })
    .slice(0, 24);
}

export function summarizeWhatChangedSinceLastWeek(
  snapshots: readonly InsightMemorySnapshot[],
  trends: readonly InsightMemoryTrend[] = deriveInsightMemoryTrends(snapshots),
  now: string | Date = new Date(),
): string[] {
  const currentWeekKey = weekKeyForDate(now);
  const previousWeekIndex = weekIndex(currentWeekKey) - 1;
  const previousPrimary = [...snapshots]
    .filter(snapshot => weekIndex(snapshot.weekKey) === previousWeekIndex && snapshot.isPrimary)
    .sort((a, b) => a.rank - b.rank)[0];
  const currentPrimary = [...snapshots]
    .filter(snapshot => snapshot.weekKey === currentWeekKey && snapshot.isPrimary)
    .sort((a, b) => a.rank - b.rank)[0];
  const summaries: string[] = [];

  if (previousPrimary && currentPrimary && previousPrimary.patternKey !== currentPrimary.patternKey) {
    summaries.push(`${previousPrimary.title} is no longer the main read; ${currentPrimary.title} moved into the foreground.`);
  }

  for (const trend of trends) {
    if (summaries.length >= 5) break;
    if (['increasing', 'softening', 'crossDomainLink', 'sleepLinked', 'bodyLinked', 'returning'].includes(trend.kind)) {
      summaries.push(trend.summary);
    }
  }

  return unique(summaries).slice(0, 5);
}

export function buildInsightMemoryProfile(
  snapshots: readonly InsightMemorySnapshot[],
  now: string | Date = new Date(),
): InsightMemoryProfile {
  const sorted = [...snapshots]
    .sort((a, b) => timestamp(b.observedAt) - timestamp(a.observedAt))
    .slice(0, MAX_MEMORY_SNAPSHOTS);
  const trends = deriveInsightMemoryTrends(sorted, now);
  return {
    version: 1,
    updatedAt: typeof now === 'string' ? now : now.toISOString(),
    snapshots: sorted,
    trends,
    whatChangedSinceLastWeek: summarizeWhatChangedSinceLastWeek(sorted, trends, now),
  };
}

export function previousPatternScoresFromInsightMemory(
  memory: InsightMemoryProfile | null | undefined,
  now: string | Date = new Date(),
): ArchivePatternScore[] {
  if (!memory?.snapshots.length) return [];
  const currentWeekIndex = weekIndex(weekKeyForDate(now));
  const latestByPattern = new Map<string, InsightMemorySnapshot>();

  for (const snapshot of memory.snapshots) {
    if (weekIndex(snapshot.weekKey) >= currentWeekIndex) continue;
    const existing = latestByPattern.get(snapshot.patternKey);
    if (!existing || weekIndex(snapshot.weekKey) > weekIndex(existing.weekKey) || timestamp(snapshot.observedAt) > timestamp(existing.observedAt)) {
      latestByPattern.set(snapshot.patternKey, snapshot);
    }
  }

  return Array.from(latestByPattern.values()).map(snapshot => ({
    patternKey: snapshot.patternKey,
    title: snapshot.title,
    category: snapshot.category,
    score: snapshot.score / 100,
    confidence: snapshot.confidence,
    movement: movementFromDelta(undefined),
    timeframeDays: 90,
    sources: snapshot.sources,
    evidence: [],
    lastSeenAt: snapshot.observedAt,
  }));
}

export async function getInsightMemoryProfile(): Promise<InsightMemoryProfile> {
  try {
    const memory = await getUserPreference<InsightMemoryProfile | null>(INSIGHT_MEMORY_KEY, null);
    if (memory?.version === 1) {
      return buildInsightMemoryProfile(memory.snapshots);
    }
  } catch {
    return emptyMemory();
  }
  return emptyMemory();
}

export async function recordInsightMemorySnapshots(
  snapshots: Array<InsightMemorySnapshot | null | undefined>,
  now: string | Date = new Date(),
): Promise<InsightMemoryProfile> {
  const validSnapshots = snapshots.filter((snapshot): snapshot is InsightMemorySnapshot => !!snapshot);
  if (!validSnapshots.length) return getInsightMemoryProfile();

  try {
    const existing = await getInsightMemoryProfile();
    const byId = new Map<string, InsightMemorySnapshot>();

    for (const snapshot of [...validSnapshots, ...existing.snapshots]) {
      const existingSnapshot = byId.get(snapshot.id);
      if (!existingSnapshot || timestamp(snapshot.observedAt) >= timestamp(existingSnapshot.observedAt)) {
        byId.set(snapshot.id, snapshot);
      }
    }

    const memory = buildInsightMemoryProfile([...byId.values()], now);
    await saveUserPreference(INSIGHT_MEMORY_KEY, memory);
    return memory;
  } catch (error) {
    logger.warn('[InsightMemory] Failed to record insight memory snapshots:', error);
    return getInsightMemoryProfile();
  }
}

export { weekKeyForDate };
