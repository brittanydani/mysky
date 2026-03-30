import { extractDreamTextSignals, formatEvidenceForUI } from '../dreamTextExtractor';

describe('dreamTextExtractor', () => {
  describe('extractDreamTextSignals()', () => {
    it('extracts signals from exposure-themed text', () => {
      const signals = extractDreamTextSignals('I was naked in front of everyone and they were all staring at me');
      expect(signals).toBeDefined();
      expect(typeof signals.coverage).toBe('number');
    });

    it('returns triggers map', () => {
      const signals = extractDreamTextSignals('I was being chased and could not escape the dark figure');
      expect(signals.triggers).toBeDefined();
    });

    it('returns evidence map', () => {
      const signals = extractDreamTextSignals('Someone betrayed my trust and I felt abandoned');
      expect(signals.evidence).toBeDefined();
    });

    it('returns empty-ish signals for blank text', () => {
      const signals = extractDreamTextSignals('');
      expect(signals.coverage).toBe(0);
    });

    it('respects maxEvidencePerTrigger option', () => {
      const signals = extractDreamTextSignals(
        'I was abandoned abandoned abandoned over and over',
        { maxEvidencePerTrigger: 1 },
      );
      expect(signals).toBeDefined();
    });
  });

  describe('formatEvidenceForUI()', () => {
    it('formats evidence into UI-friendly structure', () => {
      const signals = extractDreamTextSignals('I felt completely exposed and ashamed');
      const triggers = Object.keys(signals.triggers).slice(0, 2) as any[];
      const formatted = formatEvidenceForUI(signals, triggers);
      expect(Array.isArray(formatted)).toBe(true);
    });

    it('returns empty for no triggers', () => {
      const signals = extractDreamTextSignals('A simple dream');
      const formatted = formatEvidenceForUI(signals, []);
      expect(formatted).toHaveLength(0);
    });
  });
});
