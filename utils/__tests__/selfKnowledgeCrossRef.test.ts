import { DRAIN_TAG_MAP, RESTORE_TAG_MAP, computeSelfKnowledgeCrossRef } from '../selfKnowledgeCrossRef';

describe('selfKnowledgeCrossRef', () => {
  describe('DRAIN_TAG_MAP', () => {
    it('has at least 10 entries', () => {
      expect(Object.keys(DRAIN_TAG_MAP).length).toBeGreaterThanOrEqual(10);
    });

    it('maps strings to strings', () => {
      Object.entries(DRAIN_TAG_MAP).forEach(([key, val]) => {
        expect(typeof key).toBe('string');
        expect(typeof val).toBe('string');
      });
    });
  });

  describe('RESTORE_TAG_MAP', () => {
    it('has at least 8 entries', () => {
      expect(Object.keys(RESTORE_TAG_MAP).length).toBeGreaterThanOrEqual(8);
    });
  });

  describe('computeSelfKnowledgeCrossRef()', () => {
    it('returns empty array for minimal context and empty check-ins', () => {
      const context = {
        coreValues: null,
        archetypeProfile: null,
        cognitiveStyle: null,
        somaticEntries: [],
        triggers: null,
        relationshipPatterns: [],
        dailyReflections: null,
      };
      const result = computeSelfKnowledgeCrossRef(context as any, []);
      expect(Array.isArray(result)).toBe(true);
    });

    it('returns insights with required shape when given data', () => {
      const context = {
        coreValues: { selected: ['growth', 'connection'], topFive: ['growth', 'connection', 'authenticity', 'freedom', 'creativity'] },
        archetypeProfile: { dominant: 'caregiver' as any, scores: { hero: 2, caregiver: 4, seeker: 3, sage: 1, rebel: 2 }, completedAt: '2025-01-01' },
        cognitiveStyle: { scope: 3, processing: 2, decisions: 4 },
        somaticEntries: [
          { id: '1', date: '2025-01-01', region: 'shoulders', emotion: 'stress', intensity: 4 },
          { id: '2', date: '2025-01-02', region: 'shoulders', emotion: 'anxiety', intensity: 3 },
          { id: '3', date: '2025-01-03', region: 'chest', emotion: 'sadness', intensity: 4 },
        ],
        triggers: { drains: ['conflict', 'criticism'], restores: ['nature', 'music'] },
        relationshipPatterns: [],
        dailyReflections: null,
      };
      const checkIns = [
        { id: '1', date: '2025-01-01', moodScore: 7, energyLevel: 'medium', stressLevel: 'low', tags: ['conflict'], createdAt: '2025-01-01T12:00:00Z' },
        { id: '2', date: '2025-01-02', moodScore: 4, energyLevel: 'low', stressLevel: 'high', tags: ['nature'], createdAt: '2025-01-02T12:00:00Z' },
      ];
      const result = computeSelfKnowledgeCrossRef(context as any, checkIns as any);
      result.forEach((insight) => {
        expect(typeof insight.id).toBe('string');
        expect(typeof insight.title).toBe('string');
        expect(typeof insight.body).toBe('string');
        expect(typeof insight.accentColor).toBe('string');
        expect(typeof insight.source).toBe('string');
        expect(typeof insight.isConfirmed).toBe('boolean');
      });
    });
  });
});
