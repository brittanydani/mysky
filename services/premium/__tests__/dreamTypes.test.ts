import { DREAM_FEELINGS } from '../dreamTypes';

describe('dreamTypes', () => {
  describe('DREAM_FEELINGS', () => {
    it('has at least 40 feelings', () => {
      expect(DREAM_FEELINGS.length).toBeGreaterThanOrEqual(40);
    });

    it('each feeling has required fields', () => {
      DREAM_FEELINGS.forEach((f) => {
        expect(typeof f.id).toBe('string');
        expect(typeof f.label).toBe('string');
        expect(typeof f.primaryBranch).toBe('string');
        expect(Array.isArray(f.shadowTriggers)).toBe(true);
        expect(typeof f.attachmentSignal).toBe('string');
        expect([-1, 0, 1]).toContain(f.valence);
        expect([0, 0.5, 1]).toContain(f.activation);
        expect(typeof f.tier).toBe('string');
      });
    });

    it('all IDs are unique', () => {
      const ids = DREAM_FEELINGS.map((f) => f.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('covers multiple nervous system branches', () => {
      const branches = new Set(DREAM_FEELINGS.map((f) => f.primaryBranch));
      expect(branches.size).toBeGreaterThan(3);
    });

    it('covers multiple tiers', () => {
      const tiers = new Set(DREAM_FEELINGS.map((f) => f.tier));
      expect(tiers.size).toBeGreaterThan(1);
    });
  });
});
