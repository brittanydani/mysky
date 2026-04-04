/**
 * journalInsights — unit tests
 *
 * Covers computeMetricTrend, computeAllTrends, computeVolatility,
 * computeAllVolatility, computeKeywordLift, computeEmotionBucketLift,
 * and computeJournalingImpact.
 *
 * All functions are pure — no I/O, no mocking.
 */

import {
  computeMetricTrend,
  computeAllTrends,
  computeVolatility,
  computeAllVolatility,
  computeKeywordLift,
  computeEmotionBucketLift,
  computeJournalingImpact,
  computeWeeklyConsistency,
  computeStreakImpact,
  computeEmotionalProcessing,
} from '../journalInsights';
import type { DailyAggregate } from '../../services/insights/types';

// ─────────────────────────────────────────────────────────────────────────────
// Fixture helpers
// ─────────────────────────────────────────────────────────────────────────────

function makeAggregate(
  dayKey: string,
  overrides: Partial<DailyAggregate> = {},
): DailyAggregate {
  return {
    dayKey,
    moodAvg: 5,
    energyAvg: 5,
    stressAvg: 5,
    checkInCount: 1,
    tagsUnion: [],
    hasJournalText: false,
    journalCount: 0,
    journalWordCount: 0,
    keywordsUnion: [],
    emotionCountsTotal: {},
    sentimentAvg: null,
    checkInTimestamps: [],
    timeOfDayLabels: [],
    dayOfWeek: 0,
    sleepDurationHours: null,
    sleepQuality: null,
    hasDream: false,
    ...overrides,
  };
}

/** Create N aggregates with sequential day keys starting from a base date. */
function makeAggregates(
  n: number,
  base: Partial<DailyAggregate> = {},
  startDate = '2026-01-01',
): DailyAggregate[] {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(startDate + 'T12:00:00');
    d.setDate(d.getDate() + i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return makeAggregate(key, base);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// computeMetricTrend
// ─────────────────────────────────────────────────────────────────────────────

describe('computeMetricTrend', () => {
  it('returns stable with fewer than 2 values', () => {
    const result = computeMetricTrend([5], 'moodAvg');
    expect(result.direction).toBe('stable');
    expect(result.slope).toBe(0);
  });

  it('detects an upward trend via regression (>=10 points)', () => {
    // Strictly increasing values: slope >> 0.03/day
    const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const result = computeMetricTrend(values, 'moodAvg');
    expect(result.direction).toBe('up');
    expect(result.method).toBe('regression');
  });

  it('detects a downward trend via regression (>=10 points)', () => {
    const values = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
    const result = computeMetricTrend(values, 'stressAvg');
    expect(result.direction).toBe('down');
  });

  it('detects stable trend via regression when values are flat', () => {
    const values = Array(10).fill(5);
    const result = computeMetricTrend(values, 'moodAvg');
    expect(result.direction).toBe('stable');
  });

  it('uses split_delta method for <10 points', () => {
    const values = [3, 3, 3, 8, 8, 8]; // large delta
    const result = computeMetricTrend(values, 'moodAvg');
    expect(result.method).toBe('split_delta');
  });

  it('detects up via split_delta when delta >= 0.6', () => {
    // First half avg = 2, second half avg = 8 → delta = 6 >= 0.6
    const values = [2, 2, 8, 8];
    const result = computeMetricTrend(values, 'moodAvg');
    expect(result.direction).toBe('up');
  });

  it('detects down via split_delta when delta <= -0.6', () => {
    const values = [8, 8, 2, 2];
    const result = computeMetricTrend(values, 'moodAvg');
    expect(result.direction).toBe('down');
  });

  it('returns stable via split_delta for small delta', () => {
    const values = [5, 5, 5.2, 5.1];
    const result = computeMetricTrend(values, 'moodAvg');
    expect(result.direction).toBe('stable');
  });

  it('includes metric name in result', () => {
    const result = computeMetricTrend([1, 2, 3], 'stressAvg');
    expect(result.metric).toBe('stressAvg');
  });

  it('displayChange has sign prefix for positive change', () => {
    const values = [2, 2, 8, 8]; // up
    const result = computeMetricTrend(values, 'moodAvg');
    expect(result.displayChange.startsWith('+')).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// computeAllTrends
// ─────────────────────────────────────────────────────────────────────────────

describe('computeAllTrends', () => {
  it('returns 5 trend items', () => {
    const aggs = makeAggregates(5, { journalCount: 1, journalWordCount: 100 });
    const result = computeAllTrends(aggs);
    expect(result).toHaveLength(5);
  });

  it('includes moodAvg, stressAvg, energyAvg, journalCount, journalWordCount', () => {
    const aggs = makeAggregates(5);
    const metrics = computeAllTrends(aggs).map(t => t.metric);
    expect(metrics).toContain('moodAvg');
    expect(metrics).toContain('stressAvg');
    expect(metrics).toContain('energyAvg');
    expect(metrics).toContain('journalCount');
    expect(metrics).toContain('journalWordCount');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// computeVolatility
// ─────────────────────────────────────────────────────────────────────────────

describe('computeVolatility', () => {
  it('returns low level with fewer than 2 values', () => {
    const result = computeVolatility([5], 'mood');
    expect(result.level).toBe('low');
    expect(result.stddev).toBe(0);
  });

  it('returns low for constant values', () => {
    const result = computeVolatility(Array(10).fill(5), 'mood');
    expect(result.level).toBe('low');
  });

  it('returns high for wildly varying values', () => {
    // std dev of [1,10,1,10,...] is large
    const values = Array.from({ length: 10 }, (_, i) => (i % 2 === 0 ? 1 : 10));
    const result = computeVolatility(values, 'mood');
    expect(result.level).toBe('high');
  });

  it('returns moderate for mildly varying values', () => {
    // std dev around 1.5–2.1
    const values = [4, 5, 6, 5, 4, 6, 5, 4, 6, 5];
    const result = computeVolatility(values, 'mood');
    expect(['moderate', 'low']).toContain(result.level);
  });

  it('includes metric name', () => {
    const result = computeVolatility([1, 2, 3], 'stress');
    expect(result.metric).toBe('stress');
  });

  it('respects custom thresholds', () => {
    // tight thresholds — small std dev is already 'high'
    const result = computeVolatility([4, 5, 6], 'mood', { low: 0.1, high: 0.5 });
    expect(result.level).toBe('high');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// computeAllVolatility
// ─────────────────────────────────────────────────────────────────────────────

describe('computeAllVolatility', () => {
  it('always includes mood and stress', () => {
    const aggs = makeAggregates(5);
    const result = computeAllVolatility(aggs);
    const metrics = result.map(r => r.metric);
    expect(metrics).toContain('mood');
    expect(metrics).toContain('stress');
  });

  it('includes sentiment when >=5 days have sentimentAvg', () => {
    const aggs = makeAggregates(6, { sentimentAvg: 0.2 });
    const result = computeAllVolatility(aggs);
    const metrics = result.map(r => r.metric);
    expect(metrics).toContain('sentiment');
  });

  it('omits sentiment when <5 days have sentimentAvg', () => {
    const aggs = makeAggregates(10); // sentimentAvg: null by default
    const result = computeAllVolatility(aggs);
    const metrics = result.map(r => r.metric);
    expect(metrics).not.toContain('sentiment');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// computeKeywordLift
// ─────────────────────────────────────────────────────────────────────────────

describe('computeKeywordLift', () => {
  it('returns hasData=false with fewer than 10 aggregates', () => {
    const aggs = makeAggregates(5);
    const result = computeKeywordLift(aggs);
    expect(result.hasData).toBe(false);
    expect(result.confidence).toBe('low');
  });

  it('returns empty restores/drains when no keywords appear in data', () => {
    const aggs = makeAggregates(20);
    const result = computeKeywordLift(aggs);
    expect(result.restores).toHaveLength(0);
    expect(result.drains).toHaveLength(0);
  });

  it('identifies restoring keywords that appear more on best days', () => {
    // 21 days: top 20% (5 days) have high mood. The keyword 'exercise' only
    // appears on high-mood days → should be in restores.
    const aggs = Array.from({ length: 21 }, (_, i) => {
      const key = `2026-01-${String(i + 1).padStart(2, '0')}`;
      return makeAggregate(key, {
        moodAvg: i < 5 ? 9 : 3,
        stressAvg: 3,
        keywordsUnion: i < 5 ? ['exercise'] : [],
        journalCount: 1,
      });
    });
    const result = computeKeywordLift(aggs);
    // exercise appears only on best days → should be a restore
    const restoreLabels = result.restores.map(r => r.label);
    expect(restoreLabels).toContain('exercise');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// computeEmotionBucketLift
// ─────────────────────────────────────────────────────────────────────────────

describe('computeEmotionBucketLift', () => {
  it('returns empty array with fewer than 10 aggregates', () => {
    const aggs = makeAggregates(5);
    expect(computeEmotionBucketLift(aggs)).toEqual([]);
  });

  it('identifies emotions that appear more on hard days', () => {
    const aggs = Array.from({ length: 21 }, (_, i) => {
      const key = `2026-01-${String(i + 1).padStart(2, '0')}`;
      return makeAggregate(key, {
        moodAvg: i >= 16 ? 2 : 8,  // last 5 days = hard
        stressAvg: i >= 16 ? 9 : 2, // last 5 days = high stress
        emotionCountsTotal: i >= 16 ? { anxiety: 4 } : {},
      });
    });
    const result = computeEmotionBucketLift(aggs);
    const cats = result.map(r => r.category);
    expect(cats).toContain('anxiety');
  });

  it('returns items sorted by absolute lift descending', () => {
    const aggs = Array.from({ length: 21 }, (_, i) => {
      const key = `2026-01-${String(i + 1).padStart(2, '0')}`;
      return makeAggregate(key, {
        moodAvg: i < 5 ? 9 : 3,
        stressAvg: 3,
        emotionCountsTotal: i < 5 ? { joy: 5, calm: 5 } : {},
      });
    });
    const result = computeEmotionBucketLift(aggs);
    for (let i = 1; i < result.length; i++) {
      expect(Math.abs(result[i - 1].lift)).toBeGreaterThanOrEqual(Math.abs(result[i].lift));
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// computeJournalingImpact
// ─────────────────────────────────────────────────────────────────────────────

describe('computeJournalingImpact', () => {
  it('returns null with insufficient data in either group', () => {
    const aggs = makeAggregates(10);
    expect(computeJournalingImpact(aggs)).toBeNull();
  });

  it('returns a card when both journal and non-journal groups have >=6 days', () => {
    const journalDays = makeAggregates(6, { journalCount: 1, journalWordCount: 200 });
    journalDays.forEach((d, i) => { d.moodAvg = 6.5 + (i % 2 === 0 ? 0.5 : -0.5); });
    const noJournalDays = makeAggregates(6, { journalCount: 0, journalWordCount: 0 }, '2026-02-01');
    noJournalDays.forEach((d, i) => { d.moodAvg = 3.5 + (i % 2 === 0 ? 0.5 : -0.5); });
    const aggs = [...journalDays, ...noJournalDays];
    const result = computeJournalingImpact(aggs);
    expect(result).not.toBeNull();
    expect(result!.type).toBe('journaling_vs_not');
  });

  it('null when journal days < 4', () => {
    const aggs = [
      ...makeAggregates(3, { journalCount: 1 }),
      ...makeAggregates(10, { journalCount: 0 }, '2026-02-01'),
    ];
    expect(computeJournalingImpact(aggs)).toBeNull();
  });

  it('null when non-journal days < 4', () => {
    const aggs = [
      ...makeAggregates(10, { journalCount: 1 }),
      ...makeAggregates(3, { journalCount: 0 }, '2026-02-01'),
    ];
    expect(computeJournalingImpact(aggs)).toBeNull();
  });

  it('includes effect size and next-day data', () => {
    const journalDays = makeAggregates(8, { journalCount: 1, journalWordCount: 200 });
    journalDays.forEach((d, i) => { d.moodAvg = 7.5 + (i % 2 === 0 ? 0.5 : -0.5); });
    const noJournalDays = makeAggregates(8, { journalCount: 0, journalWordCount: 0 }, '2026-02-01');
    noJournalDays.forEach((d, i) => { d.moodAvg = 3.5 + (i % 2 === 0 ? 0.5 : -0.5); });
    const aggs = [...journalDays, ...noJournalDays];
    const result = computeJournalingImpact(aggs);
    expect(result).not.toBeNull();
    expect(result!.data.effectSize).toBeDefined();
    expect(typeof result!.data.effectSize).toBe('number');
    expect(result!.stat).toMatch(/effect/);
  });

  it('uses associative rather than causal wording', () => {
    const journalDays = makeAggregates(8, { journalCount: 1, journalWordCount: 200 });
    journalDays.forEach((d, i) => { d.moodAvg = 7.5 + (i % 2 === 0 ? 0.5 : -0.5); });
    const noJournalDays = makeAggregates(8, { journalCount: 0, journalWordCount: 0 }, '2026-02-01');
    noJournalDays.forEach((d, i) => { d.moodAvg = 3.5 + (i % 2 === 0 ? 0.5 : -0.5); });

    const result = computeJournalingImpact([...journalDays, ...noJournalDays]);
    expect(result).not.toBeNull();
    expect(result!.insight).toMatch(/tend to|often|suggest/i);
    expect(result!.insight).not.toMatch(/lifts your mood|benefits from journaling/i);
  });

  it('returns null when effect size is negligible', () => {
    // Mood difference exists (5.1 vs 5.0) but effect size is tiny
    const aggs = [
      ...makeAggregates(6, { journalCount: 1, moodAvg: 5.1 }),
      ...makeAggregates(6, { journalCount: 0, moodAvg: 5.0 }, '2026-02-01'),
    ];
    expect(computeJournalingImpact(aggs)).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// computeWeeklyConsistency
// ─────────────────────────────────────────────────────────────────────────────

describe('computeWeeklyConsistency', () => {
  it('returns null when there are not at least two consistent and two inconsistent weeks', () => {
    const aggs = [
      ...makeAggregates(7, { journalCount: 1, moodAvg: 6 }, '2026-01-01'),
      ...makeAggregates(7, { journalCount: 0, moodAvg: 4 }, '2026-01-08'),
      ...makeAggregates(7, { journalCount: 1, moodAvg: 6.2 }, '2026-01-15'),
    ];

    expect(computeWeeklyConsistency(aggs)).toBeNull();
  });

  it('returns a card when there are enough week groups on both sides', () => {
    const consistentWeek1 = makeAggregates(7, { journalCount: 1, moodAvg: 6.4 }, '2026-01-05');
    const inconsistentWeek1 = makeAggregates(7, { journalCount: 0, moodAvg: 4.2 }, '2026-01-12');
    const consistentWeek2 = makeAggregates(7, { journalCount: 1, moodAvg: 6.1 }, '2026-01-19');
    const inconsistentWeek2 = makeAggregates(7, { journalCount: 0, moodAvg: 4.0 }, '2026-01-26');

    const result = computeWeeklyConsistency([
      ...consistentWeek1,
      ...inconsistentWeek1,
      ...consistentWeek2,
      ...inconsistentWeek2,
    ]);

    expect(result).not.toBeNull();
    expect(result!.type).toBe('weekly_consistency');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// computeStreakImpact
// ─────────────────────────────────────────────────────────────────────────────

describe('computeStreakImpact', () => {
  it('returns null with fewer than 5 journal days', () => {
    const aggs = makeAggregates(10, { journalCount: 0 });
    // Only 3 journal days
    aggs[0].journalCount = 1;
    aggs[1].journalCount = 1;
    aggs[2].journalCount = 1;
    expect(computeStreakImpact(aggs)).toBeNull();
  });

  it('returns a card when streak and isolated days both have >= 3 days', () => {
    // 5 consecutive journal days (days 1-5) → days 2-5 are streak, day 1 is isolated
    // Plus 3 isolated journal days with gaps
    const aggs = makeAggregates(14);
    // Consecutive streak: days 0-4
    for (let i = 0; i < 5; i++) {
      aggs[i].journalCount = 1;
      aggs[i].moodAvg = 8;
    }
    // Isolated days: 6, 8, 10 (gaps between them)
    aggs[6].journalCount = 1;
    aggs[6].moodAvg = 5;
    aggs[8].journalCount = 1;
    aggs[8].moodAvg = 5;
    aggs[10].journalCount = 1;
    aggs[10].moodAvg = 5;

    const result = computeStreakImpact(aggs);
    expect(result).not.toBeNull();
    expect(result!.type).toBe('streak_impact');
    expect(result!.data.streakDays).toBeGreaterThanOrEqual(3);
  });

  it('returns null when not enough isolated days', () => {
    // All 5 journal days consecutive → 4 streak + 1 isolated = not enough isolated
    const aggs = makeAggregates(10);
    for (let i = 0; i < 5; i++) {
      aggs[i].journalCount = 1;
    }
    expect(computeStreakImpact(aggs)).toBeNull();
  });

  it('uses comparative rather than causal wording', () => {
    const aggs = makeAggregates(14);
    for (let i = 0; i < 5; i++) {
      aggs[i].journalCount = 1;
      aggs[i].moodAvg = 8;
    }
    aggs[6].journalCount = 1;
    aggs[6].moodAvg = 5;
    aggs[8].journalCount = 1;
    aggs[8].moodAvg = 5;
    aggs[10].journalCount = 1;
    aggs[10].moodAvg = 5;

    const result = computeStreakImpact(aggs);
    expect(result).not.toBeNull();
    expect(result!.insight).toMatch(/tends to|looks fairly small/i);
    expect(result!.insight).not.toMatch(/lifts your mood|benefits from journaling/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// computeEmotionalProcessing
// ─────────────────────────────────────────────────────────────────────────────

describe('computeEmotionalProcessing', () => {
  it('returns null with fewer than 6 journal days with emotions', () => {
    const aggs = makeAggregates(10, {
      journalCount: 1,
      emotionCountsTotal: { joy: 1 },
    });
    // Only 5 with emotions
    aggs.length = 5;
    expect(computeEmotionalProcessing(aggs)).toBeNull();
  });

  it('returns a card when enough days have varied emotion depth', () => {
    const aggs: DailyAggregate[] = [];
    // 4 days with deep emotions (5 distinct) — above median
    for (let i = 0; i < 4; i++) {
      const d = new Date('2026-01-01T12:00:00');
      d.setDate(d.getDate() + i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      aggs.push(makeAggregate(key, {
        journalCount: 1,
        moodAvg: 7,
        stressAvg: 3,
        emotionCountsTotal: { joy: 2, gratitude: 1, calm: 1, hope: 1, curiosity: 1 },
      }));
    }
    // 2 days with medium emotions (2 distinct) — at/near median
    for (let i = 4; i < 6; i++) {
      const d = new Date('2026-01-01T12:00:00');
      d.setDate(d.getDate() + i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      aggs.push(makeAggregate(key, {
        journalCount: 1,
        moodAvg: 5,
        stressAvg: 5,
        emotionCountsTotal: { sadness: 1, fatigue: 1 },
      }));
    }
    // 4 days with shallow emotions (1 distinct) — below median
    for (let i = 6; i < 10; i++) {
      const d = new Date('2026-01-01T12:00:00');
      d.setDate(d.getDate() + i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      aggs.push(makeAggregate(key, {
        journalCount: 1,
        moodAvg: 4,
        stressAvg: 7,
        emotionCountsTotal: { anxiety: 1 },
      }));
    }

    const result = computeEmotionalProcessing(aggs);
    expect(result).not.toBeNull();
    expect(result!.type).toBe('emotional_processing');
    expect(result!.data.deepDays).toBeGreaterThanOrEqual(3);
    expect(result!.data.shallowDays).toBeGreaterThanOrEqual(3);
  });

  it('returns null when no entries have emotions', () => {
    const aggs = makeAggregates(10, {
      journalCount: 1,
      emotionCountsTotal: {},
    });
    expect(computeEmotionalProcessing(aggs)).toBeNull();
  });
});
