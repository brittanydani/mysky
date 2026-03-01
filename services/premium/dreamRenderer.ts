// dreamRenderer.ts
// UI-ready renderer that converts:
// - EngineOutput
// - ThemeCard[]
// - cardEvidence
// - SelectedFeelings
//
// Into a structured interpretation payload:
//
// {
//   emotionalSnapshot,
//   insightCards[],
//   patternInsight,
//   integration
// }
//
// Safe, non-deterministic, psychology-first.

import type { EngineOutput, SelectedFeeling, ShadowTrigger } from "./dreamSynthesisEngine";
import type { ThemeCard } from "./themeDefinitions";

export type RenderedInsightCard = {
  id: string;
  title: string;
  whatItMayReflect: string;
  evidenceNoticed: string[];
  reflectionQuestion: string;
  confidence: "Low" | "Medium" | "High";
  integrationPrompt?: string;
};

export type RenderedDreamInterpretation = {
  emotionalSnapshot: string;
  insightCards: RenderedInsightCard[];
  patternInsight?: string;
  integration?: string;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function confidenceLabel(score: number): "Low" | "Medium" | "High" {
  if (score >= 0.7) return "High";
  if (score >= 0.4) return "Medium";
  return "Low";
}

function formatFeelings(selected: SelectedFeeling[], max = 3): string {
  const sorted = selected
    .slice()
    .sort((a, b) => (b.intensity ?? 0) - (a.intensity ?? 0))
    .slice(0, max);

  if (!sorted.length) return "mixed or unclear emotions";

  return sorted.map((f) => f.id).join(", ");
}

function dominantNervousSystem(engine: EngineOutput): string {
  const entries = Object.entries(engine.dominant.nervousSystemProfile);
  if (!entries.length) return "a mixed nervous system state";

  const top = entries.sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))[0];
  const key = top?.[0];

  switch (key) {
    case "fight":
      return "a protective, activated state";
    case "flight":
      return "an anxious, urgency-driven state";
    case "freeze":
      return "a shutdown or blocked state";
    case "collapse":
      return "a depleted or heavy state";
    case "ventral_safety":
      return "a regulated, connected state";
    default:
      return "a mixed nervous system state";
  }
}

function buildEmotionalSnapshot(
  engine: EngineOutput,
  selectedFeelings: SelectedFeeling[]
): string {
  const feelingSummary = formatFeelings(selectedFeelings);
  const nervous = dominantNervousSystem(engine);

  return `This dream carries themes of ${feelingSummary}. Your nervous system appears to be operating from ${nervous}, suggesting your body may be trying to process something emotionally charged or unresolved.`;
}

function buildPatternInsight(engine: EngineOutput): string | undefined {
  const { patternFlags } = engine;

  if (patternFlags.recurring && patternFlags.alignedWithRecent) {
    return "This dream appears aligned with recent emotional patterns, suggesting your system may be actively processing an ongoing theme.";
  }

  if (patternFlags.recurring && patternFlags.escalating) {
    return "This dream reflects a recurring emotional theme that may be intensifying, indicating something unresolved seeking attention.";
  }

  if (patternFlags.compensatory) {
    return "This dream contrasts recent emotional patterns, which can sometimes indicate your system attempting to rebalance or process what isn't being addressed while awake.";
  }

  if (patternFlags.recurring) {
    return "This dream reflects a theme that has appeared before, suggesting your system is revisiting something meaningful.";
  }

  return undefined;
}

function buildIntegration(cards: RenderedInsightCard[]): string | undefined {
  const integrationPrompts = cards
    .map((c) => c.integrationPrompt)
    .filter(Boolean) as string[];

  if (!integrationPrompts.length) return undefined;

  // Use first integration prompt
  return integrationPrompts[0];
}

function mergeEvidence(
  card: ThemeCard,
  cardEvidence: Array<{
    cardId: string;
    triggerEvidence: Array<{ trigger: ShadowTrigger; snippets: string[] }>;
  }>
): string[] {
  const evidenceForCard = cardEvidence.find((e) => e.cardId === card.id);
  if (!evidenceForCard) return [];

  const snippets: string[] = [];

  evidenceForCard.triggerEvidence.forEach((t) => {
    t.snippets.forEach((s) => {
      if (s && !snippets.includes(s)) snippets.push(s);
    });
  });

  return snippets.slice(0, 4);
}

export function renderDreamInterpretation(args: {
  engine: EngineOutput;
  cards: ThemeCard[];
  cardEvidence: Array<{
    cardId: string;
    triggerEvidence: Array<{ trigger: ShadowTrigger; snippets: string[] }>;
  }>;
  selectedFeelings: SelectedFeeling[];
}): RenderedDreamInterpretation {
  const { engine, cards, cardEvidence, selectedFeelings } = args;

  const emotionalSnapshot = buildEmotionalSnapshot(engine, selectedFeelings);

  const insightCards: RenderedInsightCard[] = cards.map((card) => {
    const evidence = mergeEvidence(card, cardEvidence);

    return {
      id: card.id,
      title: card.title,
      whatItMayReflect: card.meaning,
      evidenceNoticed: evidence,
      reflectionQuestion: card.reflectionQuestion,
      confidence: confidenceLabel(card.score),
      integrationPrompt: card.integrationPrompt,
    };
  });

  const patternInsight = buildPatternInsight(engine);
  const integration = buildIntegration(insightCards);

  return {
    emotionalSnapshot,
    insightCards,
    patternInsight,
    integration,
  };
}
