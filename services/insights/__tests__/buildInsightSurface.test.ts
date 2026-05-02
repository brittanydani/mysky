jest.mock('../../storage/supabaseDb', () => ({
  supabaseDb: {
    getCharts: jest.fn(),
    getCheckInsInRange: jest.fn(),
    getSleepEntriesInRange: jest.fn(),
    getJournalEntries: jest.fn(),
  },
}));

jest.mock('../selfKnowledgeContext', () => ({
  loadSelfKnowledgeContext: jest.fn(),
  enrichSelfKnowledgeContext: jest.fn((context) => context),
}));

import { buildInsightSurface } from '../buildInsightSurface';
import { supabaseDb } from '../../storage/supabaseDb';
import { loadSelfKnowledgeContext } from '../selfKnowledgeContext';
import type { SelfKnowledgeContext } from '../selfKnowledgeContext';
import type { DailyCheckIn } from '../../patterns/types';
import type { JournalEntry, SleepEntry } from '../../storage/models';

const mockDb = supabaseDb as jest.Mocked<typeof supabaseDb>;
const mockLoadSelfKnowledgeContext = loadSelfKnowledgeContext as jest.MockedFunction<typeof loadSelfKnowledgeContext>;

describe('buildInsightSurface knowledge insights', () => {
  const now = '2026-04-24T12:00:00Z';
  const today = '2026-04-24';

  const checkIns: DailyCheckIn[] = [
    {
      id: 'ci-1',
      date: today,
      moodScore: 3,
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
      content: 'I felt grounded after a hard conversation, but my chest was tight and I wanted repair.',
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
      dreamText: 'A dream about unfinished conversations stayed with me.',
      chartId: 'chart-1',
      createdAt: now,
      updatedAt: now,
      isDeleted: false,
    },
  ];

  const selfKnowledgeContext: SelfKnowledgeContext = {
    coreValues: null,
    archetypeProfile: null,
    cognitiveStyle: null,
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
    triggers: null,
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
    dailyReflections: null,
    intelligenceProfile: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockDb.getCheckInsInRange.mockResolvedValue(checkIns);
    mockDb.getSleepEntriesInRange.mockResolvedValue(sleepEntries);
    mockDb.getJournalEntries.mockResolvedValue(journalEntries);
    mockLoadSelfKnowledgeContext.mockResolvedValue(selfKnowledgeContext);
  });

  it('passes multiple V2 daily cards through the Home/Today surface data', async () => {
    const surface = await buildInsightSurface({
      chartId: 'chart-1',
      insightsEnabled: true,
      includeKnowledgeInsight: true,
      knowledgeInsightDate: now,
      knowledgeHistory: {
        recentlyShownPatternKeys: [],
        recentlyShownCopyHashes: [],
      },
    });

    expect(surface.knowledgeInsights.length).toBeGreaterThan(1);
    expect(surface.knowledgeInsights.length).toBeLessThanOrEqual(2);
    expect(surface.knowledgeInsight).toBe(surface.knowledgeInsights[0]);
    expect(surface.knowledgeInsights[0].slot).toBe('whatMySkyNoticed');
    expect(surface.knowledgeInsights.some((insight) => insight.patternKey === 'unknown')).toBe(false);
    expect(surface.premiumPatterns.length).toBeGreaterThan(0);
    expect(surface.premiumPatterns.every(pattern => pattern.isV2Derived)).toBe(true);
    expect(surface.premiumPatterns.some(pattern => pattern.patternKey === 'unknown')).toBe(false);
    expect(surface.thisWeeksV2Pattern).not.toBeNull();
    expect(surface.thisWeeksV2Pattern?.isV2Derived).toBe(true);
    expect(surface.thisWeeksV2Pattern?.patternKey).not.toBe('unknown');
    expect(surface.premiumWeeklyDeepDive.length).toBeGreaterThan(0);
    expect(surface.premiumWeeklyDeepDive.length).toBeLessThanOrEqual(4);
    expect(surface.premiumWeeklyDeepDive.every(read => read.isV2Derived)).toBe(true);
    expect(surface.premiumWeeklyDeepDive.some(read => read.patternKey === 'unknown')).toBe(false);

    const todayPatternKeys = new Set(surface.knowledgeInsights.map(insight => insight.patternKey));
    expect(surface.premiumPatterns.some(pattern => todayPatternKeys.has(pattern.patternKey))).toBe(false);
    expect(surface.premiumWeeklyDeepDive.some(read => !read.isEmptyState && todayPatternKeys.has(read.patternKey))).toBe(false);
    if (surface.thisWeeksV2Pattern && !surface.thisWeeksV2Pattern.isEmptyState) {
      expect(todayPatternKeys.has(surface.thisWeeksV2Pattern.patternKey)).toBe(false);
    }
    if (surface.knowledgeInsights.some(insight => insight.slot === 'primaryPersona')) {
      expect(surface.premiumPersonaProfile).toBeNull();
    }
  });
});
