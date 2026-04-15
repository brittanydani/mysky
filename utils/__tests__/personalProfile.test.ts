import type { DailyAggregate } from '../../services/insights/types';
import { buildPersonalProfile, detectMaturity } from '../personalProfile';

function makeAggregate(index: number, overrides: Partial<DailyAggregate> = {}): DailyAggregate {
  const day = String((index % 28) + 1).padStart(2, '0');
  return {
    dayKey: `2026-03-${day}`,
    moodAvg: 6,
    energyAvg: 5,
    stressAvg: 4,
    checkInCount: 1,
    tagsUnion: [],
    hasJournalText: false,
    journalCount: 0,
    journalWordCount: 0,
    keywordsUnion: [],
    emotionCountsTotal: {},
    sentimentAvg: null,
    checkInTimestamps: [`2026-03-${day}T12:00:00Z`],
    timeOfDayLabels: ['morning'],
    dayOfWeek: index % 7,
    sleepDurationHours: 7,
    sleepQuality: 3,
    hasDream: false,
    ...overrides,
  };
}

describe('personalProfile', () => {
  it('detects maturity thresholds correctly', () => {
    expect(detectMaturity(5)).toBe('early');
    expect(detectMaturity(14)).toBe('developing');
    expect(detectMaturity(30)).toBe('established');
    expect(detectMaturity(90)).toBe('deep');
  });

  it('builds an established profile with strengths, truths, and today context from aggregates', () => {
    const aggregates = Array.from({ length: 35 }, (_, index) => {
      const isGoodDay = index % 2 === 0;
      return makeAggregate(index, {
        moodAvg: isGoodDay ? 8 : 4,
        energyAvg: isGoodDay ? 7 : 3,
        stressAvg: isGoodDay ? 2 : 8,
        tagsUnion: isGoodDay ? ['nature', 'rest', 'boundaries'] : ['conflict', 'overwhelm', 'screens'],
        keywordsUnion: isGoodDay ? ['clarity', 'repair'] : ['fatigue', 'pressure'],
        sleepQuality: isGoodDay ? 5 : 1,
        sleepDurationHours: isGoodDay ? 8 : 5,
        hasDream: !isGoodDay,
        hasJournalText: true,
        journalCount: 1,
        journalWordCount: isGoodDay ? 250 : 120,
        sentimentAvg: isGoodDay ? 0.7 : -0.5,
      });
    });

    const profile = buildPersonalProfile(aggregates);

    expect(profile.maturity).toBe('established');
    expect(profile.totalDays).toBe(35);
    expect(profile.traits.length).toBeGreaterThan(0);
    expect(profile.personalTruths.length).toBeGreaterThan(0);
    expect(profile.bestDayIngredients.length).toBeGreaterThan(0);
    expect(profile.todayContext.type).toMatch(/anomaly|rough-patch|pattern|baseline/);
    expect(Array.isArray(profile.strengths)).toBe(true);
    expect(Array.isArray(profile.anticipations)).toBe(true);
    expect(Array.isArray(profile.progressMarkers)).toBe(true);
  });
});