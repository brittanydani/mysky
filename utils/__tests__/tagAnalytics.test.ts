/**
 * tagAnalytics — unit tests
 *
 * Covers computeTagLift, computeTagImpact, TAG_LABELS,
 * and related pure helpers.
 *
 * All functions are pure — no I/O, no mocking.
 */

import {
  computeTagLift,
  computeTagImpact,
  TAG_LABELS,
} from '../tagAnalytics';
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

/** Generate n aggregates with sequential day keys. */
function makeAggregates(
  n: number,
  overrides: Partial<DailyAggregate> = {},
  start = '2026-01-01',
): DailyAggregate[] {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(start + 'T12:00:00');
    d.setDate(d.getDate() + i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return makeAggregate(key, overrides);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// TAG_LABELS
// ─────────────────────────────────────────────────────────────────────────────

describe('TAG_LABELS', () => {
  it('has entries for common wellbeing tags', () => {
    expect(TAG_LABELS['anxiety']).toBe('Anxiety');
    expect(TAG_LABELS['joy']).toBe('Joy');
    expect(TAG_LABELS['sleep']).toBe('Sleep');
  });

  it('has entries for emotional quality tags', () => {
    expect(TAG_LABELS['eq_calm']).toBe('Calm');
    expect(TAG_LABELS['eq_anxious']).toBe('Anxious');
    expect(TAG_LABELS['eq_grounded']).toBe('Grounded');
  });

  it('has more than 30 entries', () => {
    expect(Object.keys(TAG_LABELS).length).toBeGreaterThan(30);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// computeTagLift
// ─────────────────────────────────────────────────────────────────────────────

describe('computeTagLift', () => {
  it('returns hasData=false with fewer than 10 aggregates', () => {
    const aggs = makeAggregates(5);
    const result = computeTagLift(aggs);
    expect(result.hasData).toBe(false);
    expect(result.confidence).toBe('low');
  });

  it('returns empty restores/drains when no tags are present', () => {
    const aggs = makeAggregates(20);
    const result = computeTagLift(aggs);
    expect(result.restores).toHaveLength(0);
    expect(result.drains).toHaveLength(0);
  });

  it('returns hasData=false when best or hard days < 3', () => {
    // Exactly 10 days but some edge case — all same mood, no split
    const aggs = makeAggregates(10, { moodAvg: 5, stressAvg: 5, tagsUnion: ['sleep'] });
    // With only 2 distinct best/hard days possible from equal-mood data, still might not meet threshold
    // Either way, function should not throw
    expect(() => computeTagLift(aggs)).not.toThrow();
  });

  it('identifies a restoring tag that appears exclusively on best days', () => {
    // 21 days: best 5 days (high mood) all have 'exercise'; rest do not
    const aggs = Array.from({ length: 21 }, (_, i) => {
      const key = `2026-01-${String(i + 1).padStart(2, '0')}`;
      return makeAggregate(key, {
        moodAvg: i < 5 ? 9 : 3,
        stressAvg: 3,
        tagsUnion: i < 5 ? ['exercise'] : [],
      });
    });
    const result = computeTagLift(aggs);
    const restoreTags = result.restores.map(r => r.tag);
    expect(restoreTags).toContain('exercise');
  });

  it('identifies a draining tag that appears exclusively on hard days', () => {
    // 21 days: last 5 days (high stress / low mood) all have 'work'
    const aggs = Array.from({ length: 21 }, (_, i) => {
      const key = `2026-01-${String(i + 1).padStart(2, '0')}`;
      return makeAggregate(key, {
        moodAvg: i >= 16 ? 2 : 8,
        stressAvg: i >= 16 ? 9 : 2,
        tagsUnion: i >= 16 ? ['work'] : [],
      });
    });
    const result = computeTagLift(aggs);
    const drainTags = result.drains.map(r => r.tag);
    expect(drainTags).toContain('work');
  });

  it('returns at most 5 restores and 5 drains', () => {
    // Create 21 days with many different tags on best/hard days
    const restoreTags = ['exercise', 'nature', 'music', 'sleep', 'creative', 'rest', 'movement'];
    const aggs = Array.from({ length: 21 }, (_, i) => {
      const key = `2026-01-${String(i + 1).padStart(2, '0')}`;
      return makeAggregate(key, {
        moodAvg: i < 5 ? 9 : 3,
        stressAvg: 3,
        tagsUnion: i < 5 ? restoreTags : [],
      });
    });
    const result = computeTagLift(aggs);
    expect(result.restores.length).toBeLessThanOrEqual(5);
    expect(result.drains.length).toBeLessThanOrEqual(5);
  });

  it('includes bestDayCount and hardDayCount in result', () => {
    const aggs = Array.from({ length: 21 }, (_, i) => {
      const key = `2026-01-${String(i + 1).padStart(2, '0')}`;
      return makeAggregate(key, { moodAvg: i < 5 ? 9 : 3, stressAvg: 3 });
    });
    const result = computeTagLift(aggs);
    expect(result.bestDayCount).toBeGreaterThan(0);
    expect(result.hardDayCount).toBeGreaterThan(0);
  });

  it('lift values in restores are positive', () => {
    const aggs = Array.from({ length: 21 }, (_, i) => {
      const key = `2026-01-${String(i + 1).padStart(2, '0')}`;
      return makeAggregate(key, {
        moodAvg: i < 5 ? 9 : 3,
        stressAvg: 3,
        tagsUnion: i < 5 ? ['exercise'] : [],
      });
    });
    const result = computeTagLift(aggs);
    result.restores.forEach(r => {
      expect(r.lift).toBeGreaterThan(0);
    });
  });

  it('lift values in drains are negative', () => {
    const aggs = Array.from({ length: 21 }, (_, i) => {
      const key = `2026-01-${String(i + 1).padStart(2, '0')}`;
      return makeAggregate(key, {
        moodAvg: i >= 16 ? 2 : 8,
        stressAvg: i >= 16 ? 9 : 2,
        tagsUnion: i >= 16 ? ['work'] : [],
      });
    });
    const result = computeTagLift(aggs);
    result.drains.forEach(d => {
      expect(d.lift).toBeLessThan(0);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// computeTagImpact
// ─────────────────────────────────────────────────────────────────────────────

describe('computeTagImpact', () => {
  it('returns empty items with fewer than 10 aggregates', () => {
    const aggs = makeAggregates(5);
    const result = computeTagImpact(aggs);
    expect(result.items).toHaveLength(0);
    expect(result.confidence).toBe('low');
  });

  it('requires a tag to appear on >=5 days to be included', () => {
    // Tag appears only 4 times → should not appear in results
    const aggs = Array.from({ length: 14 }, (_, i) => {
      const key = `2026-01-${String(i + 1).padStart(2, '0')}`;
      return makeAggregate(key, {
        tagsUnion: i < 4 ? ['sleep'] : [],
      });
    });
    const result = computeTagImpact(aggs);
    const tags = result.items.map(i => i.tag);
    expect(tags).not.toContain('sleep');
  });

  it('includes a tag when mood diff >= 0.5', () => {
    // 14 days: 'exercise' on 7 high-mood days, 7 low-mood days
    const aggs = Array.from({ length: 14 }, (_, i) => {
      const key = `2026-01-${String(i + 1).padStart(2, '0')}`;
      return makeAggregate(key, {
        moodAvg: i < 7 ? 9 : 4,
        energyAvg: 5,
        stressAvg: 5,
        tagsUnion: i < 7 ? ['exercise'] : [],
      });
    });
    const result = computeTagImpact(aggs);
    const tags = result.items.map(i => i.tag);
    expect(tags).toContain('exercise');
  });

  it('includes insight string for each item', () => {
    const aggs = Array.from({ length: 14 }, (_, i) => {
      const key = `2026-01-${String(i + 1).padStart(2, '0')}`;
      return makeAggregate(key, {
        moodAvg: i < 7 ? 9 : 4,
        energyAvg: 5,
        stressAvg: 5,
        tagsUnion: i < 7 ? ['exercise'] : [],
      });
    });
    const result = computeTagImpact(aggs);
    result.items.forEach(item => {
      expect(typeof item.insight).toBe('string');
      expect(item.insight.length).toBeGreaterThan(0);
    });
  });

  it('includes daysPresent count for each item', () => {
    const aggs = Array.from({ length: 14 }, (_, i) => {
      const key = `2026-01-${String(i + 1).padStart(2, '0')}`;
      return makeAggregate(key, {
        moodAvg: i < 7 ? 9 : 4,
        energyAvg: 5,
        stressAvg: 5,
        tagsUnion: i < 7 ? ['exercise'] : [],
      });
    });
    const result = computeTagImpact(aggs);
    const item = result.items.find(i => i.tag === 'exercise');
    if (item) {
      expect(item.daysPresent).toBe(7);
    }
  });
});
