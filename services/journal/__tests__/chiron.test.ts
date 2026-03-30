import { getChironPlacement, getChironInsight, getChironInsightFromChart, getChironChakra, getChironNodeFusion } from '../chiron';
import { makeTestChart } from '../../astrology/__tests__/fixtures';

describe('chiron', () => {
  describe('getChironInsight()', () => {
    it('returns insight for house 1', () => {
      const insight = getChironInsight(1);
      expect(typeof insight.title).toBe('string');
      expect(typeof insight.description).toBe('string');
    });

    it('returns insight for house 12', () => {
      const insight = getChironInsight(12);
      expect(insight.title).toBeTruthy();
    });

    it('returns insight for all houses 1-12', () => {
      for (let h = 1; h <= 12; h++) {
        const insight = getChironInsight(h);
        expect(insight).toBeDefined();
        expect(typeof insight.title).toBe('string');
      }
    });
  });

  describe('getChironPlacement()', () => {
    it('works with test chart', () => {
      const chart = makeTestChart();
      const result = getChironPlacement(chart);
      expect(result === null || typeof result === 'object').toBe(true);
    });
  });

  describe('getChironChakra()', () => {
    it('returns chakra tag for each house', () => {
      for (let h = 1; h <= 12; h++) {
        const chakra = getChironChakra(h);
        expect(typeof chakra).toBe('string');
      }
    });
  });

  describe('getChironNodeFusion()', () => {
    it('returns fusion for all houses', () => {
      for (let h = 1; h <= 12; h++) {
        const fusion = getChironNodeFusion(h);
        expect(fusion).toBeDefined();
      }
    });
  });

  describe('getChironInsightFromChart()', () => {
    it('works with test chart', () => {
      const chart = makeTestChart();
      const result = getChironInsightFromChart(chart);
      expect(result === null || typeof result === 'object').toBe(true);
    });
  });
});
