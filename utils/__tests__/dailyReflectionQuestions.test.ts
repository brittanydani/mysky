import { QUESTION_BANKS } from '../../constants/dailyReflectionQuestions';

describe('dailyReflectionQuestions', () => {
  describe('QUESTION_BANKS', () => {
    it('has values, archetypes, and cognitive categories', () => {
      expect(QUESTION_BANKS).toHaveProperty('values');
      expect(QUESTION_BANKS).toHaveProperty('archetypes');
      expect(QUESTION_BANKS).toHaveProperty('cognitive');
    });

    it('values bank has 365 questions', () => {
      expect(QUESTION_BANKS.values).toHaveLength(365);
    });

    it('each question has id and text', () => {
      QUESTION_BANKS.values.slice(0, 10).forEach((q) => {
        expect(typeof q.id).toBe('number');
        expect(typeof q.text).toBe('string');
        expect(q.text.length).toBeGreaterThan(0);
      });
    });

    it('archetypes bank has 365 questions', () => {
      expect(QUESTION_BANKS.archetypes).toHaveLength(365);
    });

    it('cognitive bank has 365 questions', () => {
      expect(QUESTION_BANKS.cognitive).toHaveLength(365);
    });
  });
});
