import { TRIGGER_TAXONOMY } from '../triggerTaxonomy';

describe('triggerTaxonomy', () => {
  describe('TRIGGER_TAXONOMY', () => {
    const triggers = Object.keys(TRIGGER_TAXONOMY);

    it('has at least 10 trigger entries', () => {
      expect(triggers.length).toBeGreaterThanOrEqual(10);
    });

    it('each entry has required fields', () => {
      triggers.forEach((key) => {
        const entry = TRIGGER_TAXONOMY[key as keyof typeof TRIGGER_TAXONOMY];
        expect(typeof entry.coreDefinition).toBe('string');
        expect(typeof entry.interpretationFrame).toBe('string');
        expect([-1, 0, 1]).toContain(entry.defaultValence);
        expect([0, 1]).toContain(entry.defaultActivation);
        expect(Array.isArray(entry.associatedBranches)).toBe(true);
        expect(Array.isArray(entry.reflectionQuestions)).toBe(true);
        expect(entry.reflectionQuestions.length).toBeGreaterThan(0);
        expect(Array.isArray(entry.evidenceHints)).toBe(true);
      });
    });

    it('includes core shadow triggers', () => {
      expect(TRIGGER_TAXONOMY).toHaveProperty('abandonment');
      expect(TRIGGER_TAXONOMY).toHaveProperty('rejection');
      expect(TRIGGER_TAXONOMY).toHaveProperty('shame');
    });
  });
});
