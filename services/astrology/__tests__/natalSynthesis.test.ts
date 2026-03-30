import {
  generateCoreIdentitySummary,
  generateRelationshipProfile,
  generateCareerProfile,
  generateEmotionalProfile,
  generateShadowGrowth,
  generateCommunicationProfile,
} from '../natalSynthesis';
import { makeTestChart } from './fixtures';

describe('natalSynthesis', () => {
  const chart = makeTestChart();

  describe('generateCoreIdentitySummary()', () => {
    it('returns sun, moon, rising signs', () => {
      const core = generateCoreIdentitySummary(chart);
      expect(typeof core.sunSign).toBe('string');
      expect(typeof core.moonSign).toBe('string');
      expect(typeof core.risingSign).toBe('string');
      expect(typeof core.overview).toBe('string');
      expect(Array.isArray(core.quickThemes)).toBe(true);
    });
  });

  describe('generateRelationshipProfile()', () => {
    it('returns complete profile', () => {
      const p = generateRelationshipProfile(chart);
      expect(typeof p.loveStyle).toBe('string');
      expect(typeof p.attractionPattern).toBe('string');
      expect(typeof p.synthesis).toBe('string');
      expect(Array.isArray(p.keyPlanets)).toBe(true);
    });
  });

  describe('generateCareerProfile()', () => {
    it('returns vocation themes', () => {
      const p = generateCareerProfile(chart);
      expect(typeof p.vocationThemes).toBe('string');
      expect(typeof p.workStyle).toBe('string');
      expect(typeof p.synthesis).toBe('string');
    });
  });

  describe('generateEmotionalProfile()', () => {
    it('returns emotional style', () => {
      const p = generateEmotionalProfile(chart);
      expect(typeof p.emotionalStyle).toBe('string');
      expect(typeof p.attachmentStyle).toBe('string');
      expect(typeof p.synthesis).toBe('string');
    });
  });

  describe('generateShadowGrowth()', () => {
    it('returns growth edges', () => {
      const p = generateShadowGrowth(chart);
      expect(typeof p.saturnLessons).toBe('string');
      expect(Array.isArray(p.growthEdges)).toBe(true);
      expect(typeof p.synthesis).toBe('string');
    });
  });

  describe('generateCommunicationProfile()', () => {
    it('returns mercury-based profile', () => {
      const p = generateCommunicationProfile(chart);
      expect(typeof p.mercurySign).toBe('string');
      expect(typeof p.expressionStyle).toBe('string');
      expect(typeof p.synthesis).toBe('string');
    });
  });
});
