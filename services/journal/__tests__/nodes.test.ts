import { getNodeAxis, getNodeInsight, getSouthNodeContent, getNorthNodeContent } from '../nodes';
import { makeTestChart } from '../../astrology/__tests__/fixtures';

describe('nodes', () => {
  describe('getSouthNodeContent()', () => {
    it('returns content for houses 1-12', () => {
      for (let h = 1; h <= 12; h++) {
        const entry = getSouthNodeContent(h);
        expect(entry).toBeDefined();
        expect(entry.house).toBe(h);
        expect(typeof entry.title).toBe('string');
        expect(typeof entry.theme).toBe('string');
        expect(typeof entry.description).toBe('string');
        expect(Array.isArray(entry.journalPrompts)).toBe(true);
        expect(entry.journalPrompts.length).toBeGreaterThan(0);
      }
    });
  });

  describe('getNorthNodeContent()', () => {
    it('returns content for houses 1-12', () => {
      for (let h = 1; h <= 12; h++) {
        const entry = getNorthNodeContent(h);
        expect(entry).toBeDefined();
        expect(entry.house).toBe(h);
        expect(typeof entry.title).toBe('string');
        expect(typeof entry.theme).toBe('string');
        expect(typeof entry.description).toBe('string');
        expect(Array.isArray(entry.journalPrompts)).toBe(true);
      }
    });

    it('south and north for same house have different themes', () => {
      for (let h = 1; h <= 12; h++) {
        expect(getSouthNodeContent(h).title).not.toBe(getNorthNodeContent(h).title);
      }
    });
  });

  describe('getNodeAxis()', () => {
    it('works with test chart', () => {
      const chart = makeTestChart();
      const result = getNodeAxis(chart);
      expect(result === null || typeof result === 'object').toBe(true);
    });
  });

  describe('getNodeInsight()', () => {
    it('works with test chart', () => {
      const chart = makeTestChart();
      const result = getNodeInsight(chart);
      expect(result === null || typeof result === 'object').toBe(true);
    });
  });
});
