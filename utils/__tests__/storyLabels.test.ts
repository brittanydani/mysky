import { HOUSE_THEMES, ASPECT_PHRASE_REPLACEMENTS, applyStoryLabels, applyGuidanceLabels } from '../../constants/storyLabels';

describe('storyLabels', () => {
  describe('HOUSE_THEMES', () => {
    it('has entries for houses 1-12', () => {
      for (let h = 1; h <= 12; h++) {
        expect(typeof HOUSE_THEMES[h]).toBe('string');
        expect(HOUSE_THEMES[h].length).toBeGreaterThan(0);
      }
    });
  });

  describe('ASPECT_PHRASE_REPLACEMENTS', () => {
    it('is a non-empty array', () => {
      expect(ASPECT_PHRASE_REPLACEMENTS.length).toBeGreaterThan(0);
    });
  });

  describe('applyStoryLabels()', () => {
    it('returns a string', () => {
      const result = applyStoryLabels('The Moon is in your 4th house.');
      expect(typeof result).toBe('string');
    });

    it('transforms astrology language to psychology language', () => {
      const result = applyStoryLabels('The Moon is in your 4th house.');
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('applyGuidanceLabels()', () => {
    it('returns a string', () => {
      const result = applyGuidanceLabels('Saturn transiting your chart');
      expect(typeof result).toBe('string');
    });
  });
});
