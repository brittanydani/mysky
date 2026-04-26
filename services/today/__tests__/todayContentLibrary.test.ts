import { AFFIRMATION_LIBRARY, getDailyAffirmation } from '../todayContentLibrary';

describe('todayContentLibrary', () => {
  describe('AFFIRMATION_LIBRARY', () => {
    it('has at least 300 affirmations', () => {
      expect(AFFIRMATION_LIBRARY.length).toBeGreaterThanOrEqual(300);
    });

    it('each entry has id, text, and tags', () => {
      AFFIRMATION_LIBRARY.slice(0, 20).forEach((a) => {
        expect(typeof a.id).toBe('number');
        expect(typeof a.text).toBe('string');
        expect(a.text.length).toBeGreaterThan(0);
        expect(Array.isArray(a.tags)).toBe(true);
        expect(a.tags.length).toBeGreaterThan(0);
      });
    });

    it('all IDs are unique', () => {
      const ids = AFFIRMATION_LIBRARY.map((a) => a.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('contains variety of tag types', () => {
      const allTags = new Set(AFFIRMATION_LIBRARY.flatMap((a) => a.tags));
      expect(allTags.size).toBeGreaterThan(10);
    });

    it('uses the daily signal seed to select a fresh post-check-in affirmation', () => {
      const beforeCheckIn = getDailyAffirmation({ mood: 8 });
      const afterCheckIn = getDailyAffirmation({ mood: 8, dailySignalSeed: 1 });

      expect(afterCheckIn.text).not.toBe(beforeCheckIn.text);
    });
  });
});
