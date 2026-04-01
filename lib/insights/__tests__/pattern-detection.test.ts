import {
  detectBestDayPatterns,
  detectHardDayPatterns,
  analyzeSleepMoodRelationship,
  computeDailyScores,
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

describe('pattern detection', () => {
  describe('best-day pattern detection', () => {
    test('identifies sleep, stress, and connection as best-day ingredients', () => {
      const days = [
        ...Array.from({ length: 5 }, (_, i) =>
          makeDay({ date: `2026-04-${String(i + 1).padStart(2, '0')}`, mood: 5, energy: 4, stress: 1, sleepQuality: 5, sleepHours: 8, connection: 4, overwhelm: 1 })
        ),
        ...Array.from({ length: 5 }, (_, i) =>
          makeDay({ date: `2026-04-${String(i + 6).padStart(2, '0')}`, mood: 1, energy: 1, stress: 5, sleepQuality: 1, sleepHours: 4.5, connection: 1, overwhelm: 5 })
        ),
      ];

      const result = detectBestDayPatterns(days);

      expect(result.hasEnoughData).toBe(true);
      expect(result.commonFactors.sleepQualityHigher).toBe(true);
      expect(result.commonFactors.stressLower).toBe(true);
      expect(result.commonFactors.connectionHigher).toBe(true);
      expect(result.commonFactors.energyHigher).toBe(true);
    });

    test('returns no common factors when all days are identical', () => {
      const days = Array.from({ length: 7 }, (_, i) =>
        makeDay({ date: `2026-04-${String(i + 1).padStart(2, '0')}` })
      );

      const result = detectBestDayPatterns(days);
      expect(result.hasEnoughData).toBe(true);

      // With identical data, no factor should differentiate best from rest
      expect(result.commonFactors.sleepQualityHigher).toBe(false);
      expect(result.commonFactors.stressLower).toBe(false);
    });

    test('refuses to detect patterns with fewer than 5 days', () => {
      const days = makeDays([
        { mood: 5, sleepQuality: 5 },
        { mood: 1, sleepQuality: 1 },
        { mood: 3, sleepQuality: 3 },
      ]);

      expect(detectBestDayPatterns(days).hasEnoughData).toBe(false);
    });

    test('detects sleep as key factor even when other metrics are noisy', () => {
      const days = makeDays([
        { mood: 4, energy: 3, stress: 3, sleepQuality: 5, connection: 2, overwhelm: 3 },
        { mood: 5, energy: 2, stress: 2, sleepQuality: 5, connection: 3, overwhelm: 2 },
        { mood: 4, energy: 4, stress: 2, sleepQuality: 4, connection: 3, overwhelm: 2 },
        { mood: 2, energy: 2, stress: 4, sleepQuality: 1, connection: 3, overwhelm: 4 },
        { mood: 1, energy: 3, stress: 4, sleepQuality: 1, connection: 2, overwhelm: 4 },
        { mood: 2, energy: 1, stress: 3, sleepQuality: 2, connection: 4, overwhelm: 3 },
      ]);

      const result = detectBestDayPatterns(days);
      expect(result.commonFactors.sleepQualityHigher).toBe(true);
    });
  });

  describe('hard-day pattern detection', () => {
    test('identifies low sleep, high stress, low energy on hard days', () => {
      const days = [
        ...Array.from({ length: 4 }, (_, i) =>
          makeDay({ date: `2026-04-${String(i + 1).padStart(2, '0')}`, mood: 5, energy: 4, stress: 1, sleepQuality: 5, sleepHours: 8, connection: 4, overwhelm: 1 })
        ),
        ...Array.from({ length: 6 }, (_, i) =>
          makeDay({ date: `2026-04-${String(i + 5).padStart(2, '0')}`, mood: 1, energy: 1, stress: 5, sleepQuality: 1, sleepHours: 4.5, connection: 1, overwhelm: 5 })
        ),
      ];

      const result = detectHardDayPatterns(days);

      expect(result.hasEnoughData).toBe(true);
      expect(result.commonFactors.lowSleep).toBe(true);
      expect(result.commonFactors.highStress).toBe(true);
      expect(result.commonFactors.lowEnergy).toBe(true);
      expect(result.commonFactors.highOverwhelm).toBe(true);
    });

    test('refuses to detect patterns with fewer than 5 days', () => {
      const days = makeDays([
        { mood: 1, stress: 5 },
        { mood: 5, stress: 1 },
      ]);

      expect(detectHardDayPatterns(days).hasEnoughData).toBe(false);
    });

    test('identical data produces no differentiating hard-day factors', () => {
      const days = Array.from({ length: 7 }, (_, i) =>
        makeDay({ date: `2026-04-${String(i + 1).padStart(2, '0')}` })
      );

      const result = detectHardDayPatterns(days);
      expect(result.commonFactors.lowSleep).toBe(false);
      expect(result.commonFactors.highStress).toBe(false);
    });
  });

  describe('sleep-mood relationship', () => {
    test('strong positive relationship when good sleep aligns with good mood', () => {
      const days = makeDays([
        { sleepQuality: 5, mood: 5 },
        { sleepQuality: 5, mood: 4 },
        { sleepQuality: 4, mood: 4 },
        { sleepQuality: 4, mood: 5 },
        { sleepQuality: 1, mood: 1 },
        { sleepQuality: 1, mood: 2 },
        { sleepQuality: 2, mood: 1 },
        { sleepQuality: 2, mood: 2 },
        { sleepQuality: 1, mood: 1 },
        { sleepQuality: 5, mood: 5 },
      ]);

      const result = analyzeSleepMoodRelationship(days);
      expect(result.hasEnoughData).toBe(true);
      expect(result.relationship).toBe('positive');
      expect(result.strength).toMatch(/moderate|strong/i);
    });

    test('insufficient data with only 3 entries', () => {
      const days = makeDays([
        { sleepQuality: 5, mood: 5 },
        { sleepQuality: 1, mood: 1 },
        { sleepQuality: 3, mood: 3 },
      ]);

      const result = analyzeSleepMoodRelationship(days);
      expect(result.hasEnoughData).toBe(false);
      expect(result.strength).toBe('insufficient_data');
    });

    test('no relationship when sleep and mood are unrelated', () => {
      const days = makeDays([
        { sleepQuality: 5, mood: 1 },
        { sleepQuality: 1, mood: 5 },
        { sleepQuality: 5, mood: 2 },
        { sleepQuality: 1, mood: 4 },
        { sleepQuality: 5, mood: 1 },
        { sleepQuality: 1, mood: 5 },
        { sleepQuality: 3, mood: 3 },
      ]);

      const result = analyzeSleepMoodRelationship(days);

      if (result.hasEnoughData) {
        // With anti-correlated data the relationship direction matters more than size
        expect(result.relationship).not.toBe('positive');
      } else {
        expect(result.strength).toBe('insufficient_data');
      }
    });

    test('weak relationship when variation is minimal', () => {
      const days = makeDays([
        { sleepQuality: 3, mood: 3 },
        { sleepQuality: 3, mood: 3 },
        { sleepQuality: 3, mood: 3 },
        { sleepQuality: 3, mood: 3 },
        { sleepQuality: 3, mood: 3 },
        { sleepQuality: 3, mood: 3 },
        { sleepQuality: 3, mood: 3 },
      ]);

      const result = analyzeSleepMoodRelationship(days);
      // No variance means cannot split into good/poor groups
      expect(result.hasEnoughData).toBe(false);
    });
  });

  describe('stability and restoration co-patterns', () => {
    test('high stability days also tend to have high restoration', () => {
      const goodDay = computeDailyScores(
        makeDay({ mood: 5, energy: 5, stress: 1, sleepQuality: 5, sleepHours: 8, connection: 4, overwhelm: 1 })
      );

      expect(goodDay.derived.stabilityScore).toBeGreaterThanOrEqual(80);
      expect(goodDay.derived.restorationScore).toBeGreaterThanOrEqual(80);
    });

    test('high strain days tend to have low stability', () => {
      const badDay = computeDailyScores(
        makeDay({ mood: 1, energy: 1, stress: 5, sleepQuality: 1, sleepHours: 4.5, connection: 1, overwhelm: 5 })
      );

      expect(badDay.derived.strainScore).toBeGreaterThanOrEqual(75);
      expect(badDay.derived.stabilityScore).toBeLessThanOrEqual(25);
    });
  });
});
