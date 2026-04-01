import {
  analyzeDreamThemes,
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

describe('dream analysis', () => {
  describe('theme detection', () => {
    test('detects lost/searching theme', () => {
      const result = analyzeDreamThemes(
        'I was lost and could not find my way. I kept wandering and searching.'
      );
      expect(result.themes.lost).toBeGreaterThan(0.5);
    });

    test('detects pursuit/chase theme', () => {
      const result = analyzeDreamThemes(
        'Someone was chasing me and I was running and hiding, trying to escape.'
      );
      expect(result.themes.pursuit).toBeGreaterThan(0.5);
    });

    test('detects falling theme', () => {
      const result = analyzeDreamThemes('I was falling endlessly, slipping and plummeting.');
      expect(result.themes.falling).toBeGreaterThan(0.5);
    });

    test('detects water theme', () => {
      const result = analyzeDreamThemes(
        'There was water everywhere, waves, an ocean. I was swimming and drowning.'
      );
      expect(result.themes.water).toBeGreaterThan(0.5);
    });

    test('detects flying theme', () => {
      const result = analyzeDreamThemes('I was flying, soaring above everything, floating free.');
      expect(result.themes.flying).toBeGreaterThan(0.5);
    });

    test('does not detect themes from unrelated text', () => {
      const result = analyzeDreamThemes('I was eating lunch with my friend in a quiet cafe.');
      for (const score of Object.values(result.themes)) {
        expect(score).toBeLessThanOrEqual(0.3);
      }
    });
  });

  describe('undercurrent generation', () => {
    test('lost theme produces uncertainty undercurrent', () => {
      const result = analyzeDreamThemes('I was lost, wandering, searching, could not find the way.');
      expect(result.undercurrent).toMatch(/uncertainty|searching/i);
    });

    test('pursuit theme produces tension undercurrent', () => {
      const result = analyzeDreamThemes('I was being chased, running, hiding, trying to escape.');
      expect(result.undercurrent).toMatch(/tension|self-protection/i);
    });

    test('falling theme produces loss of control undercurrent', () => {
      const result = analyzeDreamThemes('I was falling, plummeting, slipping endlessly.');
      expect(result.undercurrent).toMatch(/control/i);
    });

    test('water theme produces emotional depth undercurrent', () => {
      const result = analyzeDreamThemes('Water was everywhere, waves and ocean and drowning.');
      expect(result.undercurrent).toMatch(/emotion|depth/i);
    });

    test('no clear theme produces generic undercurrent', () => {
      const result = analyzeDreamThemes('I was just sitting in a room.');
      expect(result.undercurrent).toBeDefined();
      expect(result.undercurrent.length).toBeGreaterThan(0);
    });
  });

  describe('intensity scoring', () => {
    test('vivid dream with many theme words has high intensity', () => {
      const result = analyzeDreamThemes(
        'I was chasing someone, running, hiding, escaping, fleeing. I could not get away.'
      );
      expect(result.intensity).toBeGreaterThan(0.6);
    });

    test('mild dream with few theme words has lower intensity', () => {
      const result = analyzeDreamThemes('I was walking and got a bit lost.');
      expect(result.intensity).toBeLessThanOrEqual(0.5);
    });

    test('completely unrelated dream text has near-zero intensity', () => {
      const result = analyzeDreamThemes('I was eating a sandwich at home.');
      expect(result.intensity).toBeLessThanOrEqual(0.2);
    });
  });

  describe('recurring theme detection across days', () => {
    test('repeated lost dreams produce dream_theme card', () => {
      const days = [
        makeDay({ dreamLogged: true, dreamText: 'I was lost and could not find where I was going.' }),
        makeDay({ dreamLogged: true, dreamText: 'I kept searching for my way home but got turned around.' }),
        makeDay({ dreamLogged: true, dreamText: 'I was wandering, trying to get somewhere, nothing made sense.' }),
        makeDay({ dreamLogged: true, dreamText: 'I was lost again, trying to find the right path.' }),
      ];

      const cards = buildInsightCards({ days });
      const dreamCard = cards.find((c) => c.type === 'dream_theme');

      expect(dreamCard).toBeDefined();
      expect(dreamCard!.body).toMatch(/dreams?/i);
    });

    test('single dream is not enough for a dream theme card', () => {
      const days = [
        makeDay({ dreamLogged: true, dreamText: 'I was lost and wandering.' }),
        makeDay({ dreamLogged: false }),
        makeDay({ dreamLogged: false }),
        makeDay({ dreamLogged: false }),
        makeDay({ dreamLogged: false }),
      ];

      const cards = buildInsightCards({ days });
      const dreamCard = cards.find((c) => c.type === 'dream_theme');

      expect(dreamCard).toBeUndefined();
    });
  });

  describe('uncertainty language (trust protection)', () => {
    test('dream card uses hedging language, not assertions', () => {
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
    });

    test('dream card never uses absolute interpretation language', () => {
      const days = [
        makeDay({ dreamLogged: true, dreamText: 'I was lost and could not find the way.' }),
        makeDay({ dreamLogged: true, dreamText: 'I was wandering and searching endlessly.' }),
        makeDay({ dreamLogged: true, dreamText: 'I got turned around and could not find the exit.' }),
        makeDay({ dreamLogged: true, dreamText: 'Searching for a path but totally lost.' }),
      ];

      const cards = buildInsightCards({ days });
      const dreamCard = cards.find((c) => c.type === 'dream_theme');

      expect(dreamCard).toBeDefined();
      expect(dreamCard!.body).not.toMatch(/\bmeans\b|proves|definitely|certainly|always|diagnosis/i);
    });

    test('dream card never uses clinical or diagnostic terms', () => {
      const days = [
        makeDay({ dreamLogged: true, dreamText: 'I was falling and falling.' }),
        makeDay({ dreamLogged: true, dreamText: 'I was slipping and plummeting.' }),
        makeDay({ dreamLogged: true, dreamText: 'I dropped and kept falling.' }),
      ];

      const cards = buildInsightCards({ days });
      const dreamCard = cards.find((c) => c.type === 'dream_theme');

      if (dreamCard) {
        expect(dreamCard.body).not.toMatch(/disorder|trauma|anxiety disorder|depression|clinical/i);
      }
    });
  });

  describe('edge cases', () => {
    test('empty dream text does not crash', () => {
      const result = analyzeDreamThemes('');
      expect(result.themes).toBeDefined();
      expect(result.intensity).toBe(0);
    });

    test('very long dream text does not produce scores above 1', () => {
      const longText = Array(50).fill('I was lost and wandering, searching, could not find the way.').join(' ');
      const result = analyzeDreamThemes(longText);

      for (const score of Object.values(result.themes)) {
        expect(score).toBeLessThanOrEqual(1);
      }
    });
  });
});
