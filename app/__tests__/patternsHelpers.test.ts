import { buildPatternLibraryState, type PatternLibraryItem } from '../../utils/patternsHelpers';
import {
  buildInsightDuplicateKey,
  dedupeExactInsights,
} from '../../utils/insightDedupe';

const v2Pattern = (overrides: Partial<PatternLibraryItem>): PatternLibraryItem => ({
  title: 'Invisible Load',
  body: 'Mental and emotional responsibility is showing up with enough evidence to name.',
  patternKey: 'responsibilityCare_invisibleLoad',
  category: 'responsibilityCare',
  confidence: 'strong',
  movement: 'repeating',
  evidenceSummary: 'Seen across journal entries and body maps.',
  sourceCoverage: ['journal entries', 'body maps'],
  lastSeenAt: '2026-04-24',
  observedAcrossDays: 30,
  relatedSignals: ['mental_load', 'responsibility_weight'],
  librarySectionTitle: 'Responsibility & Care',
  archiveSectionTitle: 'Responsibility & Care',
  lens: 'protective_patterns',
  concept: 'protective_behavior',
  fingerprint: 'v2:responsibilityCare_invisibleLoad',
  score: 72,
  isV2Derived: true,
  ...overrides,
});

describe('patternsHelpers', () => {
  it('keeps the library in a V2 low-data state when no V2 patterns are available', () => {
    const state = buildPatternLibraryState();

    expect(state.items).toEqual([]);
    expect(state.sections).toEqual([]);
    expect(state.librarySections).toEqual([]);
    expect(state.statusLine).toBe('Not enough signal for a real pattern read');
    expect(state.helperText).toContain('V2 evidence');
  });

  it('builds archive and library sections from V2 pattern items only', () => {
    const state = buildPatternLibraryState(
      [
        v2Pattern({
          title: 'Invisible Load',
          patternKey: 'responsibilityCare_invisibleLoad',
          category: 'responsibilityCare',
          librarySectionTitle: 'Responsibility & Care',
          archiveSectionTitle: 'Responsibility & Care',
        }),
        v2Pattern({
          title: 'Subtle Bracing',
          body: 'The body may be staying prepared underneath a calm surface.',
          patternKey: 'safetyRegulation_subtleBracing',
          category: 'safetyRegulation',
          librarySectionTitle: 'Safety & Regulation',
          archiveSectionTitle: 'Safety & Regulation',
          fingerprint: 'v2:safetyRegulation_subtleBracing',
          score: 66,
        }),
      ],
    );

    const archiveTitles = state.sections.flatMap(section => section.items.map(item => item.title));
    const libraryTitles = state.librarySections.flatMap(section => section.items.map(item => item.title));

    expect(state.statusLine).toBe('Pattern read refreshed today');
    expect(archiveTitles[0]).toBe('Invisible Load');
    expect(archiveTitles).not.toContain('Legacy relationship thread');
    expect(libraryTitles).toEqual(expect.arrayContaining(['Invisible Load', 'Subtle Bracing']));
  });

  it('deduplicates semantically repeated V2 concepts before rendering sections', () => {
    const state = buildPatternLibraryState([
      v2Pattern({
        title: 'Subtle Bracing',
        patternKey: 'safetyRegulation_subtleBracing',
        category: 'safetyRegulation',
        librarySectionTitle: 'Safety & Regulation',
        archiveSectionTitle: 'Safety & Regulation',
        fingerprint: 'v2:safetyRegulation_subtleBracing',
        score: 66,
      }),
      v2Pattern({
        title: 'Subtle Bracing',
        patternKey: 'safetyRegulation_subtleBracing',
        category: 'safetyRegulation',
        librarySectionTitle: 'Safety & Regulation',
        archiveSectionTitle: 'Safety & Regulation',
        score: 62,
      }),
      v2Pattern({
        title: 'A relationship thread',
        patternKey: 'communicationVoice_repairSettles',
        category: 'communicationVoice',
        librarySectionTitle: 'Relationships',
        archiveSectionTitle: 'Relationships',
        lens: 'relational_patterns',
        concept: 'relational_dynamic',
        fingerprint: 'v2:communicationVoice_repairSettles',
        score: 60,
      }),
    ]);

    const titles = state.items.map(item => item.title);
    expect(titles.filter(title => title === 'Subtle Bracing')).toHaveLength(1);
    expect(titles).toContain('A relationship thread');
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
