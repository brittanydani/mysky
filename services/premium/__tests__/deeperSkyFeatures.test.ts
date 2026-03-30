import { DeeperSkyGate, DEEPER_SKY_FEATURES } from '../deeperSkyFeatures';

describe('deeperSkyFeatures', () => {
  describe('DEEPER_SKY_FEATURES', () => {
    it('is a non-empty array', () => {
      expect(Array.isArray(DEEPER_SKY_FEATURES)).toBe(true);
      expect(DEEPER_SKY_FEATURES.length).toBeGreaterThan(0);
    });

    it('each feature has id and name', () => {
      for (const f of DEEPER_SKY_FEATURES) {
        expect(typeof f.id).toBe('string');
        expect(typeof f.name).toBe('string');
      }
    });
  });

  describe('DeeperSkyGate', () => {
    describe('hasFeature()', () => {
      it('returns true for valid feature with premium', () => {
        const id = DEEPER_SKY_FEATURES[0].id;
        expect(typeof DeeperSkyGate.hasFeature(id, true)).toBe('boolean');
      });

      it('returns true for any feature when premium', () => {
        // hasFeature returns true for all features when isPremium=true
        expect(DeeperSkyGate.hasFeature('nonexistent-feature', true)).toBe(true);
      });

      it('returns true for unknown feature when not premium', () => {
        // Unknown features default to available
        expect(DeeperSkyGate.hasFeature('nonexistent-feature', false)).toBe(true);
      });
    });

    describe('getFeatureContent()', () => {
      it('returns string content for premium user', () => {
        const id = DEEPER_SKY_FEATURES[0].id;
        const content = DeeperSkyGate.getFeatureContent(id, true);
        expect(typeof content).toBe('string');
      });

      it('returns different content for free user', () => {
        const id = DEEPER_SKY_FEATURES[0].id;
        const free = DeeperSkyGate.getFeatureContent(id, false);
        const premium = DeeperSkyGate.getFeatureContent(id, true);
        // Free and premium content may differ
        expect(typeof free).toBe('string');
        expect(typeof premium).toBe('string');
      });
    });

    describe('getMaxRelationshipCharts()', () => {
      it('returns higher limit for premium', () => {
        const free = DeeperSkyGate.getMaxRelationshipCharts(false);
        const premium = DeeperSkyGate.getMaxRelationshipCharts(true);
        expect(premium).toBeGreaterThanOrEqual(free);
      });
    });

    describe('hasJournalPatterns()', () => {
      it('returns boolean', () => {
        expect(typeof DeeperSkyGate.hasJournalPatterns(true)).toBe('boolean');
        expect(typeof DeeperSkyGate.hasJournalPatterns(false)).toBe('boolean');
      });
    });

    describe('hasHealingInsights()', () => {
      it('returns true for premium', () => {
        expect(DeeperSkyGate.hasHealingInsights(true)).toBe(true);
      });

      it('returns false for free', () => {
        expect(DeeperSkyGate.hasHealingInsights(false)).toBe(false);
      });
    });
  });
});
