import { DREAM_KEYWORDS } from '../dreamKeywords';

describe('dreamKeywords', () => {
  describe('DREAM_KEYWORDS', () => {
    it('has at least 80 entries', () => {
      expect(DREAM_KEYWORDS.length).toBeGreaterThanOrEqual(80);
    });

    it('each entry has id, keywords, meaning, category', () => {
      DREAM_KEYWORDS.slice(0, 15).forEach((entry) => {
        expect(typeof entry.id).toBe('string');
        expect(Array.isArray(entry.keywords)).toBe(true);
        expect(entry.keywords.length).toBeGreaterThan(0);
        expect(typeof entry.meaning).toBe('string');
        expect(typeof entry.category).toBe('string');
      });
    });

    it('all IDs are unique', () => {
      const ids = DREAM_KEYWORDS.map((e) => e.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('keywords are strings', () => {
      DREAM_KEYWORDS.forEach((entry) => {
        entry.keywords.forEach((kw) => {
          expect(typeof kw).toBe('string');
        });
      });
    });

    it('covers multiple categories', () => {
      const cats = new Set(DREAM_KEYWORDS.map((e) => e.category));
      expect(cats.size).toBeGreaterThan(5);
    });
  });
});
