import { HumanGuidanceGenerator } from '../humanGuidance';
import type { HumanDailyGuidance, GuidanceMessage } from '../humanGuidance';

describe('humanGuidance', () => {
  describe('HumanGuidanceGenerator', () => {
    it('class exists and has generateDailyGuidance static method', () => {
      expect(HumanGuidanceGenerator).toBeDefined();
      expect(typeof HumanGuidanceGenerator.generateDailyGuidance).toBe('function');
    });
  });

  describe('type shape', () => {
    it('HumanDailyGuidance matches expected interface', () => {
      const guidance: HumanDailyGuidance = {
        date: '2025-01-01',
        greeting: 'Hello',
        cosmicWeather: 'Clear skies',
        love: { headline: 'Love', message: 'Message' },
        energy: { headline: 'Energy', message: 'Message' },
        growth: { headline: 'Growth', message: 'Message' },
        gentleReminder: 'Remember',
        journalPrompt: 'Write',
        mantra: 'Be still',
      };
      expect(guidance.date).toBe('2025-01-01');
      expect(guidance.love.headline).toBe('Love');
    });

    it('GuidanceMessage has headline and message', () => {
      const msg: GuidanceMessage = { headline: 'Test', message: 'Body' };
      expect(msg.headline).toBe('Test');
    });
  });
});
