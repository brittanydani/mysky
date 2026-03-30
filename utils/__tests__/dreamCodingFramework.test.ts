import { HALL_VAN_DE_CASTLE_FRAMEWORK } from '../../constants/dreamCodingFramework';

describe('dreamCodingFramework', () => {
  describe('HALL_VAN_DE_CASTLE_FRAMEWORK', () => {
    it('has framework name and version', () => {
      expect(typeof HALL_VAN_DE_CASTLE_FRAMEWORK.framework).toBe('string');
      expect(typeof HALL_VAN_DE_CASTLE_FRAMEWORK.version).toBe('string');
    });

    it('has priority categories', () => {
      expect(Array.isArray(HALL_VAN_DE_CASTLE_FRAMEWORK.priority_categories)).toBe(true);
      expect(HALL_VAN_DE_CASTLE_FRAMEWORK.priority_categories).toContain('characters');
      expect(HALL_VAN_DE_CASTLE_FRAMEWORK.priority_categories).toContain('emotions');
    });

    it('has categories with descriptions and subcategories', () => {
      const cats = HALL_VAN_DE_CASTLE_FRAMEWORK.categories;
      expect(Object.keys(cats).length).toBeGreaterThan(5);
      expect(cats.characters).toBeDefined();
      expect(typeof cats.characters.description).toBe('string');
      expect(typeof cats.characters.subcategories).toBe('object');
    });

    it('characters has expected subcategories', () => {
      const sub = HALL_VAN_DE_CASTLE_FRAMEWORK.categories.characters.subcategories;
      expect(sub).toHaveProperty('family');
      expect(sub).toHaveProperty('strangers');
      expect(Array.isArray(sub.family)).toBe(true);
    });
  });
});
