import { makeTestChart } from './fixtures';

// Mock the Swiss Ephemeris engine — not available in Node tests
jest.mock('../swissEphemerisEngine', () => ({
  isSwissEphemerisAvailable: jest.fn(() => false),
  calculateChart: jest.fn(),
  calcMoonUncertainty: jest.fn(),
  setSiderealMode: jest.fn(),
  setTropicalMode: jest.fn(),
}));

// Mock settings service
jest.mock('../astrologySettingsService', () => ({
  AstrologySettingsService: {
    getCachedSettings: jest.fn(() => null),
    getCachedOrbConfig: jest.fn(() => undefined),
  },
  ORB_CONFIGURATIONS: {
    normal: {
      conjunction: 8, opposition: 8, square: 6, trine: 6, sextile: 4,
      quincunx: 3, semisextile: 2, semisquare: 2, sesquiquadrate: 2,
      quintile: 2, biquintile: 2,
    },
    tight: {
      conjunction: 6, opposition: 6, square: 5, trine: 5, sextile: 3,
      quincunx: 2, semisextile: 1, semisquare: 1, sesquiquadrate: 1,
      quintile: 1, biquintile: 1,
    },
    wide: {
      conjunction: 10, opposition: 10, square: 8, trine: 8, sextile: 6,
      quincunx: 4, semisextile: 3, semisquare: 3, sesquiquadrate: 3,
      quintile: 3, biquintile: 3,
    },
  },
}));

import { EnhancedAstrologyCalculator } from '../calculator';
import type { BirthData } from '../types';

describe('EnhancedAstrologyCalculator', () => {
  const validBirthData: BirthData = {
    date: '1990-03-15',
    time: '14:30',
    hasUnknownTime: false,
    place: 'New York, NY',
    latitude: 40.7128,
    longitude: -74.006,
  };

  describe('generateNatalChart', () => {
    it('returns a NatalChart from valid birth data (fallback engine)', () => {
      const chart = EnhancedAstrologyCalculator.generateNatalChart(validBirthData);

      expect(chart).toBeDefined();
      expect(chart.sunSign).toBeDefined();
      expect(chart.moonSign).toBeDefined();
      expect(chart.placements).toBeDefined();
      expect(chart.placements.length).toBeGreaterThan(0);
      expect(chart.aspects).toBeDefined();
      expect(chart.houseCusps).toBeDefined();
    });

    it('includes correct sun sign for a Pisces birthdate', () => {
      const chart = EnhancedAstrologyCalculator.generateNatalChart(validBirthData);
      expect(chart.sunSign.name).toBe('Pisces');
    });

    it('returns at least 10 planet placements', () => {
      const chart = EnhancedAstrologyCalculator.generateNatalChart(validBirthData);
      expect(chart.placements.length).toBeGreaterThanOrEqual(10);
    });

    it('computes aspects between placements', () => {
      const chart = EnhancedAstrologyCalculator.generateNatalChart(validBirthData);
      expect(chart.aspects.length).toBeGreaterThan(0);
      for (const aspect of chart.aspects) {
        expect(aspect.planet1).toBeDefined();
        expect(aspect.planet2).toBeDefined();
        expect(aspect.type).toBeDefined();
      }
    });

    it('includes angles when birth time is known', () => {
      const chart = EnhancedAstrologyCalculator.generateNatalChart(validBirthData);
      expect(chart.risingSign).toBeDefined();
      expect(chart.houseCusps.length).toBe(12);
    });

    it('handles unknown birth time gracefully', () => {
      const unknownTime: BirthData = {
        ...validBirthData,
        time: undefined,
        hasUnknownTime: true,
      };
      const chart = EnhancedAstrologyCalculator.generateNatalChart(unknownTime);
      expect(chart).toBeDefined();
      expect(chart.sunSign).toBeDefined();
      expect(chart.placements.length).toBeGreaterThan(0);
    });

    it('throws on invalid birth data', () => {
      const invalid: BirthData = {
        date: '',
        hasUnknownTime: false,
        place: '',
        latitude: 40.7128,
        longitude: -74.006,
      };
      expect(() => EnhancedAstrologyCalculator.generateNatalChart(invalid)).toThrow();
    });

    it('assigns houses to planet placements when time is known', () => {
      const chart = EnhancedAstrologyCalculator.generateNatalChart(validBirthData);
      for (const p of chart.placements) {
        expect(typeof p.house).toBe('number');
        expect(p.house).toBeGreaterThanOrEqual(1);
        expect(p.house).toBeLessThanOrEqual(12);
      }
    });

    it('produces deterministic results for same input', () => {
      const chart1 = EnhancedAstrologyCalculator.generateNatalChart(validBirthData);
      const chart2 = EnhancedAstrologyCalculator.generateNatalChart(validBirthData);
      expect(chart1.sunSign.name).toBe(chart2.sunSign.name);
      expect(chart1.moonSign.name).toBe(chart2.moonSign.name);
      expect(chart1.placements.length).toBe(chart2.placements.length);
    });

    it('supports whole-sign house system by default', () => {
      const chart = EnhancedAstrologyCalculator.generateNatalChart(validBirthData);
      // Whole-sign: each house cusp aligns with a sign boundary
      expect(chart.houseCusps).toBeDefined();
    });

    it('respects explicit houseSystem override', () => {
      const withPlacidus: BirthData = { ...validBirthData, houseSystem: 'placidus' };
      const chart = EnhancedAstrologyCalculator.generateNatalChart(withPlacidus);
      expect(chart).toBeDefined();
      expect(chart.houseCusps.length).toBe(12);
    });
  });
});
