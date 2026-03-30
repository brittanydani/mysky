import { computeDreamAggregates, computeDreamPatterns } from '../dreamAggregates';
import type { SelectedFeeling } from '../dreamTypes';

describe('dreamAggregates', () => {
  const feelings: SelectedFeeling[] = [
    { id: 'anxious', intensity: 4 },
    { id: 'exposed', intensity: 3 },
    { id: 'calm', intensity: 1 },
  ];

  describe('computeDreamAggregates()', () => {
    it('returns aggregates with valid structure', () => {
      const agg = computeDreamAggregates(feelings, null);
      expect(agg.valenceScore).toBeDefined();
      expect(agg.activationScore).toBeDefined();
      expect(agg.attachmentProfile).toBeDefined();
      expect(agg.nervousSystemProfile).toBeDefined();
      expect(Array.isArray(agg.dominantFeelings)).toBe(true);
    });

    it('handles empty feelings', () => {
      const agg = computeDreamAggregates([], null);
      expect(agg).toBeDefined();
      expect(Array.isArray(agg.dominantFeelings)).toBe(true);
    });

    it('works with null chart', () => {
      const agg = computeDreamAggregates(feelings, null);
      expect(agg).toBeDefined();
    });

    it('valence is defined', () => {
      const agg = computeDreamAggregates(feelings, null);
      expect(agg.valenceScore).toBeDefined();
    });

    it('activation is defined', () => {
      const agg = computeDreamAggregates(feelings, null);
      expect(agg.activationScore).toBeDefined();
    });
  });

  describe('computeDreamPatterns()', () => {
    it('returns pattern data', () => {
      const patterns = computeDreamPatterns(feelings, []);
      expect(Array.isArray(patterns.recurringFeelings)).toBe(true);
      expect(typeof patterns.emotionalTrendDirection).toBe('string');
    });

    it('handles empty entries', () => {
      const patterns = computeDreamPatterns([], []);
      expect(patterns).toBeDefined();
    });
  });
});
