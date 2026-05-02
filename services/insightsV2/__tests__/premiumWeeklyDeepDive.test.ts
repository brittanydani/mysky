import {
  adaptPremiumPatterns,
  adaptWeeklyPremiumPatternCandidates,
  selectPremiumWeeklyDeepDive,
  selectThisWeeksV2Pattern,
  type PremiumPatternItem,
} from '../adapters/premiumPatterns';
import type { ArchivePatternScore } from '../types';

const item = (overrides: Partial<PremiumPatternItem>): PremiumPatternItem => ({
  title: 'Invisible Load',
  body: [
    'Mental and emotional responsibility is showing up even when there is not a visible task attached to it.',
    'This pattern is showing up repeatedly enough to belong in the map. The evidence is clear enough to take seriously.',
    'This does not read as I should be able to handle this. It reads as the cost of carrying things that are hard for others to see.',
    'Seen across journal entries and body maps over roughly 30 days.',
  ].join('\n\n'),
  lens: 'protective_patterns',
  concept: 'protective_behavior',
  fingerprint: 'v2:responsibilityCare_invisibleLoad',
  score: 92,
  patternKey: 'responsibilityCare_invisibleLoad',
  category: 'responsibilityCare',
  confidence: 'strong',
  movement: 'repeating',
  evidenceSummary: 'Seen across journal entries and body maps over roughly 30 days.',
  sourceCoverage: ['journal entries', 'body maps'],
  lastSeenAt: '2026-04-24',
  observedAcrossDays: 30,
  relatedSignals: ['mental_load', 'responsibility_weight'],
  shameLabel: 'I should be able to handle this.',
  clarityReframe: 'This may be the cost of carrying things that are hard for others to see.',
  librarySectionTitle: 'Responsibility & Care',
  archiveSectionTitle: 'Responsibility & Care',
  isV2Derived: true,
  ...overrides,
});

describe('selectPremiumWeeklyDeepDive', () => {
  it('selects capped V2-derived weekly reads, skips the archive core when enough alternatives exist, and includes recovery', () => {
    const reads = selectPremiumWeeklyDeepDive([
      item({
        title: 'Core archive pattern',
        patternKey: 'responsibilityCare_invisibleLoad',
        category: 'responsibilityCare',
        score: 99,
      }),
      item({
        title: 'Care Feels Earned',
        patternKey: 'selfWorthReceiving_earnedCare',
        category: 'selfWorthReceiving',
        score: 90,
      }),
      item({
        title: 'Letting Joy Land',
        patternKey: 'pleasurePlay_joyTolerance',
        category: 'pleasurePlay',
        concept: 'recovery_pattern',
        lens: 'recovery_patterns',
        score: 82,
      }),
      item({
        title: 'Subtle Bracing',
        patternKey: 'safetyRegulation_subtleBracing',
        category: 'safetyRegulation',
        score: 80,
      }),
      item({
        title: 'Another Safety Pattern',
        patternKey: 'safetyRegulation_alwaysOn',
        category: 'safetyRegulation',
        score: 78,
      }),
    ]);

    expect(reads.length).toBeGreaterThanOrEqual(2);
    expect(reads.length).toBeLessThanOrEqual(4);
    expect(reads.some(read => read.patternKey === 'responsibilityCare_invisibleLoad')).toBe(false);
    expect(reads.some(read => read.category === 'pleasurePlay')).toBe(true);
    expect(new Set(reads.map(read => read.category)).size).toBe(reads.length);
    expect(reads.every(read => read.isV2Derived)).toBe(true);
    expect(reads.some(read => read.patternKey === 'unknown')).toBe(false);
  });

  it('does not emit debug labels in weekly read copy', () => {
    const [read] = selectPremiumWeeklyDeepDive([
      item({
        title: 'Letting Joy Land',
        patternKey: 'pleasurePlay_joyTolerance',
        category: 'pleasurePlay',
        concept: 'recovery_pattern',
        lens: 'recovery_patterns',
      }),
    ]);

    const copy = [
      read.title,
      read.body,
      read.whyItMayMatter,
      read.reframe,
      read.evidenceSummary,
      read.reflectionPrompt,
    ].join(' ');

    expect(copy).not.toMatch(/High-value read|Insight type|Priority|Evidence:|debug|score/i);
    expect(read.whyItMayMatter).toContain('recovery');
    expect(read.reflectionPrompt).toContain('helped');
  });

  it('uses softer V2 fallback reads when only low-score patterns are available', () => {
    const reads = selectPremiumWeeklyDeepDive([
      item({
        title: 'Early Responsibility Thread',
        patternKey: 'responsibilityCare_needNotAssignment',
        category: 'responsibilityCare',
        confidence: 'emerging',
        movement: 'new',
        score: 24,
      }),
      item({
        title: 'Early Rhythm Thread',
        patternKey: 'timeRhythms_timingAsData',
        category: 'timeRhythms',
        confidence: 'emerging',
        movement: 'new',
        score: 18,
      }),
    ]);

    expect(reads).toHaveLength(2);
    expect(reads.every(read => read.isV2Derived)).toBe(true);
    expect(reads.every(read => read.isLowConfidenceFallback)).toBe(true);
    expect(reads[0].body).toContain('light signal');
    expect(reads[0].reframe).toContain('not a conclusion yet');
  });

  it('returns a polished V2 low-data empty state when no V2 patterns exist', () => {
    const reads = selectPremiumWeeklyDeepDive([]);

    expect(reads).toHaveLength(1);
    expect(reads[0].isV2Derived).toBe(true);
    expect(reads[0].isEmptyState).toBe(true);
    expect(reads[0].patternKey).toBe('weeklyDeepDive_lowData');
    expect(reads[0].title).toContain('Still Gathering Signal');
    expect(reads[0].body).toContain('Rather than forcing a pattern too early');
  });

  it('can adapt low-score V2 pattern scores for Weekly without adding them to the main premium map', () => {
    const lowScore: ArchivePatternScore = {
      patternKey: 'responsibilityCare_invisibleLoad',
      title: 'Invisible Load',
      category: 'responsibilityCare',
      score: 0.24,
      confidence: 'emerging',
      movement: 'new',
      timeframeDays: 30,
      sources: ['journal'],
      evidence: [],
      lastSeenAt: '2026-04-24',
    };

    expect(adaptPremiumPatterns([lowScore])).toHaveLength(0);
    const weeklyCandidates = adaptWeeklyPremiumPatternCandidates([lowScore]);
    expect(weeklyCandidates).toHaveLength(1);
    expect(weeklyCandidates[0].patternKey).toBe('responsibilityCare_invisibleLoad');
  });

  it("selects This Week's Pattern from V2 patterns when available", () => {
    const selected = selectThisWeeksV2Pattern(
      [],
      [
        item({
          title: 'Care Feels Earned',
          patternKey: 'selfWorthReceiving_earnedCare',
          category: 'selfWorthReceiving',
          score: 90,
          confidence: 'strong',
        }),
      ],
      [],
    );

    expect(selected.patternKey).toBe('selfWorthReceiving_earnedCare');
    expect(selected.isV2Derived).toBe(true);
    expect(selected.isEmptyState).toBeFalsy();
    expect(selected.patternKey).not.toBe('unknown');
  });

  it('avoids duplicating the top Weekly Deep Dive item when a strong alternative exists', () => {
    const weeklyReads = selectPremiumWeeklyDeepDive([
      item({
        title: 'Letting Joy Land',
        patternKey: 'pleasurePlay_joyTolerance',
        category: 'pleasurePlay',
        concept: 'recovery_pattern',
        score: 96,
      }),
      item({
        title: 'Care Feels Earned',
        patternKey: 'selfWorthReceiving_earnedCare',
        category: 'selfWorthReceiving',
        score: 90,
      }),
    ]);

    const selected = selectThisWeeksV2Pattern(
      [],
      [
        item({
          title: 'Letting Joy Land',
          patternKey: 'pleasurePlay_joyTolerance',
          category: 'pleasurePlay',
          concept: 'recovery_pattern',
          score: 96,
        }),
        item({
          title: 'Care Feels Earned',
          patternKey: 'selfWorthReceiving_earnedCare',
          category: 'selfWorthReceiving',
          score: 90,
        }),
      ],
      weeklyReads,
    );

    expect(weeklyReads[0].patternKey).toBe('pleasurePlay_joyTolerance');
    expect(selected.patternKey).toBe('selfWorthReceiving_earnedCare');
  });

  it("uses a soft low-confidence V2 fallback for This Week's Pattern when needed", () => {
    const lowScore: ArchivePatternScore = {
      patternKey: 'responsibilityCare_invisibleLoad',
      title: 'Invisible Load',
      category: 'responsibilityCare',
      score: 0.24,
      confidence: 'emerging',
      movement: 'new',
      timeframeDays: 30,
      sources: ['journal'],
      evidence: [],
      lastSeenAt: '2026-04-24',
    };

    const selected = selectThisWeeksV2Pattern([lowScore], [], []);

    expect(selected.patternKey).toBe('responsibilityCare_invisibleLoad');
    expect(selected.isLowConfidenceFallback).toBe(true);
    expect(selected.body).toContain('early thread');
    expect(selected.reframe).toContain('emerging signal');
  });

  it("uses a V2 low-data empty state for This Week's Pattern when no V2 patterns exist", () => {
    const selected = selectThisWeeksV2Pattern([], [], []);

    expect(selected.patternKey).toBe('thisWeek_lowData');
    expect(selected.isEmptyState).toBe(true);
    expect(selected.isV2Derived).toBe(true);
    expect(selected.title).toContain('Still Forming');
  });
});
