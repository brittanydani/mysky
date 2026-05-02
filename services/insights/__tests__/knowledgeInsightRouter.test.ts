import {
  buildV2RawInputs,
  runActiveKnowledgeInsight,
  runActiveKnowledgeInsights,
} from '../knowledgeInsightRouter';
import type { SelfKnowledgeContext } from '../selfKnowledgeContext';
import type { DailyCheckIn } from '../../patterns/types';
import type { JournalEntry, SleepEntry } from '../../storage/models';

const paragraphKey = (text: string): string => (
  text.toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim()
);

function visibleParagraphBodies(result: Awaited<ReturnType<typeof runActiveKnowledgeInsights>>): string[] {
  return [
    ...result.dailyInsights.map(insight => `${insight.observation} ${insight.pattern}`.trim()),
    ...result.premiumPatterns.map(pattern => pattern.body),
    ...result.premiumWeeklyDeepDive
      .filter(read => !read.isEmptyState)
      .map(read => read.body),
    ...(result.thisWeeksV2Pattern && !result.thisWeeksV2Pattern.isEmptyState
      ? [result.thisWeeksV2Pattern.body]
      : []),
    ...(result.premiumPatternProfile
      ? [
        result.premiumPatternProfile.portrait,
        ...result.premiumPatternProfile.sections.map(section => section.body),
        result.premiumPatternProfile.growthOrRecovery?.body ?? '',
      ]
      : []),
  ].filter(body => body.trim().length > 0);
}

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
    expect(insight?.patternKey).toBeTruthy();
    expect(insight?.patternKey).not.toBe('unknown');
    expect(insight?.observation).toBeTruthy();
    expect(insight?.prompt).toBeTruthy();
    expect(`${insight?.reframe.shame} ${insight?.reframe.clarity}`.trim()).toBeTruthy();
  });

  it('preserves the expanded V2 daily insight list for Today rendering', async () => {
    const result = await runActiveKnowledgeInsights({
      checkIns,
      journalEntries: [
        {
          ...journalEntries[0],
          content: 'I felt grounded after a hard conversation, but my chest was tight and I wanted repair.',
        },
      ],
      sleepEntries,
      selfKnowledgeContext: {
        ...emptyContext,
        somaticEntries: [
          {
            id: 'body-1',
            date: today,
            region: 'chest',
            emotion: 'anxiety',
            sensation: 'tight',
            intensity: 4,
          },
        ],
        triggerEvents: [
          {
            id: 'glimmer-1',
            timestamp: new Date(now).getTime(),
            mode: 'nourish',
            event: 'quiet walk helped me settle',
            nsState: 'ventral',
            sensations: ['soft chest'],
            intensity: 4,
          },
        ],
        relationshipPatterns: [
          {
            id: 'rel-1',
            date: today,
            note: 'I wanted repair and reassurance after the tone shifted.',
            tags: ['t2'],
          },
        ],
      },
      date: now,
      history: {
        recentlyShownPatternKeys: [],
        recentlyShownCopyHashes: [],
      },
    });

    expect(result.primaryInsight).not.toBeNull();
    expect(result.dailyInsights.length).toBeGreaterThan(1);
    expect(result.dailyInsights.length).toBeLessThanOrEqual(2);
    expect(result.dailyInsights[0].slot).toBe('whatMySkyNoticed');
    expect(result.dailyInsights.map((insight) => insight.slotLabel)).toContain('What Stands Out');
    expect(result.dailyInsights.some((insight) => insight.patternKey === 'unknown')).toBe(false);
    expect(result.premiumPatterns.length).toBeGreaterThan(0);
    expect(result.premiumPatterns.every(pattern => pattern.isV2Derived)).toBe(true);
    expect(result.premiumPatterns.some(pattern => pattern.patternKey === 'unknown')).toBe(false);
    expect(result.premiumPatternProfile).not.toBeNull();
    expect(result.premiumPatternProfile?.sourcePatternKeys.some(patternKey => patternKey === 'unknown')).toBe(false);
    expect(result.thisWeeksV2Pattern).not.toBeNull();
    expect(result.thisWeeksV2Pattern?.isV2Derived).toBe(true);
    expect(result.thisWeeksV2Pattern?.patternKey).not.toBe('unknown');
    expect(result.premiumWeeklyDeepDive.length).toBeGreaterThan(0);
    expect(result.premiumWeeklyDeepDive.length).toBeLessThanOrEqual(4);
    expect(result.premiumWeeklyDeepDive.every(read => read.isV2Derived)).toBe(true);
    expect(result.premiumWeeklyDeepDive.some(read => read.patternKey === 'unknown')).toBe(false);

    const todayPatternKeys = new Set(result.dailyInsights.map(insight => insight.patternKey));
    expect(result.premiumPatterns.some(pattern => todayPatternKeys.has(pattern.patternKey))).toBe(false);
    expect(result.premiumWeeklyDeepDive.some(read => !read.isEmptyState && todayPatternKeys.has(read.patternKey))).toBe(false);
    if (result.thisWeeksV2Pattern && !result.thisWeeksV2Pattern.isEmptyState) {
      expect(todayPatternKeys.has(result.thisWeeksV2Pattern.patternKey)).toBe(false);
    }
    const paragraphKeys = visibleParagraphBodies(result).map(paragraphKey);
    expect(new Set(paragraphKeys).size).toBe(paragraphKeys.length);
    if (result.dailyInsights.some(insight => insight.slot === 'primaryPersona')) {
      expect(result.premiumPersonaProfile).toBeNull();
    }
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
