import { detectNervousSystemConflict } from '../nervousSystemConflict';
import type { NervousSystemBranch } from '../dreamTypes';

describe('nervousSystemConflict', () => {
  describe('detectNervousSystemConflict()', () => {
    it('returns low conflict for empty profile', () => {
      const result = detectNervousSystemConflict({});
      expect(typeof result.conflictScore).toBe('number');
      expect(result.conflictScore).toBeGreaterThanOrEqual(0);
      expect(result.conflictScore).toBeLessThanOrEqual(1);
    });

    it('returns low conflict for single dominant branch', () => {
      const result = detectNervousSystemConflict({
        ventral_safety: 0.9,
        fight: 0.1,
        flight: 0.0,
        freeze: 0.0,
        collapse: 0.0,
      } as Partial<Record<NervousSystemBranch, number>>);
      expect(result.conflictScore).toBeLessThan(0.5);
    });

    it('returns higher conflict for competing branches', () => {
      const result = detectNervousSystemConflict({
        fight: 0.8,
        freeze: 0.8,
        ventral_safety: 0.1,
      } as Partial<Record<NervousSystemBranch, number>>);
      expect(result.conflictScore).toBeGreaterThan(0);
    });

    it('returns dominant states', () => {
      const result = detectNervousSystemConflict({
        fight: 0.9,
        flight: 0.1,
      } as Partial<Record<NervousSystemBranch, number>>);
      expect(Array.isArray(result.dominantStates)).toBe(true);
    });
  });
});
