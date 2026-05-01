import { runKnowledgeEngine } from '../knowledgeEngine';
import { DailyCheckIn } from '../../patterns/types';
import { JournalEntry, SleepEntry } from '../../storage/models';
import { buildRecentlyShownKnowledgeHistory } from '../insightHistory';

describe('Knowledge Engine', () => {
  const now = '2026-04-24T12:00:00Z';
  const today = '2026-04-24';

  const mockCheckIns: DailyCheckIn[] = [
    {
      id: '1',
      date: today,
      moodScore: 2,
      energyLevel: 'low',
      stressLevel: 'high',
      tags: ['rest'],
      createdAt: now,
      updatedAt: now,
      chartId: 'c1',
      timeOfDay: 'evening',
      moonSign: 'Aries',
      moonHouse: 1,
      sunHouse: 1,
      transitEvents: [],
      lunarPhase: 'new',
      retrogrades: [],
    },
  ];

  const mockJournals: JournalEntry[] = [
    {
      id: 'j1',
      date: today,
      content: 'I feel guilty for resting, I should be doing more.',
      mood: 'heavy',
      moonPhase: 'new',
      createdAt: now,
      updatedAt: now,
      isDeleted: false,
    },
  ];

  const mockSleep: SleepEntry[] = [
    {
      id: 's1',
      date: today,
      durationHours: 5,
      quality: 2,
      chartId: 'c1',
      createdAt: now,
      updatedAt: now,
      isDeleted: false,
    },
  ];

  it('generates a valid insight for a rest resistance pattern', () => {
    const insight = runKnowledgeEngine(mockCheckIns, mockJournals, mockSleep, null, now, {
      recentlyShownPatternKeys: [],
      recentlyShownCopyHashes: [],
    });

    expect(insight).not.toBeNull();
    if (insight) {
      expect(insight.patternKey).toBe('rest_resistance');
      expect(insight.title).toBeDefined();
      expect(insight.reframe.shame).toContain('This does not read as');
      expect(insight.reframe.clarity).toContain('It reads as');
    }
  });

  it('avoids recently shown patterns', () => {
    const insight = runKnowledgeEngine(mockCheckIns, mockJournals, mockSleep, null, now, {
      recentlyShownPatternKeys: ['rest_resistance'],
      recentlyShownCopyHashes: [],
    });

    // Should not select rest_resistance
    if (insight) {
      expect(insight.patternKey).not.toBe('rest_resistance');
    }
  });

  it('avoids recently shown copy hashes', () => {
    const first = runKnowledgeEngine(mockCheckIns, mockJournals, mockSleep, null, now, {
      recentlyShownPatternKeys: [],
      recentlyShownCopyHashes: [],
    });

    expect(first).not.toBeNull();
    if (!first) return;

    const next = runKnowledgeEngine(mockCheckIns, mockJournals, mockSleep, null, now, {
      recentlyShownPatternKeys: [],
      recentlyShownCopyHashes: [`${first.observation}:${first.pattern}`],
    });

    if (next) {
      expect(`${next.observation}:${next.pattern}`).not.toBe(`${first.observation}:${first.pattern}`);
    }
  });

  it('builds recent history while keeping same-day insights stable', () => {
    const history = buildRecentlyShownKnowledgeHistory([
      {
        insightId: 'same-day',
        patternKey: 'rest_resistance',
        title: 'Same Day',
        shownAt: '2026-04-24T09:00:00Z',
        sourceSignals: [],
        evidenceHash: 'same-day-evidence',
        copyHash: 'same-day-copy',
      },
      {
        insightId: 'recent',
        patternKey: 'support_scarcity',
        title: 'Recent',
        shownAt: '2026-04-20T09:00:00Z',
        sourceSignals: [],
        evidenceHash: 'recent-evidence',
        copyHash: 'recent-copy',
      },
      {
        insightId: 'old',
        patternKey: 'deep_processor',
        title: 'Old',
        shownAt: '2026-03-01T09:00:00Z',
        sourceSignals: [],
        evidenceHash: 'old-evidence',
        copyHash: 'old-copy',
      },
    ], now);

    expect(history.recentlyShownPatternKeys).toEqual(['support_scarcity']);
    expect(history.recentlyShownCopyHashes).toEqual(['recent-copy']);
  });

  it('marks the first matching multi-source pattern as new when there is no recent baseline', () => {
    const insight = runKnowledgeEngine(mockCheckIns, mockJournals, mockSleep, null, now, {
      recentlyShownPatternKeys: [],
      recentlyShownCopyHashes: [],
    });

    expect(insight).not.toBeNull();
    if (insight) {
      expect(insight.movement).toBe('new');
    }
  });
});
