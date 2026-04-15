import type { DailyCheckIn } from '../../../services/patterns/types';
import { clampScore, derivePatternOrbitScores, getPatternOrbitSummary, getPatternOrbitThemes } from '../patternOrbitHelpers';

function makeCheckIn(overrides: Partial<DailyCheckIn> = {}): DailyCheckIn {
  return {
    id: 'ci-1',
    date: '2026-04-10',
    chartId: 'chart-1',
    timeOfDay: 'morning',
    moodScore: 7,
    energyLevel: 'medium',
    stressLevel: 'medium',
    tags: [],
    moonSign: 'Cancer',
    moonHouse: 4,
    sunHouse: 10,
    transitEvents: [],
    lunarPhase: 'new',
    retrogrades: [],
    createdAt: '2026-04-10T08:00:00.000Z',
    updatedAt: '2026-04-10T08:00:00.000Z',
    ...overrides,
  };
}

describe('patternOrbitHelpers', () => {
  it('returns stable default scores without check-ins', () => {
    expect(derivePatternOrbitScores([])).toEqual([0.28, 0.28, 0.28, 0.28, 0.28, 0.28, 0.28]);
  });

  it('derives ranked themes from check-in signals', () => {
    const scores = derivePatternOrbitScores([
      makeCheckIn({ tags: ['rest', 'clarity'], stressLevel: 'low', moodScore: 8 }),
      makeCheckIn({ id: 'ci-2', date: '2026-04-11', tags: ['rest', 'clarity'], stressLevel: 'low', moodScore: 8 }),
      makeCheckIn({ id: 'ci-3', date: '2026-04-12', tags: ['rest', 'nature'], stressLevel: 'low', moodScore: 7 }),
      makeCheckIn({ id: 'ci-4', date: '2026-04-13', tags: ['clarity', 'focused'], stressLevel: 'low', moodScore: 8 }),
      makeCheckIn({ id: 'ci-5', date: '2026-04-14', tags: ['rest'], stressLevel: 'low', moodScore: 7 }),
    ]);
    const themes = getPatternOrbitThemes(scores);

    expect(themes[0]).toBe('REST');
    expect(themes).toContain('CLARITY');
  });

  it('summarizes top themes with special copy branches', () => {
    expect(getPatternOrbitSummary(Array.from({ length: 5 }, (_, i) => makeCheckIn({ id: `ci-${i}`, date: `2026-04-1${i}` })), ['REST', 'CLARITY', 'TRUST']))
      .toBe('Recovery is becoming part of the pattern, not an afterthought.');
    expect(getPatternOrbitSummary([makeCheckIn()], ['STRESS', 'REST', 'TRUST']))
      .toBe('Patterns sharpen as more entries land.');
  });

  it('clamps orbit scores to the intended range', () => {
    expect(clampScore(0.01)).toBe(0.2);
    expect(clampScore(1.2)).toBe(0.95);
  });
});