import { buildPatternLibraryState, type PatternLibraryItem } from '../patternsHelpers';

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
  it('returns a low-data state instead of falling back to legacy cross-ref selection', () => {
    const state = buildPatternLibraryState();

    expect(state.items).toEqual([]);
    expect(state.sections).toEqual([]);
    expect(state.librarySections).toEqual([]);
    expect(state.statusLine).toBe('Not enough signal for a real pattern read');
  });

  it('caps the V2 pattern map to one core pattern plus two supporting sections', () => {
    const state = buildPatternLibraryState([
      v2Pattern({
        title: 'Invisible Load',
        patternKey: 'responsibilityCare_invisibleLoad',
        category: 'responsibilityCare',
        librarySectionTitle: 'Responsibility & Care',
        archiveSectionTitle: 'Responsibility & Care',
        score: 72,
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
      v2Pattern({
        title: 'Careful Words',
        body: 'The user is choosing words carefully because being misunderstood has emotional weight.',
        patternKey: 'communicationVoice_carefulWords',
        category: 'communicationVoice',
        librarySectionTitle: 'Relationships',
        archiveSectionTitle: 'Relationships',
        lens: 'relational_patterns',
        concept: 'relational_dynamic',
        score: 62,
      }),
      v2Pattern({
        title: 'Energy Windows',
        body: 'Capacity changes depending on timing, even when the task itself stays the same.',
        patternKey: 'timeRhythms_energyWindows',
        category: 'timeRhythms',
        librarySectionTitle: 'Rest & Capacity',
        archiveSectionTitle: 'Rest & Capacity',
        lens: 'checkin_trends',
        concept: 'statistical_trend',
        score: 60,
      }),
    ]);

    expect(state.sections.length).toBeLessThanOrEqual(3);
    expect(state.sections[0]?.title).toBe('Core Pattern');
    expect(state.sections.slice(1)).toHaveLength(Math.min(2, state.sections.length - 1));

    const titles = state.sections.flatMap(section => section.items.map(item => item.title.toLowerCase()));
    expect(new Set(titles).size).toBe(titles.length);
  });

  it('builds a grouped preview-only pattern library from V2 patterns', () => {
    const state = buildPatternLibraryState([
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
    ]);

    const archiveTitles = state.sections.flatMap(section => section.items.map(item => item.title));
    const libraryTitles = state.librarySections.flatMap(section => section.items.map(item => item.title));

    expect(archiveTitles[0]).toBe('Invisible Load');
    expect(libraryTitles).toEqual(expect.arrayContaining(['Invisible Load', 'Subtle Bracing']));
    expect(state.librarySections.map(section => section.title)).toEqual(
      expect.arrayContaining(['Responsibility & Care', 'Safety & Regulation']),
    );
    expect(state.sections.flatMap(section => section.items).some(item => item.patternKey === 'unknown')).toBe(false);
  });
});
