import {
  buildInsightMemoryProfile,
  deriveInsightMemoryTrends,
  previousPatternScoresFromInsightMemory,
  summarizeWhatChangedSinceLastWeek,
  type InsightMemorySnapshot,
} from '../memory/insightMemory';

const snapshot = (overrides: Partial<InsightMemorySnapshot>): InsightMemorySnapshot => ({
  id: overrides.id ?? `${overrides.weekKey ?? '2026-W17'}:${overrides.patternKey ?? 'relationships_toneShift'}`,
  observedAt: overrides.observedAt ?? '2026-04-24T12:00:00Z',
  weekKey: overrides.weekKey ?? '2026-W17',
  surface: overrides.surface ?? 'patterns',
  rank: overrides.rank ?? 0,
  isPrimary: overrides.isPrimary ?? false,
  patternKey: overrides.patternKey ?? 'relationships_toneShift',
  title: overrides.title ?? 'Tone Shift Sensitivity',
  category: overrides.category ?? 'relationships',
  score: overrides.score ?? 72,
  confidence: overrides.confidence ?? 'strong',
  movement: overrides.movement ?? 'repeating',
  majorDomain: overrides.majorDomain ?? 'attachmentConnection',
  insightSubcategory: overrides.insightSubcategory ?? 'toneShiftSensitivity',
  patternType: overrides.patternType ?? 'highTracking',
  paragraphId: overrides.paragraphId ?? 'paragraph-1',
  writerShape: overrides.writerShape ?? 'body',
  paragraphTone: overrides.paragraphTone ?? 'grounded',
  sources: overrides.sources ?? ['relationshipMirror', 'bodyMap'],
  relatedSignals: overrides.relatedSignals ?? ['tone_sensitivity', 'chest_tension'],
  anchors: overrides.anchors ?? ['tone-shift', 'body-before-words'],
  bodyKey: overrides.bodyKey ?? 'tone shift body',
  ...overrides,
});

describe('longitudinal insight memory', () => {
  it('derives increasing, softening, body-linked, and sleep-linked trend facts', () => {
    const snapshots = [
      snapshot({
        id: 'w16-tone',
        weekKey: '2026-W16',
        observedAt: '2026-04-17T12:00:00Z',
        score: 82,
        sources: ['relationshipMirror', 'bodyMap', 'sleep'],
        relatedSignals: ['tone_sensitivity', 'chest_tension', 'low_sleep'],
      }),
      snapshot({
        id: 'w17-tone',
        weekKey: '2026-W17',
        observedAt: '2026-04-24T12:00:00Z',
        score: 68,
        sources: ['relationshipMirror', 'bodyMap', 'sleep'],
        relatedSignals: ['tone_sensitivity', 'chest_tension', 'low_sleep'],
      }),
      snapshot({
        id: 'w16-time',
        weekKey: '2026-W16',
        observedAt: '2026-04-17T12:00:00Z',
        patternKey: 'timeRhythms_transitionStress',
        title: 'Transition Stress',
        category: 'timeRhythms',
        majorDomain: 'timePerceptionCapacity',
        insightSubcategory: 'transitionStress',
        score: 45,
      }),
      snapshot({
        id: 'w17-time',
        weekKey: '2026-W17',
        observedAt: '2026-04-24T12:00:00Z',
        patternKey: 'timeRhythms_transitionStress',
        title: 'Transition Stress',
        category: 'timeRhythms',
        majorDomain: 'timePerceptionCapacity',
        insightSubcategory: 'transitionStress',
        score: 61,
      }),
    ];

    const trends = deriveInsightMemoryTrends(snapshots, '2026-04-24T12:00:00Z');

    expect(trends).toEqual(expect.arrayContaining([
      expect.objectContaining({ patternKey: 'relationships_toneShift', kind: 'softening' }),
      expect.objectContaining({ patternKey: 'relationships_toneShift', kind: 'bodyLinked' }),
      expect.objectContaining({ patternKey: 'relationships_toneShift', kind: 'sleepLinked' }),
      expect.objectContaining({ patternKey: 'timeRhythms_transitionStress', kind: 'increasing' }),
    ]));
  });

  it('summarizes what changed since last week when the primary pattern changes', () => {
    const snapshots = [
      snapshot({
        id: 'w16-primary',
        weekKey: '2026-W16',
        observedAt: '2026-04-17T12:00:00Z',
        patternKey: 'relationships_toneShift',
        title: 'Tone Shift Sensitivity',
        isPrimary: true,
      }),
      snapshot({
        id: 'w17-primary',
        weekKey: '2026-W17',
        observedAt: '2026-04-24T12:00:00Z',
        patternKey: 'responsibilityCare_invisibleLoad',
        title: 'Invisible Load',
        category: 'responsibilityCare',
        majorDomain: 'moralResponsibilityFairness',
        insightSubcategory: 'responsibilityQuestion',
        isPrimary: true,
      }),
    ];

    const summary = summarizeWhatChangedSinceLastWeek(
      snapshots,
      deriveInsightMemoryTrends(snapshots, '2026-04-24T12:00:00Z'),
      '2026-04-24T12:00:00Z',
    );

    expect(summary[0]).toContain('Tone Shift Sensitivity is no longer the main read');
    expect(summary[0]).toContain('Invisible Load moved into the foreground');
  });

  it('reconstructs previous pattern scores for current scoring continuity', () => {
    const memory = buildInsightMemoryProfile([
      snapshot({
        id: 'previous-tone',
        weekKey: '2026-W16',
        observedAt: '2026-04-17T12:00:00Z',
        patternKey: 'relationships_toneShift',
        title: 'Tone Shift Sensitivity',
        score: 84,
      }),
      snapshot({
        id: 'current-tone',
        weekKey: '2026-W17',
        observedAt: '2026-04-24T12:00:00Z',
        patternKey: 'relationships_toneShift',
        title: 'Tone Shift Sensitivity',
        score: 72,
      }),
    ], '2026-04-24T12:00:00Z');

    const previousScores = previousPatternScoresFromInsightMemory(memory, '2026-04-24T12:00:00Z');

    expect(previousScores).toHaveLength(1);
    expect(previousScores[0]).toEqual(expect.objectContaining({
      patternKey: 'relationships_toneShift',
      score: 0.84,
      category: 'relationships',
    }));
  });

  it('detects cross-domain links through shared pattern type or anchors', () => {
    const snapshots = [
      snapshot({
        id: 'w16-relationship',
        weekKey: '2026-W16',
        observedAt: '2026-04-17T12:00:00Z',
        patternKey: 'relationships_toneShift',
        title: 'Tone Shift Sensitivity',
        category: 'relationships',
        majorDomain: 'attachmentConnection',
        anchors: ['pressure', 'hightracking'],
        relatedSignals: ['tone_sensitivity'],
      }),
      snapshot({
        id: 'w17-work',
        weekKey: '2026-W17',
        observedAt: '2026-04-24T12:00:00Z',
        patternKey: 'workAmbition_pressureAsSafety',
        title: 'Progress Feels Like Safety',
        category: 'workAmbition',
        majorDomain: 'competenceMastery',
        anchors: ['pressure', 'hightracking'],
        relatedSignals: ['performance_pressure'],
      }),
    ];

    const trends = deriveInsightMemoryTrends(snapshots, '2026-04-24T12:00:00Z');

    expect(trends).toEqual(expect.arrayContaining([
      expect.objectContaining({
        kind: 'crossDomainLink',
        linkedDomains: expect.arrayContaining(['attachmentConnection', 'competenceMastery']),
      }),
    ]));
  });
});
