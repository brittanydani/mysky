import { AdvancedJournalAnalyzer } from '../advancedJournal';
import type { JournalEntryMeta } from '../advancedJournal';

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
  });
});
