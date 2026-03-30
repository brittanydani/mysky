import { runPipeline, energyToNum, stressToNum, clamp } from '../pipeline';
import type { DailyCheckIn } from '../../patterns/types';
import type { JournalEntry } from '../../storage/models';

function makeCheckIn(date: string, moodScore: number): DailyCheckIn {
  return {
    id: `ci-${date}`,
    date,
    moodScore,
    energyLevel: 'medium',
    stressLevel: 'low',
    tags: ['work'],
    createdAt: `${date}T12:00:00Z`,
  } as DailyCheckIn;
}

function makeJournalEntry(date: string, text: string): JournalEntry {
  return {
    id: `je-${date}`,
    date,
    text,
    createdAt: `${date}T12:00:00Z`,
  } as unknown as JournalEntry;
}

describe('pipeline', () => {
  describe('energyToNum()', () => {
    it('maps low to 2', () => expect(energyToNum('low')).toBe(2));
    it('maps medium to 5', () => expect(energyToNum('medium')).toBe(5));
    it('maps high to 8', () => expect(energyToNum('high')).toBe(8));
  });

  describe('stressToNum()', () => {
    it('maps low to 2', () => expect(stressToNum('low')).toBe(2));
    it('maps medium to 5', () => expect(stressToNum('medium')).toBe(5));
    it('maps high to 8', () => expect(stressToNum('high')).toBe(8));
  });

  describe('clamp()', () => {
    it('clamps below 1', () => expect(clamp(0)).toBe(1));
    it('clamps above 10', () => expect(clamp(15)).toBe(10));
    it('passes through 5', () => expect(clamp(5)).toBe(5));
  });

  describe('runPipeline()', () => {
    it('returns result for empty input', () => {
      const result = runPipeline({
        checkIns: [],
        journalEntries: [],
        chart: null,
        todayContext: null,
      });
      expect(result.dailyAggregates).toHaveLength(0);
      expect(result.chartProfile).toBeNull();
      expect(result.totalCheckIns).toBe(0);
      expect(result.totalJournalEntries).toBe(0);
    });

    it('aggregates by day', () => {
      const result = runPipeline({
        checkIns: [
          makeCheckIn('2025-01-01', 7),
          makeCheckIn('2025-01-01', 5),
          makeCheckIn('2025-01-02', 8),
        ],
        journalEntries: [],
        chart: null,
        todayContext: null,
      });
      expect(result.dailyAggregates.length).toBe(2);
      expect(result.totalCheckIns).toBe(3);
    });

    it('includes journal entries in aggregation', () => {
      const result = runPipeline({
        checkIns: [makeCheckIn('2025-01-01', 7)],
        journalEntries: [makeJournalEntry('2025-01-01', 'feeling good today')],
        chart: null,
        todayContext: null,
      });
      expect(result.dailyAggregates.length).toBe(1);
      expect(result.totalJournalEntries).toBe(1);
    });
  });
});
