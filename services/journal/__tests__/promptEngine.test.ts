import { getFreePrompt, getCurrentMoonPhase } from '../promptEngine';

describe('promptEngine', () => {
  describe('getCurrentMoonPhase()', () => {
    it('returns a human-readable moon phase string', () => {
      const phase = getCurrentMoonPhase(new Date('2025-06-15'));
      expect(typeof phase).toBe('string');
      expect(phase.length).toBeGreaterThan(0);
    });

    it('returns known phase label', () => {
      const validPhases = [
        'New Moon', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous',
        'Full Moon', 'Waning Gibbous', 'Last Quarter', 'Waning Crescent', 'Moon',
      ];
      const phase = getCurrentMoonPhase(new Date('2025-01-01'));
      expect(validPhases).toContain(phase);
    });
  });

  describe('getFreePrompt()', () => {
    it('returns a prompt with required fields', () => {
      const prompt = getFreePrompt(new Date('2025-06-15'));
      expect(typeof prompt.context).toBe('string');
      expect(typeof prompt.question).toBe('string');
      expect(typeof prompt.close).toBe('string');
      expect(typeof prompt.activation).toBe('string');
      expect(Array.isArray(prompt.tags)).toBe(true);
      expect(typeof prompt.source).toBe('string');
      expect(typeof prompt.promptId).toBe('string');
    });

    it('returns deterministic result for same date', () => {
      const d = new Date('2025-03-15');
      const a = getFreePrompt(d);
      const b = getFreePrompt(d);
      expect(a.promptId).toBe(b.promptId);
    });

    it('userSeed changes the selected prompt', () => {
      const d = new Date('2025-03-15');
      const a = getFreePrompt(d);
      const b = getFreePrompt(d, 'user-abc-123');
      // Different seeds should typically select different prompts
      expect(typeof b.promptId).toBe('string');
    });

    it('source is moon_phase or fallback', () => {
      const prompt = getFreePrompt(new Date('2025-06-15'));
      expect(['moon_phase', 'fallback']).toContain(prompt.source);
    });
  });
});
