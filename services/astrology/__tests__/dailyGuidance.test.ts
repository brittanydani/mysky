jest.mock('../transits', () => ({
  getTransitingLongitudes: jest.fn(() => ({
    Moon: 158, Sun: 355, Mercury: 340, Venus: 10, Mars: 200,
  })),
  computeTransitAspectsToNatal: jest.fn(() => []),
}));

jest.mock('../../../utils/dateUtils', () => ({
  toLocalDateString: (d: Date) => d.toISOString().slice(0, 10),
}));

import { DailyGuidanceGenerator } from '../dailyGuidance';
import {
  getTransitingLongitudes,
  computeTransitAspectsToNatal,
} from '../transits';
import { makeTestChart } from './fixtures';

describe('DailyGuidanceGenerator', () => {
  const chart = makeTestChart();
  const date  = new Date('2026-03-15T14:00:00Z');

  beforeEach(() => jest.clearAllMocks());

  // ── Shape ────────────────────────────────────────────────────────────────

  it('returns DailyEmotionalWeather with all required fields', () => {
    const result = DailyGuidanceGenerator.generateDailyWeather(chart, date);
    expect(result).toHaveProperty('emotionalClimate');
    expect(result).toHaveProperty('moonInfluence');
    expect(result).toHaveProperty('energyGuidance');
    expect(result).toHaveProperty('gentlenessAreas');
    expect(result).toHaveProperty('careAction');
    expect(result).toHaveProperty('intensity');
    expect(result).toHaveProperty('themes');
  });

  it('emotionalClimate is a non-empty string', () => {
    const result = DailyGuidanceGenerator.generateDailyWeather(chart, date);
    expect(typeof result.emotionalClimate).toBe('string');
    expect(result.emotionalClimate.length).toBeGreaterThan(0);
  });

  it('intensity is a number between 0 and 1', () => {
    const result = DailyGuidanceGenerator.generateDailyWeather(chart, date);
    expect(typeof result.intensity).toBe('number');
    expect(result.intensity).toBeGreaterThanOrEqual(0);
    expect(result.intensity).toBeLessThanOrEqual(1);
  });

  it('themes is an array', () => {
    const result = DailyGuidanceGenerator.generateDailyWeather(chart, date);
    expect(Array.isArray(result.themes)).toBe(true);
    expect(result.themes.length).toBeGreaterThan(0);
  });

  it('gentlenessAreas is an array', () => {
    const result = DailyGuidanceGenerator.generateDailyWeather(chart, date);
    expect(Array.isArray(result.gentlenessAreas)).toBe(true);
  });

  // ── Moon sign detection ──────────────────────────────────────────────────

  it('does not crash when Moon transit longitude is provided', () => {
    // Moon at 30° = Taurus element
    (getTransitingLongitudes as jest.Mock).mockReturnValueOnce({ Moon: 30, Sun: 355 });
    (computeTransitAspectsToNatal as jest.Mock).mockReturnValueOnce([]);
    expect(() => DailyGuidanceGenerator.generateDailyWeather(chart, date)).not.toThrow();
  });

  it('does not crash when Moon transit is absent (falls back to natal)', () => {
    (getTransitingLongitudes as jest.Mock).mockReturnValueOnce({ Sun: 355 });
    (computeTransitAspectsToNatal as jest.Mock).mockReturnValueOnce([]);
    expect(() => DailyGuidanceGenerator.generateDailyWeather(chart, date)).not.toThrow();
  });

  // ── Aspect-driven intensity ──────────────────────────────────────────────

  it('raises intensity above 0.5 for Moon square Moon', () => {
    (computeTransitAspectsToNatal as jest.Mock).mockReturnValueOnce([
      { pointA: 'Moon', pointB: 'Moon', type: 'square', orb: 1.5 },
    ]);
    const result = DailyGuidanceGenerator.generateDailyWeather(chart, date);
    expect(result.intensity).toBeGreaterThan(0.5);
  });

  it('raises intensity above 0.5 for Moon opposition Moon', () => {
    (computeTransitAspectsToNatal as jest.Mock).mockReturnValueOnce([
      { pointA: 'Moon', pointB: 'Moon', type: 'opposition', orb: 2 },
    ]);
    const result = DailyGuidanceGenerator.generateDailyWeather(chart, date);
    expect(result.intensity).toBeGreaterThan(0.5);
  });

  it('sets intensity around 0.7 for Moon conjunction Moon', () => {
    (computeTransitAspectsToNatal as jest.Mock).mockReturnValueOnce([
      { pointA: 'Moon', pointB: 'Moon', type: 'conjunction', orb: 0.5 },
    ]);
    const result = DailyGuidanceGenerator.generateDailyWeather(chart, date);
    expect(result.intensity).toBeGreaterThanOrEqual(0.7);
  });

  it('keeps intensity lower for Moon trine Moon', () => {
    (computeTransitAspectsToNatal as jest.Mock).mockReturnValueOnce([
      { pointA: 'Moon', pointB: 'Moon', type: 'trine', orb: 2 },
    ]);
    const result = DailyGuidanceGenerator.generateDailyWeather(chart, date);
    expect(result.intensity).toBeLessThan(0.6);
  });

  // ── Sun aspect handling ──────────────────────────────────────────────────

  it('produces non-empty emotionalClimate for Moon conjunction Sun', () => {
    (computeTransitAspectsToNatal as jest.Mock).mockReturnValueOnce([
      { pointA: 'Moon', pointB: 'Sun', type: 'conjunction', orb: 1 },
    ]);
    const result = DailyGuidanceGenerator.generateDailyWeather(chart, date);
    expect(result.emotionalClimate.length).toBeGreaterThan(0);
  });

  it('does not throw with empty transit aspects', () => {
    (computeTransitAspectsToNatal as jest.Mock).mockReturnValueOnce([]);
    expect(() => DailyGuidanceGenerator.generateDailyWeather(chart, date)).not.toThrow();
  });

  it('sorts results by tightness (smallest orb first) when multiple aspects provided', () => {
    (computeTransitAspectsToNatal as jest.Mock).mockReturnValueOnce([
      { pointA: 'Moon', pointB: 'Sun',  type: 'conjunction', orb: 3.5 },
      { pointA: 'Moon', pointB: 'Moon', type: 'square',      orb: 0.5 },
    ]);
    // Tightest is Moon-Moon square (orb 0.5) → should raise intensity
    const result = DailyGuidanceGenerator.generateDailyWeather(chart, date);
    expect(result.intensity).toBeGreaterThan(0.5);
  });
});
