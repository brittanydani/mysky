import { getArchetypePrompt } from '../archetypeIntegration';
import type { ArchetypeKey, ArchetypeProfile } from '../archetypeIntegration';

describe('archetypeIntegration', () => {
  const archetypes: ArchetypeKey[] = ['hero', 'caregiver', 'seeker', 'sage', 'rebel'];
  const moods = ['calm', 'soft', 'okay', 'heavy', 'stormy'] as const;

  function makeProfile(dominant: ArchetypeKey): ArchetypeProfile {
    return {
      dominant,
      scores: { hero: 0, caregiver: 0, seeker: 0, sage: 0, rebel: 0, [dominant]: 5 },
      completedAt: '2025-01-01',
    };
  }

  describe('getArchetypePrompt()', () => {
    it('returns prompt for every archetype × mood combination', () => {
      archetypes.forEach((a) => {
        moods.forEach((m) => {
          const prompt = getArchetypePrompt(makeProfile(a), m);
          expect(prompt).toBeDefined();
          expect(typeof prompt.context).toBe('string');
          expect(typeof prompt.question).toBe('string');
          expect(typeof prompt.archetypeName).toBe('string');
          expect(typeof prompt.archetypeColor).toBe('string');
          expect(prompt.archetypeColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
        });
      });
    });

    it('total combinations = 25 (5 × 5)', () => {
      let count = 0;
      archetypes.forEach((a) => {
        moods.forEach((m) => {
          const prompt = getArchetypePrompt(makeProfile(a), m);
          if (prompt) count++;
        });
      });
      expect(count).toBe(25);
    });
  });
});
