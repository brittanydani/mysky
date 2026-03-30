import { AWARENESS_QUOTES, PROTECTIVE_QUOTES, TENSION_QUOTES, RELEASE_QUOTES } from '../shadowQuotes';

describe('shadowQuotes', () => {
  describe('AWARENESS_QUOTES', () => {
    it('is non-empty', () => {
      expect(AWARENESS_QUOTES.length).toBeGreaterThan(0);
    });

    it('each quote has id, text, tone, triggers', () => {
      AWARENESS_QUOTES.forEach((q) => {
        expect(typeof q.id).toBe('string');
        expect(typeof q.text).toBe('string');
        expect(q.tone).toBe('awareness');
        expect(Array.isArray(q.triggers)).toBe(true);
      });
    });
  });

  describe('PROTECTIVE_QUOTES', () => {
    it('is non-empty', () => {
      expect(PROTECTIVE_QUOTES.length).toBeGreaterThan(0);
    });

    it('all have protective tone', () => {
      PROTECTIVE_QUOTES.forEach((q) => expect(q.tone).toBe('protective'));
    });
  });

  describe('TENSION_QUOTES', () => {
    it('is non-empty', () => {
      expect(TENSION_QUOTES.length).toBeGreaterThan(0);
    });

    it('all have tension tone', () => {
      TENSION_QUOTES.forEach((q) => expect(q.tone).toBe('tension'));
    });
  });

  describe('RELEASE_QUOTES', () => {
    it('is non-empty', () => {
      expect(RELEASE_QUOTES.length).toBeGreaterThan(0);
    });

    it('all have release tone', () => {
      RELEASE_QUOTES.forEach((q) => expect(q.tone).toBe('release'));
    });
  });

  it('all IDs are unique across all quote arrays', () => {
    const allIds = [
      ...AWARENESS_QUOTES,
      ...PROTECTIVE_QUOTES,
      ...TENSION_QUOTES,
      ...RELEASE_QUOTES,
    ].map((q) => q.id);
    expect(new Set(allIds).size).toBe(allIds.length);
  });
});
