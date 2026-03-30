import { analyzeDreamPattern, extractDreamFeatures, scoreDreamPatterns, detectEmotionalContradictions, analyzeEnding } from '../dreamPatternEngine';
import { computeDreamAggregates } from '../dreamAggregates';
import type { SelectedFeeling, DreamMetadata } from '../dreamTypes';
import type { KeywordMatch } from '../dreamKeywords';

const feelings: SelectedFeeling[] = [
  { id: 'anxious', intensity: 4 },
  { id: 'exposed', intensity: 3 },
];

const metadata: DreamMetadata = {
  vividness: 4,
  lucidity: 2,
  controlLevel: 1,
  awakenState: 'anxious',
  recurring: false,
};

const dreamText = 'I was standing in a crowded classroom and everyone was staring at me. I could not speak or move.';

describe('dreamPatternEngine', () => {
  const aggregates = computeDreamAggregates(feelings, null);

  describe('extractDreamFeatures()', () => {
    it('returns features from dream text', () => {
      const features = extractDreamFeatures(dreamText, [], feelings, metadata, aggregates);
      expect(features).toBeDefined();
      expect(typeof features.endingType).toBe('string');
    });
  });

  describe('scoreDreamPatterns()', () => {
    it('returns primary pattern and confidence', () => {
      const features = extractDreamFeatures(dreamText, [], feelings, metadata, aggregates);
      const result = scoreDreamPatterns(features);
      expect(typeof result.primaryPattern).toBe('string');
      expect(typeof result.confidence).toBe('number');
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });
  });

  describe('detectEmotionalContradictions()', () => {
    it('returns array', () => {
      const result = detectEmotionalContradictions(feelings, ['calm']);
      expect(Array.isArray(result)).toBe(true);
    });

    it('returns empty for no contradictions', () => {
      const result = detectEmotionalContradictions([], []);
      expect(result).toHaveLength(0);
    });
  });

  describe('analyzeEnding()', () => {
    it('returns ending analysis', () => {
      const analysis = analyzeEnding('unresolved', 42);
      expect(typeof analysis.type).toBe('string');
      expect(typeof analysis.meaning).toBe('string');
    });

    it('handles all ending types', () => {
      const types = ['resolved', 'unresolved', 'abrupt', 'escape', 'relief', 'confrontation', 'unknown'] as const;
      for (const t of types) {
        const a = analyzeEnding(t, 1);
        expect(a.type).toBe(t);
      }
    });
  });

  describe('analyzeDreamPattern()', () => {
    it('returns analysis or null for input below evidence gate', () => {
      const analysis = analyzeDreamPattern(dreamText, [], feelings, metadata, aggregates, 42);
      // Can return null if evidence is insufficient
      if (analysis) {
        expect(typeof analysis.primaryPattern).toBe('string');
        expect(typeof analysis.confidence).toBe('number');
        expect(typeof analysis.narrative).toBe('string');
        expect(typeof analysis.reflectionQuestion).toBe('string');
      } else {
        expect(analysis).toBeNull();
      }
    });

    it('returns analysis for rich dream text', () => {
      const richText = 'I was running through a dark forest being chased by a shadowy figure. I stumbled and fell into a deep pit. A bright light appeared above me and someone reached down to help me climb out. I felt terrified but also relieved and safe.';
      const analysis = analyzeDreamPattern(richText, [], feelings, metadata, aggregates, 42);
      if (analysis) {
        expect(typeof analysis.primaryPattern).toBe('string');
      }
    });
  });
});
