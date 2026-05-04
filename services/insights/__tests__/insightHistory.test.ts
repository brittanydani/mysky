import { createCopyHash } from '../../insightsV2/insightFreshness';
import {
  buildRecentlyShownKnowledgeHistory,
} from '../insightHistory';
import { createKnowledgeInsightCopyHash } from '../insightHash';
import type { GeneratedInsight, InsightHistoryEntry } from '../types/knowledgeEngine';

describe('knowledge insight history', () => {
  it('keeps rich recent entries for V2 freshness while preserving key/hash lists', () => {
    const recent: InsightHistoryEntry = {
      insightId: 'recent-1',
      patternKey: 'pattern-1',
      angleKey: 'angle-1',
      slot: 'whatMySkyNoticed',
      surface: 'today',
      title: 'Recent Insight',
      shownAt: '2026-04-22T12:00:00Z',
      sourceSignals: ['signal-1'],
      evidenceHash: 'evidence-1',
      copyHash: 'copy-1',
    };
    const sameDay: InsightHistoryEntry = {
      ...recent,
      insightId: 'same-day-1',
      shownAt: '2026-04-24T08:00:00Z',
      copyHash: 'copy-same-day',
    };
    const old: InsightHistoryEntry = {
      ...recent,
      insightId: 'old-1',
      shownAt: '2026-03-01T12:00:00Z',
      copyHash: 'copy-old',
    };

    const result = buildRecentlyShownKnowledgeHistory(
      [recent, sameDay, old],
      '2026-04-24T12:00:00Z',
    );

    expect(result.recentInsights).toEqual([recent]);
    expect(result.recentlyShownPatternKeys).toEqual(['pattern-1']);
    expect(result.recentlyShownCopyHashes).toEqual(['copy-1']);
  });

  it('can include same-day entries when a new Today signal should force freshness', () => {
    const sameDay: InsightHistoryEntry = {
      insightId: 'same-day-1',
      patternKey: 'pattern-1',
      angleKey: 'angle-1',
      slot: 'whatMySkyNoticed',
      surface: 'today',
      title: 'Same Day Insight',
      shownAt: '2026-04-24T08:00:00Z',
      sourceSignals: ['signal-1'],
      evidenceHash: 'evidence-1',
      copyHash: 'copy-same-day',
    };

    const result = buildRecentlyShownKnowledgeHistory(
      [sameDay],
      '2026-04-24T12:00:00Z',
      undefined,
      { includeSameDay: true },
    );

    expect(result.recentInsights).toEqual([sameDay]);
    expect(result.recentlyShownPatternKeys).toEqual(['pattern-1']);
    expect(result.recentlyShownCopyHashes).toEqual(['copy-same-day']);
  });

  it('uses the V2 copy hash format for newly recorded insight copy', () => {
    const insight = {
      title: 'Low-Capacity Windows',
      observation: 'Low capacity is showing up today.',
      pattern: 'Sleep and energy may be shaping what feels possible.',
      prompt: 'What keeps landing in your lowest-capacity window?',
    } as GeneratedInsight;

    expect(createKnowledgeInsightCopyHash(insight)).toBe(
      createCopyHash(
        'Low-Capacity Windows\nLow capacity is showing up today. Sleep and energy may be shaping what feels possible.\nWhat keeps landing in your lowest-capacity window?',
      ),
    );
  });
});
