import { deriveChartProfile, regulationStyle, emotionalNeeds } from '../chartProfile';
import { makeTestChart } from '../../astrology/__tests__/fixtures';

describe('chartProfile', () => {
  const chart = makeTestChart();

  describe('deriveChartProfile()', () => {
    it('returns profile with dominant element', () => {
      const profile = deriveChartProfile(chart);
      expect(profile).toBeDefined();
      expect(['Fire', 'Earth', 'Air', 'Water']).toContain(profile.dominantElement);
    });

    it('returns profile with dominant modality', () => {
      const profile = deriveChartProfile(chart);
      expect(['Cardinal', 'Fixed', 'Mutable']).toContain(profile.dominantModality);
    });

    it('returns moon and saturn signs', () => {
      const profile = deriveChartProfile(chart);
      expect(typeof profile.moonSign).toBe('string');
      expect(typeof profile.saturnSign).toBe('string');
    });
  });

  describe('regulationStyle()', () => {
    it('returns string for Fire', () => {
      expect(typeof regulationStyle('Fire' as any)).toBe('string');
    });

    it('returns string for Water', () => {
      expect(typeof regulationStyle('Water' as any)).toBe('string');
    });

    it('returns string for Earth', () => {
      expect(typeof regulationStyle('Earth' as any)).toBe('string');
    });

    it('returns string for Air', () => {
      expect(typeof regulationStyle('Air' as any)).toBe('string');
    });
  });

  describe('emotionalNeeds()', () => {
    it('returns string for Aries Moon in house 1', () => {
      const result = emotionalNeeds('Aries', 1);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('returns string for Cancer Moon', () => {
      expect(typeof emotionalNeeds('Cancer', 4)).toBe('string');
    });
  });
});
