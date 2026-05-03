import { buildInsightTimingDecision } from '../timing/insightTiming';
import type { CurrentInsightStateProfile } from '../state/insightState';
import type { InsightHistoryItem } from '../types';

const profile = (
  overrides: Partial<CurrentInsightStateProfile>,
): CurrentInsightStateProfile => ({
  primaryState: 'calm',
  scores: {
    calm: 1,
    activated: 0,
    overwhelmed: 0,
    shutdown: 0,
    tired: 0,
    openReceptive: 0,
  },
  intensity: 0.25,
  confidence: 0.8,
  reasonSignals: ['calm'],
  preferredWriterShapes: ['patternAnalysis'],
  avoidedWriterShapes: [],
  preferredTones: ['grounded'],
  avoidedTones: [],
  preferredIntensities: ['medium'],
  avoidedIntensities: [],
  preferredSentenceCounts: [5],
  maxDepthLevel: 3,
  reasonCodes: ['state:calm'],
  ...overrides,
});
const historyItem = (overrides: Partial<InsightHistoryItem>): InsightHistoryItem => ({
  id: 'history-1',
  patternKey: 'relationships_toneShift',
  slot: 'whatMySkyNoticed',
  surface: 'today',
  title: 'A heavy pattern',
  shownAt: '2026-04-24T09:00:00Z',
  copyHash: 'copy-1',
  ...overrides,
});

describe('insightTiming', () => {
  it('uses a gentle echo mode when overwhelm is high', () => {
    const decision = buildInsightTimingDecision({
      stateProfile: profile({
        primaryState: 'overwhelmed',
        intensity: 0.82,
        confidence: 0.9,
        reasonCodes: ['state:overwhelmed'],
      }),
      history: [],
      date: '2026-04-24T12:00:00Z',
    });

    expect(decision.deliveryMode).toBe('gentleEcho');
    expect(decision.maxDailyInsights).toBe(2);
    expect(decision.suppressNovelty).toBe(true);
    expect(decision.suppressDeepContext).toBe(true);
  });

  it('creates space when shutdown follows a heavy insight today', () => {
    const decision = buildInsightTimingDecision({
      stateProfile: profile({
        primaryState: 'shutdown',
        intensity: 0.8,
        confidence: 0.88,
        reasonCodes: ['state:shutdown'],
      }),
      history: [historyItem({})],
      date: '2026-04-24T12:00:00Z',
    });

    expect(decision.deliveryMode).toBe('space');
    expect(decision.maxDailyInsights).toBe(1);
    expect(decision.preferReinforcement).toBe(true);
  });

  it('allows novelty when the user appears calm and has not seen much today', () => {
    const decision = buildInsightTimingDecision({
      stateProfile: profile({}),
      history: [],
      date: '2026-04-24T12:00:00Z',
    });

    expect(decision.deliveryMode).toBe('novelty');
    expect(decision.maxDailyInsights).toBeGreaterThanOrEqual(3);
    expect(decision.suppressNovelty).toBe(false);
  });
});
