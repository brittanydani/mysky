// dreamPipeline.ts
// One-shot glue pipeline:
// 1) Extract deterministic text signals from dream journal
// 2) Run synthesis scoring engine (feelings + text + check-ins + history + personality)
// 3) Select final insight cards using ThemeDefinitions map
//
// Drop this into your project and wire it to your UI layer.

import {
  extractDreamTextSignals,
  type DreamTextSignals,
} from './dreamTextExtractor';
import {
  runDreamSynthesisEngine,
  type EngineInput,
  type EngineOutput,
  type SelectedFeeling,
  type ShadowTrigger,
  type NervousSystemBranch,
} from './dreamSynthesisEngine';
import type { DreamFeelingDef } from './dreamTypes';
import type { PersonalityProcessingProfile } from './dreamSynthesisEngine';
import {
  selectThemesForDream,
  type ThemeCard,
} from './themeDefinitions';

// ---------- Input types for the pipeline ----------
export type RecentCheckInSignals = {
  completeness: number; // 0..1
  triggers?: Partial<Record<ShadowTrigger, number>>; // 0..1
  nervousSystem?: Partial<Record<NervousSystemBranch, number>>; // 0..1
};

export type HistorySignals = {
  completeness: number; // 0..1
  recurring: boolean;
  recurrenceStrength: number; // 0..1
  triggers?: Partial<Record<ShadowTrigger, number>>; // 0..1
};

export type DreamPipelineInput = {
  dreamText: string;

  // Feelings (user dropdown selections)
  selectedFeelings: SelectedFeeling[];
  feelingDefs: DreamFeelingDef[];

  // Optional extra layers
  checkInSignals?: RecentCheckInSignals;
  historySignals?: HistorySignals;
  personalityProfile?: PersonalityProcessingProfile;

  // Options
  supportedTriggers?: ShadowTrigger[]; // to lock taxonomy
  maxCards?: number; // default 4
  seed?: number; // stable randomization for prompt variety
};

export type DreamPipelineOutput = {
  textSignals: DreamTextSignals;
  engine: EngineOutput;
  cards: ThemeCard[];
  // UI-ready evidence snippets grouped by card triggers
  cardEvidence: Array<{
    cardId: string;
    triggerEvidence: Array<{ trigger: ShadowTrigger; snippets: string[] }>;
  }>;
};

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function topTriggersFromCard(card: ThemeCard, max = 3): ShadowTrigger[] {
  return card.matched.triggers.slice(0, max).map((t) => t.trigger);
}

function pickEvidence(signals: DreamTextSignals, trigger: ShadowTrigger, max = 2): string[] {
  const hits = signals.evidence[trigger] ?? [];
  return hits.slice(0, max).map((h) => h.snippet);
}

/**
 * Run the full dream interpretation pipeline.
 * Deterministic + robust + explainable.
 */
export function runDreamPipeline(input: DreamPipelineInput): DreamPipelineOutput {
  const {
    dreamText,
    selectedFeelings,
    feelingDefs,
    checkInSignals,
    historySignals,
    personalityProfile,
    supportedTriggers,
    maxCards = 4,
    seed = 0.1337,
  } = input;

  // 1) Extract deterministic signals from text
  const textSignals = extractDreamTextSignals(dreamText, { maxEvidencePerTrigger: 4 });

  // Optional: nudge coverage down if dream text is extremely short AND no feelings selected
  const meanIntensity =
    selectedFeelings.length > 0
      ? selectedFeelings.reduce((a, b) => a + clamp(b.intensity ?? 0, 0, 5), 0) / selectedFeelings.length
      : 0;

  const adjustedTextSignals: DreamTextSignals = {
    ...textSignals,
    coverage:
      meanIntensity <= 0.5 && (dreamText?.trim()?.length ?? 0) < 100
        ? clamp(textSignals.coverage - 0.12, 0, 1)
        : textSignals.coverage,
  };

  // 2) Run synthesis engine
  const engineInput: EngineInput = {
    selectedFeelings,
    feelingDefs,
    textSignals: { coverage: adjustedTextSignals.coverage, triggers: adjustedTextSignals.triggers },
    checkInSignals,
    historySignals,
    personalityProfile,
    supportedTriggers,
  };

  const engine = runDreamSynthesisEngine(engineInput);

  // 3) Select theme cards
  const cards = selectThemesForDream({
    topThemes: engine.topThemes.map((t) => ({ trigger: t.trigger, score: t.score })),
    dominant: engine.dominant,
    maxCards,
    seed,
  });

  // 4) Attach evidence snippets per card (based on top matched triggers per card)
  const cardEvidence = cards.map((card) => {
    const triggers = topTriggersFromCard(card, 3);
    const triggerEvidence = triggers.map((t) => ({
      trigger: t,
      snippets: pickEvidence(adjustedTextSignals, t, 2),
    }));
    return { cardId: card.id, triggerEvidence };
  });

  return {
    textSignals: adjustedTextSignals,
    engine,
    cards,
    cardEvidence,
  };
}
