jest.mock('../../astrology/transits', () => ({
  getTransitingLongitudes:    jest.fn(() => ({
    Moon: 158, Sun: 355, Mercury: 340, Venus: 10, Mars: 200,
  })),
  computeTransitAspectsToNatal: jest.fn(() => [
    { pointA: 'Moon', pointB: 'Moon', type: 'trine', orb: 2 },
  ]),
}));

jest.mock('../../../utils/dateUtils', () => ({
  toLocalDateString: (d: Date) => d.toISOString().slice(0, 10),
}));

jest.mock('../../../utils/moonPhase', () => ({
  getMoonPhaseName: jest.fn(() => 'Waxing Crescent'),
}));

import { PremiumDailyGuidanceGenerator } from '../premiumDailyGuidance';
import { computeTransitAspectsToNatal } from '../../astrology/transits';
import { makeTestChart } from '../../astrology/__tests__/fixtures';

describe('PremiumDailyGuidanceGenerator', () => {
  const chart = makeTestChart();
  const date  = new Date('2026-03-15T14:00:00Z');

  beforeEach(() => jest.clearAllMocks());

  // ── Premium mode ───────────────────────────────────────────────────────────

  describe('generatePremiumGuidance() — isPremium=true', () => {
    it('returns all required top-level fields', () => {
      const result = PremiumDailyGuidanceGenerator.generatePremiumGuidance(chart, date, true);
      expect(result).toHaveProperty('date');
      expect(result).toHaveProperty('overallTheme');
      expect(result).toHaveProperty('moonPhaseContext');
      expect(result).toHaveProperty('categories');
      expect(result).toHaveProperty('transitExplanation');
      expect(result).toHaveProperty('personalizedAffirmation');
      expect(result).toHaveProperty('eveningReflection');
    });

    it('date matches the input (YYYY-MM-DD)', () => {
      const result = PremiumDailyGuidanceGenerator.generatePremiumGuidance(chart, date, true);
      expect(result.date).toBe('2026-03-15');
    });

    it('returns exactly 4 categories', () => {
      const result = PremiumDailyGuidanceGenerator.generatePremiumGuidance(chart, date, true);
      expect(result.categories.length).toBe(4);
    });

    it('includes all 4 category types', () => {
      const result = PremiumDailyGuidanceGenerator.generatePremiumGuidance(chart, date, true);
      const types = result.categories.map(c => c.category);
      expect(types).toContain('love');
      expect(types).toContain('energy');
      expect(types).toContain('work');
      expect(types).toContain('emotional');
    });

    it('each category has required non-empty string fields', () => {
      const result = PremiumDailyGuidanceGenerator.generatePremiumGuidance(chart, date, true);
      for (const cat of result.categories) {
        expect(typeof cat.guidance).toBe('string');
        expect(cat.guidance.length).toBeGreaterThan(0);
        expect(typeof cat.title).toBe('string');
        expect(cat.title.length).toBeGreaterThan(0);
        expect(typeof cat.icon).toBe('string');
        expect(typeof cat.keyInsight).toBe('string');
        expect(cat.keyInsight!.length).toBeGreaterThan(0);
        expect(typeof cat.actionSuggestion).toBe('string');
        expect(cat.actionSuggestion!.length).toBeGreaterThan(0);
      }
    });

    it('personalizedAffirmation is a non-empty string', () => {
      const result = PremiumDailyGuidanceGenerator.generatePremiumGuidance(chart, date, true);
      expect(typeof result.personalizedAffirmation).toBe('string');
      expect(result.personalizedAffirmation.length).toBeGreaterThan(0);
    });

    it('overallTheme is a non-empty string', () => {
      const result = PremiumDailyGuidanceGenerator.generatePremiumGuidance(chart, date, true);
      expect(typeof result.overallTheme).toBe('string');
      expect(result.overallTheme.length).toBeGreaterThan(0);
    });

    it('eveningReflection is a non-empty string', () => {
      const result = PremiumDailyGuidanceGenerator.generatePremiumGuidance(chart, date, true);
      expect(typeof result.eveningReflection).toBe('string');
      expect(result.eveningReflection.length).toBeGreaterThan(0);
    });

    it('transitExplanation is a non-empty string', () => {
      const result = PremiumDailyGuidanceGenerator.generatePremiumGuidance(chart, date, true);
      expect(typeof result.transitExplanation).toBe('string');
      expect(result.transitExplanation.length).toBeGreaterThan(0);
    });

    it('produces consistent output for the same input', () => {
      const r1 = PremiumDailyGuidanceGenerator.generatePremiumGuidance(chart, date, true);
      const r2 = PremiumDailyGuidanceGenerator.generatePremiumGuidance(chart, date, true);
      expect(r1.date).toBe(r2.date);
      expect(r1.categories.length).toBe(r2.categories.length);
      expect(r1.personalizedAffirmation).toBe(r2.personalizedAffirmation);
    });

    it('includes transitContext on categories when aspect data is present', () => {
      const result = PremiumDailyGuidanceGenerator.generatePremiumGuidance(chart, date, true);
      // At least some categories should have transitContext when aspects exist
      const hasTransitContext = result.categories.some(c => c.transitContext !== undefined);
      expect(hasTransitContext).toBe(true);
    });

    it('handles missing transit aspects gracefully (no crash)', () => {
      (computeTransitAspectsToNatal as jest.Mock).mockReturnValueOnce([]);
      expect(() =>
        PremiumDailyGuidanceGenerator.generatePremiumGuidance(chart, date, true)
      ).not.toThrow();
    });
  });

  // ── Free mode ──────────────────────────────────────────────────────────────

  describe('generatePremiumGuidance() — isPremium=false', () => {
    it('returns only 1 category for free users', () => {
      const result = PremiumDailyGuidanceGenerator.generatePremiumGuidance(chart, date, false);
      expect(result.categories.length).toBe(1);
    });

    it('the single category is "emotional"', () => {
      const result = PremiumDailyGuidanceGenerator.generatePremiumGuidance(chart, date, false);
      expect(result.categories[0].category).toBe('emotional');
    });

    it('free guidance references Deeper Sky upgrade', () => {
      const result = PremiumDailyGuidanceGenerator.generatePremiumGuidance(chart, date, false);
      const combined = [
        result.categories[0].actionSuggestion ?? '',
        result.categories[0].keyInsight ?? '',
        result.transitExplanation,
      ].join(' ');
      expect(combined.toLowerCase()).toContain('deeper sky');
    });

    it('free guidance still has a valid date', () => {
      const result = PremiumDailyGuidanceGenerator.generatePremiumGuidance(chart, date, false);
      expect(result.date).toBe('2026-03-15');
    });
  });
});
