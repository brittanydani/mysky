import { type DailyAggregate } from '../../services/insights/types';
import { buildPatternLibraryState, readableLabel, refineCrossRefCopy } from '../../utils/patternsHelpers';

function makeAggregate(overrides: Partial<DailyAggregate> = {}): DailyAggregate {
  return {
    dayKey: '2026-04-10',
    moodAvg: 6,
    energyAvg: 5,
    stressAvg: 4,
    checkInCount: 2,
    tagsUnion: [],
    hasJournalText: false,
    journalCount: 0,
    journalWordCount: 0,
    keywordsUnion: [],
    emotionCountsTotal: {},
    sentimentAvg: null,
    checkInTimestamps: [],
    timeOfDayLabels: [],
    dayOfWeek: 5,
    sleepDurationHours: 7,
    sleepQuality: 4,
    hasDream: false,
    ...overrides,
  };
}

describe('patternsHelpers', () => {
  it('keeps the library locked until there are enough entries', () => {
    const state = buildPatternLibraryState([
      makeAggregate({ checkInCount: 2 }),
      makeAggregate({ dayKey: '2026-04-11', checkInCount: 2 }),
    ]);

    expect(state.statusLine).toBe('Needs more entries');
    expect(state.items).toEqual([]);
    expect(state.sections).toEqual([]);
    expect(state.helperText).toContain('relationship reflections');
  });

  it('builds recurring pattern items from tags, keywords, dreams, and stress', () => {
    const state = buildPatternLibraryState([
      makeAggregate({ tagsUnion: ['eq_overwhelm', 'creative'], keywordsUnion: ['boundaries'], hasDream: true, stressAvg: 7 }),
      makeAggregate({ dayKey: '2026-04-11', tagsUnion: ['eq_overwhelm'], keywordsUnion: ['boundaries', 'repair'], hasDream: true, stressAvg: 6.5 }),
      makeAggregate({ dayKey: '2026-04-12', tagsUnion: ['creative'], keywordsUnion: ['repair'], hasDream: true, stressAvg: 6.2, checkInCount: 1 }),
    ]);

    expect(state.statusLine).toBe('Building deeper analysis');
    expect(state.items).toHaveLength(3);
    expect(state.sections).toHaveLength(1);
    expect(state.sections[0].title).toBe('Check-In Trends');
    expect(state.items[0].body).toContain('Overwhelm');
    expect(state.items[1].body).toContain('Boundaries');
    expect(state.items[2].body).toContain('3 recent days include dream material');
  });

  it('includes real computed cross-reference insights in the library', () => {
    const state = buildPatternLibraryState([], [
      {
        id: 'relationship-pattern',
        source: 'relationship',
        title: 'Your Relational Mirror',
        body: 'When relational themes appear in your check-ins, your emotional baseline tends to drop.',
        isConfirmed: true,
      } as any,
    ]);

    expect(state.statusLine).toBe('Last updated today');
    expect(state.helperText).toContain('built from your current pattern analysis');
    expect(state.sections[0].title).toBe('Relationship Patterns');
    expect(state.items[0]).toEqual({
      title: 'Your Relational Mirror',
      body: 'When relational themes appear in your check-ins, your emotional baseline tends to drop.',
    });
  });

  it('explains when only trend analysis is available', () => {
    const state = buildPatternLibraryState([
      makeAggregate({ tagsUnion: ['eq_overwhelm'], checkInCount: 3 }),
      makeAggregate({ dayKey: '2026-04-11', tagsUnion: ['eq_overwhelm'], checkInCount: 2 }),
    ]);

    expect(state.statusLine).toBe('Building deeper analysis');
    expect(state.helperText).toContain('Add relationship patterns, trigger logs, somatic entries, or daily reflections');
    expect(state.sections[0].title).toBe('Check-In Trends');
  });

  it('formats readable labels for pattern copy', () => {
    expect(readableLabel('eq_overstimulated')).toBe('Overstimulated');
  });

  it('softens values-based cross-reference copy', () => {
    const refined = refineCrossRefCopy({
      id: '1',
      source: 'values',
      title: 'Original',
      body: 'Your top values are connection and compassion.',
      isConfirmed: true,
    } as any);

    expect(refined.title).toBe('Your core anchors are becoming clearer');
    expect(refined.body).toContain('Connection, compassion, and stability are showing up as your core anchors right now');
  });
});