import { computeInnerTensions, NS_BRANCH_COLORS, NS_BRANCH_LABELS, NS_STATE_FULL_LABELS, TRIGGER_DISPLAY } from '../innerTensionsEngine';

describe('innerTensionsEngine', () => {
  describe('display constants', () => {
    it('NS_BRANCH_COLORS has entries', () => {
      expect(Object.keys(NS_BRANCH_COLORS).length).toBeGreaterThan(0);
    });

    it('NS_BRANCH_LABELS has entries', () => {
      expect(Object.keys(NS_BRANCH_LABELS).length).toBeGreaterThan(0);
    });

    it('NS_STATE_FULL_LABELS has entries', () => {
      expect(Object.keys(NS_STATE_FULL_LABELS).length).toBeGreaterThan(0);
    });

    it('TRIGGER_DISPLAY maps triggers to labels', () => {
      expect(Object.keys(TRIGGER_DISPLAY).length).toBeGreaterThan(0);
      for (const label of Object.values(TRIGGER_DISPLAY)) {
        expect(typeof label).toBe('string');
      }
    });
  });

  describe('computeInnerTensions()', () => {
    it('returns data quality indicator for empty entries', () => {
      const result = computeInnerTensions([]);
      expect(result).toBeDefined();
      expect(result.dataQuality).toBeDefined();
      expect(typeof result.dataQuality.totalEntries).toBe('number');
    });

    it('returns nsConflict info', () => {
      const result = computeInnerTensions([]);
      expect(result.nsConflict).toBeDefined();
    });

    it('returns ambivalence info', () => {
      const result = computeInnerTensions([]);
      expect(result.ambivalence).toBeDefined();
    });

    it('returns topTriggers array', () => {
      const result = computeInnerTensions([]);
      expect(Array.isArray(result.topTriggers)).toBe(true);
    });

    it('returns dreamPatterns array', () => {
      const result = computeInnerTensions([]);
      expect(Array.isArray(result.dreamPatterns)).toBe(true);
    });
  });
});
