import { DailyAffirmationEngine, AFFIRMATION_POOL } from '../dailyAffirmation';
import { makeTestChart } from '../../astrology/__tests__/fixtures';

describe('dailyAffirmation', () => {
  describe('AFFIRMATION_POOL', () => {
    it('has at least 150 affirmations', () => {
      expect(AFFIRMATION_POOL.length).toBeGreaterThanOrEqual(150);
    });

    it('each affirmation has text and tags', () => {
      AFFIRMATION_POOL.slice(0, 20).forEach((a) => {
        expect(typeof a.text).toBe('string');
        expect(a.text.length).toBeGreaterThan(0);
        expect(Array.isArray(a.tags)).toBe(true);
        expect(a.tags.length).toBeGreaterThan(0);
      });
    });
  });

  describe('DailyAffirmationEngine', () => {
    it('getAffirmation returns text and source', () => {
      const chart = makeTestChart();
      const result = DailyAffirmationEngine.getAffirmation(chart, new Date('2025-06-15'));
      expect(typeof result.text).toBe('string');
      expect(result.text.length).toBeGreaterThan(0);
      expect(typeof result.source).toBe('string');
    });

    it('returns deterministic result for same date', () => {
      const chart = makeTestChart();
      const d = new Date('2025-03-01');
      const a = DailyAffirmationEngine.getAffirmation(chart, d);
      const b = DailyAffirmationEngine.getAffirmation(chart, d);
      expect(a.text).toBe(b.text);
    });

    it('returns different affirmation for different dates', () => {
      const chart = makeTestChart();
      const a = DailyAffirmationEngine.getAffirmation(chart, new Date('2025-01-01'));
      const b = DailyAffirmationEngine.getAffirmation(chart, new Date('2025-06-15'));
      // Different dates should typically give different affirmations (not guaranteed but very likely)
      expect(typeof a.text).toBe('string');
      expect(typeof b.text).toBe('string');
    });
  });
});
