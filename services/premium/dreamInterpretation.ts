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
import { parseDreamSymbols } from './dreamSymbolParser';

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

// ─── Variant Selection ────────────────────────────────────────────────────────
// Picks one variant deterministically per-dream using the seed + a positional
// offset. Different offsets ensure each section picks independently.

/** Pick a variant deterministically using a seed + positional offset for diversity */
function pickVariant<T>(variants: readonly T[], seed: number, offset: number): T {
  const idx = Math.abs(Math.floor(seed * 997 + offset * 131)) % variants.length;
  return variants[idx];
}

// ─── Context-Linking Table ────────────────────────────────────────────────────
// When multiple symbol categories co-occur, interpret the *combination*
// rather than listing each symbol's dictionary meaning individually.
// This makes the interpretation feel situationally aware.
//
// Keys are sorted category pairs (e.g. "people+places"). Values are
// interpretation generators that receive the matched entries and dream text
// to produce a single contextual sentence.

/**
 * Context-linked interpretation: interpret symbol combinations, not individuals.
 *
 * Returns a contextual meaning sentence when a known category pair is present,
 * or null when no context link applies (caller falls back to individual meanings).
 */
function buildContextLinkedMeaning(
  matches: KeywordMatch[],
  hasPlaces: boolean,
  hasPeople: boolean,
  hasRelationships: boolean,
  hasEmotionsExpressed: boolean,
  dreamText: string,
): string | null {
  // Identify which entries fall into each category
  const placeEntry = matches.find(m => m.entry.category === 'places');
  const personEntry = matches.find(m => m.entry.category === 'people');
  const relEntry = matches.find(m => m.entry.category === 'relationships');
  const emotEntry = matches.find(m => m.entry.category === 'emotions_expressed');

  const lower = dreamText.toLowerCase();

  // Detect privacy/public modifiers in the dream text
  const isPublicContext = /\bpublic\b|\bcrowded\b|\bpeople around\b|\bsomeone (was |could )?(watching|there|saw)\b|\bweren't alone\b/i.test(lower);
  const isPrivateContext = /\balone\b|\bby myself\b|\bprivate\b|\bhidden\b|\blocked\b|\bsecret\b/i.test(lower);

  // ── People + Places: relational dynamics in a setting ──
  if (hasPeople && hasPlaces && personEntry && placeEntry) {
    const personLabel = personEntry.entry.keywords[0];
    const placeLabel = placeEntry.entry.keywords[0];

    if (isPublicContext) {
      return `Because the ${placeLabel} was public rather than private, the dream may be exploring what it feels like when something deeply personal happens in a space that doesn\u2019t feel protected \u2014 especially with ${personLabel === 'stranger' ? 'an unfamiliar presence' : personLabel} present. This combination often points to boundary confusion, emotional exposure around ${personLabel === 'father' || personLabel === 'mother' || personLabel === 'boss' || personLabel === 'teacher' ? 'an authority figure' : 'someone significant'}, or discomfort with closeness under observation.`;
    }

    if (isPrivateContext) {
      return `The ${placeLabel} setting, combined with ${personLabel}'s presence, may reflect something intimate or hidden being processed \u2014 perhaps a dynamic that only exists behind closed doors, or feelings that haven\u2019t been expressed openly.`;
    }

    // Default people+places without public/private modifier
    return `The presence of ${personLabel} in a ${placeLabel} setting may point to relational dynamics tied to that kind of space \u2014 what it means to share, navigate, or feel exposed in environments that carry their own emotional weight.`;
  }

  // ── People + Relationships: relational action with a specific person ──
  if (hasPeople && hasRelationships && personEntry && relEntry) {
    const personLabel = personEntry.entry.keywords[0];
    const relLabel = relEntry.entry.keywords[0];
    return `The ${relLabel} dynamic with ${personLabel} in this dream may reflect something unresolved between you and what they represent \u2014 not necessarily the person themselves, but the relational pattern or emotional charge they carry.`;
  }

  // ── People + Emotions Expressed: person triggers emotional display ──
  if (hasPeople && hasEmotionsExpressed && personEntry && emotEntry) {
    const personLabel = personEntry.entry.keywords[0];
    const emotLabel = emotEntry.entry.keywords[0];
    return `Experiencing ${emotLabel} in the presence of ${personLabel} may reflect how that relationship \u2014 or what they represent \u2014 connects to this emotional thread in your inner world.`;
  }

  // ── Places + Emotions Expressed: setting amplifies emotional tone ──
  if (hasPlaces && hasEmotionsExpressed && placeEntry && emotEntry) {
    const placeLabel = placeEntry.entry.keywords[0];
    const emotLabel = emotEntry.entry.keywords[0];
    return `Feeling ${emotLabel} in a ${placeLabel} setting may highlight how that kind of environment connects to this emotional experience \u2014 the space itself may carry its own meaning.`;
  }

  // ── Places + Relationships: setting shapes relational meaning ──
  if (hasPlaces && hasRelationships && placeEntry && relEntry) {
    const placeLabel = placeEntry.entry.keywords[0];
    const relLabel = relEntry.entry.keywords[0];
    return `The ${relLabel} unfolding in a ${placeLabel} may point to how environment and relational dynamics interact \u2014 the setting may be shaping what feels possible or safe in that connection.`;
  }

  return null;
}

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
  seed: number,
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

    // Use varied, natural-sounding openers instead of a single template
    const openerVariants: readonly ((labels: string[]) => string)[] = [
      (labels) => labels.length === 1
        ? `This dream centered around a ${labels[0]} setting.`
        : `This dream unfolded across themes of ${labels.slice(0, -1).join(', ')} and ${labels[labels.length - 1]}.`,
      (labels) => labels.length === 1
        ? `Your dream took place in a ${labels[0]} space.`
        : `Your dream wove together the ${labels.slice(0, -1).join(', ')} and the ${labels[labels.length - 1]}.`,
      (labels) => labels.length === 1
        ? `The imagery in your dream revolved around the ${labels[0]}.`
        : `The imagery in your dream moved through the ${labels.slice(0, -1).join(', ')} and the ${labels[labels.length - 1]}.`,
      (labels) => labels.length === 1
        ? `A ${labels[0]} appeared at the center of this dream.`
        : `Several threads came through in this dream \u2014 ${labels.slice(0, -1).join(', ')} and ${labels[labels.length - 1]}.`,
      (labels) => labels.length === 1
        ? `Your dream kept returning to the ${labels[0]}.`
        : `The dream carried imagery of ${labels.slice(0, -1).join(', ')} and ${labels[labels.length - 1]}.`,
      (labels) => labels.length === 1
        ? `Something about the ${labels[0]} stood out in this dream.`
        : `This dream touched on ${labels.slice(0, -1).join(', ')} and ${labels[labels.length - 1]} \u2014 a layered inner landscape.`,
    ];
    symbolBlock.push(pickVariant(openerVariants, seed, 1)(symbolLabels));

    if (keywordMatches.length > 4) {
      const extras = keywordMatches.slice(4, 7).map(m => m.entry.keywords[0]);
      const extrasVariants = [
        'The dream also touched on ' + extras.join(', ') + '.',
        'There were also traces of ' + extras.join(', ') + ' in the dream.',
        extras.join(', ') + ' appeared in the background, adding texture to what came through.',
      ] as const;
      symbolBlock.push(pickVariant(extrasVariants, seed, 18));
    }
    sections.push(symbolBlock.join(' '));
  } else if (dreamText.length > 30) {
    const noSymbolVariants = [
      'What you described carries emotional weight. Even when specific symbols aren\u2019t obvious, something in you chose to write this down \u2014 and that matters.',
      'Even without clear symbols, the emotional texture of what you described is worth paying attention to.',
      'Sometimes the most meaningful dreams don\u2019t come with clear imagery. What matters is the feeling you carried out of it.',
    ] as const;
    sections.push(pickVariant(noSymbolVariants, seed, 2));
  } else if (dreamText.length > 0) {
    const briefVariants = [
      'You noted a brief dream impression. Even short fragments can carry something worth noticing.',
      'Even a brief glimpse can hold meaning. Your mind chose to remember this particular fragment.',
      'Short dream fragments sometimes carry the most concentrated emotional weight.',
    ] as const;
    sections.push(pickVariant(briefVariants, seed, 3));
  }

  // ════ PHASE B: INTERPRETIVE SYMBOLIC LAYER ════════════════════════════════
  // Clearly separated from factual imagery above.
  // May reference broader themes as INTERPRETATION, not literal imagery.
  //
  // CONTEXT LINKING: When multiple symbols co-occur, interpret the
  // combination — not each symbol in isolation. This produces interpretations
  // that feel situationally aware rather than dictionary-like.

  if (keywordMatches.length > 0) {
    const categories = keywordMatches.map(m => m.entry.category);
    const hasPlaces = categories.includes('places');
    const hasPeople = categories.includes('people');
    const hasRelationships = categories.includes('relationships');
    const hasEmotionsExpressed = categories.includes('emotions_expressed');

    // Try context-linked interpretation first (symbol combination)
    const contextLinked = buildContextLinkedMeaning(
      keywordMatches.slice(0, 4),
      hasPlaces,
      hasPeople,
      hasRelationships,
      hasEmotionsExpressed,
      dreamText,
    );

    if (contextLinked) {
      sections.push(contextLinked);
    } else {
      // Fallback: individual symbol meanings (up to 2 per block)
      const meaningBlock: string[] = [];
      for (const m of keywordMatches.slice(0, 2)) {
        meaningBlock.push(m.entry.meaning);
      }
      if (meaningBlock.length > 0) {
        sections.push(meaningBlock.join(' '));
      }
    }

    // If there's a third+ symbol not covered by context linking, give it a short block
    if (keywordMatches.length >= 3 && !contextLinked) {
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
      const snippet = textEvidence[0];
      const evidenceVariants = [
        'Something in the way you described it \u2014 "' + snippet + '" \u2014 may point to a deeper emotional thread.',
        'The phrase "' + snippet + '" stands out \u2014 it may carry more weight than it seems on the surface.',
        'Your choice of words \u2014 "' + snippet + '" \u2014 hints at something your deeper awareness is tracking.',
        'There\u2019s something telling in the phrase "' + snippet + '" \u2014 language often reveals what the conscious mind hasn\u2019t fully named.',
      ] as const;
      sections.push(pickVariant(evidenceVariants, seed, 4));
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
      // Use softer phrasing that weaves feelings into prose rather than listing tags
      if (topFeelings.length === 1) {
        const singleEmotionVariants = [
          `The emotional tone of this dream seems to carry ${topFeelings[0].toLowerCase()}, with moments that may have felt ${toneWord} to sit with.`,
          `There\u2019s a thread of ${topFeelings[0].toLowerCase()} running through this dream \u2014 the overall quality felt ${toneWord}.`,
          `${topFeelings[0]} seems to be what your inner world was working with here, leaving an emotional residue that felt ${toneWord}.`,
        ] as const;
        emotionBlock.push(pickVariant(singleEmotionVariants, seed, 5));
      } else {
        const multiEmotionVariants = [
          `The emotional tone seems to include ${topFeelings.slice(0, -1).join(', ').toLowerCase()} and ${topFeelings[topFeelings.length - 1].toLowerCase()}, with an overall quality that felt ${toneWord}.`,
          `This dream seems to have carried ${topFeelings.slice(0, -1).join(', ').toLowerCase()} and ${topFeelings[topFeelings.length - 1].toLowerCase()} \u2014 a ${toneWord} blend of emotional currents.`,
          `Your inner world was working through several feelings at once \u2014 ${topFeelings.join(', ').toLowerCase()} \u2014 creating something that felt ${toneWord} overall.`,
        ] as const;
        emotionBlock.push(pickVariant(multiEmotionVariants, seed, 6));
      }
    } else if (triggerScores.length > 0 && keywordMatches.length === 0) {
      const inferred = inferDefaultsFromTriggers(triggerScores.slice(0, 5));
      if (inferred.valence < -0.3) toneWord = 'difficult';
      else if (inferred.valence > 0.3) toneWord = 'positive';
      else toneWord = 'mixed';
      const inferredVariants = [
        `The emotional quality of this dream appears ${toneWord}, based on the themes that came through.`,
        `Based on the themes present, this dream seems to carry a ${toneWord} emotional quality.`,
        `The themes in this dream suggest an emotional undercurrent that felt ${toneWord}.`,
      ] as const;
      emotionBlock.push(pickVariant(inferredVariants, seed, 7));
    }

    // Ambivalence (opposing feelings)
    const activeFeelings = feelings.filter(f => f.intensity >= 2);
    const hasPositive = activeFeelings.some(f => FEELING_MAP[f.id]?.valence === 1);
    const hasNegative = activeFeelings.some(f => FEELING_MAP[f.id]?.valence === -1);
    if (hasPositive && hasNegative && Math.abs(aggregates.valenceScore) < 0.25) {
      const ambivalenceVariants = [
        'There may be a part of you holding two things at once here \u2014 that kind of tension often shows up where something is shifting.',
        'The push and pull between these feelings may reflect something in transition \u2014 your inner world holding space for contradiction.',
        'Conflicting emotions in a dream often signal that something is ready to be examined from more than one angle.',
      ] as const;
      emotionBlock.push(pickVariant(ambivalenceVariants, seed, 8));
    }

    if (emotionBlock.length > 0) sections.push(emotionBlock.join(' '));
  }

  // ════ DREAM DETAILS (vividness, recurring, awaken state) ═══════════════════

  {
    const detailBlock: string[] = [];

    if (metadata.vividness >= 4) {
      const vividHighVariants = [
        'The dream was notably vivid \u2014 as if something emotional was pressing for your attention.',
        'The vividness of this dream suggests something in your inner world wanted to be seen clearly.',
        'Dreams this vivid often carry emotional material that\u2019s ready to surface.',
      ] as const;
      detailBlock.push(pickVariant(vividHighVariants, seed, 9));
    } else if (metadata.vividness <= 2) {
      const vividLowVariants = [
        'The dream was faint and hazy \u2014 sometimes a sign that a part of you is keeping the emotional content at a distance.',
        'The haziness of this dream may suggest that something is being processed just below the surface, not quite ready to be fully seen.',
        'A faint dream can mean the emotional content is still emerging \u2014 your deeper awareness may be approaching it carefully.',
      ] as const;
      detailBlock.push(pickVariant(vividLowVariants, seed, 10));
    }

    if (metadata.recurring) {
      const recurringVariants = [
        'This is a recurring dream \u2014 something in you keeps returning to this material.',
        'The fact that this dream recurs suggests unfinished emotional business \u2014 your inner world keeps circling back.',
        'Recurring dreams often point to a theme your psyche hasn\u2019t finished working through yet.',
      ] as const;
      detailBlock.push(pickVariant(recurringVariants, seed, 11));
    }

    if (metadata.controlLevel != null) {
      if (metadata.controlLevel >= 4) {
        const controlHighVariants = [
          'You felt a sense of control in this dream \u2014 a part of you may be finding its footing in what was being explored.',
          'The sense of agency you had in this dream may reflect growing confidence in navigating something that used to feel overwhelming.',
          'Having control in a dream can signal that your inner world is integrating something \u2014 finding its way through rather than being swept up.',
        ] as const;
        detailBlock.push(pickVariant(controlHighVariants, seed, 12));
      } else if (metadata.controlLevel <= 2) {
        const controlLowVariants = [
          'The dream may be exploring a situation where emotional boundaries felt unclear or difficult to navigate.',
          'The lack of control in this dream could reflect something in your waking life where you feel at the mercy of forces outside yourself.',
          'When dreams feel uncontrollable, it often mirrors a place in your life where agency feels limited or uncertain.',
        ] as const;
        detailBlock.push(pickVariant(controlLowVariants, seed, 13));
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
      survival: 'You may be feeling pressed to protect yourself or outrun something overwhelming in your waking life.',
      loss: 'A part of you might be metabolizing an ending or holding space for grief.',
      discovery: 'Something in you is uncovering new truths, bringing previously hidden layers to the surface.',
      mundane: 'Your inner world seems to be processing everyday logistics and waking details rather than deep symbolism.',
      surreal: 'Things may feel distorted or harder to ground right now, bypassing strict logical understanding.',
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
    // Connect somatic observation to the dream content before stating the body signal
    const nsAttachVariants = [
      'Dreams that carry this kind of emotional texture can sometimes leave the body holding ' + branchPhrase + '. Relationally, there may be ' + attachPhrase + ' woven into the experience.',
      'Your body may be carrying ' + branchPhrase + ' from this dream. On a relational level, ' + attachPhrase + ' seems to run through the experience.',
      'This dream touches on ' + branchPhrase + ' \u2014 something that may still be sitting in your body. There\u2019s also ' + attachPhrase + ' present in how the dream felt.',
      'The nervous system signature here points to ' + branchPhrase + '. Beneath the surface, ' + attachPhrase + ' may be shaping how this dream landed.',
    ] as const;
    sections.push(pickVariant(nsAttachVariants, seed, 14));
  }

  // ════ PATTERNS ═════════════════════════════════════════════════════════════

  if (patterns.comparisonCount >= 2) {
    const patternBlock: string[] = [];
    if (patterns.recurringFeelings.length > 0) {
      const labels = patterns.recurringFeelings
        .slice(0, 2)
        .map(id => FEELING_MAP[id]?.label ?? id);
      const plural = labels.length > 1;
      const patternRecurringVariants = [
        labels.join(' and ') + ' ha' + (plural ? 've' : 's') + ' appeared across several recent dreams \u2014 a thread something in you keeps returning to.',
        labels.join(' and ') + ' keep' + (plural ? '' : 's') + ' showing up in your dreams lately \u2014 your inner world seems to be working through something persistent.',
        'There\u2019s a recurring emotional pattern here: ' + labels.join(' and ') + '. Something in you is circling around this material.',
      ] as const;
      patternBlock.push(pickVariant(patternRecurringVariants, seed, 15));
    }
    if (patterns.emotionalTrendDirection === 'increasing') {
      const intensityUpVariants = [
        'Emotional intensity has been building recently \u2014 a part of you may be asking for more attention than it\u2019s getting.',
        'Your recent dreams have been gaining emotional momentum \u2014 something may be approaching a threshold.',
        'The rising intensity across your recent dreams suggests that something in your inner world is pressing to be acknowledged.',
      ] as const;
      patternBlock.push(pickVariant(intensityUpVariants, seed, 16));
    } else if (patterns.emotionalTrendDirection === 'decreasing') {
      const intensityDownVariants = [
        'Emotional intensity has been settling \u2014 something may be integrating quietly.',
        'Your dreams have been calming in tone recently \u2014 a sign that something may have found some resolution.',
        'The emotional temperature of your recent dreams has been cooling \u2014 your inner world may be settling into something more stable.',
      ] as const;
      patternBlock.push(pickVariant(intensityDownVariants, seed, 17));
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

  // ── Match single word symbols (Hall Van De Castle) ───────────────────
  const extractedSymbols = parseDreamSymbols(dreamText);

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
    numericSeed,
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
    extractedSymbols,
  };
}

// ─── Test-only Exports ────────────────────────────────────────────────────────
/** @internal Exposed for unit tests only; tree-shaken in production builds. */
export const __test = { GROUNDING_LINES } as const;