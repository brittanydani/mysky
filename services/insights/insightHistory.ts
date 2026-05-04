import { GeneratedInsight, InsightHistoryEntry } from './types/knowledgeEngine';
import { getUserPreference, saveUserPreference } from '../storage/userProfileService';
import { logger } from '../../utils/logger';
import { createKnowledgeInsightCopyHash } from './insightHash';

const HISTORY_KEY = 'msky_knowledge_engine_history_v2';
const MAX_HISTORY = 50;
const DEFAULT_RECENT_DAYS = 14;

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
  const todayKey = new Date(nowTime).toISOString().slice(0, 10);
  const cutoff = nowTime - recentDays * 86_400_000;

  const recent = history.filter((item) => {
    const shownAt = new Date(item.shownAt);
    const shownTime = shownAt.getTime();
    if (!Number.isFinite(shownTime)) return false;

    // Keep the daily card stable during repeated same-day Home focuses.
    if (!options.includeSameDay && shownAt.toISOString().slice(0, 10) === todayKey) return false;
    return shownTime >= cutoff && shownTime <= nowTime;
  });

  return {
    recentInsights: recent,
    recentlyShownPatternKeys: Array.from(new Set(recent.map((item) => item.patternKey))),
    recentlyShownCopyHashes: Array.from(new Set(recent.map((item) => item.copyHash))),
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

    const entryDay = entry.shownAt.slice(0, 10);
    const newHistory = [
      entry,
      ...history.filter((item) => {
        const sameDay = item.shownAt.slice(0, 10) === entryDay;
        return !(sameDay && item.patternKey === entry.patternKey && item.title === entry.title);
      }),
    ].slice(0, MAX_HISTORY);
    await saveUserPreference(HISTORY_KEY, newHistory);
  } catch (err) {
    logger.warn('[KnowledgeInsightHistory] Failed to record insight history:', err);
  }
}
