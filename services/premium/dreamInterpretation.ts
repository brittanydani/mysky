/**
 * Dream Interpretation Engine — Premium Feature (v3)
 *
 * Evidence-based, psychologically-grounded dream interpretation.
 * Generates personalized insights without AI or network calls.
 *
 * Priority order (paragraph):
 *   1. Dream journal keywords — what the user wrote (symbols, imagery)
 *   2. How the dream felt     — selected feelings + emotional tone
 *   3. Dream details           — vividness, recurring, awaken state
 *   4. Other data              — patterns, natal chart, check-in trends
 *
 * Signal Sources & Weights:
 *   Wt = 0.55  Text signals + keywords (regex + dream symbol dictionary)
 *   Wf = 0.25  Feelings (user-selected emotions + intensity)
 *   Wc = 0.10  Check-ins (recent mood scores, tags, energy)
 *   Wh = 0.07  History (recurring feelings, emotional trends)
 *   Wp = 0.03  Personality (natal chart → nervous system / attachment baseline)
 *
 * Output is deterministic per entry: same input always produces same interpretation.
 * Tone: Warm but not poetic. Grounded. "May", "could", "often reflects" — never absolute.
 *
 * Returns: one paragraph + one reflection question.
 */

import {
  AttachmentStyle,
  DreamAggregates,
  DreamInterpretation,
  DreamInterpretationInput,
  DreamMetadata,
  DreamPatternData,
  FEELING_MAP,
  NervousSystemBranch,
  SelectedFeeling,
  ShadowTrigger,
} from './dreamTypes';
import { extractDreamTextSignals, DreamTextSignals } from './dreamTextExtractor';
import {
  selectThemesForDream,
  ThemeCard,
  TriggerScore,
  DominantProfiles,
} from './themeDefinitions';
import { inferDefaultsFromTriggers, getTriggerReflectionQuestion } from './triggerTaxonomy';
import { matchDreamKeywords, KeywordMatch } from './dreamKeywords';

// ─── Signal Weights ───────────────────────────────────────────────────────────

const W = {
  text: 0.55,
  feelings: 0.25,
  checkIns: 0.10,
  history: 0.07,
  personality: 0.03,
} as const;

// ─── Trigger Score Blending ───────────────────────────────────────────────────

/**
 * Merge feeling-based heatmap with text-extracted signals into unified trigger scores.
 * Uses the weighted blending formula: Wf * feeling + Wt * text.
 * Check-in, history, and personality signals are folded into aggregates upstream.
 */
function blendTriggerScores(
  aggregates: DreamAggregates,
  textSignals: DreamTextSignals,
): TriggerScore[] {
  const ALL_TRIGGERS: ShadowTrigger[] = [
    'abandonment', 'rejection', 'betrayal', 'shame', 'exposure', 'control',
    'power', 'helplessness', 'danger', 'intimacy', 'sexuality', 'consent_violation',
    'worthiness', 'responsibility', 'failure', 'grief', 'identity', 'belonging',
    'unpredictability', 'punishment', 'isolation', 'transformation',
  ];

  // Normalize heatmap weights to 0..1
  const heatmap = aggregates.shadowTriggerHeatmap;
  const maxHeatWeight = heatmap.length > 0 ? heatmap[0].weight : 1;
  const heatNorm: Partial<Record<ShadowTrigger, number>> = {};
  for (const h of heatmap) {
    heatNorm[h.trigger] = maxHeatWeight > 0 ? h.weight / maxHeatWeight : 0;
  }

  // Text coverage scales down text weight when there's minimal text
  const textReliability = textSignals.coverage;

  const scores: TriggerScore[] = [];
  for (const trigger of ALL_TRIGGERS) {
    const feelingScore = heatNorm[trigger] ?? 0;
    const textScore = (textSignals.triggers[trigger] ?? 0) * textReliability;

    // Weighted blend — text leads, feelings supplement
    const blended = (W.text * textScore) + (W.feelings * feelingScore);

    if (blended > 0.01) {
      scores.push({ trigger, score: Math.min(blended, 1) });
    }
  }

  return scores.sort((a, b) => b.score - a.score);
}

/**
 * Build DominantProfiles from aggregates, for themeDefinitions' selectThemesForDream.
 */
function buildDominantProfiles(aggregates: DreamAggregates): DominantProfiles {
  const activationMap = { low: 1, moderate: 2, high: 3 };
  return {
    valenceScore: aggregates.valenceScore,
    activationAvg: activationMap[aggregates.activationScore],
    attachmentProfile: { ...aggregates.attachmentProfile },
    nervousSystemProfile: { ...aggregates.nervousSystemProfile },
  };
}

// ─── Unified Paragraph Builder ────────────────────────────────────────────────

/** Human-readable nervous system branch phrase */
const BRANCH_LABELS: Record<NervousSystemBranch, string> = {
  ventral_safety: 'a sense of safety and connection',
  fight: 'activation around boundaries or anger',
  flight: 'anxiety or a pull toward escape',
  freeze: 'a sense of being stuck or overwhelmed',
  collapse: 'depletion or a heaviness that is hard to shake',
  mixed: 'an inner conflict between different emotional states',
};

/** Human-readable attachment label */
const ATTACH_LABELS: Record<AttachmentStyle, string> = {
  secure: 'a grounded relational tone',
  anxious: 'a pull toward closeness or reassurance',
  avoidant: 'a pull toward distance or self-reliance',
  disorganized: 'a push-pull tension in how connection felt',
};

/**
 * Build one cohesive paragraph.
 *
 * Priority order:
 *   1. Dream journal keywords  — what the user actually WROTE (symbols, imagery)
 *   2. How the dream felt       — selected feelings + emotional tone
 *   3. Dream details            — vividness, recurring, awaken state
 *   4. Other data               — patterns, natal chart, check-in trends
 */
function buildParagraph(
  dreamText: string,
  aggregates: DreamAggregates,
  metadata: DreamMetadata,
  feelings: SelectedFeeling[],
  patterns: DreamPatternData,
  triggerScores: TriggerScore[],
  rawThemeCards: ThemeCard[],
  textSignals: DreamTextSignals,
  keywordMatches: KeywordMatch[],
): string {
  const sentences: string[] = [];

  // ════ 1. DREAM JOURNAL KEYWORDS (what they wrote) — always first ═══════════

  if (keywordMatches.length > 0) {
    // Lead with the top matched symbols
    const topMatches = keywordMatches.slice(0, 4);
    const symbolLabels = topMatches.map(m => m.entry.keywords[0]);

    if (symbolLabels.length === 1) {
      sentences.push(
        `Your dream contained imagery of ${symbolLabels[0]}. ${topMatches[0].entry.meaning}`
      );
    } else {
      sentences.push(
        `Your dream contained imagery of ${symbolLabels.slice(0, -1).join(', ')} and ${symbolLabels[symbolLabels.length - 1]}.`
      );
      // Add the interpretation for each matched symbol (up to 3)
      for (const m of topMatches.slice(0, 3)) {
        sentences.push(m.entry.meaning);
      }
    }

    // If there were additional matches beyond the first 4, mention them briefly
    if (keywordMatches.length > 4) {
      const extras = keywordMatches.slice(4, 7).map(m => m.entry.keywords[0]);
      sentences.push(
        'The dream also touched on ' + extras.join(', ') + ' \u2014 each carrying its own emotional significance.'
      );
    }
  } else if (dreamText.length > 30) {
    // No keyword matches, but they did write something — acknowledge the text
    const snippet = dreamText.slice(0, 100).trim().replace(/\s+/g, ' ');
    const ellipsis = dreamText.length > 100 ? '\u2026' : '';
    sentences.push(
      'What you described \u2014 "' + snippet + ellipsis + '" \u2014 carries emotional weight. Even when specific symbols are not obvious, the act of writing about a dream brings its themes closer to the surface.'
    );
  } else if (dreamText.length > 0) {
    sentences.push(
      'You noted a brief dream impression. Even short fragments can point to something meaningful beneath the surface.'
    );
  }

  // Add trigger/text evidence that enriches the keyword story
  if (keywordMatches.length > 0 && triggerScores.length > 0) {
    const textEvidence: string[] = [];
    for (const ts of triggerScores.slice(0, 3)) {
      const ev = textSignals.evidence[ts.trigger];
      if (ev && ev.length > 0 && ev[0].snippet) {
        textEvidence.push(ev[0].snippet);
      }
    }
    if (textEvidence.length > 0) {
      sentences.push(
        'The specific language you used \u2014 "' + textEvidence[0] + '" \u2014 may be connected to a deeper emotional undercurrent.'
      );
    }
  }

  // Theme meanings from the trigger taxonomy (supplements keywords)
  if (rawThemeCards.length > 0) {
    // Only add theme meanings if they add new information
    const topCard = rawThemeCards[0];
    if (keywordMatches.length === 0) {
      sentences.push(topCard.meaning);
    }
    if (rawThemeCards.length >= 2 && rawThemeCards[1].score >= 0.32) {
      sentences.push(rawThemeCards[1].meaning);
    }
  }

  // ════ 2. HOW THE DREAM FELT (feelings + emotional tone) ═══════════════════

  const topFeelings = aggregates.dominantFeelings
    .slice(0, 3)
    .map(f => FEELING_MAP[f.id]?.label ?? f.id)
    .filter(Boolean);

  let toneWord: string;
  if (aggregates.valenceScore > 0.3) toneWord = 'positive';
  else if (aggregates.valenceScore > -0.3) toneWord = 'mixed';
  else toneWord = 'difficult';

  if (topFeelings.length > 0) {
    sentences.push(
      `Emotionally, the dream felt predominantly ${toneWord}, centered around feelings of ${topFeelings.join(', ')}.`
    );
  } else if (triggerScores.length > 0 && keywordMatches.length === 0) {
    // No feelings AND no keywords — infer from triggers
    const inferred = inferDefaultsFromTriggers(triggerScores.slice(0, 5));
    if (inferred.valence < -0.3) toneWord = 'difficult';
    else if (inferred.valence > 0.3) toneWord = 'positive';
    else toneWord = 'mixed';
    sentences.push(
      `The emotional quality of this dream appears ${toneWord}, based on the themes that came through.`
    );
  }

  // Ambivalence (opposing feelings)
  const activeFeelings = feelings.filter(f => f.intensity >= 2);
  const hasPositive = activeFeelings.some(f => FEELING_MAP[f.id]?.valence === 1);
  const hasNegative = activeFeelings.some(f => FEELING_MAP[f.id]?.valence === -1);
  if (hasPositive && hasNegative && Math.abs(aggregates.valenceScore) < 0.25) {
    sentences.push(
      'This dream held opposing emotions at once \u2014 that kind of ambivalence often signals a place where growth is happening, where what you want and what you fear are sitting close together.'
    );
  }

  // ════ 3. DREAM DETAILS (vividness, recurring, awaken state) ═══════════════

  if (metadata.vividness >= 4) {
    sentences.push('The dream was notably vivid, which often means the emotional content was pressing for attention.');
  } else if (metadata.vividness <= 2) {
    sentences.push('The dream was faint and hazy \u2014 sometimes a sign that the emotional content is distant or defended against.');
  }

  if (metadata.recurring) {
    sentences.push('This dream was marked as recurring \u2014 recurring dreams often carry themes your mind is working to integrate.');
  }

  const AWAKEN_PHRASES: Record<string, string> = {
    startled: 'Waking startled may point to unresolved tension the dream was holding.',
    unsettled: 'The unsettled feeling upon waking suggests the dream touched something still active.',
    confused: 'Waking confused can mean the dream was working through something your mind has not yet organized.',
    heavy: 'Waking with heaviness often means the dream carried something your body is still processing.',
    relieved: 'Waking with relief may indicate the dream worked through something difficult.',
  };
  const awakenPhrase = AWAKEN_PHRASES[metadata.awakenState];
  if (awakenPhrase) sentences.push(awakenPhrase);

  // ════ 4. OTHER DATA (natal chart, patterns, check-in trends) ══════════════

  // Nervous system / personality layer
  const branch = aggregates.dominantBranch;
  const branchPhrase = BRANCH_LABELS[branch];
  const attachPhrase = ATTACH_LABELS[aggregates.dominantAttachment];
  sentences.push(
    'Your nervous system signature suggests ' + branchPhrase + ', with ' + attachPhrase + ' showing up in the relational texture of the dream.'
  );

  // Pattern context: recurring feelings, trends
  if (patterns.comparisonCount >= 2) {
    if (patterns.recurringFeelings.length > 0) {
      const labels = patterns.recurringFeelings
        .slice(0, 2)
        .map(id => FEELING_MAP[id]?.label ?? id);
      const plural = labels.length > 1;
      sentences.push(
        'Notably, ' + labels.join(' and ') + ' ha' + (plural ? 've' : 's') + ' appeared across several of your recent dreams, suggesting something your mind is actively working through.'
      );
    }
    if (patterns.emotionalTrendDirection === 'increasing') {
      sentences.push('The emotional intensity of your dreams has been increasing recently, which may indicate something building that wants attention.');
    } else if (patterns.emotionalTrendDirection === 'decreasing') {
      sentences.push('The emotional intensity in your dreams has been settling lately \u2014 this can be a sign of processing or integration.');
    }
  }

  return sentences.join(' ');
}

// ─── Reflection Question ──────────────────────────────────────────────────────

/**
 * Select one reflection question from the top theme card or taxonomy.
 * Prefers the theme-level question; falls back to taxonomy when unavailable.
 */
function pickReflectionQuestion(
  rawThemeCards: ThemeCard[],
  triggerScores: TriggerScore[],
  seed: number,
): string {
  // Prefer the top theme card's reflection question
  if (rawThemeCards.length > 0 && rawThemeCards[0].reflectionQuestion) {
    return rawThemeCards[0].reflectionQuestion;
  }

  // Fallback: taxonomy question from top trigger
  if (triggerScores.length > 0) {
    return getTriggerReflectionQuestion(triggerScores[0].trigger, seed);
  }

  return 'What is this dream asking you to notice?';
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Simple numeric hash from a string seed */
function hashSeed(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return (h % 10000) / 10000;
}

// ─── Main Export ──────────────────────────────────────────────────────────────

/**
 * Generate a psychologically-grounded dream interpretation from all available data.
 *
 * Incorporates:
 *   - Dream text (what the user wrote)
 *   - Selected feelings + intensity
 *   - Dream metadata (vividness, recurring, awaken state)
 *   - Natal chart personality layer (nervous system + attachment baselines)
 *   - Recent check-in / mood / pattern context
 *   - Trigger taxonomy (psychological definitions, interpretation frames)
 *
 * Returns one paragraph + one reflection question.
 * Output is deterministic per entry. No network calls, no AI.
 */
export function generateDreamInterpretation(
  input: DreamInterpretationInput,
): DreamInterpretation {
  const { entry, dreamText, feelings, metadata, aggregates, patterns } = input;

  // Stable seed for deterministic variant selection
  const seed = entry.id + (dreamText.slice(0, 20));

  // ── Extract text signals (Wt = 0.55) ────────────────────────────────
  const textSignals = extractDreamTextSignals(dreamText);

  // ── Match dream journal keywords (symbols, imagery, motifs) ──────────
  const keywordMatches = matchDreamKeywords(dreamText);

  // ── Blend trigger scores from feelings + text ─────────────────────────────
  const triggerScores = blendTriggerScores(aggregates, textSignals);

  // ── Build profiles for theme selection ────────────────────────────────────
  const dominantProfiles = buildDominantProfiles(aggregates);

  // ── Select themes (for trigger context + question) ────────────────────────
  const numericSeed = hashSeed(seed);

  const rawThemeCards = selectThemesForDream({
    topThemes: triggerScores,
    dominant: dominantProfiles,
    maxCards: 3,
    seed: numericSeed,
  });

  // ── Build single paragraph ────────────────────────────────────────────────
  const paragraph = buildParagraph(
    dreamText,
    aggregates,
    metadata,
    feelings,
    patterns,
    triggerScores,
    rawThemeCards,
    textSignals,
    keywordMatches,
  );

  // ── Pick one reflection question ──────────────────────────────────────────
  const question = pickReflectionQuestion(rawThemeCards, triggerScores, numericSeed);

  return {
    paragraph,
    question,
    generatedAt: new Date().toISOString(),
  };
}

