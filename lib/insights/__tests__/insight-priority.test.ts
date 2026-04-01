import {
  buildInsightCards,
  type DailyCheckIn,
} from '@/lib/insights/engine';

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

describe('insight priority and deduplication', () => {
  describe('maximum card count', () => {
    test('never returns more than 6 cards regardless of data richness', () => {
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
        makeDay({ dreamLogged: true, dreamText: 'I was lost and wandering.' }),
        makeDay({ dreamLogged: true, dreamText: 'I was searching for the way out.' }),
        makeDay({ dreamLogged: true, dreamText: 'I was lost again.' }),
        makeDay({ dreamLogged: true, dreamText: 'Wandering and could not find the way.' }),
      ];

      const cards = buildInsightCards({ days });
      expect(cards.length).toBeLessThanOrEqual(6);
    });
  });

  describe('no duplicate card types', () => {
    test('each card type appears at most once', () => {
      const days = [
        ...Array.from({ length: 8 }, (_, i) =>
          makeDay({
            date: `2026-04-${String(i + 1).padStart(2, '0')}`,
            mood: i < 4 ? 5 : 1,
            energy: i < 4 ? 4 : 1,
            stress: i < 4 ? 1 : 5,
            sleepQuality: i < 4 ? 5 : 1,
            sleepHours: i < 4 ? 8 : 4.5,
            connection: i < 4 ? 4 : 1,
            overwhelm: i < 4 ? 1 : 5,
          })
        ),
      ];

      const cards = buildInsightCards({ days });
      const types = cards.map((c) => c.type);
      const unique = new Set(types);

      expect(unique.size).toBe(types.length);
    });
  });

  describe('card generation priority', () => {
    test('sleep connection card appears when sleep-mood relationship is strong', () => {
      const days = makeDays([
        { sleepQuality: 5, mood: 5 },
        { sleepQuality: 5, mood: 4 },
        { sleepQuality: 4, mood: 4 },
        { sleepQuality: 4, mood: 4 },
        { sleepQuality: 1, mood: 1 },
        { sleepQuality: 1, mood: 2 },
        { sleepQuality: 2, mood: 2 },
        { sleepQuality: 2, mood: 1 },
      ]);

      const cards = buildInsightCards({ days });
      expect(cards.some((c) => c.type === 'sleep_connection')).toBe(true);
    });

    test('best_day_pattern appears when there are enough contrasting days', () => {
      const best = Array.from({ length: 6 }, (_, i) =>
        makeDay({ date: `2026-04-${String(i + 1).padStart(2, '0')}`, mood: 5, energy: 4, stress: 1, sleepQuality: 5, connection: 4, overwhelm: 1 })
      );
      const hard = Array.from({ length: 4 }, (_, i) =>
        makeDay({ date: `2026-04-${String(i + 7).padStart(2, '0')}`, mood: 1, energy: 1, stress: 5, sleepQuality: 1, connection: 1, overwhelm: 5 })
      );

      const cards = buildInsightCards({ days: [...best, ...hard] });
      expect(cards.some((c) => c.type === 'best_day_pattern')).toBe(true);
    });

    test('hard_day_pattern appears when hard days dominate', () => {
      const best = Array.from({ length: 4 }, (_, i) =>
        makeDay({ date: `2026-04-${String(i + 1).padStart(2, '0')}`, mood: 5, energy: 4, stress: 1, sleepQuality: 5, connection: 4, overwhelm: 1 })
      );
      const hard = Array.from({ length: 7 }, (_, i) =>
        makeDay({ date: `2026-04-${String(i + 5).padStart(2, '0')}`, mood: 1, energy: 1, stress: 5, sleepQuality: 1, connection: 1, overwhelm: 5 })
      );

      const cards = buildInsightCards({ days: [...best, ...hard] });
      expect(cards.some((c) => c.type === 'hard_day_pattern')).toBe(true);
    });
  });

  describe('minimal data suppression', () => {
    test('no insight cards generated from only 2 days of data', () => {
      const days = makeDays([
        { sleepQuality: 5, mood: 5 },
        { sleepQuality: 1, mood: 1 },
      ]);

      const cards = buildInsightCards({ days });
      // With only 2 days, no pattern should pass the minimum data thresholds
      expect(cards.length).toBe(0);
    });

    test('empty day array produces no cards', () => {
      const cards = buildInsightCards({ days: [] });
      expect(cards.length).toBe(0);
    });
  });

  describe('all confidence values are finite', () => {
    test('every generated card has a finite numeric confidence', () => {
      const days = [
        ...Array.from({ length: 8 }, (_, i) =>
          makeDay({
            date: `2026-04-${String(i + 1).padStart(2, '0')}`,
            mood: i < 4 ? 5 : 1,
            energy: i < 4 ? 4 : 1,
            stress: i < 4 ? 1 : 5,
            sleepQuality: i < 4 ? 5 : 1,
            connection: i < 4 ? 4 : 1,
            overwhelm: i < 4 ? 1 : 5,
            journalText: 'I felt heavy and overwhelmed. I wanted quiet and space.',
          })
        ),
        makeDay({ dreamLogged: true, dreamText: 'I was lost and searching.' }),
        makeDay({ dreamLogged: true, dreamText: 'I was wandering, could not find the way.' }),
        makeDay({ dreamLogged: true, dreamText: 'Searching for something, totally lost.' }),
      ];

      const cards = buildInsightCards({ days });

      for (const card of cards) {
        expect(Number.isFinite(card.confidence)).toBe(true);
        expect(card.confidence).toBeGreaterThanOrEqual(0);
        expect(card.confidence).toBeLessThanOrEqual(100);
      }
    });
  });
});
