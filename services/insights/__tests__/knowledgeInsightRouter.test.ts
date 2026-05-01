import { buildV2RawInputs, runActiveKnowledgeInsight } from '../knowledgeInsightRouter';
import type { SelfKnowledgeContext } from '../selfKnowledgeContext';
import type { DailyCheckIn } from '../../patterns/types';
import type { JournalEntry, SleepEntry } from '../../storage/models';

describe('knowledgeInsightRouter', () => {
  const now = '2026-04-24T12:00:00Z';
  const today = '2026-04-24';

  const checkIns: DailyCheckIn[] = [
    {
      id: 'ci-1',
      date: today,
      moodScore: 2,
      energyLevel: 'low',
      stressLevel: 'high',
      tags: ['rest'],
      createdAt: now,
      updatedAt: now,
      chartId: 'chart-1',
      timeOfDay: 'evening',
      moonSign: 'Aries',
      moonHouse: 1,
      sunHouse: 1,
      transitEvents: [],
      lunarPhase: 'new',
      retrogrades: [],
    },
  ];

  const journalEntries: JournalEntry[] = [
    {
      id: 'journal-1',
      date: today,
      content: 'I feel guilty for resting and keep thinking I should do more.',
      mood: 'heavy',
      moonPhase: 'new',
      createdAt: now,
      updatedAt: now,
      isDeleted: false,
    },
  ];

  const sleepEntries: SleepEntry[] = [
    {
      id: 'sleep-1',
      date: today,
      durationHours: 5,
      quality: 2,
      chartId: 'chart-1',
      createdAt: now,
      updatedAt: now,
      isDeleted: false,
    },
  ];

  const emptyContext: SelfKnowledgeContext = {
    coreValues: null,
    archetypeProfile: null,
    cognitiveStyle: null,
    somaticEntries: [],
    triggers: null,
    triggerEvents: [],
    relationshipPatterns: [],
    dailyReflections: null,
    intelligenceProfile: null,
  };

  it('prefers V2 daily insight coverage while preserving the active card shape', async () => {
    const insight = await runActiveKnowledgeInsight({
      checkIns,
      journalEntries,
      sleepEntries,
      selfKnowledgeContext: emptyContext,
      date: now,
      history: {
        recentlyShownPatternKeys: [],
        recentlyShownCopyHashes: [],
      },
    });

    expect(insight).not.toBeNull();
    expect(insight?.patternKey).toBe('rest_capacity_001_rest_resistance');
    expect(insight?.observation).toBeTruthy();
    expect(insight?.prompt).toBeTruthy();
    expect(insight?.reframe.shame).toContain('This does not read as');
    expect(insight?.reframe.clarity).toContain('It reads as');
  });

  it('passes self-knowledge sources into V2 raw inputs', () => {
    const selfKnowledgeContext: SelfKnowledgeContext = {
      ...emptyContext,
      somaticEntries: [
        {
          id: 'body-1',
          date: now,
          region: 'heart',
          emotion: 'anxiety',
          sensation: 'tight',
          intensity: 4,
        },
      ],
      triggerEvents: [
        {
          id: 'trigger-1',
          timestamp: new Date(now).getTime(),
          mode: 'drain',
          event: 'work deadline',
          nsState: 'sympathetic',
          sensations: ['shoulders'],
          intensity: 4,
        },
        {
          id: 'glimmer-1',
          timestamp: new Date(now).getTime(),
          mode: 'nourish',
          event: 'quiet morning',
          nsState: 'ventral',
          sensations: ['soft chest'],
          intensity: 3,
        },
      ],
      relationshipPatterns: [
        {
          id: 'rel-1',
          date: today,
          note: 'I needed reassurance and repair.',
          tags: ['t2'],
        },
      ],
      dailyReflections: {
        totalAnswers: 1,
        totalDays: 1,
        streak: 1,
        byCategory: { values: 1 },
        reflectionDates: [today],
        recentAnswers: [
          {
            questionId: 1,
            category: 'values',
            questionText: 'What mattered?',
            answer: 'Support and honesty',
            scaleValue: 3,
            date: today,
            sealedAt: now,
          },
        ],
      },
    };

    const rawInputs = buildV2RawInputs({
      checkIns,
      journalEntries,
      sleepEntries,
      selfKnowledgeContext,
    });

    expect(rawInputs.bodyMaps?.[0]?.cues).toContain('chest');
    expect(rawInputs.triggerLogs).toHaveLength(1);
    expect(rawInputs.glimmerLogs).toHaveLength(1);
    expect(rawInputs.relationshipMirrors).toHaveLength(1);
    expect(rawInputs.reflectionAnswers).toHaveLength(1);
  });
});
