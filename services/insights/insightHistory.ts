import { GeneratedInsight, InsightHistoryEntry } from './types/knowledgeEngine';
import { getUserPreference, saveUserPreference } from '../storage/userProfileService';

const HISTORY_KEY = 'msky_knowledge_engine_history';
const MAX_HISTORY = 50;

/**
 * Tracks generated insights to prevent repetition and show movement.
 */
export async function getInsightHistory(): Promise<InsightHistoryEntry[]> {
  try {
    return getUserPreference(HISTORY_KEY, []);
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
      title: insight.title,
      shownAt: insight.createdAt,
      sourceSignals: insight.evidence.map((e) => e.signal).filter((s): s is string => !!s),
      evidenceHash: JSON.stringify(insight.evidence),
      copyHash: `${insight.observation}:${insight.pattern}`,
    };

    const newHistory = [entry, ...history].slice(0, MAX_HISTORY);
    await saveUserPreference(HISTORY_KEY, newHistory);
  } catch (err) {
    console.error('Failed to record insight history:', err);
  }
}
