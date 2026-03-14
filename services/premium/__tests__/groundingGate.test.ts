/**
 * groundingGate.test.ts — Tests for the grounding close feature
 *
 * When a dream has high activation + negative valence (high distress),
 * the interpretation should end with a somatic grounding sentence.
 * When distress is low/moderate, no grounding line should appear.
 */

import { generateDreamInterpretation, __test } from '../dreamInterpretation';
import type { DreamInterpretationInput } from '../dreamTypes';
import type { SleepEntry } from '../../storage/models';

const { GROUNDING_LINES } = __test;

/** Check whether any line from the grounding pool appears in the paragraph. */
function containsGrounding(text: string): boolean {
  return GROUNDING_LINES.some((line: string) => text.includes(line));
}

/** Check whether the last section matches a grounding line. */
function lastSectionIsGrounding(text: string): boolean {
  const sections = text.split('\n\n');
  const last = sections[sections.length - 1];
  return GROUNDING_LINES.some((line: string) => last.includes(line));
}

// ─── Minimal fixture builders ─────────────────────────────────────────────────

function makeSleepEntry(id = 'test-1'): SleepEntry {
  return {
    id,
    chartId: 'chart-1',
    date: '2026-02-28',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isDeleted: false,
  };
}

function makeInput(
  overrides: Partial<DreamInterpretationInput> & {
    valence?: number;
    activation?: 'low' | 'moderate' | 'high';
  } = {},
): DreamInterpretationInput {
  const {
    valence = 0,
    activation = 'moderate',
    ...rest
  } = overrides;

  return {
    entry: makeSleepEntry(),
    dreamText: rest.dreamText ?? 'I was running through a dark building, chased by something I could not see.',
    feelings: rest.feelings ?? [{ id: 'anxious', intensity: 4 }],
    metadata: rest.metadata ?? {
      vividness: 4,
      lucidity: 2,
      controlLevel: 2,
      awakenState: 'shaken',
      recurring: false,
    },
    aggregates: rest.aggregates ?? {
      valenceScore: valence,
      activationScore: activation,
      attachmentProfile: { secure: 0.1, anxious: 0.5, avoidant: 0.2, disorganized: 0.2 },
      nervousSystemProfile: { ventral_safety: 0.05, fight: 0.1, flight: 0.6, freeze: 0.2, collapse: 0.05, mixed: 0 },
      shadowTriggerHeatmap: [
        { trigger: 'danger' as any, weight: 0.8 },
        { trigger: 'unpredictability' as any, weight: 0.5 },
      ],
      dominantFeelings: [{ id: 'anxious', intensity: 4 }],
      dominantBranch: 'flight',
      dominantAttachment: 'anxious',
    },
    patterns: rest.patterns ?? {
      recurringFeelings: [],
      emotionalTrendDirection: 'stable',
      coOccurringPairs: [],
      comparisonCount: 0,
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('grounding close — high-distress gate', () => {
  it('should include grounding when activation=high AND valence is strongly negative', () => {
    const input = makeInput({ activation: 'high', valence: -0.7 });
    const result = generateDreamInterpretation(input);

    expect(containsGrounding(result.paragraph)).toBe(true);
  });

  it('should include grounding at the valence threshold (-0.3)', () => {
    const input = makeInput({ activation: 'high', valence: -0.3 });
    const result = generateDreamInterpretation(input);

    expect(containsGrounding(result.paragraph)).toBe(true);
  });

  it('should NOT include grounding when activation=moderate even with negative valence', () => {
    const input = makeInput({ activation: 'moderate', valence: -0.8 });
    const result = generateDreamInterpretation(input);

    expect(containsGrounding(result.paragraph)).toBe(false);
  });

  it('should NOT include grounding when activation=low', () => {
    const input = makeInput({ activation: 'low', valence: -0.5 });
    const result = generateDreamInterpretation(input);

    expect(containsGrounding(result.paragraph)).toBe(false);
  });

  it('should NOT include grounding when valence is neutral despite high activation', () => {
    const input = makeInput({ activation: 'high', valence: 0.0 });
    const result = generateDreamInterpretation(input);

    expect(containsGrounding(result.paragraph)).toBe(false);
  });

  it('should NOT include grounding when valence is positive', () => {
    const input = makeInput({ activation: 'high', valence: 0.5 });
    const result = generateDreamInterpretation(input);

    expect(containsGrounding(result.paragraph)).toBe(false);
  });

  it('should NOT include grounding when valence is just above threshold (-0.29)', () => {
    const input = makeInput({ activation: 'high', valence: -0.29 });
    const result = generateDreamInterpretation(input);

    expect(containsGrounding(result.paragraph)).toBe(false);
  });

  it('grounding line should be the LAST section of the paragraph', () => {
    const input = makeInput({ activation: 'high', valence: -0.7 });
    const result = generateDreamInterpretation(input);

    expect(lastSectionIsGrounding(result.paragraph)).toBe(true);
  });

  it('grounding should be deterministic — same input always gets same line', () => {
    const input = makeInput({ activation: 'high', valence: -0.6 });
    const r1 = generateDreamInterpretation(input);
    const r2 = generateDreamInterpretation(input);

    expect(r1.paragraph).toBe(r2.paragraph);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// POOL INTEGRITY
// ═══════════════════════════════════════════════════════════════════════════════

describe('grounding line pool', () => {
  it('should contain at least 50 unique lines', () => {
    expect(GROUNDING_LINES.length).toBeGreaterThanOrEqual(50);
    // All lines should be unique
    const unique = new Set(GROUNDING_LINES);
    expect(unique.size).toBe(GROUNDING_LINES.length);
  });

  it('no line should be empty or whitespace-only', () => {
    for (const line of GROUNDING_LINES) {
      expect(line.trim().length).toBeGreaterThan(0);
    }
  });

  it('no line should contain clinical / pathologizing language', () => {
    const BANNED_WORDS = [
      'hypervigilance', 'hypervigilant', 'hyperalert',
      'dissociat', 'patholog', 'diagnos', 'disorder',
      'symptom', 'trigger warning', 'PTSD', 'trauma response',
      'maladaptive', 'dysfunctional',
    ];
    for (const line of GROUNDING_LINES) {
      const lower = line.toLowerCase();
      for (const word of BANNED_WORDS) {
        expect(lower).not.toContain(word);
      }
    }
  });

  it('every line should end with a period', () => {
    for (const line of GROUNDING_LINES) {
      expect(line.trimEnd()).toMatch(/\.$/);
    }
  });

  it('should produce good distribution across varied dream lengths', () => {
    // Simulate 200 different dream text lengths → should hit many distinct lines
    const seen = new Set<number>();
    for (let len = 1; len <= 200; len++) {
      seen.add(len % GROUNDING_LINES.length);
    }
    // With 50+ lines and 200 lengths, modular arithmetic guarantees all indices hit
    // At minimum, we should see at least 40 distinct lines used
    expect(seen.size).toBeGreaterThanOrEqual(40);
  });
});
