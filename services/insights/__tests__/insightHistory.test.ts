import { createCopyHash } from '../../insightsV2/insightFreshness';
import {
  buildKnowledgeHistoryFromInsightMemory,
  buildRecentlyShownKnowledgeHistory,
  mergeKnowledgeHistoryInputs,
} from '../insightHistory';
import { createKnowledgeInsightCopyHash } from '../insightHash';
import type { GeneratedInsight, InsightHistoryEntry } from '../types/knowledgeEngine';
import type { InsightMemoryProfile } from '../../insightsV2/memory/insightMemory';

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

  it('keeps same-day stability on local evening times that cross UTC midnight', () => {
    const localEveningShownAt = new Date(2026, 3, 24, 21, 15).toISOString();
    const localLateNow = new Date(2026, 3, 24, 23, 30).toISOString();
    const sameLocalDay: InsightHistoryEntry = {
      insightId: 'same-local-day-1',
      patternKey: 'pattern-1',
      angleKey: 'angle-1',
      slot: 'whatMySkyNoticed',
      surface: 'today',
      title: 'Same Local Day Insight',
      shownAt: localEveningShownAt,
      sourceSignals: ['signal-1'],
      evidenceHash: 'evidence-1',
      copyHash: 'copy-same-local-day',
    };

    const stableFocus = buildRecentlyShownKnowledgeHistory([sameLocalDay], localLateNow);
    const forcedRefresh = buildRecentlyShownKnowledgeHistory(
      [sameLocalDay],
      localLateNow,
      undefined,
      { includeSameDay: true },
    );

    expect(stableFocus.recentInsights).toEqual([]);
    expect(forcedRefresh.recentInsights).toEqual([sameLocalDay]);
  });

  it('converts longitudinal insight memory into no-repeat history', () => {
    const memory: InsightMemoryProfile = {
      version: 1,
      updatedAt: '2026-04-24T12:00:00Z',
      snapshots: [{
        id: 'snapshot-1',
        observedAt: '2026-04-23T12:00:00Z',
        weekKey: '2026-W17',
        surface: 'patterns',
        rank: 0,
        isPrimary: true,
        patternKey: 'pattern-1',
        title: 'Already Seen',
        category: 'relationships',
        score: 72,
        confidence: 'strong',
        movement: 'repeating',
        paragraphId: 'paragraph-1',
        sources: ['relationshipMirror'],
        relatedSignals: ['tone_sensitivity'],
        anchors: ['tone-shift'],
        bodyKey: 'body-key-1',
      }],
      trends: [],
      whatChangedSinceLastWeek: [],
    };

    const result = buildKnowledgeHistoryFromInsightMemory(memory, '2026-04-24T12:00:00Z');

    expect(result.recentInsights?.[0]).toEqual(expect.objectContaining({
      insightId: 'snapshot-1',
      patternKey: 'pattern-1',
      copyHash: 'body-key-1',
      surface: 'patterns',
    }));
    expect(result.recentlyShownPatternKeys).toEqual(['pattern-1']);
    expect(result.recentlyShownCopyHashes).toEqual(['body-key-1']);
  });

  it('does not permanently suppress older longitudinal memory', () => {
    const memory: InsightMemoryProfile = {
      version: 1,
      updatedAt: '2026-04-24T12:00:00Z',
      snapshots: [{
        id: 'snapshot-1',
        observedAt: '2026-02-01T12:00:00Z',
        weekKey: '2026-W05',
        surface: 'patterns',
        rank: 0,
        isPrimary: true,
        patternKey: 'pattern-1',
        title: 'Recurring Pattern',
        category: 'relationships',
        score: 72,
        confidence: 'strong',
        movement: 'repeating',
        paragraphId: 'paragraph-1',
        sources: ['relationshipMirror'],
        relatedSignals: ['tone_sensitivity'],
        anchors: ['tone-shift'],
        bodyKey: 'body-key-1',
      }],
      trends: [],
      whatChangedSinceLastWeek: [],
    };

    const result = buildKnowledgeHistoryFromInsightMemory(memory, '2026-04-24T12:00:00Z');

    expect(result.recentInsights).toEqual([]);
    expect(result.recentlyShownPatternKeys).toEqual([]);
    expect(result.recentlyShownCopyHashes).toEqual([]);
  });

  it('does not suppress insights from future-dated memory snapshots', () => {
    const memory: InsightMemoryProfile = {
      version: 1,
      updatedAt: '2026-04-24T12:00:00Z',
      snapshots: [{
        id: 'snapshot-future',
        observedAt: '2026-04-25T12:00:00Z',
        weekKey: '2026-W17',
        surface: 'patterns',
        rank: 0,
        isPrimary: true,
        patternKey: 'future-pattern',
        title: 'Future Pattern',
        category: 'relationships',
        score: 72,
        confidence: 'strong',
        movement: 'repeating',
        paragraphId: 'paragraph-1',
        sources: ['relationshipMirror'],
        relatedSignals: ['tone_sensitivity'],
        anchors: ['tone-shift'],
        bodyKey: 'body-key-1',
      }],
      trends: [],
      whatChangedSinceLastWeek: [],
    };

    const result = buildKnowledgeHistoryFromInsightMemory(memory, '2026-04-24T12:00:00Z');

    expect(result.recentInsights).toEqual([]);
    expect(result.recentlyShownPatternKeys).toEqual([]);
    expect(result.recentlyShownCopyHashes).toEqual([]);
  });

  it('merges explicit history with memory-derived history without dropping no-repeat keys', () => {
    const merged = mergeKnowledgeHistoryInputs(
      {
        recentInsights: [],
        recentlyShownPatternKeys: ['pattern-1'],
        recentlyShownCopyHashes: ['copy-1'],
      },
      {
        recentInsights: [],
        recentlyShownPatternKeys: ['pattern-1', 'pattern-2'],
        recentlyShownCopyHashes: ['copy-2'],
      },
    );

    expect(merged.recentlyShownPatternKeys).toEqual(['pattern-1', 'pattern-2']);
    expect(merged.recentlyShownCopyHashes).toEqual(['copy-1', 'copy-2']);
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
