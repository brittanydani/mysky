import { runKnowledgeEngine } from '../knowledgeEngine';
import { DailyCheckIn } from '../../patterns/types';
import { JournalEntry, SleepEntry } from '../../storage/models';

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

  it('detects cross-source matches', () => {
    const insight = runKnowledgeEngine(mockCheckIns, mockJournals, mockSleep, null, now, {
      recentlyShownPatternKeys: [],
      recentlyShownCopyHashes: [],
    });

    expect(insight).not.toBeNull();
    if (insight) {
      expect(insight.movement).toBe('cross_source_match');
    }
  });
});
