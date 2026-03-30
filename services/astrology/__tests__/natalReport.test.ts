import { generateComprehensiveNatalReport } from '../natalReport';
import { makeTestChart } from './fixtures';

describe('natalReport', () => {
  const chart = makeTestChart();

  describe('generateComprehensiveNatalReport()', () => {
    let report: ReturnType<typeof generateComprehensiveNatalReport>;

    beforeAll(() => {
      report = generateComprehensiveNatalReport(chart);
    });

    it('returns planetary placements', () => {
      expect(Array.isArray(report.planetaryPlacements)).toBe(true);
      expect(report.planetaryPlacements.length).toBeGreaterThanOrEqual(10);
    });

    it('each placement has formatted position', () => {
      for (const p of report.planetaryPlacements) {
        expect(typeof p.planet).toBe('string');
        expect(typeof p.sign).toBe('string');
        expect(typeof p.formattedPosition).toBe('string');
      }
    });

    it('returns angles', () => {
      expect(Array.isArray(report.angles)).toBe(true);
    });

    it('returns 12 houses', () => {
      expect(report.houses).toHaveLength(12);
    });

    it('each house has theme', () => {
      for (const h of report.houses) {
        expect(typeof h.theme).toBe('string');
        expect(h.house).toBeGreaterThanOrEqual(1);
        expect(h.house).toBeLessThanOrEqual(12);
      }
    });

    it('returns major aspects', () => {
      expect(Array.isArray(report.majorAspects)).toBe(true);
    });

    it('returns element/modality breakdown', () => {
      expect(report.breakdown).toBeDefined();
      expect(typeof report.breakdown.fire).toBe('number');
      expect(typeof report.breakdown.earth).toBe('number');
      expect(typeof report.breakdown.air).toBe('number');
      expect(typeof report.breakdown.water).toBe('number');
    });

    it('returns chart patterns', () => {
      expect(report.chartPatterns).toBeDefined();
    });

    it('returns dignity analysis', () => {
      expect(report.dignity).toBeDefined();
    });

    it('returns retrograde summary', () => {
      expect(report.retrogrades).toBeDefined();
      expect(Array.isArray(report.retrogrades.planets)).toBe(true);
    });

    it('returns core identity', () => {
      expect(report.coreIdentity).toBeDefined();
      expect(typeof report.coreIdentity.sunSign).toBe('string');
      expect(typeof report.coreIdentity.moonSign).toBe('string');
    });
  });
});
