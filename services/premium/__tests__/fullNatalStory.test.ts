import { FullNatalStoryGenerator } from '../fullNatalStory';
import { makeTestChart } from '../../astrology/__tests__/fixtures';

describe('fullNatalStory', () => {
  const chart = makeTestChart();

  describe('generateFullStory()', () => {
    it('returns chapters for premium user', () => {
      const story = FullNatalStoryGenerator.generateFullStory(chart, true);
      expect(Array.isArray(story.chapters)).toBe(true);
      expect(story.chapters.length).toBeGreaterThan(0);
    });

    it('returns chapters for free user', () => {
      const story = FullNatalStoryGenerator.generateFullStory(chart, false);
      expect(Array.isArray(story.chapters)).toBe(true);
      expect(story.chapters.length).toBeGreaterThan(0);
    });

    it('each chapter has id, title, content', () => {
      const story = FullNatalStoryGenerator.generateFullStory(chart, true);
      for (const ch of story.chapters) {
        expect(typeof ch.id).toBe('string');
        expect(typeof ch.title).toBe('string');
        expect(typeof ch.content).toBe('string');
        expect(ch.content.length).toBeGreaterThan(0);
      }
    });

    it('returns summary and affirmation', () => {
      const story = FullNatalStoryGenerator.generateFullStory(chart, true);
      expect(typeof story.summary).toBe('string');
      expect(typeof story.affirmation).toBe('string');
    });

    it('has 10 chapters', () => {
      const story = FullNatalStoryGenerator.generateFullStory(chart, true);
      expect(story.chapters.length).toBe(10);
    });
  });
});
