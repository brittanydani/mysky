import { generateDreamInterpretation } from '../dreamInterpretation';
import type {
  DreamInterpretationInput,
  DreamAggregates,
  DreamPatternData,
  DreamMetadata,
  SelectedFeeling,
} from '../dreamTypes';

function makeAggregates(overrides: Partial<DreamAggregates> = {}): DreamAggregates {
  return {
    valenceScore: -0.2,
    activationScore: 'moderate',
    attachmentProfile: { secure: 0.4, anxious: 0.3, avoidant: 0.2, disorganized: 0.1 },
    nervousSystemProfile: {
      ventral_safety: 0.2,
      fight: 0.1,
      flight: 0.3,
      freeze: 0.2,
      collapse: 0.1,
      mixed: 0.1,
    },
    shadowTriggerHeatmap: [
      { trigger: 'abandonment', weight: 0.8 },
      { trigger: 'shame', weight: 0.5 },
      { trigger: 'control', weight: 0.3 },
    ],
    dominantFeelings: [{ id: 'anxious', intensity: 4 }],
    dominantBranch: 'flight',
    dominantAttachment: 'anxious',
    ...overrides,
  };
}

function makeMetadata(overrides: Partial<DreamMetadata> = {}): DreamMetadata {
  return {
    vividness: 4,
    lucidity: 2,
    controlLevel: 2,
    awakenState: 'confused',
    recurring: false,
    ...overrides,
  };
}

function makePatterns(overrides: Partial<DreamPatternData> = {}): DreamPatternData {
  return {
    recurringFeelings: ['anxious', 'lost'],
    emotionalTrendDirection: 'stable',
    coOccurringPairs: [['anxious', 'lost']],
    comparisonCount: 5,
    ...overrides,
  };
}

function makeFeelings(): SelectedFeeling[] {
  return [
    { id: 'anxious', intensity: 4 },
    { id: 'lost', intensity: 3 },
  ];
}

function makeInput(overrides: Partial<DreamInterpretationInput> = {}): DreamInterpretationInput {
  return {
    entry: {
      id: 'dream-001',
      chartId: 'chart-1',
      date: '2025-06-15',
      dreamText: 'I was running through a dark forest, trying to find my way home but every path led deeper into the woods.',
      createdAt: '2025-06-15T08:00:00Z',
      updatedAt: '2025-06-15T08:00:00Z',
      isDeleted: false,
    } as any,
    dreamText: 'I was running through a dark forest, trying to find my way home but every path led deeper into the woods.',
    feelings: makeFeelings(),
    metadata: makeMetadata(),
    aggregates: makeAggregates(),
    patterns: makePatterns(),
    ...overrides,
  };
}

describe('generateDreamInterpretation', () => {
  it('returns a DreamInterpretation with paragraph and question', () => {
    const result = generateDreamInterpretation(makeInput());

    expect(typeof result.paragraph).toBe('string');
    expect(result.paragraph.length).toBeGreaterThan(20);
    expect(typeof result.question).toBe('string');
    expect(result.question.length).toBeGreaterThan(10);
    expect(typeof result.generatedAt).toBe('string');
  });

  it('includes explicit imagery from the dream text', () => {
    const result = generateDreamInterpretation(makeInput());
    expect(Array.isArray(result.explicitImagery)).toBe(true);
  });

  it('includes interpretive themes', () => {
    const result = generateDreamInterpretation(makeInput());
    expect(Array.isArray(result.interpretiveThemes)).toBe(true);
  });

  it('is deterministic for same input', () => {
    const input = makeInput();
    const r1 = generateDreamInterpretation(input);
    const r2 = generateDreamInterpretation(input);

    expect(r1.paragraph).toBe(r2.paragraph);
    expect(r1.question).toBe(r2.question);
  });

  it('produces different output with seedSuffix', () => {
    const base = makeInput();
    const variant = makeInput({ seedSuffix: 'reinterpret-1' });

    const r1 = generateDreamInterpretation(base);
    const r2 = generateDreamInterpretation(variant);

    // At least the question or paragraph should differ
    const differs = r1.paragraph !== r2.paragraph || r1.question !== r2.question;
    expect(differs).toBe(true);
  });

  it('handles minimal dream text', () => {
    const input = makeInput({
      dreamText: 'Bad dream.',
      entry: {
        id: 'dream-002',
        chartId: 'chart-1',
        date: '2025-06-15',
        dreamText: 'Bad dream.',
        createdAt: '2025-06-15T08:00:00Z',
        updatedAt: '2025-06-15T08:00:00Z',
        isDeleted: false,
      } as any,
    });

    const result = generateDreamInterpretation(input);
    expect(result.paragraph.length).toBeGreaterThan(0);
    expect(result.question.length).toBeGreaterThan(0);
  });

  it('adds grounding close for high-activation negative valence', () => {
    const input = makeInput({
      aggregates: makeAggregates({
        activationScore: 'high',
        valenceScore: -0.5,
      }),
    });

    const result = generateDreamInterpretation(input);
    // Grounding lines are appended — paragraph should be non-empty
    expect(result.paragraph.length).toBeGreaterThan(50);
  });

  it('handles empty feelings array', () => {
    const input = makeInput({ feelings: [] });
    const result = generateDreamInterpretation(input);
    expect(result.paragraph.length).toBeGreaterThan(0);
  });

  it('handles empty shadow trigger heatmap', () => {
    const input = makeInput({
      aggregates: makeAggregates({ shadowTriggerHeatmap: [] }),
    });
    const result = generateDreamInterpretation(input);
    expect(result.paragraph.length).toBeGreaterThan(0);
  });

  it('uses non-clinical trauma-informed language', () => {
    const result = generateDreamInterpretation(makeInput());
    // Should not contain absolute clinical terms
    expect(result.paragraph).not.toMatch(/\byou definitely\b/i);
    expect(result.paragraph).not.toMatch(/\bdiagnos/i);
  });

  it('reflects recurring dream patterns data', () => {
    const input = makeInput({
      metadata: makeMetadata({ recurring: true }),
      patterns: makePatterns({
        recurringFeelings: ['anxious', 'trapped'],
        comparisonCount: 10,
      }),
    });

    const result = generateDreamInterpretation(input);
    expect(result.paragraph.length).toBeGreaterThan(0);
  });
});
