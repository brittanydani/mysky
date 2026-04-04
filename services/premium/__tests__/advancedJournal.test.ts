import { AdvancedJournalAnalyzer } from '../advancedJournal';
import type { JournalEntryMeta } from '../advancedJournal';

function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function daysAgo(count: number): string {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() - count);
  return formatLocalDate(date);
}

describe('advancedJournal', () => {
  describe('analyzePatterns()', () => {
    const entries: JournalEntryMeta[] = [
      { id: '1', date: '2025-01-01', wordCount: 100, mood: { overall: 4 as any }, tags: ['work', 'stress'] },
      { id: '2', date: '2025-01-02', wordCount: 200, mood: { overall: 3 as any }, tags: ['stress'] },
      { id: '3', date: '2025-01-03', wordCount: 150, mood: { overall: 5 as any }, tags: ['nature', 'calm'] },
      { id: '4', date: '2025-01-04', wordCount: 80, mood: { overall: 2 as any }, tags: ['conflict'] },
      { id: '5', date: '2025-01-05', wordCount: 300, mood: { overall: 4 as any }, tags: ['work'] },
    ];

    it('returns array of pattern insights', () => {
      const patterns = AdvancedJournalAnalyzer.analyzePatterns(entries);
      expect(Array.isArray(patterns)).toBe(true);
    });

    it('returns empty for insufficient data', () => {
      const patterns = AdvancedJournalAnalyzer.analyzePatterns([]);
      expect(patterns).toHaveLength(0);
    });
  });

  describe('generateAnalytics()', () => {
    it('returns analytics for entries', () => {
      const entries: JournalEntryMeta[] = [
        { id: '1', date: '2025-01-01', wordCount: 100, mood: { overall: 4 as any }, tags: ['work'] },
        { id: '2', date: '2025-01-02', wordCount: 200, mood: { overall: 3 as any }, tags: ['calm'] },
        { id: '3', date: '2025-01-03', wordCount: 150, mood: { overall: 5 as any }, tags: ['nature'] },
      ];
      const analytics = AdvancedJournalAnalyzer.generateAnalytics(entries);
      expect(analytics.totalEntries).toBe(3);
      expect(typeof analytics.averageMood).toBe('number');
      expect(Array.isArray(analytics.topTags)).toBe(true);
    });

    it('handles empty entries', () => {
      const analytics = AdvancedJournalAnalyzer.generateAnalytics([]);
      expect(analytics.totalEntries).toBe(0);
    });

    it('computes mood trend from chronological order rather than input order', () => {
      const recentHighMood = Array.from({ length: 7 }, (_, index) => ({
        id: `recent-${index}`,
        date: daysAgo(index),
        wordCount: 100,
        mood: { overall: 5 as const },
        tags: ['recent'],
      }));
      const olderLowMood = Array.from({ length: 7 }, (_, index) => ({
        id: `older-${index}`,
        date: daysAgo(index + 7),
        wordCount: 100,
        mood: { overall: 2 as const },
        tags: ['older'],
      }));

      const shuffledEntries: JournalEntryMeta[] = [
        olderLowMood[3],
        recentHighMood[1],
        olderLowMood[0],
        recentHighMood[6],
        olderLowMood[5],
        recentHighMood[3],
        olderLowMood[2],
        recentHighMood[0],
        olderLowMood[6],
        recentHighMood[4],
        olderLowMood[1],
        recentHighMood[2],
        olderLowMood[4],
        recentHighMood[5],
      ];

      const analytics = AdvancedJournalAnalyzer.generateAnalytics(shuffledEntries);
      expect(analytics.moodTrend).toBe('improving');
    });

    it('counts streaks from unique calendar days', () => {
      const entries: JournalEntryMeta[] = [
        { id: '1', date: daysAgo(0), wordCount: 100, mood: { overall: 4 as const }, tags: [] },
        { id: '2', date: daysAgo(0), wordCount: 120, mood: { overall: 3 as const }, tags: [] },
        { id: '3', date: daysAgo(1), wordCount: 90, mood: { overall: 4 as const }, tags: [] },
        { id: '4', date: daysAgo(3), wordCount: 110, mood: { overall: 2 as const }, tags: [] },
      ];

      const analytics = AdvancedJournalAnalyzer.generateAnalytics(entries);
      expect(analytics.streakDays).toBe(2);
      expect(analytics.longestStreak).toBe(2);
    });
  });

  describe('getTransitInsightForEntry()', () => {
    it('uses non-causal language for known transit insights', () => {
      const insight = AdvancedJournalAnalyzer.getTransitInsightForEntry({
        id: '1',
        date: '2025-01-01',
        wordCount: 120,
        mood: { overall: 2 as const },
        tags: [],
        transitSnapshot: {
          date: '2025-01-01',
          moonSign: 'Cancer',
          moonPhase: 'Full Moon',
          strongestAspects: [
            {
              transitingPlanet: 'Moon',
              natalPlanet: 'Saturn',
              aspectType: 'square',
              orb: 0.4,
            },
          ],
        },
      });

      expect(insight).toContain('may have been colored by');
      expect(insight).not.toContain('because');
    });
  });
});
