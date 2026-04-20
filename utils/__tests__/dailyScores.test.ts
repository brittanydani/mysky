import { scoreDay, scoreDays, buildPatternProfile } from '../dailyScores';
import type { DailyAggregate } from '../../services/insights/types';

function makeAggregate(overrides: Partial<DailyAggregate> = {}): DailyAggregate {
  return {
    dayKey: '2025-04-01',
    moodAvg: 7,
    energyAvg: 6,
    stressAvg: 4,
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
    dayOfWeek: 2,
    sleepDurationHours: 7.5,
    sleepQuality: 4,
    hasDreamText: false,
    dreamCount: 0,
    ...overrides,
  } as DailyAggregate;
}

describe('scoreDay', () => {
  it('returns a ScoredDay with the original aggregate', () => {
    const agg = makeAggregate();
    const result = scoreDay(agg);
    expect(result.aggregate).toBe(agg);
  });

  it('produces scores all in 0–100 range', () => {
    const result = scoreDay(makeAggregate());
    const { stability, restoration, strain, emotionalIntensity, connection } = result.scores;
    for (const score of [stability, restoration, strain, emotionalIntensity, connection]) {
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    }
  });

  it('high mood+energy+low stress → high stability, high restoration, low strain', () => {
    const good = scoreDay(makeAggregate({ moodAvg: 9, energyAvg: 9, stressAvg: 1 }));
    const bad = scoreDay(makeAggregate({ moodAvg: 2, energyAvg: 2, stressAvg: 9 }));
    expect(good.scores.stability).toBeGreaterThan(bad.scores.stability);
    expect(good.scores.restoration).toBeGreaterThan(bad.scores.restoration);
    expect(good.scores.strain).toBeLessThan(bad.scores.strain);
  });

  it('positive connection tags → higher connection score than neutral', () => {
    const social = scoreDay(makeAggregate({ tagsUnion: ['social', 'family'] }));
    const neutral = scoreDay(makeAggregate({ tagsUnion: [] }));
    expect(social.scores.connection).toBeGreaterThan(neutral.scores.connection);
  });

  it('negative connection tags → lower connection score than neutral', () => {
    const isolated = scoreDay(makeAggregate({ tagsUnion: ['loneliness', 'isolation'] }));
    const neutral = scoreDay(makeAggregate({ tagsUnion: [] }));
    expect(isolated.scores.connection).toBeLessThan(neutral.scores.connection);
  });
});

describe('scoreDays', () => {
  it('returns empty array for empty input', () => {
    expect(scoreDays([])).toHaveLength(0);
  });

  it('sorts aggregates by dayKey before scoring', () => {
    const aggs = [
      makeAggregate({ dayKey: '2025-04-03' }),
      makeAggregate({ dayKey: '2025-04-01' }),
      makeAggregate({ dayKey: '2025-04-02' }),
    ];
    const result = scoreDays(aggs);
    expect(result.map((r) => r.scores.dayKey)).toEqual([
      '2025-04-01',
      '2025-04-02',
      '2025-04-03',
    ]);
  });
});

describe('buildPatternProfile', () => {
  it('returns an empty profile for no aggregates', () => {
    const profile = buildPatternProfile([]);
    expect(profile.scoredDays).toHaveLength(0);
    expect(profile.windowDays).toBe(0);
  });

  it('builds a valid profile for a set of aggregates', () => {
    const aggs = Array.from({ length: 10 }, (_, i) =>
      makeAggregate({ dayKey: `2025-04-${String(i + 1).padStart(2, '0')}` }),
    );
    const profile = buildPatternProfile(aggs);
    expect(profile.scoredDays).toHaveLength(10);
    expect(profile.overallAvg).toBeDefined();
    expect(profile.recentAvg).toBeDefined();
  });
});
