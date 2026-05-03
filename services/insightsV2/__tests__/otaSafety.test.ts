import { buildTodayInsights } from '../knowledgeEngineV2';
import { detectCurrentInsightState, stateAwareParagraphScore } from '../state/insightState';
import { buildInsightTimingDecision } from '../timing/insightTiming';
import type { CurrentInsightStateProfile } from '../state/insightState';
import type { InsightHistoryItem, UserSignal } from '../types';

const profile = (
  overrides: Partial<CurrentInsightStateProfile> = {},
): CurrentInsightStateProfile => ({
  primaryState: 'overwhelmed',
  scores: {
    calm: 0,
    activated: 0,
    overwhelmed: 1,
    shutdown: 0,
    tired: 0,
    openReceptive: 0,
  },
  intensity: 0.82,
  confidence: 0.9,
  reasonSignals: ['overwhelm'],
  preferredWriterShapes: ['tender'],
  avoidedWriterShapes: ['poetic'],
  preferredTones: ['tender'],
  avoidedTones: ['poetic'],
  preferredIntensities: ['low'],
  avoidedIntensities: ['high'],
  preferredSentenceCounts: [4],
  maxDepthLevel: 1,
  reasonCodes: ['state:overwhelmed'],
  ...overrides,
});

describe('insight OTA safety', () => {
  it('ignores malformed persisted history entries in timing decisions', () => {
    const malformedHistory = [
      null,
      {},
      { shownAt: undefined, title: undefined },
      {
        id: 'old-history',
        patternKey: 'relationships_toneShift',
        slot: 'whatMySkyNoticed',
        surface: 'today',
        title: 'Deep relationship pattern',
        shownAt: '2026-04-24T09:00:00Z',
        copyHash: 'copy-1',
      },
    ] as unknown as InsightHistoryItem[];

    expect(() => buildInsightTimingDecision({
      stateProfile: profile(),
      history: malformedHistory,
      date: '2026-04-24T12:00:00Z',
    })).not.toThrow();

    const decision = buildInsightTimingDecision({
      stateProfile: profile(),
      history: malformedHistory,
      date: '2026-04-24T12:00:00Z',
    });

    expect(decision.deliveryMode).toBe('space');
  });

  it('falls back safely when timing receives partial state metadata', () => {
    const decision = buildInsightTimingDecision({
      stateProfile: null,
      history: null,
      date: null,
    });

    expect(decision.deliveryMode).toBe('novelty');
    expect(decision.reasonCodes).toContain('state:calm');
  });

  it('keeps state scoring additive when old or partial data is present', () => {
    const malformedSignals = [
      null,
      { key: 'overwhelm', date: undefined, strength: '0.8' },
      {
        key: 'low_sleep',
        source: 'dailyCheckIn',
        date: '2026-04-24',
        strength: 0.8,
      },
    ] as unknown as UserSignal[];

    expect(() => detectCurrentInsightState(malformedSignals, '2026-04-24T12:00:00Z')).not.toThrow();

    const score = stateAwareParagraphScore({
      writerShape: 'tender',
      tone: 'tender',
      intensity: 'low',
      body: 'One. Two. Three. Four.',
    }, {
      ...profile(),
      preferredWriterShapes: undefined,
      preferredTones: undefined,
      preferredIntensities: undefined,
      preferredSentenceCounts: undefined,
    } as unknown as CurrentInsightStateProfile);

    expect(Number.isFinite(score)).toBe(true);
  });

  it('builds Today insights when optional arrays arrive as null from an older bundle/cache', async () => {
    await expect(buildTodayInsights({
      date: '2026-04-24T12:00:00Z',
      rawInputs: {
        dailyCheckIns: [{
          date: '2026-04-24',
          mood: 2,
          energy: 1,
          stress: 4,
          tags: ['rest'],
        }],
        journals: [{
          date: '2026-04-24',
          text: 'I feel guilty for resting.',
        }],
      },
      history: null,
      previousPatternScores: null,
    } as unknown as Parameters<typeof buildTodayInsights>[0])).resolves.toEqual(expect.objectContaining({
      currentState: expect.any(String),
      deliveryMode: expect.any(String),
    }));
  });

  it('builds an empty result instead of crashing when required runtime inputs are absent', async () => {
    await expect(buildTodayInsights({
      date: null,
      rawInputs: null,
      history: null,
      previousPatternScores: null,
    } as unknown as Parameters<typeof buildTodayInsights>[0])).resolves.toEqual(expect.objectContaining({
      insights: expect.any(Array),
      patternScores: expect.any(Array),
    }));
  });
});
