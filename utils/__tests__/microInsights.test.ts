import { generateMicroInsights, type DailySnapshot } from '../microInsights';

function makeSnapshot(overrides: Partial<DailySnapshot> = {}): DailySnapshot {
  return {
    date: '2025-04-01',
    dayOfWeek: 1,
    mood: 5,
    energy: 5,
    stress: 5,
    sleepHours: 7,
    ...overrides,
  };
}

describe('generateMicroInsights', () => {
  it('returns empty array with fewer than 3 snapshots', () => {
    expect(generateMicroInsights([])).toHaveLength(0);
    expect(generateMicroInsights([makeSnapshot()])).toHaveLength(0);
    expect(generateMicroInsights([makeSnapshot(), makeSnapshot()])).toHaveLength(0);
  });

  it('detects upward mood trend', () => {
    const snapshots = [
      makeSnapshot({ date: '2025-04-01', mood: 3, dayOfWeek: 2 }),
      makeSnapshot({ date: '2025-04-02', mood: 4, dayOfWeek: 3 }),
      makeSnapshot({ date: '2025-04-03', mood: 5, dayOfWeek: 4 }),
      makeSnapshot({ date: '2025-04-04', mood: 6, dayOfWeek: 5 }),
    ];
    const insights = generateMicroInsights(snapshots);
    const moodTrend = insights.find((i) => i.type === 'mood_trend');
    expect(moodTrend).toBeDefined();
    expect(moodTrend!.text).toContain('upward');
  });

  it('detects downward mood trend', () => {
    const snapshots = [
      makeSnapshot({ date: '2025-04-01', mood: 8, dayOfWeek: 1 }),
      makeSnapshot({ date: '2025-04-02', mood: 7, dayOfWeek: 2 }),
      makeSnapshot({ date: '2025-04-03', mood: 6, dayOfWeek: 3 }),
      makeSnapshot({ date: '2025-04-04', mood: 5, dayOfWeek: 4 }),
    ];
    const insights = generateMicroInsights(snapshots);
    const moodTrend = insights.find((i) => i.type === 'mood_trend');
    expect(moodTrend).toBeDefined();
    expect(moodTrend!.text).toContain('dipping');
  });

  it('detects sleep-mood correlation', () => {
    const snapshots = [
      makeSnapshot({ mood: 7, sleepHours: 8 }),
      makeSnapshot({ mood: 8, sleepHours: 7.5 }),
      makeSnapshot({ mood: 3, sleepHours: 5 }),
      makeSnapshot({ mood: 2, sleepHours: 4.5 }),
    ];
    const insights = generateMicroInsights(snapshots);
    const sleepMood = insights.find((i) => i.type === 'sleep_mood');
    expect(sleepMood).toBeDefined();
  });

  it('detects low energy pattern', () => {
    const snapshots = Array.from({ length: 5 }, () => makeSnapshot({ energy: 2 }));
    const insights = generateMicroInsights(snapshots);
    const energyInsight = insights.find((i) => i.type === 'energy_pattern');
    expect(energyInsight).toBeDefined();
  });

  it('returns at most 3 insights', () => {
    // Build snapshots designed to trigger multiple insights
    const snapshots = Array.from({ length: 7 }, (_, i) =>
      makeSnapshot({
        date: `2025-04-0${i + 1}`,
        dayOfWeek: i % 7,
        mood: i < 4 ? 8 : 4,
        energy: 2,
        sleepHours: i % 2 === 0 ? 4 : 8,
      }),
    );
    const insights = generateMicroInsights(snapshots);
    expect(insights.length).toBeLessThanOrEqual(3);
  });

  it('each insight has a unique id', () => {
    const snapshots = Array.from({ length: 5 }, (_, i) =>
      makeSnapshot({ date: `2025-04-0${i + 1}`, dayOfWeek: i % 7 }),
    );
    const insights = generateMicroInsights(snapshots);
    const ids = insights.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
