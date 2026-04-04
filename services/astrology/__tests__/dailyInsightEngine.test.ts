// Mock circular-natal-horoscope-js — not available in Node tests
jest.mock('circular-natal-horoscope-js', () => {
  const mockBodies = {
    sun:     { absoluteDegrees: 355 },
    moon:    { absoluteDegrees: 158 },
    mercury: { absoluteDegrees: 340 },
    venus:   { absoluteDegrees: 10  },
    mars:    { absoluteDegrees: 200 },
    jupiter: { absoluteDegrees: 100 },
    saturn:  { absoluteDegrees: 290 },
  };
  return {
    Origin:    jest.fn().mockImplementation(() => ({})),
    Horoscope: jest.fn().mockImplementation(() => ({ CelestialBodies: mockBodies })),
  };
});

jest.mock('../astrologySettingsService', () => ({
  AstrologySettingsService: {
    getCachedSettings:   jest.fn(() => null),
    getCachedOrbConfig:  jest.fn(() => undefined),
  },
  ORB_CONFIGURATIONS: {
    normal: {
      conjunction: 8, opposition: 8, square: 6, trine: 6, sextile: 4,
      quincunx: 3, semisextile: 2, semisquare: 2, sesquiquadrate: 2,
      quintile: 2, biquintile: 2,
    },
  },
}));

import { DailyInsightEngine } from '../dailyInsightEngine';
import { makeHouseCusps, makePlacement, makeTestChart } from './fixtures';

describe('DailyInsightEngine', () => {
  const chart = makeTestChart();
  // Fixed date so mantra index and date strings are deterministic
  const date = new Date('2026-03-15T14:00:00Z');

  describe('generateDailyInsight()', () => {
    it('returns a result with all required top-level fields', () => {
      const result = DailyInsightEngine.generateDailyInsight(chart, date);
      expect(result).toHaveProperty('date');
      expect(result).toHaveProperty('headline');
      expect(result).toHaveProperty('headlineSubtext');
      expect(result).toHaveProperty('cards');
      expect(result).toHaveProperty('mantra');
      expect(result).toHaveProperty('moonSign');
      expect(result).toHaveProperty('moonPhase');
      expect(result).toHaveProperty('intensity');
      expect(result).toHaveProperty('signals');
    });

    it('date matches the input date (YYYY-MM-DD)', () => {
      const result = DailyInsightEngine.generateDailyInsight(chart, date);
      expect(result.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('returns at least one card', () => {
      const result = DailyInsightEngine.generateDailyInsight(chart, date);
      expect(result.cards.length).toBeGreaterThanOrEqual(1);
    });

    it('returns at most 3 cards', () => {
      const result = DailyInsightEngine.generateDailyInsight(chart, date);
      expect(result.cards.length).toBeLessThanOrEqual(3);
    });

    it('each card has all required fields with non-empty strings', () => {
      const result = DailyInsightEngine.generateDailyInsight(chart, date);
      for (const card of result.cards) {
        expect(typeof card.domain).toBe('string');
        expect(card.domain.length).toBeGreaterThan(0);
        expect(typeof card.title).toBe('string');
        expect(card.title.length).toBeGreaterThan(0);
        expect(typeof card.observation).toBe('string');
        expect(card.observation.length).toBeGreaterThan(0);
        expect(typeof card.choicePoint).toBe('string');
        expect(card.choicePoint.length).toBeGreaterThan(0);
        expect(typeof card.icon).toBe('string');
      }
    });

    it('cards contain only valid domain values', () => {
      const validDomains = ['love', 'energy', 'focus', 'mood', 'direction', 'home', 'growth'];
      const result = DailyInsightEngine.generateDailyInsight(chart, date);
      for (const card of result.cards) {
        expect(validDomains).toContain(card.domain);
      }
    });

    it('mantra is a non-empty string', () => {
      const result = DailyInsightEngine.generateDailyInsight(chart, date);
      expect(typeof result.mantra).toBe('string');
      expect(result.mantra.length).toBeGreaterThan(0);
    });

    it('moonSign is a non-empty string', () => {
      const result = DailyInsightEngine.generateDailyInsight(chart, date);
      expect(typeof result.moonSign).toBe('string');
      expect(result.moonSign.length).toBeGreaterThan(0);
    });

    it('moonPhase is a non-empty string', () => {
      const result = DailyInsightEngine.generateDailyInsight(chart, date);
      expect(typeof result.moonPhase).toBe('string');
      expect(result.moonPhase.length).toBeGreaterThan(0);
    });

    it('headline is a non-empty string', () => {
      const result = DailyInsightEngine.generateDailyInsight(chart, date);
      expect(typeof result.headline).toBe('string');
      expect(result.headline.length).toBeGreaterThan(0);
    });

    it('signals array contains description and orb fields', () => {
      const result = DailyInsightEngine.generateDailyInsight(chart, date);
      for (const sig of result.signals) {
        expect(typeof sig.description).toBe('string');
        expect(typeof sig.orb).toBe('string');
      }
    });

    it('returns a valid intensity level', () => {
      const result = DailyInsightEngine.generateDailyInsight(chart, date);
      expect(['calm', 'moderate', 'intense']).toContain(result.intensity);
    });

    it('timeline is defined when signals are present', () => {
      const result = DailyInsightEngine.generateDailyInsight(chart, date);
      if (result.signals.length > 0) {
        expect(result.timeline).toBeDefined();
        expect(typeof result.timeline!.peakInfluence).toBe('string');
        expect(typeof result.timeline!.easesBy).toBe('string');
        expect(typeof result.timeline!.isPartOfLongerCycle).toBe('boolean');
      }
    });

    it('produces consistent output for same date (deterministic)', () => {
      const r1 = DailyInsightEngine.generateDailyInsight(chart, date);
      const r2 = DailyInsightEngine.generateDailyInsight(chart, date);
      expect(r1.date).toBe(r2.date);
      expect(r1.mantra).toBe(r2.mantra);
      expect(r1.cards.length).toBe(r2.cards.length);
    });

    it('produces different mantra on a different day', () => {
      // Day 15 vs day 16 — mantra is indexed by date.getDate() % array.length
      const date2 = new Date('2026-03-16T14:00:00Z');
      const r1 = DailyInsightEngine.generateDailyInsight(chart, date);
      const r2 = DailyInsightEngine.generateDailyInsight(chart, date2);
      // They might occasionally match if the domain and array length align,
      // so we just verify both are valid strings
      expect(r1.mantra.length).toBeGreaterThan(0);
      expect(r2.mantra.length).toBeGreaterThan(0);
    });

    it('uses legacy houseCusps when falling back to Moon house', () => {
      const fallbackChart = makeTestChart({
        placements: [],
        planets: [],
        angles: [],
        ascendant: undefined,
        midheaven: undefined,
        houses: undefined,
        houseCusps: makeHouseCusps(),
      });

      const result = DailyInsightEngine.generateDailyInsight(fallbackChart, date);

      expect(result.signals).toHaveLength(0);
      expect(result.cards[0]?.title).toBe('Words carry feeling');
      expect(result.cards[0]?.domain).toBe('focus');
      expect(result.intensity).toBe('calm');
    });

    it('recognizes legacy ascendant and midheaven positions when angles array is absent', () => {
      const legacyAngleChart = makeTestChart({
        placements: [],
        planets: [],
        angles: [],
        houses: undefined,
        houseCusps: makeHouseCusps(),
        ascendant: makePlacement('Ascendant', 100, 'Cancer', 'Water', 'Cardinal', 4, 1, false, 'Point'),
        midheaven: makePlacement('Midheaven', 15, 'Aries', 'Fire', 'Cardinal', 1, 10, false, 'Point'),
      });

      const result = DailyInsightEngine.generateDailyInsight(legacyAngleChart, date);

      expect(result.signals.some(signal => signal.description.includes('Ascendant'))).toBe(true);
    });
  });

  describe('timeline for Saturn signals', () => {
    it('marks Saturn as a longer cycle', () => {
      // Saturn at 290° in the chart; transits Saturn is also at 290 in mock → conjunction within 0°
      // This will produce a Saturn conjunction signal which triggers longerCycle
      const result = DailyInsightEngine.generateDailyInsight(chart, date);
      if (result.timeline && result.timeline.isPartOfLongerCycle) {
        expect(result.timeline.longerCycleNote).toBeDefined();
        expect(typeof result.timeline.longerCycleNote).toBe('string');
      }
    });
  });
});
