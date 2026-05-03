import type { GeneratedInsightParagraph } from '../generated/generatedInsightParagraphs';
import { buildInsightFeedbackProfile, type InsightOutcomeEvent } from '../feedback/insightOutcomeFeedback';
import {
  buildPersonalizedInsightStyleRoute,
  personalizedStyleRouteScore,
} from '../selection/personalizedStyleRouting';

const event = (overrides: Partial<InsightOutcomeEvent>): InsightOutcomeEvent => ({
  id: overrides.id ?? 'event',
  outcome: overrides.outcome ?? 'ratedHelpful',
  occurredAt: overrides.occurredAt ?? '2026-05-01T12:00:00Z',
  category: 'relationships',
  majorDomain: 'attachmentConnection',
  subcategory: 'toneShiftSensitivity',
  patternType: 'highTracking',
  writerShape: 'body',
  tone: 'grounded',
  intensity: 'medium',
  surface: 'today',
  sentenceCount: 5,
  ...overrides,
});

const paragraph = (overrides: Partial<GeneratedInsightParagraph>): GeneratedInsightParagraph => ({
  id: overrides.id ?? 'paragraph',
  category: overrides.category ?? 'relationships',
  writerShape: overrides.writerShape ?? 'body',
  flowName: overrides.flowName ?? 'microMoment',
  patternType: overrides.patternType ?? 'highTracking',
  majorDomain: overrides.majorDomain ?? 'attachmentConnection',
  theoryLens: overrides.theoryLens ?? ['attachmentTheory'],
  insightSubcategory: overrides.insightSubcategory ?? 'toneShiftSensitivity',
  anchors: overrides.anchors ?? ['tone-shift', 'body-before-words'],
  allowedSurfaces: overrides.allowedSurfaces ?? ['today', 'patterns'],
  tone: overrides.tone ?? 'grounded',
  intensity: overrides.intensity ?? 'medium',
  signalTypes: overrides.signalTypes ?? ['relationshipMirror'],
  tags: overrides.tags ?? ['relationship'],
  avoidIfRecentlyUsed: overrides.avoidIfRecentlyUsed ?? true,
  isCurated: overrides.isCurated ?? false,
  source: overrides.source ?? 'pythonGenerated',
  body: overrides.body ?? 'When someone’s tone shifts, your body notices before your mind has the full story. You replay what changed and look for where repair might be needed. That kind of awareness did not come from nowhere. You learned to catch the shift early. It just means you can end up bracing inside moments that are still unfolding.',
});

describe('personalized style routing', () => {
  it('turns outcome history into a readable style route', () => {
    const profile = buildInsightFeedbackProfile([
      event({ id: 'body-helpful', outcome: 'ratedHelpful', writerShape: 'body', tone: 'grounded', sentenceCount: 5 }),
      event({ id: 'body-journaled', outcome: 'journaledFrom', writerShape: 'body', tone: 'grounded', sentenceCount: 5 }),
      event({
        id: 'poetic-ignored',
        outcome: 'ratedNotHelpful',
        writerShape: 'poetic',
        tone: 'poetic',
        sentenceCount: 4,
      }),
      event({
        id: 'practical-dismissed',
        outcome: 'dismissed',
        writerShape: 'practicalCapacity',
        tone: 'practical',
        sentenceCount: 4,
        hasPracticalPrompt: true,
      }),
    ], new Date('2026-05-02T12:00:00Z'));

    const route = buildPersonalizedInsightStyleRoute(profile);

    expect(route.styles).toContain('bodyFirst');
    expect(route.avoidedStyles).toEqual(expect.arrayContaining(['poeticMeaning', 'practicalNextStep']));
    expect(route.preferredWriterShapes).toContain('body');
    expect(route.avoidedWriterShapes).toEqual(expect.arrayContaining(['poetic', 'practicalCapacity']));
    expect(route.preferredPatternTypes).toContain('highTracking');
    expect(route.preferredDepth).toBe('deeperReflective');
    expect(route.avoidsPracticalPrompts).toBe(true);
    expect(route.reasonCodes).toContain('prefers:bodyFirst');
  });

  it('scores paragraph metadata by the personalized route, not just category match', () => {
    const profile = buildInsightFeedbackProfile([
      event({ id: 'saved-body', outcome: 'saved', writerShape: 'body', tone: 'grounded', sentenceCount: 5 }),
      event({ id: 'journaled-body', outcome: 'journaledFrom', writerShape: 'body', tone: 'grounded', sentenceCount: 5 }),
      event({
        id: 'ignored-poetic',
        outcome: 'ignored',
        writerShape: 'poetic',
        tone: 'poetic',
        patternType: 'pushPull',
        sentenceCount: 4,
      }),
    ], new Date('2026-05-02T12:00:00Z'));
    const route = buildPersonalizedInsightStyleRoute(profile);
    const bodyFirstScore = personalizedStyleRouteScore(paragraph({ writerShape: 'body', tone: 'grounded' }), route, 'today');
    const poeticScore = personalizedStyleRouteScore(paragraph({
      writerShape: 'poetic',
      tone: 'poetic',
      patternType: 'pushPull',
      anchors: ['symbolic-processing'],
    }), route, 'today');

    expect(bodyFirstScore).toBeGreaterThan(0);
    expect(poeticScore).toBeLessThan(bodyFirstScore);
  });
});
