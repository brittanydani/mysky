import { adaptPremiumPatterns } from '../adapters/premiumPatterns';
import type { ArchivePatternScore } from '../types';

const sentenceCount = (text: string): number => (
  text.match(/[.!?](?=\s|$)/g)?.length ?? 0
);

const baseScore = (overrides: Partial<ArchivePatternScore>): ArchivePatternScore => ({
  patternKey: 'responsibilityCare_invisibleLoad',
  title: 'Invisible Load',
  category: 'responsibilityCare',
  score: 0.72,
  confidence: 'strong',
  movement: 'repeating',
  timeframeDays: 30,
  sources: ['journal', 'bodyMap'],
  evidence: [
    {
      source: 'journal',
      date: '2026-04-24',
      label: 'Journal',
      phrase: 'Naomi needs me to carry this.',
      signal: 'mental_load',
      strength: 0.8,
    },
    {
      source: 'bodyMap',
      date: '2026-04-22',
      label: 'Shoulder tension',
      phrase: 'I felt the load in my shoulders after helping.',
      signal: 'responsibility_weight',
      strength: 0.72,
    },
    {
      source: 'journal',
      date: '2026-04-20',
      label: 'Shared responsibility',
      phrase: 'I noticed I picked it up before checking capacity.',
      signal: 'invisible_labor',
      strength: 0.68,
    },
  ],
  lastSeenAt: '2026-04-24',
  ...overrides,
});

describe('adaptPremiumPatterns', () => {
  it('adapts V2 pattern scores into premium pattern items without raw evidence dumps', () => {
    const items = adaptPremiumPatterns([
      baseScore({}),
      baseScore({
        patternKey: 'safetyRegulation_subtleBracing',
        title: 'Subtle Bracing',
        category: 'safetyRegulation',
        score: 0.66,
        confidence: 'moderate',
        sources: ['bodyMap', 'journal'],
      }),
    ]);

    expect(items).toHaveLength(2);
    expect(items[0].patternKey).toBe('responsibilityCare_invisibleLoad');
    expect(items[0].isV2Derived).toBe(true);
    expect(items[0].librarySectionTitle).toBe('Responsibility & Care');
    expect(items[0].paragraphId).toMatch(/^moralResponsibilityFairness_responsibilityQuestion_/);
    expect(items[0].weeklyParagraphId).toMatch(/^responsibilityCare_weekly_/);
    expect([4, 5]).toContain(sentenceCount(items[0].body));
    expect(items[0].body).toMatch(/care|responsibility|support|load|held|weight|pick it up/i);
    expect(items[0].body.split(/\n{2,}/)).toHaveLength(1);
    expect(items[0].body).not.toContain('Naomi');
    expect(items[0].body).not.toContain('journal');
    expect(items[0].body).not.toContain('bodyMap');
    expect(items[0].body).not.toContain('This does not read as');
    expect(items[0].body).not.toContain('It reads as');
    expect(items[0].body).not.toContain('Seen across');
    expect(items[0].body).not.toContain('Detected in');
    expect(items[0].body).not.toContain('Based on');
    expect(items[0].body).not.toMatch(/\bthe user\b/i);
    expect(items[0].evidenceSummary).toContain('It showed up across 3 days in the last 30 days');
    expect(items[0].evidenceSummary).toContain('journaling and body check-ins');
  });

  it('dedupes duplicate V2 pattern keys and ignores weak scores', () => {
    const items = adaptPremiumPatterns([
      baseScore({ score: 0.7 }),
      baseScore({ score: 0.68 }),
      baseScore({
        patternKey: 'workAmbition_pressureAsSafety',
        title: 'Progress Feels Like Safety',
        category: 'workAmbition',
        score: 0.2,
        confidence: 'emerging',
        evidence: [],
      }),
    ]);

    expect(items).toHaveLength(1);
    expect(items[0].patternKey).toBe('responsibilityCare_invisibleLoad');
    expect(items.some(item => item.patternKey === 'unknown')).toBe(false);
  });

  it('does not surface confident pattern-screen copy from a single-entry signal', () => {
    const items = adaptPremiumPatterns([
      baseScore({
        score: 0.86,
        confidence: 'veryStrong',
        evidence: [
          {
            source: 'journal',
            date: '2026-04-24',
            label: 'One intense journal entry',
            phrase: 'Today felt like too much to carry.',
            signal: 'mental_load',
            strength: 0.95,
          },
        ],
      }),
    ]);

    expect(items).toHaveLength(0);
  });

  it('excludes dream paragraph patterns from the pattern screen engine', () => {
    const dreamScore: ArchivePatternScore = {
      patternKey: 'dreams_001_unfinished_processing',
      title: 'When Dreams Continue the Conversation',
      category: 'dreamsSymbols',
      score: 0.9,
      confidence: 'veryStrong',
      movement: 'repeating',
      timeframeDays: 90,
      sources: ['dream'],
      evidence: [
        {
          source: 'dream',
          date: '2026-04-24',
          label: 'Dream',
          signal: 'dream_unfinished_processing',
          strength: 0.9,
        },
      ],
      lastSeenAt: '2026-04-24',
    };

    const items = adaptPremiumPatterns([
      dreamScore,
      baseScore({}),
    ]);

    expect(items).toHaveLength(1);
    expect(items[0].category).toBe('responsibilityCare');
    expect(items.some(item => item.category === 'dreamsSymbols')).toBe(false);
    expect(items.some(item => item.paragraphId?.startsWith('dreamsSymbols_'))).toBe(false);
  });
});
