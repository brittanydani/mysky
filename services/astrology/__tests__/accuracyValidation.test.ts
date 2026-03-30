// Mock the ephemeris library
jest.mock('ephemeris', () => ({
  __esModule: true,
  default: {
    getAllPlanets: jest.fn((date: Date) => {
      // Return mock reference data with realistic longitudes
      return {
        observed: {
          sun: { apparentLongitudeDd: 354.5 },
          moon: { apparentLongitudeDd: 157.8 },
          mercury: { apparentLongitudeDd: 340.2 },
          venus: { apparentLongitudeDd: 10.1 },
          mars: { apparentLongitudeDd: 200.4 },
          jupiter: { apparentLongitudeDd: 100.3 },
          saturn: { apparentLongitudeDd: 290.1 },
          uranus: { apparentLongitudeDd: 280.05 },
          neptune: { apparentLongitudeDd: 285.02 },
          pluto: { apparentLongitudeDd: 225.01 },
        },
      };
    }),
  },
}));

import { compareWithReferenceEphemeris } from '../accuracyValidation';
import type { BirthData, PlanetPosition } from '../types';

describe('accuracyValidation', () => {
  const birthData: BirthData = {
    date: '1990-03-15',
    time: '14:30',
    hasUnknownTime: false,
    place: 'New York, NY',
    latitude: 40.7128,
    longitude: -74.006,
  };

  const makePosition = (planet: string, sign: string, degree: number, absoluteDegree: number): PlanetPosition => ({
    planet,
    sign,
    degree,
    absoluteDegree,
    isRetrograde: false,
  });

  describe('compareWithReferenceEphemeris', () => {
    it('returns a comparison result with expected shape', () => {
      const planets: PlanetPosition[] = [
        makePosition('Sun', 'Pisces', 24.5, 354.5),
        makePosition('Moon', 'Virgo', 7.8, 157.8),
      ];

      const result = compareWithReferenceEphemeris(birthData, planets);

      expect(result.reference).toBe('ephemeris');
      expect(typeof result.maxDifference).toBe('number');
      expect(typeof result.isWithinStandards).toBe('boolean');
      expect(Array.isArray(result.comparisons)).toBe(true);
    });

    it('reports within standards when calculated matches reference', () => {
      const planets: PlanetPosition[] = [
        makePosition('Sun', 'Pisces', 24.5, 354.5),
        makePosition('Moon', 'Virgo', 7.8, 157.8),
        makePosition('Mercury', 'Pisces', 10.2, 340.2),
        makePosition('Venus', 'Aries', 10.1, 10.1),
        makePosition('Mars', 'Libra', 20.4, 200.4),
        makePosition('Jupiter', 'Cancer', 10.3, 100.3),
        makePosition('Saturn', 'Capricorn', 20.1, 290.1),
      ];

      const result = compareWithReferenceEphemeris(birthData, planets);
      expect(result.isWithinStandards).toBe(true);
      expect(result.maxDifference).toBe(0);
    });

    it('reports NOT within standards when large differences exist', () => {
      // Create planets with significantly wrong longitudes
      const planets: PlanetPosition[] = [
        makePosition('Sun', 'Aries', 5, 5),       // ref is 354.5 → ~10° off
        makePosition('Moon', 'Virgo', 7.8, 157.8), // ref is 157.8 → exact
      ];

      const result = compareWithReferenceEphemeris(birthData, planets);
      expect(result.isWithinStandards).toBe(false);
      expect(result.maxDifference).toBeGreaterThan(1);
    });

    it('includes per-planet comparisons', () => {
      const planets: PlanetPosition[] = [
        makePosition('Sun', 'Pisces', 24.5, 354.5),
        makePosition('Mars', 'Libra', 20.5, 200.5),
      ];

      const result = compareWithReferenceEphemeris(birthData, planets);
      expect(result.comparisons.length).toBe(2);
      for (const comp of result.comparisons) {
        expect(typeof comp.planet).toBe('string');
        expect(typeof comp.difference).toBe('number');
        expect(typeof comp.threshold).toBe('number');
        expect(typeof comp.withinThreshold).toBe('boolean');
      }
    });

    it('handles unknown planet names gracefully', () => {
      const planets: PlanetPosition[] = [
        makePosition('FakePlanet', 'Aries', 5, 5),
      ];

      const result = compareWithReferenceEphemeris(birthData, planets);
      expect(result.comparisons.length).toBe(0);
    });

    it('uses cached results for same date', () => {
      const ephemeris = require('ephemeris').default;
      ephemeris.getAllPlanets.mockClear();

      const planets: PlanetPosition[] = [
        makePosition('Sun', 'Pisces', 24.5, 354.5),
      ];

      // First call — may or may not hit cache from previous tests
      compareWithReferenceEphemeris(birthData, planets);
      // Second call — should hit cache
      compareWithReferenceEphemeris(birthData, planets);

      // getAllPlanets should be called at most once (cached after first call)
      expect(ephemeris.getAllPlanets.mock.calls.length).toBeLessThanOrEqual(1);
    });
  });
});
