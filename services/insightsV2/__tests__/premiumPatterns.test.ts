import { adaptPremiumPatterns } from '../adapters/premiumPatterns';
import type { ArchivePatternScore } from '../types';

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
    expect(items[0].body).toContain('This does not read as');
    expect(items[0].body).toContain('Seen across journal entries and body maps');
    expect(items[0].body).not.toContain('Naomi');
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
});
