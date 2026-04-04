import { HumanGuidanceGenerator } from '../humanGuidance';
import type { HumanDailyGuidance, GuidanceMessage } from '../humanGuidance';
import { DailyInsightEngine } from '../dailyInsightEngine';
import { makeTestChart } from './fixtures';

describe('humanGuidance', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('HumanGuidanceGenerator', () => {
    it('class exists and has generateDailyGuidance static method', () => {
      expect(HumanGuidanceGenerator).toBeDefined();
      expect(typeof HumanGuidanceGenerator.generateDailyGuidance).toBe('function');
    });

    it('uses engine-derived intensity instead of parsing the orb label', () => {
      jest.spyOn(DailyInsightEngine, 'generateDailyInsight').mockReturnValue({
        date: '2025-01-01',
        headline: 'Focused day',
        headlineSubtext: 'A steady day to work with what is active.',
        cards: [
          {
            domain: 'love',
            title: 'Stay connected',
            observation: 'Connection is present.',
            choicePoint: 'Reach out directly.',
            icon: '💞',
          },
        ],
        mantra: 'Stay present.',
        moonSign: 'Aries',
        moonPhase: 'Full Moon',
        intensity: 'moderate',
        signals: [{ description: 'Mars square natal Sun', orb: '0.1°' }],
      });

      const result = HumanGuidanceGenerator.generateDailyGuidance(
        makeTestChart(),
        new Date('2025-01-01T12:00:00Z')
      );

      expect(result.intensity).toBe('moderate');
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
