import { extractJournalSignals } from '@/lib/insights/engine';

describe('journal analysis', () => {
  describe('keyword and theme detection', () => {
    test('detects heaviness from heavy-language entries', () => {
      const signals = extractJournalSignals('I felt heavy and drained today, completely exhausted.');
      expect(signals.heaviness).toBeGreaterThan(0.2);
    });

    test('detects overwhelm from pressure-language entries', () => {
      const signals = extractJournalSignals('I was overwhelmed, stretched thin, everything was too much.');
      expect(signals.overwhelm).toBeGreaterThan(0.2);
    });

    test('detects restoration need from space-seeking language', () => {
      const signals = extractJournalSignals('I just want quiet, space, rest, and some relief from everything.');
      expect(signals.restorationNeed).toBeGreaterThan(0.3);
    });

    test('detects connection from warm relational language', () => {
      const signals = extractJournalSignals('I felt supported, close to my people, and truly loved today.');
      expect(signals.connection).toBeGreaterThan(0.3);
    });

    test('detects hope from forward-looking language', () => {
      const signals = extractJournalSignals('I felt calmer, lighter, more hopeful, and grateful for the shift.');
      expect(signals.hope).toBeGreaterThan(0.3);
    });
  });

  describe('emotional tone extraction', () => {
    test('warm entry produces high connection and hope, low heaviness', () => {
      const signals = extractJournalSignals(
        'Today I felt supported, loved, held, and calmer than I have in weeks. I feel hopeful and lighter.'
      );

      expect(signals.connection).toBeGreaterThan(signals.heaviness);
      expect(signals.hope).toBeGreaterThan(signals.heaviness);
    });

    test('dark entry produces high heaviness and overwhelm, low hope', () => {
      const signals = extractJournalSignals(
        'Everything felt heavy and dark. I was overwhelmed and drowning. Completely numb and drained.'
      );

      expect(signals.heaviness).toBeGreaterThan(signals.hope);
      expect(signals.overwhelm).toBeGreaterThan(signals.hope);
    });
  });

  describe('ambiguity handling', () => {
    test('mixed positive and negative signals both register', () => {
      const signals = extractJournalSignals(
        'I felt exhausted and heavy but also supported and hopeful. It was a confusing day.'
      );

      expect(signals.heaviness).toBeGreaterThan(0);
      expect(signals.connection).toBeGreaterThan(0);
      expect(signals.hope).toBeGreaterThan(0);
    });

    test('short ambiguous entry does not produce extreme signals', () => {
      const signals = extractJournalSignals('It was okay I guess.');
      expect(signals.heaviness).toBeLessThanOrEqual(0.15);
      expect(signals.overwhelm).toBeLessThanOrEqual(0.15);
      expect(signals.connection).toBeLessThanOrEqual(0.15);
    });
  });

  describe('neutral text handling', () => {
    test('factual errands text produces near-zero signals', () => {
      const signals = extractJournalSignals('Today was ordinary. I did some errands and made dinner.');

      expect(signals.heaviness).toBeLessThanOrEqual(0.15);
      expect(signals.overwhelm).toBeLessThanOrEqual(0.15);
      expect(signals.connection).toBeLessThanOrEqual(0.15);
      expect(signals.hope).toBeLessThanOrEqual(0.15);
      expect(signals.restorationNeed).toBeLessThanOrEqual(0.15);
    });

    test('weather report text produces near-zero signals', () => {
      const signals = extractJournalSignals('It rained today. I stayed inside and read a book.');

      expect(signals.heaviness).toBeLessThanOrEqual(0.15);
      expect(signals.overwhelm).toBeLessThanOrEqual(0.15);
    });

    test('empty string produces all-zero signals', () => {
      const signals = extractJournalSignals('');
      expect(signals.heaviness).toBe(0);
      expect(signals.overwhelm).toBe(0);
      expect(signals.restorationNeed).toBe(0);
      expect(signals.connection).toBe(0);
      expect(signals.hope).toBe(0);
    });

    test('whitespace-only string produces all-zero signals', () => {
      const signals = extractJournalSignals('   \n\t  ');
      expect(signals.heaviness).toBe(0);
      expect(signals.overwhelm).toBe(0);
    });
  });

  describe('conflicting signals in one entry', () => {
    test('exhausted but hopeful produces both heaviness and hope', () => {
      const signals = extractJournalSignals(
        'I was exhausted and drained, but oddly hopeful and looking forward to tomorrow.'
      );

      expect(signals.heaviness).toBeGreaterThan(0);
      expect(signals.hope).toBeGreaterThan(0);
    });

    test('overwhelmed but connected produces both overwhelm and connection', () => {
      const signals = extractJournalSignals(
        'Everything felt like too much, but my partner held me and I felt supported and understood.'
      );

      expect(signals.overwhelm).toBeGreaterThan(0);
      expect(signals.connection).toBeGreaterThan(0);
    });

    test('needing space while also feeling connected', () => {
      const signals = extractJournalSignals(
        'I love being close to people but I also need quiet, space, and solitude to recharge.'
      );

      expect(signals.restorationNeed).toBeGreaterThan(0);
      expect(signals.connection).toBeGreaterThan(0);
    });
  });

  describe('signal magnitude reasonableness', () => {
    test('all signals are between 0 and 1', () => {
      const signals = extractJournalSignals(
        'Heavy, drained, exhausted, numb, dark, sinking, weighed down. Overwhelmed, stretched thin, too much, drowning, overloaded, crushed.'
      );

      expect(signals.heaviness).toBeGreaterThanOrEqual(0);
      expect(signals.heaviness).toBeLessThanOrEqual(1);
      expect(signals.overwhelm).toBeGreaterThanOrEqual(0);
      expect(signals.overwhelm).toBeLessThanOrEqual(1);
    });

    test('single keyword match produces modest signal not extreme', () => {
      const signals = extractJournalSignals('I felt heavy today.');
      expect(signals.heaviness).toBeGreaterThan(0);
      expect(signals.heaviness).toBeLessThanOrEqual(0.3);
    });
  });
});
