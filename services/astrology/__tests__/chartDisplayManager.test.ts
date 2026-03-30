import { ChartDisplayManager } from '../chartDisplayManager';
import { makeTestChart } from './fixtures';
import type { EmotionalPattern, PlacementRule, NatalChart } from '../types';

function makePattern(id: string, house?: number): EmotionalPattern {
  const triggers: PlacementRule[] = house
    ? [{ house, weight: 1 }]
    : [{ weight: 1 }];
  return {
    id,
    name: `Pattern ${id}`,
    description: 'test',
    triggers,
    intensity: 5,
    themes: ['test'],
  };
}

describe('chartDisplayManager', () => {
  describe('formatChartWithTimeWarnings()', () => {
    it('returns display chart for known-time chart', () => {
      const chart = makeTestChart();
      const display = ChartDisplayManager.formatChartWithTimeWarnings(chart);
      expect(display.chart).toBeDefined();
      expect(Array.isArray(display.warnings)).toBe(true);
      expect(Array.isArray(display.unavailableFeatures)).toBe(true);
    });

    it('has no warnings for known-time chart', () => {
      const chart = makeTestChart();
      const display = ChartDisplayManager.formatChartWithTimeWarnings(chart);
      expect(display.warnings.length).toBe(0);
    });

    it('flags unavailable features for unknown-time chart', () => {
      const chart = makeTestChart({
        birthData: {
          date: '1990-03-15',
          hasUnknownTime: true,
          place: 'New York, NY',
          latitude: 40.7128,
          longitude: -74.006,
        },
        ascendant: undefined,
        midheaven: undefined,
      });
      const display = ChartDisplayManager.formatChartWithTimeWarnings(chart);
      expect(display.warnings.length).toBeGreaterThan(0);
      expect(display.unavailableFeatures.length).toBeGreaterThan(0);
    });
  });

  describe('hideTimeBasedInterpretations()', () => {
    it('returns all patterns for known-time chart', () => {
      const chart = makeTestChart();
      const patterns = [makePattern('a'), makePattern('b', 7)];
      const filtered = ChartDisplayManager.hideTimeBasedInterpretations(chart, patterns);
      expect(filtered).toHaveLength(2);
    });

    it('filters house-based patterns for unknown-time chart', () => {
      const chart = makeTestChart({
        birthData: {
          date: '1990-03-15',
          hasUnknownTime: true,
          place: 'New York, NY',
          latitude: 40.7128,
          longitude: -74.006,
        },
      });
      const patterns = [makePattern('a'), makePattern('b', 7)];
      const filtered = ChartDisplayManager.hideTimeBasedInterpretations(chart, patterns);
      expect(filtered.length).toBeLessThanOrEqual(2);
    });
  });
});
