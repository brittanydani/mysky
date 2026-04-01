import {
  buildInsightCards,
  type DailyCheckIn,
  type InsightCard,
} from '@/lib/insights/engine';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeDay(overrides: Partial<DailyCheckIn> = {}): DailyCheckIn {
  return {
    date: overrides.date ?? '2026-04-01',
    mood: overrides.mood ?? 3,
    energy: overrides.energy ?? 3,
    stress: overrides.stress ?? 3,
    sleepQuality: overrides.sleepQuality ?? 3,
    sleepHours: overrides.sleepHours ?? 7,
    connection: overrides.connection ?? 3,
    overwhelm: overrides.overwhelm ?? 3,
    emotions: overrides.emotions ?? [],
    tags: overrides.tags ?? [],
    journalText: overrides.journalText ?? '',
    dreamLogged: overrides.dreamLogged ?? false,
    dreamText: overrides.dreamText ?? '',
  };
}

function makeDays(rows: Array<Partial<DailyCheckIn>>): DailyCheckIn[] {
  return rows.map((row, i) =>
    makeDay({ date: `2026-04-${String(i + 1).padStart(2, '0')}`, ...row })
  );
}

function allCards(): InsightCard[] {
  // Produce a rich dataset that generates multiple card types
  const days = [
    ...makeDays([
      { sleepQuality: 5, mood: 5, energy: 5, stress: 1, overwhelm: 1, connection: 4, journalText: 'I felt heavy and overwhelmed and stretched thin. I wanted quiet and space and relief.' },
      { sleepQuality: 5, mood: 4, energy: 4, stress: 2, overwhelm: 2, connection: 4, journalText: 'I felt heavy and overwhelmed and stretched thin. I wanted quiet and space and relief.' },
      { sleepQuality: 4, mood: 4, energy: 4, stress: 2, overwhelm: 2, connection: 4, journalText: 'I felt heavy and overwhelmed and stretched thin. I wanted quiet and space and relief.' },
      { sleepQuality: 4, mood: 4, energy: 4, stress: 2, overwhelm: 2, connection: 4, journalText: 'I felt heavy and overwhelmed and stretched thin. I wanted quiet and space and relief.' },
      { sleepQuality: 1, mood: 1, energy: 1, stress: 5, overwhelm: 5, connection: 1, journalText: 'I felt heavy and overwhelmed and stretched thin. I wanted quiet and space and relief.' },
      { sleepQuality: 1, mood: 2, energy: 2, stress: 5, overwhelm: 4, connection: 2, journalText: 'I felt heavy and overwhelmed and stretched thin. I wanted quiet and space and relief.' },
      { sleepQuality: 2, mood: 2, energy: 2, stress: 4, overwhelm: 4, connection: 2, journalText: 'I felt heavy and overwhelmed and stretched thin. I wanted quiet and space and relief.' },
      { sleepQuality: 2, mood: 1, energy: 1, stress: 5, overwhelm: 5, connection: 1, journalText: 'I felt heavy and overwhelmed and stretched thin. I wanted quiet and space and relief.' },
    ]),
    makeDay({ dreamLogged: true, dreamText: 'I was lost and could not find my way.' }),
    makeDay({ dreamLogged: true, dreamText: 'I kept searching but everything was confusing.' }),
    makeDay({ dreamLogged: true, dreamText: 'I was wandering and trying to get somewhere.' }),
    makeDay({ dreamLogged: true, dreamText: 'I was lost again, turned around, no direction.' }),
  ];
  return buildInsightCards({ days });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('insight copy quality', () => {
  describe('blocked diagnostic language', () => {
    const DIAGNOSTIC_WORDS = [
      'depression',
      'anxiety disorder',
      'trauma response',
      'dysregulated',
      'diagnosis',
      'clinical',
      'pathological',
      'disorder',
      'syndrome',
      'bipolar',
      'PTSD',
      'OCD',
    ];

    test('no insight card ever uses diagnostic language', () => {
      const cards = allCards();
      const pattern = new RegExp(DIAGNOSTIC_WORDS.join('|'), 'i');

      for (const card of cards) {
        expect(card.body).not.toMatch(pattern);
        expect(card.title).not.toMatch(pattern);
      }
    });
  });

  describe('blocked robotic / algorithmic language', () => {
    const ROBOTIC_WORDS = [
      'algorithm',
      'detected',
      'statistically',
      'computed',
      'calculated',
      'data shows',
      'analysis reveals',
      'our system',
      'metrics indicate',
      'score of',
      'coefficient',
      'correlation',
      'regression',
      'p-value',
      'significant at',
    ];

    test('no insight card ever sounds like a machine report', () => {
      const cards = allCards();
      const pattern = new RegExp(ROBOTIC_WORDS.join('|'), 'i');

      for (const card of cards) {
        expect(card.body).not.toMatch(pattern);
        expect(card.title).not.toMatch(pattern);
      }
    });
  });

  describe('blocked overstatement language', () => {
    const OVERSTATEMENT_WORDS = [
      'definitely',
      'certainly',
      'always',
      'never',
      'proves',
      'guaranteed',
      'without a doubt',
      'undeniably',
      'conclusively',
    ];

    test('no insight card makes absolute claims', () => {
      const cards = allCards();
      const pattern = new RegExp(OVERSTATEMENT_WORDS.join('|'), 'i');

      for (const card of cards) {
        expect(card.body).not.toMatch(pattern);
      }
    });
  });

  describe('softer language at lower confidence', () => {
    test('medium-confidence sleep card uses hedging language', () => {
      const cards = buildInsightCards({
        days: makeDays([
          { sleepQuality: 4, mood: 4 },
          { sleepQuality: 4, mood: 3 },
          { sleepQuality: 3, mood: 3 },
          { sleepQuality: 2, mood: 2 },
          { sleepQuality: 2, mood: 3 },
          { sleepQuality: 3, mood: 2 },
          { sleepQuality: 4, mood: 4 },
        ]),
      });

      const sleepCard = cards.find((c) => c.type === 'sleep_connection');
      expect(sleepCard).toBeDefined();
      expect(sleepCard!.body).toMatch(/seems to|may be|appears to|may|might/i);
    });

    test('high-confidence card can use direct phrasing without hedging requirement', () => {
      const cards = buildInsightCards({
        days: makeDays([
          { sleepQuality: 5, mood: 5, energy: 5, stress: 1, overwhelm: 1, connection: 4 },
          { sleepQuality: 5, mood: 4, energy: 4, stress: 2, overwhelm: 2, connection: 4 },
          { sleepQuality: 4, mood: 4, energy: 4, stress: 2, overwhelm: 2, connection: 4 },
          { sleepQuality: 4, mood: 4, energy: 4, stress: 2, overwhelm: 2, connection: 4 },
          { sleepQuality: 1, mood: 1, energy: 1, stress: 5, overwhelm: 5, connection: 2 },
          { sleepQuality: 1, mood: 2, energy: 2, stress: 5, overwhelm: 4, connection: 2 },
          { sleepQuality: 2, mood: 2, energy: 2, stress: 4, overwhelm: 4, connection: 2 },
          { sleepQuality: 2, mood: 1, energy: 1, stress: 5, overwhelm: 5, connection: 1 },
        ]),
      });

      const sleepCard = cards.find((c) => c.type === 'sleep_connection');
      expect(sleepCard).toBeDefined();
      expect(sleepCard!.confidence).toBeGreaterThanOrEqual(70);
      // High confidence can use "tend to" style — still warm but more direct
      expect(sleepCard!.body).toMatch(/tend to|appears to|foundations/i);
    });
  });

  describe('emotional warmth', () => {
    test('hard-day card acknowledges difficulty with care', () => {
      const bestDays = Array.from({ length: 4 }, (_, i) =>
        makeDay({ date: `2026-04-${String(i + 1).padStart(2, '0')}`, mood: 5, energy: 4, stress: 1, sleepQuality: 5, sleepHours: 8, connection: 4, overwhelm: 1 })
      );
      const hardDays = Array.from({ length: 7 }, (_, i) =>
        makeDay({ date: `2026-04-${String(i + 5).padStart(2, '0')}`, mood: 1, energy: 1, stress: 5, sleepQuality: 1, sleepHours: 4.5, connection: 1, overwhelm: 5 })
      );

      const cards = buildInsightCards({ days: [...bestDays, ...hardDays] });
      const hardCard = cards.find((c) => c.type === 'hard_day_pattern');

      expect(hardCard).toBeDefined();
      // Should reference self-care or recognition, not blame
      expect(hardCard!.body).toMatch(/ease up|take care|recognize|notice|gentl/i);
      expect(hardCard!.body).not.toMatch(/fault|blame|fail|wrong|bad/i);
    });

    test('best-day card celebrates without being empty praise', () => {
      const bestDays = Array.from({ length: 7 }, (_, i) =>
        makeDay({ date: `2026-04-${String(i + 1).padStart(2, '0')}`, mood: 5, energy: 4, stress: 1, sleepQuality: 5, sleepHours: 8, connection: 4, overwhelm: 1 })
      );
      const hardDays = Array.from({ length: 4 }, (_, i) =>
        makeDay({ date: `2026-04-${String(i + 8).padStart(2, '0')}`, mood: 1, energy: 1, stress: 5, sleepQuality: 1, sleepHours: 4.5, connection: 1, overwhelm: 5 })
      );

      const cards = buildInsightCards({ days: [...bestDays, ...hardDays] });
      const bestCard = cards.find((c) => c.type === 'best_day_pattern');

      expect(bestCard).toBeDefined();
      // Should mention concrete ingredients, not just "great job"
      expect(bestCard!.body).toMatch(/sleep|stress|connection|energy/i);
    });
  });

  describe('dream copy uses uncertainty language', () => {
    test('dream card uses hedging not assertion', () => {
      const days = [
        makeDay({ dreamLogged: true, dreamText: 'I was being chased and trying to hide.' }),
        makeDay({ dreamLogged: true, dreamText: 'I kept running from someone.' }),
        makeDay({ dreamLogged: true, dreamText: 'I was hiding and trying to get away.' }),
        makeDay({ dreamLogged: true, dreamText: 'I was escaping from danger.' }),
      ];

      const cards = buildInsightCards({ days });
      const dreamCard = cards.find((c) => c.type === 'dream_theme');

      expect(dreamCard).toBeDefined();
      expect(dreamCard!.body).toMatch(/may reflect|may suggest|could point to|seems to/i);
      expect(dreamCard!.body).not.toMatch(/\bmeans\b|proves|definitely|certainly/i);
    });
  });

  describe('no duplicate sentence structures', () => {
    test('different card types use distinct opening structures', () => {
      const cards = allCards();

      if (cards.length < 2) return;

      const openings = cards.map((c) => {
        // Extract first 5 words of body
        return c.body.split(/\s+/).slice(0, 5).join(' ').toLowerCase();
      });

      // No two cards should open with the exact same 5 words
      const unique = new Set(openings);
      expect(unique.size).toBe(openings.length);
    });
  });
});
