import {
  GENERATED_INSIGHT_PARAGRAPHS,
  GENERATED_WEEKLY_INSIGHT_PARAGRAPHS,
} from '../generated/generatedInsightParagraphs';
import {
  SELECTOR_PROFILES,
  hasEnoughPatternEvidence,
  inferTargetIntensity,
  selectGeneratedInsightForSurface,
} from '../adapters/premiumPatternParagraphLibrary';

const responsibilityInput = {
  targetCategory: 'responsibilityCare' as const,
  targetSubcategory: 'responsibilityQuestion',
  targetPatternType: 'highTracking' as const,
  targetIntensity: 'medium' as const,
  signalTypes: ['mental_load', 'responsibility_weight', 'journal'],
};

describe('generated paragraph selector', () => {
  it('infers high intensity from activated current-moment signals', () => {
    expect(inferTargetIntensity({
      stress: 4,
      triggerIntensity: 2,
      nervousSystemState: 'fight',
      emotionTags: ['overwhelmed'],
      somaticCues: ['tight chest'],
    })).toBe('high');
  });

  it('keeps Today selection in the daily card pool and favors Today shapes', () => {
    const selected = selectGeneratedInsightForSurface({
      surface: 'today',
      ...responsibilityInput,
      targetIntensity: 'high',
      recentlyUsedIds: [],
    });

    expect(selected).toBeTruthy();
    expect(selected?.allowedSurfaces).toContain('today');
    expect(selected?.flowName).not.toBe('weeklyDeepDive');
    expect(GENERATED_WEEKLY_INSIGHT_PARAGRAPHS.some(item => item.id === selected?.id)).toBe(false);
    expect(SELECTOR_PROFILES.today.preferredWriterShapes).toContain(selected!.writerShape);
  });

  it('prefers pattern-screen writer shapes for durable Patterns reads', () => {
    const selected = selectGeneratedInsightForSurface({
      surface: 'patterns',
      ...responsibilityInput,
      targetIntensity: 'high',
      recentlyUsedIds: [],
    });

    expect(selected).toBeTruthy();
    expect(selected?.allowedSurfaces).toContain('patterns');
    expect(SELECTOR_PROFILES.patterns.preferredWriterShapes).toContain(selected!.writerShape);
    expect(SELECTOR_PROFILES.patterns.avoidedWriterShapes).not.toContain(selected!.writerShape);
  });

  it('does not select a recently used paragraph id', () => {
    const first = selectGeneratedInsightForSurface({
      surface: 'patterns',
      ...responsibilityInput,
      recentlyUsedIds: [],
    });
    const second = selectGeneratedInsightForSurface({
      surface: 'patterns',
      ...responsibilityInput,
      recentlyUsedIds: [first!.id],
    });

    expect(first).toBeTruthy();
    expect(second).toBeTruthy();
    expect(second?.id).not.toBe(first?.id);
  });

  it('uses weekly paragraph pools for Weekly and This Week surfaces', () => {
    const weekly = selectGeneratedInsightForSurface({
      surface: 'weeklyDeepDive',
      ...responsibilityInput,
      recentlyUsedIds: [],
    });
    const thisWeek = selectGeneratedInsightForSurface({
      surface: 'thisWeek',
      ...responsibilityInput,
      targetIntensity: 'high',
      recentlyUsedIds: [],
    });

    expect(weekly?.flowName).toBe('weeklyDeepDive');
    expect(thisWeek?.flowName).toBe('weeklyDeepDive');
    expect(GENERATED_INSIGHT_PARAGRAPHS.some(item => item.id === weekly?.id)).toBe(false);
    expect(GENERATED_INSIGHT_PARAGRAPHS.some(item => item.id === thisWeek?.id)).toBe(false);
    expect(thisWeek?.intensity).not.toBe('high');
  });

  it('requires repeated evidence before the Patterns surface can make a durable read', () => {
    expect(hasEnoughPatternEvidence({
      surface: 'patterns',
      categoryScore: 0.86,
      entryCount: 1,
      distinctDays: 1,
    })).toBe(false);
    expect(hasEnoughPatternEvidence({
      surface: 'patterns',
      categoryScore: 0.5,
      entryCount: 3,
      distinctDays: 2,
    })).toBe(true);
  });
});
