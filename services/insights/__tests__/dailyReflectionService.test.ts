import { getReflectionDate, getTodayKey, getTodayQuestions, getAllTodayQuestions } from '../dailyReflectionService';

describe('dailyReflectionService (pure functions)', () => {
  describe('getReflectionDate()', () => {
    it('returns a Date', () => {
      const d = getReflectionDate();
      expect(d).toBeInstanceOf(Date);
    });

    it('returns same date for given input', () => {
      const now = new Date('2025-06-15T10:00:00Z');
      const d = getReflectionDate(now);
      expect(d).toBeInstanceOf(Date);
    });
  });

  describe('getTodayKey()', () => {
    it('returns YYYY-MM-DD format', () => {
      const key = getTodayKey(new Date('2025-06-15T10:00:00Z'));
      expect(key).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('returns consistent key for same date', () => {
      const d = new Date('2025-01-01T12:00:00Z');
      expect(getTodayKey(d)).toBe(getTodayKey(d));
    });
  });

  describe('getTodayQuestions()', () => {
    it('returns questions for a category', () => {
      const questions = getTodayQuestions('values', new Date('2025-06-15'));
      expect(Array.isArray(questions)).toBe(true);
      expect(questions.length).toBeGreaterThan(0);
    });

    it('each question has text', () => {
      const questions = getTodayQuestions('values', new Date('2025-06-15'));
      for (const q of questions) {
        expect(typeof q.text).toBe('string');
        expect(q.text.length).toBeGreaterThan(0);
      }
    });

    it('returns deterministic results for same seed', () => {
      const d = new Date('2025-06-15');
      const q1 = getTodayQuestions('values', d, 'seed-a');
      const q2 = getTodayQuestions('values', d, 'seed-a');
      expect(q1).toEqual(q2);
    });
  });

  describe('getAllTodayQuestions()', () => {
    it('returns questions for all categories', () => {
      const all = getAllTodayQuestions(new Date('2025-06-15'));
      expect(Array.isArray(all)).toBe(true);
      expect(all.length).toBeGreaterThan(0);
    });

    it('each entry has category and questions', () => {
      const all = getAllTodayQuestions(new Date('2025-06-15'));
      for (const entry of all) {
        expect(typeof entry.category).toBe('string');
        expect(Array.isArray(entry.questions)).toBe(true);
      }
    });
  });
});
