import {
  computeTrendDirection,
  computeVolatility,
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

describe('trend analysis', () => {
  describe('computeTrendDirection', () => {
    test('improving when recent is meaningfully above previous', () => {
      expect(computeTrendDirection(72, 58)).toBe('improving');
      expect(computeTrendDirection(90, 60)).toBe('improving');
    });

    test('declining when recent is meaningfully below previous', () => {
      expect(computeTrendDirection(48, 62)).toBe('declining');
      expect(computeTrendDirection(30, 70)).toBe('declining');
    });

    test('steady when difference is within threshold', () => {
      expect(computeTrendDirection(61, 58)).toBe('steady');
      expect(computeTrendDirection(55, 60)).toBe('steady');
      expect(computeTrendDirection(50, 50)).toBe('steady');
    });

    test('boundary: exactly at threshold is steady', () => {
      expect(computeTrendDirection(65, 58)).toBe('steady'); // diff = 7
    });

    test('boundary: one past threshold is improving', () => {
      expect(computeTrendDirection(66, 58)).toBe('improving'); // diff = 8
    });

    test('equal values are steady', () => {
      expect(computeTrendDirection(50, 50)).toBe('steady');
      expect(computeTrendDirection(0, 0)).toBe('steady');
      expect(computeTrendDirection(100, 100)).toBe('steady');
    });
  });

  describe('computeVolatility', () => {
    test('zero volatility for constant sequence', () => {
      expect(computeVolatility([50, 50, 50, 50])).toBe(0);
    });

    test('low volatility for gradual changes', () => {
      const volatility = computeVolatility([50, 51, 52, 53, 54, 55, 56]);
      expect(volatility).toBeLessThanOrEqual(2);
    });

    test('low volatility for minor oscillation', () => {
      const volatility = computeVolatility([60, 61, 59, 60, 60, 61, 59]);
      expect(volatility).toBeLessThanOrEqual(3);
    });

    test('high volatility for dramatic swings', () => {
      const volatility = computeVolatility([20, 80, 25, 75, 30, 85, 20]);
      expect(volatility).toBeGreaterThanOrEqual(35);
    });

    test('moderate volatility for moderate swings', () => {
      const volatility = computeVolatility([40, 55, 42, 58, 45, 55]);
      expect(volatility).toBeGreaterThanOrEqual(10);
      expect(volatility).toBeLessThanOrEqual(20);
    });

    test('handles single value without error', () => {
      expect(computeVolatility([50])).toBe(0);
    });

    test('handles empty array without error', () => {
      expect(computeVolatility([])).toBe(0);
    });

    test('handles two values', () => {
      const volatility = computeVolatility([20, 80]);
      expect(volatility).toBe(60);
    });
  });

  describe('7-day window comparisons', () => {
    test('improving week detected when stability rises across windows', () => {
      const week1 = Array.from({ length: 7 }, (_, i) =>
        makeDay({
          date: `2026-03-${String(20 + i).padStart(2, '0')}`,
          mood: 2, energy: 2, stress: 4, sleepQuality: 2, overwhelm: 4,
        })
      );

      const week2 = Array.from({ length: 7 }, (_, i) =>
        makeDay({
          date: `2026-03-${String(27 + i).padStart(2, '0')}`,
          mood: 4, energy: 4, stress: 2, sleepQuality: 4, overwhelm: 2,
        })
      );

      const avgStability = (days: DailyCheckIn[]) =>
        days.reduce((s, d) => s + computeDailyScores(d).derived.stabilityScore, 0) / days.length;

      const trend = computeTrendDirection(avgStability(week2), avgStability(week1));
      expect(trend).toBe('improving');
    });

    test('declining week detected when stability drops across windows', () => {
      const week1 = Array.from({ length: 7 }, (_, i) =>
        makeDay({
          date: `2026-03-${String(20 + i).padStart(2, '0')}`,
          mood: 4, energy: 4, stress: 2, sleepQuality: 4, overwhelm: 2,
        })
      );

      const week2 = Array.from({ length: 7 }, (_, i) =>
        makeDay({
          date: `2026-03-${String(27 + i).padStart(2, '0')}`,
          mood: 2, energy: 2, stress: 4, sleepQuality: 2, overwhelm: 4,
        })
      );

      const avgStability = (days: DailyCheckIn[]) =>
        days.reduce((s, d) => s + computeDailyScores(d).derived.stabilityScore, 0) / days.length;

      const trend = computeTrendDirection(avgStability(week2), avgStability(week1));
      expect(trend).toBe('declining');
    });

    test('steady when two similar weeks are compared', () => {
      const week1 = Array.from({ length: 7 }, (_, i) =>
        makeDay({
          date: `2026-03-${String(20 + i).padStart(2, '0')}`,
          mood: 3, energy: 3, stress: 3, sleepQuality: 3, overwhelm: 3,
        })
      );

      const week2 = Array.from({ length: 7 }, (_, i) =>
        makeDay({
          date: `2026-03-${String(27 + i).padStart(2, '0')}`,
          mood: 3, energy: 3, stress: 3, sleepQuality: 3, overwhelm: 3,
        })
      );

      const avgStability = (days: DailyCheckIn[]) =>
        days.reduce((s, d) => s + computeDailyScores(d).derived.stabilityScore, 0) / days.length;

      const trend = computeTrendDirection(avgStability(week2), avgStability(week1));
      expect(trend).toBe('steady');
    });
  });

  describe('volatility across real-like day sequences', () => {
    test('stability volatility is low for consistent good week', () => {
      const days = Array.from({ length: 7 }, (_, i) =>
        makeDay({
          date: `2026-04-${String(i + 1).padStart(2, '0')}`,
          mood: 4, energy: 4, stress: 2, sleepQuality: 4, overwhelm: 2,
        })
      );

      const scores = days.map((d) => computeDailyScores(d).derived.stabilityScore);
      expect(computeVolatility(scores)).toBeLessThanOrEqual(3);
    });

    test('stability volatility is high for erratic week', () => {
      const patterns = [
        { mood: 5, energy: 5, stress: 1, sleepQuality: 5, overwhelm: 1 },
        { mood: 1, energy: 1, stress: 5, sleepQuality: 1, overwhelm: 5 },
        { mood: 5, energy: 4, stress: 1, sleepQuality: 5, overwhelm: 1 },
        { mood: 1, energy: 2, stress: 5, sleepQuality: 1, overwhelm: 5 },
        { mood: 4, energy: 5, stress: 2, sleepQuality: 4, overwhelm: 2 },
        { mood: 1, energy: 1, stress: 5, sleepQuality: 2, overwhelm: 5 },
        { mood: 5, energy: 4, stress: 1, sleepQuality: 5, overwhelm: 1 },
      ];

      const days = patterns.map((p, i) =>
        makeDay({ date: `2026-04-${String(i + 1).padStart(2, '0')}`, ...p })
      );

      const scores = days.map((d) => computeDailyScores(d).derived.stabilityScore);
      expect(computeVolatility(scores)).toBeGreaterThanOrEqual(30);
    });
  });

  describe('sparse data safety', () => {
    test('single day produces valid scores without errors', () => {
      const day = makeDay({ mood: 4, energy: 3, stress: 2, sleepQuality: 4 });
      const scores = computeDailyScores(day);

      expect(Number.isFinite(scores.derived.stabilityScore)).toBe(true);
      expect(Number.isFinite(scores.derived.strainScore)).toBe(true);
    });

    test('volatility of one value is zero, not NaN', () => {
      expect(Number.isFinite(computeVolatility([42]))).toBe(true);
      expect(computeVolatility([42])).toBe(0);
    });
  });
});
