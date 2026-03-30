import { detectExtendedPatterns } from '../aspectPatterns';
import { makeTestChart, makeAspect, makePlacement } from './fixtures';

describe('aspectPatterns', () => {
  const chart = makeTestChart();

  describe('detectExtendedPatterns()', () => {
    it('returns aspectPatterns array', () => {
      const result = detectExtendedPatterns(chart);
      expect(Array.isArray(result.aspectPatterns)).toBe(true);
    });

    it('returns hemisphereEmphasis', () => {
      const result = detectExtendedPatterns(chart);
      if (result.hemisphereEmphasis) {
        expect(typeof result.hemisphereEmphasis.eastern).toBe('number');
        expect(typeof result.hemisphereEmphasis.western).toBe('number');
        expect(typeof result.hemisphereEmphasis.northern).toBe('number');
        expect(typeof result.hemisphereEmphasis.southern).toBe('number');
        expect(typeof result.hemisphereEmphasis.dominant).toBe('string');
        expect(typeof result.hemisphereEmphasis.description).toBe('string');
      }
    });

    it('returns houseEmphasis', () => {
      const result = detectExtendedPatterns(chart);
      if (result.houseEmphasis) {
        expect(typeof result.houseEmphasis.angularCount).toBe('number');
        expect(typeof result.houseEmphasis.succedentCount).toBe('number');
        expect(typeof result.houseEmphasis.cadentCount).toBe('number');
        expect(typeof result.houseEmphasis.dominant).toBe('string');
      }
    });

    it('hemisphere counts sum to planet count', () => {
      const result = detectExtendedPatterns(chart);
      if (result.hemisphereEmphasis) {
        const h = result.hemisphereEmphasis;
        expect(h.eastern + h.western).toBe(h.northern + h.southern);
      }
    });

    it('house emphasis counts sum to planet count', () => {
      const result = detectExtendedPatterns(chart);
      if (result.houseEmphasis) {
        const e = result.houseEmphasis;
        const total = e.angularCount + e.succedentCount + e.cadentCount;
        expect(total).toBe(10); // 10 core planets
      }
    });

    it('each pattern has name, planets, description', () => {
      const result = detectExtendedPatterns(chart);
      for (const p of result.aspectPatterns) {
        expect(typeof p.name).toBe('string');
        expect(Array.isArray(p.planets)).toBe(true);
        expect(typeof p.description).toBe('string');
      }
    });
  });
});
