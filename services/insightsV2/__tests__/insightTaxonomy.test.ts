import {
  allowedCandidateSurfacesForCategory,
  insightTaxonomyForCategory,
  insightTaxonomyForSubcategory,
  INSIGHT_TAXONOMY_CATEGORIES,
  INSIGHT_TAXONOMY_DOMAINS,
  isInsightCategoryAllowedOnCandidateSurface,
} from '../taxonomy/insightTaxonomy';
import {
  isInsightCategoryAllowedOnSurface,
} from '../insightSurfacePolicy';
import {
  GENERATED_INSIGHT_PARAGRAPHS,
} from '../../insights/generatedInsightParagraphs';

const PATTERN_TYPES = ['highTracking', 'lowAccess', 'pushPull', 'delayedActivation'] as const;

describe('canonical insight taxonomy', () => {
  it('centralizes domain, subcategory, anchor, signal, surface, and pattern-type rules', () => {
    const taxonomy = insightTaxonomyForCategory('relationships');

    expect(taxonomy).toEqual(expect.objectContaining({
      category: 'relationships',
      majorDomain: 'attachmentConnection',
      domainName: 'Attachment & Connection',
      subcategory: 'toneShiftSensitivity',
      theoryLens: [
        'attachmentTheory',
        'socialBaselineTheory',
        'repairRuptureTheory',
        'connectionSafety',
        'proximitySeeking',
        'attachmentActivationDeactivation',
      ],
      allowedSurfaces: ['today', 'patterns', 'weeklyDeepDive', 'thisWeek'],
    }));
    expect(taxonomy?.blockedSurfaces).toContain('dreamInterpretation');
    expect(taxonomy?.microMoments.highTracking.length).toBeGreaterThan(0);
    expect(taxonomy?.actions.lowAccess.length).toBeGreaterThan(0);
    expect(taxonomy?.validationStyle.pushPull.length).toBeGreaterThan(0);
    expect(taxonomy?.landings.delayedActivation.length).toBeGreaterThan(0);
    expect(new Set(taxonomy?.patternTypes)).toEqual(new Set(PATTERN_TYPES));
    expect(taxonomy?.patternTypeRules.highTracking).toBe(
      'When someone’s tone shifts, you notice immediately and start looking for what changed.',
    );
    expect(taxonomy?.anchors).toEqual(expect.arrayContaining(['tone-shift', 'repair']));
    expect(taxonomy?.signalTypes).toEqual(expect.arrayContaining(['relationshipMirror', 'triggerLog']));
  });

  it('keeps paragraph metadata aligned to the taxonomy registry', () => {
    for (const paragraph of GENERATED_INSIGHT_PARAGRAPHS) {
      const taxonomy = insightTaxonomyForSubcategory(paragraph.majorDomain, paragraph.insightSubcategory);

      expect(taxonomy).toBeDefined();
      expect(paragraph.majorDomain).toBe(taxonomy?.majorDomain);
      expect(paragraph.insightSubcategory).toBe(taxonomy?.subcategory);
      expect(paragraph.theoryLens).toEqual(taxonomy?.theoryLens);

      const anchorOverlap = paragraph.anchors.some(anchor => taxonomy?.anchors.includes(anchor));
      const signalOverlap = paragraph.signalTypes.some(signalType => taxonomy?.signalTypes.includes(signalType));
      const isTaxonomyGenerated = paragraph.id.startsWith(`${paragraph.majorDomain}_${paragraph.insightSubcategory}_`);
      if (isTaxonomyGenerated) {
        expect(anchorOverlap).toBe(true);
      }
      expect(signalOverlap).toBe(true);
    }
  });

  it('uses taxonomy surface routing for normal insight screens and isolates dreams to the dream engine', () => {
    expect(INSIGHT_TAXONOMY_DOMAINS).toHaveLength(50);
    expect(INSIGHT_TAXONOMY_CATEGORIES.some(item => item.category === 'dreamsSymbols')).toBe(false);

    expect(allowedCandidateSurfacesForCategory('relationships')).toEqual([
      'today',
      'patterns',
      'weeklyDeepDive',
      'thisWeek',
    ]);
    expect(allowedCandidateSurfacesForCategory('dreamsSymbols')).toEqual(['dreamInterpretation']);
    expect(insightTaxonomyForCategory('dreamsSymbols')?.blockedSurfaces).toEqual([
      'today',
      'patterns',
      'weeklyDeepDive',
      'thisWeek',
    ]);
    expect(isInsightCategoryAllowedOnCandidateSurface('dreamsSymbols', 'today')).toBe(false);
    expect(isInsightCategoryAllowedOnCandidateSurface('dreamsSymbols', 'dreamInterpretation')).toBe(true);
    expect(isInsightCategoryAllowedOnSurface('dreamsSymbols', 'patternScreen')).toBe(false);
    expect(isInsightCategoryAllowedOnSurface('relationships', 'today')).toBe(true);
  });
});
