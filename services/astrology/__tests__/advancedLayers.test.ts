import { analyzeSect, analyzeDecans, detectCriticalDegrees, detectFixedStarConjunctions } from '../advancedLayers';
import { makeTestChart } from './fixtures';

describe('advancedLayers', () => {
  const chart = makeTestChart();

  describe('analyzeSect()', () => {
    it('returns sect analysis for chart with ascendant', () => {
      const sect = analyzeSect(chart);
      expect(sect).not.toBeNull();
      if (sect) {
        expect(typeof sect.isDayChart).toBe('boolean');
        expect(['diurnal', 'nocturnal']).toContain(sect.sect);
        expect(typeof sect.sectLight).toBe('string');
        expect(typeof sect.description).toBe('string');
      }
    });

    it('identifies sect benefic and malefic', () => {
      const sect = analyzeSect(chart);
      if (sect) {
        expect(typeof sect.beneficInSect).toBe('string');
        expect(typeof sect.maleficInSect).toBe('string');
      }
    });

    it('detects combust planets', () => {
      const sect = analyzeSect(chart);
      if (sect) {
        expect(Array.isArray(sect.combustPlanets)).toBe(true);
      }
    });
  });

  describe('analyzeDecans()', () => {
    it('returns decan info for all planets', () => {
      const decans = analyzeDecans(chart);
      expect(Array.isArray(decans)).toBe(true);
      expect(decans.length).toBeGreaterThanOrEqual(10);
    });

    it('each decan has required fields', () => {
      const decans = analyzeDecans(chart);
      for (const d of decans) {
        expect(typeof d.planet).toBe('string');
        expect(typeof d.sign).toBe('string');
        expect([1, 2, 3]).toContain(d.decan);
        expect(typeof d.decanRuler).toBe('string');
        expect(typeof d.description).toBe('string');
      }
    });
  });

  describe('detectCriticalDegrees()', () => {
    it('returns array of critical degree info', () => {
      const cds = detectCriticalDegrees(chart);
      expect(Array.isArray(cds)).toBe(true);
    });

    it('each entry has planet and type', () => {
      const cds = detectCriticalDegrees(chart);
      for (const c of cds) {
        expect(typeof c.planet).toBe('string');
        expect(typeof c.type).toBe('string');
        expect(typeof c.description).toBe('string');
      }
    });
  });

  describe('detectFixedStarConjunctions()', () => {
    it('returns array', () => {
      const stars = detectFixedStarConjunctions(chart);
      expect(Array.isArray(stars)).toBe(true);
    });

    it('each conjunction has star and orb', () => {
      const stars = detectFixedStarConjunctions(chart);
      for (const s of stars) {
        expect(typeof s.planet).toBe('string');
        expect(typeof s.star).toBe('string');
        expect(typeof s.orb).toBe('number');
      }
    });
  });
});
