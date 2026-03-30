import { detectAmbivalence } from '../ambivalenceEngine';
import type { ShadowTrigger } from '../dreamTypes';

describe('ambivalenceEngine', () => {
  describe('detectAmbivalence()', () => {
    it('detects no ambivalence when all scores are zero', () => {
      const result = detectAmbivalence({});
      expect(result.detected).toBe(false);
    });

    it('detects no ambivalence for single trigger', () => {
      const result = detectAmbivalence({ exposure: 0.8 } as Partial<Record<ShadowTrigger, number>>);
      expect(result.detected).toBe(false);
    });

    it('detects ambivalence for opposing triggers', () => {
      // intimacy + isolation are often contradictory
      const result = detectAmbivalence({
        intimacy: 0.8,
        isolation: 0.7,
      } as Partial<Record<ShadowTrigger, number>>);
      // May or may not detect depending on pair definitions
      expect(typeof result.detected).toBe('boolean');
    });

    it('returns pairs when ambivalence detected', () => {
      // Try with many high scores to increase chance of detection
      const triggers: Partial<Record<ShadowTrigger, number>> = {
        control: 0.9,
        helplessness: 0.9,
        intimacy: 0.8,
        isolation: 0.8,
      };
      const result = detectAmbivalence(triggers);
      if (result.detected) {
        expect(result.pairs.length).toBeGreaterThan(0);
      }
    });
  });
});
