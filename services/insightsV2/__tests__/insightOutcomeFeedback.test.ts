import {
  buildInsightFeedbackProfile,
  insightFeedbackScoreForParagraph,
  insightOutcomeFromGeneratedInsight,
  type InsightOutcomeEvent,
} from '../feedback/insightOutcomeFeedback';
import type { GeneratedInsightParagraph } from '../../insights/generatedInsightParagraphs';
import type { GeneratedInsight } from '../../insights/types/knowledgeEngine';

const baseEvent = (overrides: Partial<InsightOutcomeEvent>): InsightOutcomeEvent => ({
  id: overrides.id ?? `event-${Math.random()}`,
  outcome: overrides.outcome ?? 'ratedHelpful',
  occurredAt: overrides.occurredAt ?? '2026-04-30T12:00:00Z',
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
  id: overrides.id ?? 'attachmentConnection_toneShiftSensitivity_highTracking_body_001',
  category: overrides.category ?? 'relationships',
  writerShape: overrides.writerShape ?? 'body',
  flowName: overrides.flowName ?? 'microMoment',
  patternType: overrides.patternType ?? 'highTracking',
  majorDomain: overrides.majorDomain ?? 'attachmentConnection',
  theoryLens: overrides.theoryLens ?? ['attachmentTheory'],
  insightSubcategory: overrides.insightSubcategory ?? 'toneShiftSensitivity',
  anchors: overrides.anchors ?? ['tone-shift'],
  tone: overrides.tone ?? 'grounded',
  intensity: overrides.intensity ?? 'medium',
  signalTypes: overrides.signalTypes ?? ['relationshipMirror'],
  tags: overrides.tags ?? ['relationship'],
  avoidIfRecentlyUsed: overrides.avoidIfRecentlyUsed ?? true,
  isCurated: overrides.isCurated ?? false,
  source: overrides.source ?? 'pythonGenerated',
  body: overrides.body ?? 'When someone’s tone shifts, your body notices before your mind has the full story. You replay what changed and look for where repair might be needed. That kind of awareness did not come from nowhere. You learned to catch the shift early. It just means you can end up bracing inside moments that are still unfolding.',
});

describe('insight outcome feedback', () => {
  it('builds a lightweight preference profile from helpful and unhelpful outcomes', () => {
    const profile = buildInsightFeedbackProfile([
      baseEvent({ id: 'helpful-body', outcome: 'ratedHelpful' }),
      baseEvent({
        id: 'saved-body',
        outcome: 'saved',
        writerShape: 'body',
        patternType: 'highTracking',
      }),
      baseEvent({
        id: 'bad-practical',
        outcome: 'ratedNotHelpful',
        writerShape: 'practicalCapacity',
        tone: 'practical',
        hasPracticalPrompt: true,
      }),
    ], new Date('2026-05-02T12:00:00Z'));

    expect(profile.eventCount).toBe(3);
    expect(profile.positiveCount).toBe(2);
    expect(profile.negativeCount).toBe(1);
    expect(profile.preferred.writerShapes).toContain('body');
    expect(profile.preferred.patternTypes).toContain('highTracking');
    expect(profile.preferred.majorDomains).toContain('attachmentConnection');
    expect(profile.preferred.avoidsPracticalPrompts).toBe(true);
  });

  it('scores paragraphs toward the styles this user responds to', () => {
    const profile = buildInsightFeedbackProfile([
      baseEvent({ id: 'body-helpful', outcome: 'ratedHelpful', writerShape: 'body' }),
      baseEvent({ id: 'body-journaled', outcome: 'journaledFrom', writerShape: 'body' }),
      baseEvent({
        id: 'practical-dismissed',
        outcome: 'dismissed',
        writerShape: 'practicalCapacity',
        tone: 'practical',
        hasPracticalPrompt: true,
      }),
    ], new Date('2026-05-02T12:00:00Z'));

    const preferred = insightFeedbackScoreForParagraph(paragraph({ writerShape: 'body' }), profile);
    const avoided = insightFeedbackScoreForParagraph(paragraph({
      writerShape: 'practicalCapacity',
      tone: 'practical',
    }), profile);

    expect(preferred).toBeGreaterThan(0);
    expect(avoided).toBeLessThan(preferred);
  });

  it('can create an outcome payload from the visible insight metadata', () => {
    const insight: GeneratedInsight = {
      id: 'insight-1',
      slot: 'whatMySkyNoticed',
      title: 'A relationship thread',
      observation: 'When someone’s tone shifts, your body notices before your mind has the full story.',
      pattern: 'You replay what changed and look for where repair might be needed.',
      paragraphId: 'relationships_tone_shift_gold_001',
      category: 'relationships',
      writerShape: 'tender',
      patternType: 'highTracking',
      majorDomain: 'attachmentConnection',
      insightSubcategory: 'toneShiftSensitivity',
      paragraphTone: 'grounded',
      paragraphIntensity: 'medium',
      sentenceCount: 5,
      hasPracticalPrompt: false,
      reframe: { shame: '', clarity: 'That kind of bracing makes sense.' },
      prompt: 'What changed in the connection?',
      patternKey: 'relationships_toneShiftSensitivity',
      confidence: 'strong',
      movement: 'repeating',
      evidence: [],
      createdAt: '2026-05-02T12:00:00Z',
    };

    expect(insightOutcomeFromGeneratedInsight(insight, 'saved')).toEqual(expect.objectContaining({
      outcome: 'saved',
      paragraphId: 'relationships_tone_shift_gold_001',
      majorDomain: 'attachmentConnection',
      subcategory: 'toneShiftSensitivity',
      patternType: 'highTracking',
      writerShape: 'tender',
      sentenceCount: 5,
    }));
  });
});
