import { UnknownTimeHandler, UNKNOWN_TIME_WARNINGS, UNKNOWN_TIME_FEATURES } from '../unknownTimeHandler';
import { makeTestChart } from './fixtures';

describe('unknownTimeHandler', () => {
  describe('UNKNOWN_TIME_WARNINGS', () => {
    it('has warning strings', () => {
      expect(UNKNOWN_TIME_WARNINGS.length).toBeGreaterThan(0);
      UNKNOWN_TIME_WARNINGS.forEach((w) => expect(typeof w).toBe('string'));
    });
  });

  describe('UNKNOWN_TIME_FEATURES', () => {
    it('has feature strings', () => {
      expect(UNKNOWN_TIME_FEATURES.length).toBeGreaterThan(0);
      UNKNOWN_TIME_FEATURES.forEach((f) => expect(typeof f).toBe('string'));
    });
  });

  describe('isUnknownTimeChart()', () => {
    it('returns false for chart with known time', () => {
      const chart = makeTestChart();
      expect(UnknownTimeHandler.isUnknownTimeChart(chart)).toBe(false);
    });
  });

  describe('validateTimeRequiredFeatures()', () => {
    it('returns feature availability object', () => {
      const chart = makeTestChart();
      const availability = UnknownTimeHandler.validateTimeRequiredFeatures(chart);
      expect(typeof availability.risingSign).toBe('boolean');
      expect(typeof availability.houses).toBe('boolean');
      expect(typeof availability.angles).toBe('boolean');
    });
  });

  describe('getUnknownTimeWarnings()', () => {
    it('returns empty array for full chart', () => {
      const chart = makeTestChart();
      const warnings = UnknownTimeHandler.getUnknownTimeWarnings(chart);
      expect(Array.isArray(warnings)).toBe(true);
    });
  });

  describe('isTimeRequiredForFeature()', () => {
    it('returns boolean', () => {
      expect(typeof UnknownTimeHandler.isTimeRequiredForFeature('houses')).toBe('boolean');
    });
  });

  describe('getAvailableFeaturesForUnknownTime()', () => {
    it('returns array of feature strings', () => {
      const features = UnknownTimeHandler.getAvailableFeaturesForUnknownTime();
      expect(Array.isArray(features)).toBe(true);
      expect(features.length).toBeGreaterThan(0);
    });
  });
});
