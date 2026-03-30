import { HealingInsightsGenerator } from '../healingInsights';
import { makeTestChart } from '../../astrology/__tests__/fixtures';

describe('healingInsights', () => {
  describe('HealingInsightsGenerator', () => {
    it('generateHealingInsights returns complete structure', () => {
      const chart = makeTestChart();
      const insights = HealingInsightsGenerator.generateHealingInsights(chart);
      expect(insights.attachment).toBeDefined();
      expect(typeof insights.attachment.style).toBe('string');
      expect(typeof insights.attachment.headline).toBe('string');
      expect(insights.fears).toBeDefined();
      expect(insights.safety).toBeDefined();
      expect(insights.reparenting).toBeDefined();
      expect(typeof insights.dailyJournalPrompt).toBe('string');
      expect(typeof insights.weeklyReflection).toBe('string');
    });

    it('getDailyHealingPrompt returns a string', () => {
      const prompt = HealingInsightsGenerator.getDailyHealingPrompt();
      expect(typeof prompt).toBe('string');
      expect(prompt.length).toBeGreaterThan(0);
    });

    it('getWeeklyFocus returns a string', () => {
      const focus = HealingInsightsGenerator.getWeeklyFocus();
      expect(typeof focus).toBe('string');
      expect(focus.length).toBeGreaterThan(0);
    });
  });
});
