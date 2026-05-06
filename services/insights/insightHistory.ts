import { GeneratedInsight, InsightHistoryEntry } from './types/knowledgeEngine';
import { getUserPreference, saveUserPreference } from '../storage/userProfileService';
import { logger } from '../../utils/logger';
import { createKnowledgeInsightCopyHash } from './insightHash';
import type { InsightMemoryProfile } from '../insightsV2/memory/insightMemory';
import { toLocalDateString } from '../../utils/dateUtils';

const HISTORY_KEY = 'msky_knowledge_engine_history_v2';
const MAX_HISTORY = 50;
const DEFAULT_RECENT_DAYS = 14;
const DEFAULT_MEMORY_RECENT_DAYS = 30;

export type KnowledgeEngineHistoryInput = {
  recentInsights?: InsightHistoryEntry[];
  recentlyShownPatternKeys: string[];
  recentlyShownCopyHashes: string[];
};

interface RecentlyShownKnowledgeHistoryOptions {
  includeSameDay?: boolean;
}

export function buildRecentlyShownKnowledgeHistory(
  history: InsightHistoryEntry[],
  now: string | Date = new Date(),
  recentDays = DEFAULT_RECENT_DAYS,
  options: RecentlyShownKnowledgeHistoryOptions = {},
): KnowledgeEngineHistoryInput {
  const nowDate = typeof now === 'string' ? new Date(now) : now;
  const nowTime = Number.isFinite(nowDate.getTime()) ? nowDate.getTime() : Date.now();
  const todayKey = toLocalDateString(new Date(nowTime));
  const cutoff = nowTime - recentDays * 86_400_000;

  const recent = history.filter((item) => {
    const shownAt = new Date(item.shownAt);
    const shownTime = shownAt.getTime();
    if (!Number.isFinite(shownTime)) return false;

    // Keep the daily card stable during repeated same-day Home focuses.
    if (!options.includeSameDay && toLocalDateString(shownAt) === todayKey) return false;
    return shownTime >= cutoff && shownTime <= nowTime;
  });

  return {
    recentInsights: recent,
    recentlyShownPatternKeys: Array.from(new Set(recent.map((item) => item.patternKey))),
    recentlyShownCopyHashes: Array.from(new Set(recent.map((item) => item.copyHash))),
  };
}

function timestamp(value: string): number {
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

export function mergeKnowledgeHistoryInputs(
  ...inputs: (KnowledgeEngineHistoryInput | null | undefined)[]
): KnowledgeEngineHistoryInput {
  const recentInsights = inputs
    .flatMap(input => input?.recentInsights ?? [])
    .filter(item => item.patternKey && item.copyHash)
    .sort((a, b) => timestamp(b.shownAt) - timestamp(a.shownAt));

  return {
    recentInsights,
    recentlyShownPatternKeys: Array.from(new Set(
      inputs.flatMap(input => input?.recentlyShownPatternKeys ?? []).filter(Boolean),
    )),
    recentlyShownCopyHashes: Array.from(new Set(
      inputs.flatMap(input => input?.recentlyShownCopyHashes ?? []).filter(Boolean),
    )),
  };
}

export function buildKnowledgeHistoryFromInsightMemory(
  memory: InsightMemoryProfile | null | undefined,
  now: string | Date = new Date(),
  recentDays = DEFAULT_MEMORY_RECENT_DAYS,
): KnowledgeEngineHistoryInput {
  if (!memory?.snapshots.length) {
    return {
      recentInsights: [],
      recentlyShownPatternKeys: [],
      recentlyShownCopyHashes: [],
    };
  }

  const nowDate = typeof now === 'string' ? new Date(now) : now;
  const nowTime = Number.isFinite(nowDate.getTime()) ? nowDate.getTime() : Date.now();
  const cutoff = nowTime - recentDays * 86_400_000;
  const snapshots = memory.snapshots.filter((snapshot) => {
    const observedAt = timestamp(snapshot.observedAt);
    return observedAt >= cutoff && observedAt <= nowTime;
  });

  const recentInsights: InsightHistoryEntry[] = snapshots.map((snapshot, index) => ({
    insightId: snapshot.id || `memory-${index}`,
    patternKey: snapshot.patternKey,
    slot: snapshot.surface,
    surface: snapshot.surface,
    title: snapshot.title,
    shownAt: snapshot.observedAt,
    sourceSignals: snapshot.relatedSignals,
    evidenceHash: JSON.stringify({
      sources: snapshot.sources,
      anchors: snapshot.anchors,
      relatedSignals: snapshot.relatedSignals,
    }),
    copyHash: snapshot.bodyKey ?? snapshot.paragraphId ?? `pattern-${snapshot.patternKey}`,
  }));

  return {
    recentInsights,
    recentlyShownPatternKeys: Array.from(new Set(
      snapshots.map(snapshot => snapshot.patternKey).filter(Boolean),
    )),
    recentlyShownCopyHashes: Array.from(new Set(
      snapshots
        .map(snapshot => snapshot.bodyKey ?? snapshot.paragraphId ?? `pattern-${snapshot.patternKey}`)
        .filter(Boolean),
    )),
  };
}

/**
 * Tracks generated insights to prevent repetition and show movement.
 */
export async function getInsightHistory(): Promise<InsightHistoryEntry[]> {
  try {
    return await getUserPreference(HISTORY_KEY, []);
  } catch {
    return [];
  }
}

export async function recordInsight(insight: GeneratedInsight): Promise<void> {
  try {
    const history = await getInsightHistory();
    const entry: InsightHistoryEntry = {
      insightId: insight.id,
      patternKey: insight.patternKey,
      angleKey: insight.angleKey,
      slot: insight.slot,
      surface: 'today',
      title: insight.title,
      shownAt: insight.createdAt,
      sourceSignals: insight.evidence.map((e) => e.signal).filter((s): s is string => !!s),
      evidenceHash: JSON.stringify(insight.evidence),
      copyHash: createKnowledgeInsightCopyHash(insight),
    };

    const entryDay = toLocalDateString(new Date(entry.shownAt));
    const newHistory = [
      entry,
      ...history.filter((item) => {
        const sameDay = toLocalDateString(new Date(item.shownAt)) === entryDay;
        return !(sameDay && item.patternKey === entry.patternKey && item.title === entry.title);
      }),
    ].slice(0, MAX_HISTORY);
    await saveUserPreference(HISTORY_KEY, newHistory);
  } catch (err) {
    logger.warn('[KnowledgeInsightHistory] Failed to record insight history:', err);
  }
}
