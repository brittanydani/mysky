import { computeNarrativeInsights } from '../narrativeInsights';
import type { DailyAggregate } from '../../services/insights/types';

function makeAggregate(overrides: Partial<DailyAggregate> = {}): DailyAggregate {
  return {
    dayKey: overrides.dayKey ?? '2026-04-01',
    moodAvg: overrides.moodAvg ?? 7,
    energyAvg: overrides.energyAvg ?? 7,
    stressAvg: overrides.stressAvg ?? 3,
    checkInCount: overrides.checkInCount ?? 1,
    sleepQuality: overrides.sleepQuality ?? 4,
    tagsUnion: overrides.tagsUnion ?? ['relationships'],
    keywordsUnion: overrides.keywordsUnion ?? [],
    emotionCountsTotal: overrides.emotionCountsTotal ?? { calm: 1 },
    hasJournalText: overrides.hasJournalText ?? false,
    journalCount: overrides.journalCount ?? 0,
    journalWordCount: overrides.journalWordCount ?? 0,
    sentimentAvg: overrides.sentimentAvg ?? null,
    checkInTimestamps: overrides.checkInTimestamps ?? ['2026-04-01T08:00:00Z'],
    timeOfDayLabels: overrides.timeOfDayLabels ?? ['morning'],
    dayOfWeek: overrides.dayOfWeek ?? 2,
    sleepDurationHours: overrides.sleepDurationHours ?? 8,
    hasDream: overrides.hasDream ?? false,
  };
}

describe('narrativeInsights', () => {
  it('adds a personalized takeaway to sleep insights', () => {
    const aggregates: DailyAggregate[] = [
      makeAggregate({ dayKey: '2026-04-01', moodAvg: 9, energyAvg: 8, stressAvg: 2, sleepQuality: 5 }),
      makeAggregate({ dayKey: '2026-04-02', moodAvg: 8, energyAvg: 8, stressAvg: 2, sleepQuality: 5 }),
      makeAggregate({ dayKey: '2026-04-03', moodAvg: 8, energyAvg: 7, stressAvg: 3, sleepQuality: 4 }),
      makeAggregate({ dayKey: '2026-04-04', moodAvg: 3, energyAvg: 3, stressAvg: 8, sleepQuality: 1 }),
      makeAggregate({ dayKey: '2026-04-05', moodAvg: 2, energyAvg: 2, stressAvg: 9, sleepQuality: 1 }),
      makeAggregate({ dayKey: '2026-04-06', moodAvg: 3, energyAvg: 3, stressAvg: 7, sleepQuality: 2 }),
      makeAggregate({ dayKey: '2026-04-07', moodAvg: 8, energyAvg: 8, stressAvg: 3, sleepQuality: 5 }),
    ];

    const result = computeNarrativeInsights(aggregates);
    const sleepInsight = result.insights.find((insight) => insight.category === 'sleep_connection');

    expect(sleepInsight).toBeDefined();
    expect(sleepInsight?.takeaway?.label).toBeTruthy();
    expect(sleepInsight?.takeaway?.body).toMatch(/sleep|night|morning|tomorrow/i);
  });
});