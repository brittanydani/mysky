// Mock localDb for SQLite-dependent operations
const mockDb = {
  execAsync: jest.fn().mockResolvedValue(undefined),
  getAllAsync: jest.fn().mockResolvedValue([]),
  runAsync: jest.fn().mockResolvedValue({ changes: 0 }),
};

jest.mock('../../storage/localDb', () => ({
  localDb: {
    getDb: jest.fn().mockResolvedValue(mockDb),
  },
}));

import { TodayContentEngine } from '../todayContentEngine';
import { makeTestChart } from '../../astrology/__tests__/fixtures';

describe('TodayContentEngine', () => {
  const chart = makeTestChart();
  const fixedDate = new Date('2025-06-15T10:00:00Z');

  beforeEach(() => {
    jest.clearAllMocks();
    mockDb.getAllAsync.mockResolvedValue([]);
  });

  describe('generateTodayContent', () => {
    it('returns all required content fields', async () => {
      const content = await TodayContentEngine.generateTodayContent(chart, fixedDate);

      expect(typeof content.greeting).toBe('string');
      expect(typeof content.affirmation).toBe('string');
      expect(typeof content.reflection).toBe('string');
      expect(typeof content.cosmicWeather).toBe('string');
      expect(typeof content.affirmationSource).toBe('string');
      expect(typeof content.reflectionSource).toBe('string');
    });

    it('returns non-empty strings for all fields', async () => {
      const content = await TodayContentEngine.generateTodayContent(chart, fixedDate);

      expect(content.greeting.length).toBeGreaterThan(0);
      expect(content.affirmation.length).toBeGreaterThan(0);
      expect(content.reflection.length).toBeGreaterThan(0);
      expect(content.cosmicWeather.length).toBeGreaterThan(0);
    });

    it('is deterministic for the same chart and date', async () => {
      const c1 = await TodayContentEngine.generateTodayContent(chart, fixedDate);
      const c2 = await TodayContentEngine.generateTodayContent(chart, fixedDate);

      expect(c1.affirmation).toBe(c2.affirmation);
      expect(c1.reflection).toBe(c2.reflection);
      expect(c1.cosmicWeather).toBe(c2.cosmicWeather);
    });

    it('produces different content for different dates', async () => {
      const c1 = await TodayContentEngine.generateTodayContent(chart, new Date('2025-01-01T10:00:00Z'));
      const c2 = await TodayContentEngine.generateTodayContent(chart, new Date('2025-07-15T10:00:00Z'));

      // At least one field should differ
      const differs = c1.affirmation !== c2.affirmation ||
        c1.reflection !== c2.reflection ||
        c1.cosmicWeather !== c2.cosmicWeather;
      expect(differs).toBe(true);
    });

    it('accepts optional intensity parameter', async () => {
      const calm = await TodayContentEngine.generateTodayContent(chart, fixedDate, 'calm');
      expect(calm).toBeDefined();
      expect(typeof calm.affirmation).toBe('string');
    });

    it('accepts optional dominantDomain parameter', async () => {
      const content = await TodayContentEngine.generateTodayContent(chart, fixedDate, undefined, 'relationships');
      expect(content).toBeDefined();
    });

    it('accepts optional hasRetrograde parameter', async () => {
      const content = await TodayContentEngine.generateTodayContent(chart, fixedDate, undefined, undefined, true);
      expect(content).toBeDefined();
    });

    it('records shown content to prevent repeats', async () => {
      await TodayContentEngine.generateTodayContent(chart, fixedDate);
      // Should have made runAsync calls to record shown content
      expect(mockDb.runAsync).toHaveBeenCalled();
    });

    it('avoids recently shown content', async () => {
      // Simulate recently shown content IDs
      mockDb.getAllAsync.mockResolvedValue([
        { content_id: 1 }, { content_id: 2 }, { content_id: 3 },
      ]);

      const content = await TodayContentEngine.generateTodayContent(chart, fixedDate);
      expect(content).toBeDefined();
      expect(typeof content.affirmation).toBe('string');
    });
  });
});
