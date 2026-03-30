import { selectThemesForDream, THEME_DEFINITIONS } from '../themeDefinitions';
import type { TriggerScore } from '../themeDefinitions';

describe('themeDefinitions', () => {
  describe('THEME_DEFINITIONS', () => {
    it('has 66 themes (22 triggers × 3 variants)', () => {
      expect(THEME_DEFINITIONS.length).toBe(66);
    });

    it('each theme has required fields', () => {
      for (const t of THEME_DEFINITIONS) {
        expect(typeof t.id).toBe('string');
        expect(typeof t.trigger).toBe('string');
        expect(['core', 'somatic', 'relational']).toContain(t.variant);
        expect(typeof t.title).toBe('string');
        expect(typeof t.meaning).toBe('string');
        expect(Array.isArray(t.reflectionQuestions)).toBe(true);
      }
    });
  });

  describe('selectThemesForDream()', () => {
    it('returns theme cards for given scores', () => {
      const topThemes: TriggerScore[] = [
        { trigger: 'exposure', score: 0.8 },
        { trigger: 'shame', score: 0.6 },
      ];
      const cards = selectThemesForDream({ topThemes });
      expect(Array.isArray(cards)).toBe(true);
      expect(cards.length).toBeGreaterThan(0);
    });

    it('respects maxCards', () => {
      const topThemes: TriggerScore[] = [
        { trigger: 'exposure', score: 0.8 },
        { trigger: 'shame', score: 0.6 },
        { trigger: 'control', score: 0.5 },
      ];
      const cards = selectThemesForDream({ topThemes, maxCards: 2 });
      expect(cards.length).toBeLessThanOrEqual(2);
    });

    it('each card has title and reflection question', () => {
      const topThemes: TriggerScore[] = [{ trigger: 'abandonment', score: 0.9 }];
      const cards = selectThemesForDream({ topThemes });
      for (const c of cards) {
        expect(typeof c.title).toBe('string');
        expect(typeof c.reflectionQuestion).toBe('string');
      }
    });

    it('returns empty for empty scores', () => {
      const cards = selectThemesForDream({ topThemes: [] });
      expect(cards).toHaveLength(0);
    });
  });
});
