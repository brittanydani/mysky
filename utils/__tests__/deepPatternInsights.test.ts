import { computeDeepPatternBundle } from '../deepPatternInsights';
import { makeTestChart } from '../../services/astrology/__tests__/fixtures';

describe('deepPatternInsights', () => {
  describe('computeDeepPatternBundle()', () => {
    it('returns bundle for empty inputs', () => {
      const result = computeDeepPatternBundle([], [], [], null);
      expect(result).toBeDefined();
    });

    it('returns bundle with chart', () => {
      const chart = makeTestChart();
      const checkIns = [
        { id: '1', date: '2025-01-01', moodScore: 7, energyLevel: 'medium', stressLevel: 'low', tags: ['work'], createdAt: '2025-01-01T12:00:00Z' },
        { id: '2', date: '2025-01-02', moodScore: 5, energyLevel: 'low', stressLevel: 'high', tags: ['stress'], createdAt: '2025-01-02T12:00:00Z' },
      ];
      const result = computeDeepPatternBundle(checkIns as any, [], [], chart);
      expect(result).toBeDefined();
    });
  });
});
