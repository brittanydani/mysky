import { buildUserSignals } from '../normalizers/buildUserSignals';
import type { SelfKnowledgeContext } from '../selfKnowledgeContext';
import type { DailyCheckIn } from '../../patterns/types';

const today = '2026-04-24';

function makeCheckIn(overrides: Partial<DailyCheckIn> = {}): DailyCheckIn {
  return {
    id: 'ci-1',
    date: today,
    chartId: 'chart-1',
    timeOfDay: 'evening',
    moodScore: 6,
    energyLevel: 'medium',
    stressLevel: 'medium',
    tags: ['relationships'],
    note: 'A relationship repair needed more reassurance.',
    moonSign: 'Cancer',
    moonHouse: 7,
    sunHouse: 1,
    transitEvents: [
      {
        transitPlanet: 'Moon',
        natalPlanet: 'Venus',
        aspect: 'square',
        orb: 1.2,
        isApplying: true,
      },
    ],
    lunarPhase: 'full',
    retrogrades: [],
    createdAt: `${today}T18:00:00Z`,
    updatedAt: `${today}T18:00:00Z`,
    ...overrides,
  };
}

function makeContext(): SelfKnowledgeContext {
  return {
    coreValues: null,
    archetypeProfile: null,
    cognitiveStyle: null,
    intelligenceProfile: null,
    somaticEntries: [
      {
        id: 'som-1',
        date: `${today}T12:00:00Z`,
        region: 'chest',
        emotion: 'Anxiety',
        sensation: 'tight',
        intensity: 4,
      },
    ],
    triggers: {
      drains: ['conflict'],
      restores: ['quiet time'],
    },
    triggerEvents: [
      {
        id: 'trig-1',
        timestamp: new Date(`${today}T14:00:00`).getTime(),
        mode: 'drain',
        event: 'Relationship conflict',
        nsState: 'sympathetic',
        sensations: ['chest tightness'],
        intensity: 4,
      },
      {
        id: 'glim-1',
        timestamp: new Date(`${today}T19:00:00`).getTime(),
        mode: 'nourish',
        event: 'Quiet time at home',
        nsState: 'ventral',
        sensations: ['calm chest'],
        intensity: 3,
      },
    ],
    relationshipPatterns: [
      {
        id: 'rel-1',
        date: today,
        note: 'Asked for reassurance instead of withdrawing.',
        tags: ['t2', 's1'],
      },
    ],
    dailyReflections: {
      totalAnswers: 1,
      totalDays: 1,
      streak: 1,
      byCategory: { values: 1 },
      recentAnswers: [
        {
          questionId: 1,
          category: 'values',
          questionText: 'Where did a core value ask for a boundary today?',
          answer: 'Very true',
          scaleValue: 3,
          date: today,
          sealedAt: `${today}T20:00:00Z`,
        },
      ],
      reflectionDates: [today],
    },
  };
}

describe('buildUserSignals', () => {
  it('collects daily questions, check-ins, astrology, somatic, glimmer/trigger, and relationship signals together', () => {
    const signals = buildUserSignals({
      checkIns: [makeCheckIn()],
      journalEntries: [],
      sleepEntries: [],
      selfKnowledgeContext: makeContext(),
    });

    const sources = new Set(signals.map((signal) => signal.source));

    expect(Array.from(sources)).toEqual(expect.arrayContaining([
      'dailyCheckIn',
      'astrology',
      'bodyMap',
      'triggerLog',
      'glimmerLog',
      'relationshipMirror',
      'reflectionBank',
    ]));
    expect(signals.some((signal) => signal.source === 'reflectionBank' && signal.key === 'boundary_growth')).toBe(true);
    expect(signals.some((signal) => signal.source === 'relationshipMirror' && signal.key === 'reassurance_need')).toBe(true);
    expect(signals.some((signal) => signal.source === 'astrology' && signal.key === 'mutuality_need')).toBe(true);
  });
});
