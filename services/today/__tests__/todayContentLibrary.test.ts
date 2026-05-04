import { AFFIRMATION_LIBRARY, getDailyAffirmation } from '../todayContentLibrary';
import { isSupportTextAligned } from '../../insightsV2/generated/insightSupportAlignment';

describe('todayContentLibrary', () => {
  describe('AFFIRMATION_LIBRARY', () => {
    it('has at least 300 affirmations', () => {
      expect(AFFIRMATION_LIBRARY.length).toBeGreaterThanOrEqual(300);
    });

    it('each entry has id, text, and tags', () => {
      AFFIRMATION_LIBRARY.slice(0, 20).forEach((a) => {
        expect(typeof a.id).toBe('number');
        expect(typeof a.text).toBe('string');
        expect(a.text.length).toBeGreaterThan(0);
        expect(Array.isArray(a.tags)).toBe(true);
        expect(a.tags.length).toBeGreaterThan(0);
      });
    });

    it('all IDs are unique', () => {
      const ids = AFFIRMATION_LIBRARY.map((a) => a.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('contains variety of tag types', () => {
      const allTags = new Set(AFFIRMATION_LIBRARY.flatMap((a) => a.tags));
      expect(allTags.size).toBeGreaterThan(10);
    });

    it('uses the daily signal seed to select a fresh post-check-in affirmation', () => {
      const beforeCheckIn = getDailyAffirmation({ mood: 8 });
      const afterCheckIn = getDailyAffirmation({ mood: 8, dailySignalSeed: 1 });

      expect(afterCheckIn.text).not.toBe(beforeCheckIn.text);
    });

    it('subordinates Daily Affirmation to the selected knowledge insight when present', () => {
      const insightAlignment = {
        category: 'lifeDirection',
        majorDomain: 'learnedAgency',
        insightSubcategory: 'effortDoubt',
        patternType: 'pushPull',
        anchors: ['future-pressure', 'clarity-before-movement'],
        tags: ['direction', 'future', 'choice'],
        signalTypes: ['journal', 'reflectionBank', 'next_step'],
        title: 'The Effort Doubt',
        body: 'Part of you wants movement but does not trust the effort will matter.',
      };
      const affirmation = getDailyAffirmation({
        mood: 8,
        energy: 'high',
        dailySignalSeed: 1,
        insightAlignment,
      });

      expect(affirmation.text).toMatch(/effort|movement|step|change|stuck/i);
      expect(affirmation.text).not.toMatch(/intuition|inner light|closeness/i);
      expect(isSupportTextAligned(affirmation.text, insightAlignment)).toBe(true);
    });
  });
});
