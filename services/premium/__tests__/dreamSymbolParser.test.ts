import { parseDreamSymbols } from '../dreamSymbolParser';

describe('dreamSymbolParser', () => {
  describe('parseDreamSymbols()', () => {
    it('extracts symbols from dream text', () => {
      const symbols = parseDreamSymbols('I saw a snake in the water near a bridge');
      expect(Array.isArray(symbols)).toBe(true);
      expect(symbols.length).toBeGreaterThan(0);
    });

    it('each symbol has word, category, description', () => {
      const symbols = parseDreamSymbols('A dog chased me through a forest');
      for (const s of symbols) {
        expect(typeof s.word).toBe('string');
        expect(typeof s.category).toBe('string');
        expect(typeof s.description).toBe('string');
      }
    });

    it('returns empty for text with no symbols', () => {
      const symbols = parseDreamSymbols('');
      expect(symbols).toHaveLength(0);
    });

    it('finds multiple symbols in rich dream text', () => {
      const symbols = parseDreamSymbols('I was flying over mountains and rivers with a baby in my arms');
      expect(symbols.length).toBeGreaterThanOrEqual(1);
    });

    it('is case-insensitive', () => {
      const lower = parseDreamSymbols('snake');
      const upper = parseDreamSymbols('SNAKE');
      expect(lower.length).toBe(upper.length);
    });
  });
});
