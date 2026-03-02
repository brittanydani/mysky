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

  return scores.sort((a, b) => b.score - a.score || a.trigger.localeCompare(b.trigger));
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

// ─── Grounding Lines (high-distress close) ────────────────────────────────────
// Somatic, regulating, non-clinical. One is selected deterministically per dream.
// Voice: co-reflective, parts-aware, trauma-informed. Never instructional.

const GROUNDING_LINES: readonly string[] = [
  // ── Breath-anchored ──
  'If this dream left you feeling unsettled, it may help to take a slow breath and remind yourself: you are here, and you are safe.',
  'A few slow breaths can help your body remember that the dream is over and you are okay.',
  'If there\u2019s still tension in your chest or belly, try breathing into that spot slowly. Let it know you\u2019re listening.',
  'Sometimes a single deep breath is enough to let your body know: that was then, this is now.',
  'Try one long exhale \u2014 longer than your inhale. Your nervous system may soften just a little.',
  'If your breathing feels shallow right now, that\u2019s your body still holding the dream. A few slow, intentional breaths can help it let go.',

  // ── Touch / somatic ──
  'If your body is still holding something from this dream, a hand on your chest and a few slow breaths can help it land.',
  'Placing a hand somewhere warm on your body \u2014 your chest, your belly \u2014 can remind you that you\u2019re here.',
  'If you notice tension anywhere, try pressing your feet gently into the floor. Let your body feel the ground.',
  'You might try holding your own hand for a moment. It sounds simple, but it tells your nervous system: I\u2019m here with you.',
  'Resting both hands on your lap, palms up, can signal to your body that nothing needs to be held right now.',
  'Try gently rubbing your palms together for a few seconds, then placing them over your eyes. Let the warmth settle in.',

  // ── Grounding / orientation ──
  'Notice what shifts in your body as you sit with this \u2014 sometimes that\u2019s all the processing you need.',
  'Look around the room for a moment. Name three things you can see. This small act brings your body back to the present.',
  'Feel your feet on the floor. Feel the surface beneath you. These small anchors remind your body where it actually is.',
  'If this dream pulled you somewhere far, try pressing your fingertips together gently. It brings you back.',
  'Notice the temperature of the air on your skin right now. That\u2019s the present moment touching you.',
  'Wiggle your toes. It\u2019s a small thing, but it reconnects you to your body and to right now.',

  // ── Permission / release ──
  'You don\u2019t have to solve anything this dream brought up. Just notice what\u2019s here.',
  'Nothing about this dream requires an answer right now. You\u2019re allowed to just let it be.',
  'You don\u2019t have to understand it all at once. Sometimes a dream just needs to be witnessed.',
  'Whatever this dream stirred up, it\u2019s okay to set it down for now. You can come back to it when you\u2019re ready.',
  'There\u2019s no rush to figure this out. Your understanding will come in its own time.',
  'You\u2019re allowed to close this and go about your day. The insight will be here when you come back.',
  'This dream doesn\u2019t need to be solved. Sometimes just acknowledging what you felt is enough.',

  // ── Parts-aware ──
  'If a part of you is still unsettled, try speaking to it gently: I see you. I\u2019m here.',
  'Whatever part of you carried this dream \u2014 it\u2019s safe now. You can remind it of that.',
  'There may be a part of you that\u2019s still bracing. You can let it know: the dream ended. You\u2019re awake.',
  'If something in you is still activated, try meeting it with curiosity instead of urgency. It often helps.',
  'The part of you that felt this so strongly \u2014 it was doing its job. You can thank it and let it rest.',
  'Sometimes a dream like this is a part of you asking to be seen. You just did that by writing it down.',

  // ── Somatic awareness ──
  'Check in with your shoulders. If they\u2019ve crept up toward your ears, let them drop. Your body has permission to soften.',
  'Notice your jaw right now. If it\u2019s clenched, try letting your lips part slightly. Small releases matter.',
  'Pay attention to your hands. If they\u2019re tight, open them slowly. Let that be a signal to the rest of your body.',
  'Scan from your head downward. Where is the dream still living in your body? Just notice it \u2014 no need to fix.',
  'If your stomach is tight, try placing a hand there and breathing gently. Your body is still processing.',
  'Your body was alongside you in that dream. Give it a moment to arrive back here.',

  // ── Temporal anchoring ──
  'This dream happened while you were asleep. You are awake now, and you are safe.',
  'Whatever you felt in the dream is not happening now. Your body may need a moment to catch up to that truth.',
  'Dreams can feel urgent, but morning is patient. There\u2019s no emergency here.',
  'The dream is behind you. This moment \u2014 right here, reading this \u2014 is your present.',
  'Your waking life is yours. Whatever the dream showed you, it\u2019s not a prediction \u2014 it\u2019s a reflection.',

  // ── Compassion / warmth ──
  'Be gentle with yourself after a dream like this. It\u2019s not always easy to carry what sleep brings up.',
  'A dream this intense deserves gentleness. Whatever you need right now \u2014 give yourself permission to have it.',
  'If you feel a little raw after that, it makes sense. Dreams that matter tend to leave a mark.',
  'You showed up and wrote this down. That takes a kind of courage, even when it doesn\u2019t feel like it.',
  'However this dream made you feel \u2014 that feeling is valid. You don\u2019t need to justify it.',

  // ── Movement / action ──
  'If this dream left energy in your body, moving gently \u2014 stretching, shaking your hands, walking \u2014 can help it discharge.',
  'Sometimes the best thing after an intense dream is something simple: a glass of water, a few stretches, a moment outside.',
  'If you can, try stepping outside for a moment. Fresh air and natural light can help your nervous system recalibrate.',
  'A short walk, even just around your room, can help your body release what the dream left behind.',
];

/**
 * Build a structured dream reflection with distinct sections.
 *
 * Output format: sections separated by \n\n, each 2–3 sentences max.
 * Designed for mobile readability — no dense academic blocks.
 *
 * Sections (when applicable):
 *   Symbol   — what imagery appeared (Phase A: explicit only)
 *   Meaning  — what it may reflect (Phase B: interpretive)
 *   Emotion  — how the dream felt
 *   Body     — nervous system / somatic signals
 *   Pattern  — recurring themes across dreams
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
  // Each section is a short block (2–3 sentences). Sections join with \n\n.
  const sections: string[] = [];

  // ════ PHASE A: EXPLICIT IMAGERY EXTRACTION ═════════════════════════════════
  // This section ONLY lists concrete, explicitly mentioned nouns/scenes.
  // It never includes inferred symbolic expansions.
  // Rule: if the word does not literally appear in the dream text, it cannot
  // be listed as imagery. "Fear of dying" ≠ "funeral imagery".

  if (keywordMatches.length > 0) {
    const symbolBlock: string[] = [];
    const topMatches = keywordMatches.slice(0, 4);
    const symbolLabels = topMatches.map(m => m.entry.keywords[0]);

    if (symbolLabels.length === 1) {
      symbolBlock.push(
        `Your dream wove together themes of ${symbolLabels[0]}.`
      );
    } else {
      symbolBlock.push(
        `Your dream wove together themes of ${symbolLabels.slice(0, -1).join(', ')} and ${symbolLabels[symbolLabels.length - 1]}.`
      );
    }

    if (keywordMatches.length > 4) {
      const extras = keywordMatches.slice(4, 7).map(m => m.entry.keywords[0]);
      symbolBlock.push(
        'The dream also touched on ' + extras.join(', ') + '.'
      );
    }
    sections.push(symbolBlock.join(' '));
  } else if (dreamText.length > 30) {
    sections.push(
      'What you described carries emotional weight. Even when specific symbols aren\u2019t obvious, something in you chose to write this down \u2014 and that matters.'
    );
  } else if (dreamText.length > 0) {
    sections.push(
      'You noted a brief dream impression. Even short fragments can carry something worth noticing.'
    );
  }

  // ════ PHASE B: INTERPRETIVE SYMBOLIC LAYER ════════════════════════════════
  // Clearly separated from factual imagery above.
  // May reference broader themes as INTERPRETATION, not literal imagery.

  if (keywordMatches.length > 0) {
    const meaningBlock: string[] = [];
    // Add interpretive meanings for matched symbols (up to 2 per block)
    for (const m of keywordMatches.slice(0, 2)) {
      meaningBlock.push(m.entry.meaning);
    }
    if (meaningBlock.length > 0) {
      sections.push(meaningBlock.join(' '));
    }

    // If there's a third symbol, give it its own short block
    if (keywordMatches.length >= 3) {
      sections.push(keywordMatches[2].entry.meaning);
    }
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
      sections.push(
        'Something in the way you described it \u2014 "' + textEvidence[0] + '" \u2014 may point to a deeper emotional thread.'
      );
    }
  }

  // Theme meanings from the trigger taxonomy (supplements keywords)
  if (rawThemeCards.length > 0) {
    const topCard = rawThemeCards[0];
    if (keywordMatches.length === 0) {
      sections.push(topCard.meaning);
    }
    if (rawThemeCards.length >= 2 && rawThemeCards[1].score >= 0.32) {
      sections.push(rawThemeCards[1].meaning);
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

  {
    const emotionBlock: string[] = [];
    if (topFeelings.length > 0) {
      emotionBlock.push(
        `Emotionally, this dream carried something ${toneWord} \u2014 centered around ${topFeelings.join(', ')}.`
      );
    } else if (triggerScores.length > 0 && keywordMatches.length === 0) {
      const inferred = inferDefaultsFromTriggers(triggerScores.slice(0, 5));
      if (inferred.valence < -0.3) toneWord = 'difficult';
      else if (inferred.valence > 0.3) toneWord = 'positive';
      else toneWord = 'mixed';
      emotionBlock.push(
        `The emotional quality of this dream appears ${toneWord}, based on the themes that came through.`
      );
    }

    // Ambivalence (opposing feelings)
    const activeFeelings = feelings.filter(f => f.intensity >= 2);
    const hasPositive = activeFeelings.some(f => FEELING_MAP[f.id]?.valence === 1);
    const hasNegative = activeFeelings.some(f => FEELING_MAP[f.id]?.valence === -1);
    if (hasPositive && hasNegative && Math.abs(aggregates.valenceScore) < 0.25) {
      emotionBlock.push(
        'There may be a part of you holding two things at once here \u2014 that kind of tension often shows up where something is shifting.'
      );
    }

    if (emotionBlock.length > 0) sections.push(emotionBlock.join(' '));
  }

  // ════ DREAM DETAILS (vividness, recurring, awaken state) ═══════════════════

  {
    const detailBlock: string[] = [];

    if (metadata.vividness >= 4) {
      detailBlock.push('The dream was notably vivid \u2014 as if something emotional was pressing for your attention.');
    } else if (metadata.vividness <= 2) {
      detailBlock.push('The dream was faint and hazy \u2014 sometimes a sign that a part of you is keeping the emotional content at a distance.');
    }

    if (metadata.recurring) {
      detailBlock.push('This is a recurring dream \u2014 something in you keeps returning to this material.');
    }

    if (metadata.controlLevel != null) {
      if (metadata.controlLevel >= 4) {
        detailBlock.push('You felt a sense of control in this dream \u2014 a part of you may be finding its footing in what was being explored.');
      } else if (metadata.controlLevel <= 2) {
        detailBlock.push('There was a sense of powerlessness here \u2014 a part of you may feel at the mercy of something you can\u2019t quite steer.');
      }
    }

    if (detailBlock.length > 0) sections.push(detailBlock.join(' '));
  }

  // Overall theme + awaken state
  {
    const contextBlock: string[] = [];

    const THEME_PHRASES: Record<string, string> = {
      adventure: 'A part of you may be reaching toward something new \u2014 expansion, possibility, or a life not yet lived.',
      conflict: 'There may be a part of you holding tension \u2014 something unresolved that\u2019s still looking for a way through.',
      connection: 'Something in you may be working through themes of belonging, closeness, or what it means to be met by another person.',
      transformation: 'Something in your inner world may be shifting \u2014 a version of you that\u2019s ready to change.',
      mystery: 'There\u2019s something here your deeper awareness senses but hasn\u2019t fully named yet.',
    };
    if (metadata.overallTheme) {
      const themePhrase = THEME_PHRASES[metadata.overallTheme];
      if (themePhrase) contextBlock.push(themePhrase);
    }

    const AWAKEN_PHRASES: Record<string, string> = {
      startled: 'Waking startled often means a part of you was holding tension that hasn\u2019t fully resolved.',
      unsettled: 'That unsettled feeling upon waking suggests something in the dream is still alive in you.',
      confused: 'Confusion upon waking often means something emotionally complex is still being organized.',
      heavy: 'Waking heavy often means your body is still holding something the dream carried.',
      relieved: 'Waking with relief may mean a part of you found its way through something difficult.',
      drained: 'Waking drained suggests a part of you did significant processing overnight.',
      neutral: 'Waking neutral may mean the emotional content didn\u2019t fully reach the surface \u2014 or that something metabolized quietly.',
      thoughtful: 'Waking thoughtful often means the dream left something worth sitting with.',
    };
    const awakenPhrase = AWAKEN_PHRASES[metadata.awakenState];
    if (awakenPhrase) contextBlock.push(awakenPhrase);

    if (contextBlock.length > 0) sections.push(contextBlock.join(' '));
  }

  // ════ BODY / NERVOUS SYSTEM ════════════════════════════════════════════════

  {
    const branch = aggregates.dominantBranch;
    const branchPhrase = BRANCH_LABELS[branch];
    const attachPhrase = ATTACH_LABELS[aggregates.dominantAttachment];
    sections.push(
      'Your body may have been holding ' + branchPhrase + ' during this dream, with ' + attachPhrase + ' woven into its relational texture.'
    );
  }

  // ════ PATTERNS ═════════════════════════════════════════════════════════════

  if (patterns.comparisonCount >= 2) {
    const patternBlock: string[] = [];
    if (patterns.recurringFeelings.length > 0) {
      const labels = patterns.recurringFeelings
        .slice(0, 2)
        .map(id => FEELING_MAP[id]?.label ?? id);
      const plural = labels.length > 1;
      patternBlock.push(
        labels.join(' and ') + ' ha' + (plural ? 've' : 's') + ' appeared across several recent dreams \u2014 a thread something in you keeps returning to.'
      );
    }
    if (patterns.emotionalTrendDirection === 'increasing') {
      patternBlock.push('Emotional intensity has been building recently \u2014 a part of you may be asking for more attention than it\u2019s getting.');
    } else if (patterns.emotionalTrendDirection === 'decreasing') {
      patternBlock.push('Emotional intensity has been settling \u2014 something may be integrating quietly.');
    }
    if (patternBlock.length > 0) sections.push(patternBlock.join(' '));
  }

  // ════ GROUNDING CLOSE (high-distress gate) ═════════════════════════════════
  // When the dream carried high activation + negative valence, close with a
  // single regulating sentence — somatic, not instructional.
  if (aggregates.activationScore === 'high' && aggregates.valenceScore <= -0.3) {
    // Deterministic pick based on dream text length so it's stable per-dream
    const groundIdx = dreamText.length % GROUNDING_LINES.length;
    sections.push(GROUNDING_LINES[groundIdx]);
  }

  return sections.join('\n\n');
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

  // ── Phase A: Explicit imagery (literal keyword matches only) ──────────────
  const explicitImagery = keywordMatches
    .slice(0, 4)
    .map(m => m.entry.keywords[0]);

  // ── Phase B: Interpretive themes (trigger-based symbolic analysis) ────────
  const interpretiveThemes = rawThemeCards
    .slice(0, 3)
    .map(card => card.title);

  return {
    paragraph,
    question,
    generatedAt: new Date().toISOString(),
    explicitImagery,
    interpretiveThemes,
  };
}

// ─── Test-only Exports ────────────────────────────────────────────────────────
export const __test = { GROUNDING_LINES } as const;