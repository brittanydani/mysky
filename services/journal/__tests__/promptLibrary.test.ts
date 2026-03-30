import { GENTLE_CLOSES, CONTEXT_LINES, PROMPT_LIBRARY } from '../promptLibrary';

describe('promptLibrary', () => {
  describe('GENTLE_CLOSES', () => {
    it('is a non-empty array of strings', () => {
      expect(Array.isArray(GENTLE_CLOSES)).toBe(true);
      expect(GENTLE_CLOSES.length).toBeGreaterThan(5);
      GENTLE_CLOSES.forEach((c) => expect(typeof c).toBe('string'));
    });
  });

  describe('CONTEXT_LINES', () => {
    it('has entries for each activation type', () => {
      const activations = [
        'emotional_processing',
        'identity_pressure',
        'relationship_mirroring',
        'inner_review',
        'boundary_testing',
        'integration_phase',
        'creative_release',
        'somatic_awareness',
      ];
      activations.forEach((a) => {
        expect(CONTEXT_LINES[a as keyof typeof CONTEXT_LINES]).toBeDefined();
        expect(Array.isArray(CONTEXT_LINES[a as keyof typeof CONTEXT_LINES])).toBe(true);
      });
    });
  });

  describe('PROMPT_LIBRARY', () => {
    it('has at least 50 prompts', () => {
      expect(PROMPT_LIBRARY.length).toBeGreaterThanOrEqual(50);
    });

    it('each prompt has required fields', () => {
      PROMPT_LIBRARY.slice(0, 10).forEach((p) => {
        expect(typeof p.id).toBe('string');
        expect(typeof p.context).toBe('string');
        expect(typeof p.question).toBe('string');
        expect(p.tags).toBeDefined();
        expect(typeof p.tags.activation).toBe('string');
        expect(typeof p.tags.theme).toBe('string');
        expect(typeof p.tags.intensity).toBe('string');
      });
    });

    it('all IDs are unique', () => {
      const ids = PROMPT_LIBRARY.map((p) => p.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });
});
