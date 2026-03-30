import { JournalPatternAnalyzer } from '../journalPatterns';

describe('journalPatterns', () => {
  describe('getInsightForMood()', () => {
    const moods = ['calm', 'soft', 'okay', 'heavy', 'stormy'];

    it.each(moods)('returns insight for "%s"', (mood) => {
      const insight = JournalPatternAnalyzer.getInsightForMood(mood);
      expect(insight).toBeDefined();
      expect(typeof insight.patternTitle).toBe('string');
      expect(typeof insight.patternDescription).toBe('string');
      expect(typeof insight.gentleQuestion).toBe('string');
    });

    it('returns a fallback for unknown mood', () => {
      const insight = JournalPatternAnalyzer.getInsightForMood('unknown-mood');
      expect(insight).toBeDefined();
      expect(insight.patternTitle).toBeTruthy();
    });
  });

  describe('getWeeklyPattern()', () => {
    it('returns pattern for mixed moods', () => {
      const result = JournalPatternAnalyzer.getWeeklyPattern(['calm', 'soft', 'heavy', 'stormy', 'okay']);
      expect(typeof result.title).toBe('string');
      expect(typeof result.message).toBe('string');
      expect(typeof result.prompt).toBe('string');
      expect(typeof result.dominantMood).toBe('string');
    });

    it('returns pattern for uniform calm moods', () => {
      const result = JournalPatternAnalyzer.getWeeklyPattern(['calm', 'calm', 'calm']);
      expect(result.dominantMood).toBe('calm');
    });

    it('handles single mood array', () => {
      const result = JournalPatternAnalyzer.getWeeklyPattern(['heavy']);
      expect(result).toBeDefined();
      expect(result.dominantMood).toBe('heavy');
    });

    it('handles empty array', () => {
      const result = JournalPatternAnalyzer.getWeeklyPattern([]);
      expect(result).toBeDefined();
    });
  });

  describe('getJournalPrompt()', () => {
    it('returns a string prompt for calm', () => {
      expect(typeof JournalPatternAnalyzer.getJournalPrompt('calm')).toBe('string');
    });

    it('returns a string prompt for stormy', () => {
      expect(typeof JournalPatternAnalyzer.getJournalPrompt('stormy')).toBe('string');
    });

    it('returns non-empty prompt', () => {
      expect(JournalPatternAnalyzer.getJournalPrompt('okay').length).toBeGreaterThan(0);
    });
  });
});
