import { detectChartPatterns } from '../chartPatterns';
import { makeTestChart, makePlacement } from './fixtures';

describe('chartPatterns', () => {
  const chart = makeTestChart();

  describe('detectChartPatterns()', () => {
    it('returns all expected fields', () => {
      const p = detectChartPatterns(chart);
      expect(p).toHaveProperty('stelliums');
      expect(p).toHaveProperty('chartRuler');
      expect(p).toHaveProperty('conjunctionClusters');
      expect(p).toHaveProperty('retrogradeEmphasis');
      expect(p).toHaveProperty('elementBalance');
      expect(p).toHaveProperty('modalityBalance');
      expect(p).toHaveProperty('polarityBalance');
      expect(p).toHaveProperty('dominantFactors');
    });

    it('stelliums is an array', () => {
      const p = detectChartPatterns(chart);
      expect(Array.isArray(p.stelliums)).toBe(true);
    });

    describe('chartRuler', () => {
      it('has planet and rising sign', () => {
        const { chartRuler } = detectChartPatterns(chart);
        if (chartRuler) {
          expect(chartRuler.planet).toBeTruthy();
          expect(chartRuler.risingSign).toBeTruthy();
          expect(typeof chartRuler.description).toBe('string');
        }
      });
    });

    describe('elementBalance', () => {
      it('identifies a dominant element', () => {
        const { elementBalance } = detectChartPatterns(chart);
        expect(['Fire', 'Earth', 'Air', 'Water']).toContain(elementBalance.dominant);
        expect(typeof elementBalance.description).toBe('string');
      });

      it('has counts for all elements', () => {
        const { elementBalance } = detectChartPatterns(chart);
        expect(typeof elementBalance.counts['Fire']).toBe('number');
        expect(typeof elementBalance.counts['Earth']).toBe('number');
        expect(typeof elementBalance.counts['Air']).toBe('number');
        expect(typeof elementBalance.counts['Water']).toBe('number');
      });
    });

    describe('modalityBalance', () => {
      it('identifies a dominant modality', () => {
        const { modalityBalance } = detectChartPatterns(chart);
        expect(['Cardinal', 'Fixed', 'Mutable']).toContain(modalityBalance.dominant);
      });
    });

    describe('polarityBalance', () => {
      it('returns masculine and feminine counts', () => {
        const { polarityBalance } = detectChartPatterns(chart);
        expect(typeof polarityBalance.masculine).toBe('number');
        expect(typeof polarityBalance.feminine).toBe('number');
        expect(['Masculine', 'Feminine', 'Balanced']).toContain(polarityBalance.dominant);
      });
    });

    describe('retrogradeEmphasis', () => {
      it('detects retrograde Saturn', () => {
        const { retrogradeEmphasis } = detectChartPatterns(chart);
        expect(retrogradeEmphasis.planets).toContain('Saturn');
        expect(retrogradeEmphasis.count).toBeGreaterThanOrEqual(1);
      });
    });

    describe('conjunctionClusters', () => {
      it('detects Saturn-Uranus-Neptune cluster', () => {
        const { conjunctionClusters } = detectChartPatterns(chart);
        // Saturn ~290, Uranus ~280, Neptune ~285 are within conjunction orb
        expect(conjunctionClusters.length).toBeGreaterThanOrEqual(1);
        const clusterPlanets = conjunctionClusters.flatMap((c: any) => c.planets);
        expect(clusterPlanets).toContain('Saturn');
      });
    });

    it('detects stellium when 3+ planets share a sign', () => {
      // Make a chart with 3 planets in the same sign
      const stelliumChart = makeTestChart({
        mercury: makePlacement('Mercury', 288, 'Capricorn', 'Earth', 'Cardinal', 10, 7),
        // saturn at 290, uranus at 280, neptune at 285 already in Capricorn
      });
      const p = detectChartPatterns(stelliumChart);
      const capStellium = p.stelliums.find((s: any) => s.label.includes('Capricorn'));
      expect(capStellium).toBeDefined();
    });
  });
});
