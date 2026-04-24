import { selectPattern } from '../patternSelector';
import { writePremiumInsight } from '../premiumInsightWriter';
import { runQualityGate } from '../insightQualityGate';
import { evaluateEligibility } from '../../premium/eligibility';
import { supabase } from '../../../../lib/supabase';

jest.mock('../../../../lib/supabase', () => ({
  supabase: {
    functions: {
      invoke: jest.fn(),
    },
  },
}));

describe('Premium Insight Pipeline', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('selectPattern', () => {
    it('should parse the new taxonomy and evidence object correctly', async () => {
      const mockResponse = {
        selected_pattern: {
          id: 'test-pattern-1',
          insightClass: 'deep_pattern',
          claim: 'body tension in back co-occurs with stress',
          userFacingTopic: 'Somatic Stress',
          domainsUsed: ['somatic', 'journal'],
          timeWindowDays: 90,
          repeatCount: 5,
          confidence: 0.85,
          novelty: 0.5,
          emotionalWeight: 0.6,
          stability: 0.7,
          primarySignals: [],
          supportingSignals: [],
          crossDomainLinks: [],
          userLanguageAnchors: ['heavy'],
          extractedPhrases: [],
          phraseHealth: 'clean',
          paradox: 'User stays highly functional while body registers strain.',
          paradoxStrength: 0.6,
          valenceClass: 'negative',
          causalStrength: 0.4,
          isIdentityClaim: false,
          stats: {},
        },
        writing_constraints: {
          must_include: ['heavy'],
          must_avoid: ['you are'],
          tone_target: 'observational',
          word_count_target: 200,
        },
      };

      (supabase.functions.invoke as jest.Mock).mockResolvedValue({
        data: { text: JSON.stringify(mockResponse) },
        error: null,
      });

      const result = await selectPattern({} as any, 'fake-token');
      expect(result).toEqual(mockResponse);
      expect(result?.selected_pattern.insightClass).toBe('deep_pattern');
      expect(result?.selected_pattern.phraseHealth).toBe('clean');
    });

    it('should handle edge function errors gracefully', async () => {
      (supabase.functions.invoke as jest.Mock).mockResolvedValue({
        data: null,
        error: new Error('Network error'),
      });

      const result = await selectPattern({} as any, 'fake-token');
      expect(result).toBeNull();
    });
  });

  describe('writePremiumInsight', () => {
    it('should parse the insight response correctly', async () => {
      const mockResponse = {
        title: 'Where Your System Braces',
        body: 'An observation body text.',
        invitation: 'A gentle reflection.',
        quality_checks: {
          specificity_score: 0.9,
          cross_domain_grounding_score: 0.8,
          emotional_accuracy_score: 0.85,
          paradox_score: 0.8,
          mySky_voice_score: 0.9,
          premium_score: 0.9,
        },
      };

      (supabase.functions.invoke as jest.Mock).mockResolvedValue({
        data: { text: JSON.stringify(mockResponse) },
        error: null,
      });

      const result = await writePremiumInsight({} as any, 'fake-token');
      expect(result).toEqual(mockResponse);
      expect(result?.title).toBe('Where Your System Braces');
    });
  });

  describe('canRenderInsight', () => {
    it('should fail if phrase hygiene is broken', () => {
      const { canRenderInsight } = require('../insightQualityGate');
      const evidence = {
        insightClass: 'deep_pattern',
        phraseHealth: 'broken',
        confidence: 0.9,
      };
      const result = canRenderInsight(evidence as any);
      expect(result.allowed).toBe(false);
      expect(result.reasons).toContain('broken phrase hygiene');
    });

    it('should downgrade a deep pattern if there is only one domain', () => {
      const { canRenderInsight } = require('../insightQualityGate');
      const evidence = {
        insightClass: 'deep_pattern',
        phraseHealth: 'clean',
        confidence: 0.9,
        domainsUsed: ['somatic'],
        repeatCount: 10,
        isIdentityClaim: false,
      };
      const result = canRenderInsight(evidence as any);
      expect(result.allowed).toBe(false);
      expect(result.downgradeTo).toBe('emerging_pattern');
      expect(result.reasons).toContain('needs cross-domain evidence');
    });

    it('should reject non-archive insights built from generic categories alone', () => {
      const { canRenderInsight } = require('../insightQualityGate');
      const evidence = {
        insightClass: 'emerging_pattern',
        phraseHealth: 'clean',
        confidence: 0.7,
        domainsUsed: ['check_ins', 'journal'],
        timeWindowDays: 14,
        repeatCount: 4,
        primarySignals: ['stress was high'],
        supportingSignals: ['mood was low'],
        crossDomainLinks: [],
        userLanguageAnchors: ['stress', 'mood'],
        extractedPhrases: [],
        isIdentityClaim: false,
      };

      const result = canRenderInsight(evidence as any);
      expect(result.allowed).toBe(false);
      expect(result.reasons).toContain('missing specific recurring user language');
    });

    it('should allow an emerging pattern with time, language, pattern, and second-domain support', () => {
      const { canRenderInsight } = require('../insightQualityGate');
      const evidence = {
        insightClass: 'emerging_pattern',
        phraseHealth: 'clean',
        confidence: 0.72,
        domainsUsed: ['journal', 'sleep'],
        timeWindowDays: 10,
        repeatCount: 4,
        primarySignals: ['after lower-sleep nights, entries become more self-conscious'],
        supportingSignals: ['sleep drops below 6 hours nearby'],
        crossDomainLinks: ['low sleep + guarded journal language recur together'],
        userLanguageAnchors: ['trying to hold it together'],
        extractedPhrases: ['bracing'],
        isIdentityClaim: false,
      };

      const result = canRenderInsight(evidence as any);
      expect(result.allowed).toBe(true);
    });
  });

  describe('evaluateEligibility', () => {
    it('should block premium evidence without the three tailored anchors', () => {
      const result = evaluateEligibility({
        id: 'generic-category-pattern',
        insightClass: 'emerging_pattern',
        claim: 'stress and mood are recurring themes',
        userFacingTopic: 'Stress',
        domainsUsed: ['check_ins'],
        timeWindowDays: 0,
        repeatCount: 3,
        confidence: 0.7,
        novelty: 0.5,
        emotionalWeight: 0.6,
        stability: 0.5,
        primarySignals: [],
        supportingSignals: [],
        crossDomainLinks: [],
        userLanguageAnchors: ['stress'],
        extractedPhrases: [],
        phraseHealth: 'clean',
        paradox: null,
        paradoxStrength: 0.1,
        valenceClass: 'negative',
        causalStrength: 0.2,
        isIdentityClaim: false,
        stats: {},
      });

      expect(result.allowed).toBe(false);
      expect(result.reasons).toContain('missing specific recurring user language');
      expect(result.reasons).toContain('missing temporal anchor');
      expect(result.reasons).toContain('missing behavioral or emotional pattern signal');
      expect(result.reasons).toContain('missing support signal from second domain');
    });
  });

  describe('runQualityGate', () => {
    it('should parse quality gate rejection correctly', async () => {
      const mockResponse = {
        approved: false,
        reason: 'Taxonomy Violation: insight_type is emerging_pattern but tone was too confident.',
        scores: {
          specificity: 0.6,
          crossDomainGrounding: 0.5,
          emotionalAccuracy: 0.7,
          paradoxDepth: 0.4,
          mySkyVoice: 0.7,
          premiumValue: 0.6,
          phraseCleanliness: 0.8,
          evidenceFit: 0.6,
        },
        downgradeTo: 'emerging_pattern',
        suggested_revision: 'Downgrade confidence to "what may be starting to emerge"',
      };

      (supabase.functions.invoke as jest.Mock).mockResolvedValue({
        data: { text: JSON.stringify(mockResponse) },
        error: null,
      });

      const result = await runQualityGate({} as any, 'fake-token');
      expect(result).toEqual(mockResponse);
      expect(result?.approved).toBe(false);
      expect(result?.reason).toContain('Taxonomy Violation');
      expect(result?.downgradeTo).toBe('emerging_pattern');
    });
  });
});
