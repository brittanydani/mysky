// themeDefinitions.ts
// Production-ready theme selection engine.
// Generates 66 themes (22 triggers × 3 variants: core, somatic, relational)
// from TRIGGER_TAXONOMY_22 instead of hardcoded definitions.
//
// Usage:
// 1) Run synthesis engine → get topThemes (trigger scores), dominant profiles.
// 2) Call selectThemesForDream({topThemes, dominant}) → ranked ThemeCards.
// 3) Render cards with your dream text snippets + feelings evidence.
//
// Notes:
// - All psychology-first. No astrology terms.
// - Deterministic: same input always produces same output.
// - Themes auto-derive from triggerTaxonomy22 — add a trigger there and themes appear here.

import {
  TRIGGER_TAXONOMY_22,
  SHADOW_TRIGGERS_22,
  type ShadowTrigger as TaxonomyShadowTrigger,
  type NervousSystemBranch as TaxonomyNSB,
  type AttachmentTone as TaxonomyAttachmentTone,
  type TriggerDefinition,
} from './triggerTaxonomy22';

// Re-export canonical types with backward-compat unions
export type ShadowTrigger = TaxonomyShadowTrigger;
export type AttachmentTone = TaxonomyAttachmentTone | "neutral";
export type NervousSystemBranch = TaxonomyNSB | "mixed";

export type TriggerScore = {
  trigger: ShadowTrigger;
  score: number; // 0..1
};

export type DominantProfiles = {
  valenceScore: number; // -1..1
  activationAvg: number; // 1..3
  attachmentProfile: Partial<Record<AttachmentTone, number>>; // 0..1 distribution
  nervousSystemProfile: Partial<Record<NervousSystemBranch, number>>; // 0..1 distribution
};

export type ThemeVariant = "core" | "somatic" | "relational";

export type ThemeDefinition = {
  id: string;
  trigger: ShadowTrigger;
  variant: ThemeVariant;
  title: string;
  meaning: string;
  evidenceHints: string[];
  reflectionQuestions: string[];
  integrationPrompts: string[];
  nervousPreferred: TaxonomyNSB[];
  attachmentPreferred: TaxonomyAttachmentTone[];
};

export type ThemeCard = {
  id: string;
  trigger: ShadowTrigger;
  variant: ThemeVariant;
  title: string;
  score: number; // 0..1
  meaning: string;
  evidenceHints: string[];
  reflectionQuestion: string;
  integrationPrompt?: string;
  matched: {
    triggers: Array<{ trigger: ShadowTrigger; score: number }>;
    nervousBoost?: { branch: NervousSystemBranch; weight: number };
    attachmentBoost?: { tone: AttachmentTone; weight: number };
  };
};

// ─── Utilities ────────────────────────────────────────────────────────────────

const pickOne = (arr: string[], seed: number): string => {
  if (!arr.length) return "";
  const idx = Math.abs(Math.floor(seed * 997)) % arr.length;
  return arr[idx];
};

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

const topKey = <T extends string>(m: Partial<Record<T, number>>): { key: T | null; value: number } => {
  const entries = Object.entries(m) as Array<[T, number]>;
  if (!entries.length) return { key: null, value: 0 };
  let best: T | null = null;
  let bestV = -Infinity;
  for (const [k, v] of entries) {
    const vv = v ?? 0;
    if (vv > bestV) {
      best = k;
      bestV = vv;
    }
  }
  return { key: best, value: bestV > 0 ? bestV : 0 };
};

// ─── Nervous / Attachment human labels (for somatic/relational meanings) ─────

const NERVOUS_PHRASE: Record<TaxonomyNSB, string> = {
  fight: "a protective, activated state",
  flight: "an anxious, urgency-driven state",
  freeze: "a shutdown or stuck state",
  collapse: "a depleted, heavy state",
  ventral_safety: "a grounded, regulated state",
};

const ATTACH_PHRASE: Record<TaxonomyAttachmentTone, string> = {
  secure: "trust and stability",
  anxious: "closeness-seeking and reassurance",
  avoidant: "self-reliance and distance",
  disorganized: "push-pull tension in connection",
};

// ─── Dynamic theme generation from taxonomy ──────────────────────────────────

function buildVariants(def: TriggerDefinition): ThemeDefinition[] {
  const nervPhrase =
    def.typicalNervousSystem.length > 0
      ? NERVOUS_PHRASE[def.typicalNervousSystem[0]]
      : "a mixed nervous system state";

  const attachPhrase =
    def.typicalAttachment.length > 0
      ? ATTACH_PHRASE[def.typicalAttachment[0]]
      : "varying relational patterns";

  const subFirst = def.subThemes[0] ?? def.label.toLowerCase();
  const feelsShort = def.commonFeels.slice(0, 2).join(" or ");
  const feelsLong = def.commonFeels.slice(0, 3).join(", ");

  return [
    // ── Core variant ─────────────────────────────────────────────────────
    {
      id: `${def.id}_core`,
      trigger: def.id,
      variant: "core",
      title: def.label,
      meaning: def.interpretationFrame,
      evidenceHints: def.commonMotifs.slice(0, 5),
      reflectionQuestions: [
        `What part of "${def.label.toLowerCase()}" resonates most with your current life?`,
        `If this dream is pointing to ${subFirst}, what might need attention?`,
        `What would it mean to sit with the feeling of ${feelsShort} without fixing it?`,
      ],
      integrationPrompts: [
        `Notice what comes up when you sit with the word "${def.label.toLowerCase()}." No need to fix — just observe.`,
      ],
      nervousPreferred: def.typicalNervousSystem,
      attachmentPreferred: def.typicalAttachment,
    },

    // ── Somatic (nervous-system-focused) variant ─────────────────────────
    {
      id: `${def.id}_somatic`,
      trigger: def.id,
      variant: "somatic",
      title: `${def.label}: Body Signal`,
      meaning: `Your body may be holding ${def.label.toLowerCase()} as ${nervPhrase}. ${def.interpretationFrame}`,
      evidenceHints: [
        ...def.commonMotifs.slice(0, 3),
        `physical sensations like ${feelsShort}`,
      ],
      reflectionQuestions: [
        `Where in your body did you feel the ${def.label.toLowerCase()} theme most?`,
        `What would your nervous system need to feel safer right now?`,
        `When you think of "${def.label.toLowerCase()}," does your body tense, sink, or go still?`,
      ],
      integrationPrompts: [
        `Place a hand on your chest. Take three slow breaths. Notice what shifts.`,
        `Scan from head to feet — where do you feel this theme living?`,
      ],
      nervousPreferred: def.typicalNervousSystem,
      attachmentPreferred: [],
    },

    // ── Relational (attachment-focused) variant ──────────────────────────
    {
      id: `${def.id}_relational`,
      trigger: def.id,
      variant: "relational",
      title: `${def.label}: Relational Pattern`,
      meaning: `This theme may surface relational dynamics around ${attachPhrase}. ${def.interpretationFrame}`,
      evidenceHints: [
        ...def.commonMotifs.slice(0, 3),
        `relational cues: ${feelsLong}`,
      ],
      reflectionQuestions: [
        `Who in your life does this ${def.label.toLowerCase()} theme remind you of?`,
        `What relational pattern might this dream be pointing to?`,
        `What would "enough" look like in the relationship this theme evokes?`,
      ],
      integrationPrompts: [
        `Consider one relationship where this theme shows up. What would "enough" look like there?`,
      ],
      nervousPreferred: [],
      attachmentPreferred: def.typicalAttachment,
    },
  ];
}

/**
 * All 66 themes (22 triggers × 3 variants), generated once at module load.
 */
export const THEME_DEFINITIONS: ThemeDefinition[] = SHADOW_TRIGGERS_22.flatMap(
  (id) => buildVariants(TRIGGER_TAXONOMY_22[id]),
);

// ─── Scoring constants ───────────────────────────────────────────────────────

const WEIGHTS = {
  nervousPreferred: 0.18,
  attachmentPreferred: 0.12,
  variantPenalty: 0.06, // somatic / relational get slight penalty to keep core themes dominant
  minThemeScoreToKeep: 0.05,
} as const;

// ─── Score normalizer ────────────────────────────────────────────────────────

const normalizeTriggerScores = (topThemes: TriggerScore[]): Record<ShadowTrigger, number> => {
  const init = Object.fromEntries(SHADOW_TRIGGERS_22.map((t) => [t, 0])) as Record<ShadowTrigger, number>;
  for (const t of topThemes) init[t.trigger] = clamp(t.score ?? 0, 0, 1);
  return init;
};

// ─── Theme selection ─────────────────────────────────────────────────────────

/**
 * Select & rank the best ThemeCards for a dream.
 *
 * @param args.topThemes  - scored triggers from the synthesis engine
 * @param args.dominant   - optional dominant profiles (nervous system + attachment)
 * @param args.maxCards   - max cards to return (default 4)
 * @param args.seed       - deterministic seed for reflection-question picking
 */
export function selectThemesForDream(args: {
  topThemes: TriggerScore[];
  dominant?: DominantProfiles;
  maxCards?: number;
  seed?: number;
}): ThemeCard[] {
  const { topThemes, dominant } = args;
  const maxCards = args.maxCards ?? 4;
  const seed = args.seed ?? 0.1337;

  const triggerScores = normalizeTriggerScores(topThemes);

  const topNerv = dominant ? topKey(dominant.nervousSystemProfile) : { key: null, value: 0 };
  const topAttach = dominant ? topKey(dominant.attachmentProfile) : { key: null, value: 0 };

  // Score every theme
  type ScoredTheme = {
    theme: ThemeDefinition;
    score: number;
    primaryScore: number;
    nervousBoost?: ThemeCard["matched"]["nervousBoost"];
    attachmentBoost?: ThemeCard["matched"]["attachmentBoost"];
  };

  const scored: ScoredTheme[] = [];

  for (const theme of THEME_DEFINITIONS) {
    const primaryScore = triggerScores[theme.trigger] ?? 0;
    if (primaryScore < 0.03) continue; // irrelevant trigger → skip entirely

    let s = primaryScore;

    // Nervous system preference boost
    let nervousBoost: ThemeCard["matched"]["nervousBoost"] | undefined;
    if (
      theme.nervousPreferred.length > 0 &&
      topNerv.key &&
      (theme.nervousPreferred as string[]).includes(topNerv.key)
    ) {
      const b = WEIGHTS.nervousPreferred * clamp(topNerv.value, 0, 1);
      s += b;
      nervousBoost = { branch: topNerv.key as NervousSystemBranch, weight: b };
    }

    // Attachment preference boost
    let attachmentBoost: ThemeCard["matched"]["attachmentBoost"] | undefined;
    if (
      theme.attachmentPreferred.length > 0 &&
      topAttach.key &&
      (theme.attachmentPreferred as string[]).includes(topAttach.key)
    ) {
      const b = WEIGHTS.attachmentPreferred * clamp(topAttach.value, 0, 1);
      s += b;
      attachmentBoost = { tone: topAttach.key as AttachmentTone, weight: b };
    }

    // Variant diversity: somatic/relational get a slight penalty to keep core dominant
    if (theme.variant !== "core") {
      s -= WEIGHTS.variantPenalty;
    }

    if (s >= WEIGHTS.minThemeScoreToKeep) {
      scored.push({ theme, score: clamp(s, 0, 1), primaryScore, nervousBoost, attachmentBoost });
    }
  }

  // Sort by score, then deduplicate: at most 1 variant per trigger
  scored.sort((a, b) => b.score - a.score);

  const usedTriggers = new Set<ShadowTrigger>();
  const selected: ScoredTheme[] = [];

  for (const entry of scored) {
    if (usedTriggers.has(entry.theme.trigger)) continue;
    usedTriggers.add(entry.theme.trigger);
    selected.push(entry);
    if (selected.length >= maxCards) break;
  }

  // Build final ThemeCard array
  return selected.map((x, idx) => {
    const reflectionQuestion = pickOne(x.theme.reflectionQuestions, seed + idx * 0.17);
    const integrationPrompt = x.theme.integrationPrompts.length
      ? pickOne(x.theme.integrationPrompts, seed + idx * 0.31)
      : undefined;

    // Build matched.triggers: primary trigger + other high-scoring triggers for evidence breadth
    const matchedTriggers: Array<{ trigger: ShadowTrigger; score: number }> = [
      { trigger: x.theme.trigger, score: x.primaryScore },
    ];
    for (const ts of topThemes) {
      if (ts.trigger !== x.theme.trigger && ts.score >= 0.15 && matchedTriggers.length < 4) {
        matchedTriggers.push({ trigger: ts.trigger, score: ts.score });
      }
    }
    matchedTriggers.sort((a, b) => b.score - a.score);

    return {
      id: x.theme.id,
      trigger: x.theme.trigger,
      variant: x.theme.variant,
      title: x.theme.title,
      score: x.score,
      meaning: x.theme.meaning,
      evidenceHints: x.theme.evidenceHints,
      reflectionQuestion,
      integrationPrompt,
      matched: {
        triggers: matchedTriggers,
        nervousBoost: x.nervousBoost,
        attachmentBoost: x.attachmentBoost,
      },
    };
  });
}
