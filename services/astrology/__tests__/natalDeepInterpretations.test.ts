import { generatePlanetDeepDive, generateHouseDeepDives, generateAngleInterpretations, selectKeyAspects, generatePointInterpretations } from '../natalDeepInterpretations';
import { makeTestChart } from './fixtures';

describe('natalDeepInterpretations', () => {
  const chart = makeTestChart();

  describe('generatePlanetDeepDive()', () => {
    it('returns dive for Sun placement', () => {
      const dive = generatePlanetDeepDive(chart.sun, chart.aspects);
      expect(dive.planet).toBe('Sun');
      expect(dive.sign).toBeTruthy();
      expect(typeof dive.house).toBe('number');
      expect(typeof dive.synthesis).toBe('string');
      expect(dive.synthesis.length).toBeGreaterThan(0);
    });

    it('includes retrograde flag for Saturn', () => {
      const dive = generatePlanetDeepDive(chart.saturn, chart.aspects);
      expect(dive.isRetrograde).toBe(true);
    });

    it('includes dignity information', () => {
      const dive = generatePlanetDeepDive(chart.sun, chart.aspects);
      expect(dive.dignity).toBeDefined();
    });
  });

  describe('generateHouseDeepDives()', () => {
    it('returns 12 house dives', () => {
      const dives = generateHouseDeepDives(chart);
      expect(dives.length).toBe(12);
    });

    it('each dive has house number and theme', () => {
      const dives = generateHouseDeepDives(chart);
      for (const d of dives) {
        expect(d.house).toBeGreaterThanOrEqual(1);
        expect(d.house).toBeLessThanOrEqual(12);
        expect(typeof d.theme).toBe('string');
        expect(typeof d.synthesis).toBe('string');
      }
    });
  });

  describe('generateAngleInterpretations()', () => {
    it('returns interpretations for chart with angles', () => {
      const angles = generateAngleInterpretations(chart);
      expect(Array.isArray(angles)).toBe(true);
      expect(angles.length).toBeGreaterThan(0);
    });

    it('each angle has name and interpretation', () => {
      const angles = generateAngleInterpretations(chart);
      for (const a of angles) {
        expect(typeof a.name).toBe('string');
        expect(typeof a.interpretation).toBe('string');
      }
    });
  });

  describe('selectKeyAspects()', () => {
    it('returns limited number of aspects', () => {
      const key = selectKeyAspects(chart, 5);
      expect(key.length).toBeLessThanOrEqual(5);
    });

    it('each aspect has interpretation', () => {
      const key = selectKeyAspects(chart);
      for (const a of key) {
        expect(typeof a.interpretation).toBe('string');
        expect(typeof a.planet1).toBe('string');
        expect(typeof a.planet2).toBe('string');
      }
    });
  });

  describe('generatePointInterpretations()', () => {
    it('returns array', () => {
      const points = generatePointInterpretations(chart);
      expect(Array.isArray(points)).toBe(true);
    });
  });
});
