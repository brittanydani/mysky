import { type DailyAggregate } from '../../services/insights/types';
import {
  buildPatternLibraryState,
  readableLabel,
  refineCrossRefCopy,
} from '../../utils/patternsHelpers';
import {
  buildInsightDuplicateKey,
  dedupeExactInsights,
} from '../../utils/insightDedupe';

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
    journalEmotionCountsTotal: {},
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

    expect(state.items).toEqual([]);
    expect(state.sections).toEqual([]);
    expect(state.statusLine).toBe('Not enough signal for a real pattern read');
    expect(state.helperText).toContain('Do not force a read yet');
  });

  it('builds recurring pattern items from tags, keywords, dreams, and stress', () => {
    const state = buildPatternLibraryState([
      makeAggregate({ tagsUnion: ['eq_overwhelm', 'creative'], keywordsUnion: ['boundaries'], hasDream: true, stressAvg: 7 }),
      makeAggregate({ dayKey: '2026-04-11', tagsUnion: ['eq_overwhelm'], keywordsUnion: ['boundaries', 'repair'], hasDream: true, stressAvg: 6.5 }),
      makeAggregate({ dayKey: '2026-04-12', tagsUnion: ['creative'], keywordsUnion: ['repair'], hasDream: true, stressAvg: 6.2, checkInCount: 1 }),
    ]);

    expect(state.statusLine).toBe('Check-in read is live');
    expect(state.items).toHaveLength(4);
    expect(state.sections.map(section => section.title)).toEqual([
      'Core Pattern',
      'Recurring Theme',
      'Check-in Trends',
      'Dream/Archive Contrast',
    ]);
    expect(state.items.find(item => item.lens === 'checkin_trends')?.body).toContain('Overwhelm');
    expect(state.items.find(item => item.lens === 'reflection_themes')?.body).toContain('Boundaries');
    expect(state.items.find(item => item.lens === 'dream_archive_contrast')?.body).toContain('3 recent days included dream material');
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

    expect(state.statusLine).toBe('Pattern read refreshed today');
    expect(state.helperText).toContain('One core pattern sits first');
    expect(state.sections[0].title).toBe('Core Pattern');
    expect(state.items[0].lens).toBe('core_pattern');
    const relationalItem = state.items.find(item => item.lens === 'relational_patterns');
    expect(relationalItem?.title).toBe('You are highly sensitive to whether connection feels safe');
    expect(relationalItem?.body).toContain('relational themes show up');
  });

  it('explains when only trend analysis is available', () => {
    const state = buildPatternLibraryState([
      makeAggregate({ tagsUnion: ['eq_overwhelm'], checkInCount: 3 }),
      makeAggregate({ dayKey: '2026-04-11', tagsUnion: ['eq_overwhelm'], checkInCount: 2 }),
    ]);

    expect(state.statusLine).toBe('Check-in read is live');
    expect(state.helperText).toContain('Source-specific sections need more relational, somatic, trigger, or reflection evidence');
    expect(state.sections[0].title).toBe('Check-in Trends');
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

    expect(refined.title).toBe('You keep returning to what matters');
    expect(refined.body).toContain('Across your recent reflections, the same values keep shaping what feels livable');
  });

  it('preserves deep insight titles instead of replacing them with generic reflection copy', () => {
    const refined = refineCrossRefCopy({
      id: 'deep-strength-consistent-presence',
      source: 'reflection',
      title: 'What Repeats on Harder Days',
      body: 'Across 9 lower-stability days, your archive keeps naming overwhelm and boundaries.',
      isConfirmed: true,
    } as any);

    expect(refined.title).toBe('What Repeats on Harder Days');
    expect(refined.body).toContain('overwhelm and boundaries');
    expect(refined.body).not.toContain('archive');
  });

  it('names the repeated reflection theme when reflection copy provides one', () => {
    const refined = refineCrossRefCopy({
      id: 'reflection-depth',
      source: 'reflection',
      title: 'The Depth of the Inquiry',
      body: 'Across 8 days, your mind repeatedly returns to the theme of boundaries.',
      isConfirmed: true,
    } as any);

    expect(refined.title).toBe('You keep returning to questions of boundaries');
  });

  it('deduplicates semantically repeated concepts before rendering sections', () => {
    const state = buildPatternLibraryState([], [
      {
        id: 'somatic-dominant',
        source: 'somatic',
        title: 'Body one',
        body: 'Your archive indicates that your body is carrying pressure.',
        isConfirmed: true,
      } as any,
      {
        id: 'journal-body-pattern',
        source: 'somatic',
        title: 'Body two',
        body: 'Your archive reveals that your body and your words are carrying the exact same weight.',
        isConfirmed: true,
      } as any,
      {
        id: 'relationship-pattern',
        source: 'relationship',
        title: 'Relational',
        body: 'Your archive indicates that relational dynamics strongly shape your internal weather.',
        isConfirmed: true,
      } as any,
    ]);

    const concepts = state.items.map(item => item.concept);
    expect(concepts.filter(concept => concept === 'body_awareness')).toHaveLength(1);
    expect(concepts).toContain('relational_dynamic');
  });

  it('builds stable exact duplicate keys from normalized insight content', () => {
    expect(buildInsightDuplicateKey({
      id: 'a',
      lens: 'checkin_trends',
      title: '  Same\u200B Title ',
      body: 'Same\n\nbody',
    })).toBe(buildInsightDuplicateKey({
      id: 'b',
      lens: 'checkin_trends',
      title: 'same title',
      body: ' same body ',
    }));
  });

  it('removes exact duplicate insights while preserving the first instance', () => {
    const deduped = dedupeExactInsights([
      {
        id: 'first',
        title: 'Same title',
        body: 'Same body',
        isConfirmed: false,
        evidence: [],
      },
      {
        id: 'second',
        title: ' same   title ',
        body: 'Same\u200B body',
        isConfirmed: true,
        evidence: ['a', 'b'],
      },
    ], 'patternsHelpers.test');

    expect(deduped).toHaveLength(1);
    expect(deduped[0].id).toBe('first');
  });
});
