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
import { analyzeDreamPattern } from './dreamPatternEngine';

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
 * Build a cohesive dream reflection as a flowing narrative.
 *
 * Output format: sections separated by \n\n, each 2–3 sentences max.
 * Designed for mobile readability — no dense academic blocks.
 *
 * Architecture: instead of separate "symbol → meaning → emotion → body" blocks,
 * each section references the previous one, producing a woven narrative that
 * reads like one person thoughtfully reflecting on the dream.
 *
 * Narrative flow:
 *   1. Opening setting — introduces the dream's world with meaning integrated
 *   2. Relational/symbolic layer — interprets combinations, not isolated symbols
 *   3. Emotional thread — feelings woven into the dream context
 *   4. Dream quality — vividness, control, awaken state tied to the dream
 *   5. Somatic close — body/nervous system connected to what was described
 *   6. Patterns — cross-dream threads (when applicable)
 *   7. Grounding — regulating close (high-distress only)
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
  // Unlike a "stacked blocks" approach, each section is written to reference
  // the dream content and connect to the previous section, producing a
  // flowing narrative rather than disconnected interpretations.
  const sections: string[] = [];

  // ── Gather key data used across multiple sections ──────────────────────────

  const topMatches = keywordMatches.slice(0, 6);
  const topFeelings = aggregates.dominantFeelings
    .slice(0, 3)
    .map(f => FEELING_MAP[f.id]?.label ?? f.id)
    .filter(Boolean);

  let toneWord: string;
  if (aggregates.valenceScore > 0.3) toneWord = 'tender';
  else if (aggregates.valenceScore > -0.3) toneWord = 'unsettled';
  else toneWord = 'heavy';

  // Categorize matched symbols for narrative weaving
  const matchCategories = topMatches.map(m => m.entry.category);
  const placeMatch = topMatches.find(m => m.entry.category === 'places');
  const personMatch = topMatches.find(m => m.entry.category === 'people');
  const scenarioMatches = topMatches.filter(m => m.entry.category === 'scenarios');
  const otherMatches = topMatches.filter(m =>
    m.entry.category !== 'places' && m.entry.category !== 'people' &&
    m.entry.category !== 'scenarios' && m.entry.category !== 'relationships'
  );

  // ════ 1. OPENING — Setting + Meaning Integrated ═══════════════════════════
  // Instead of listing symbols then separately listing meanings, introduce
  // the dream's world with its interpretive meaning woven in.

  if (topMatches.length > 0) {
    if (placeMatch && topMatches.length >= 2) {
      // Dream has a setting — open with the place + its meaning in one breath
      const placeLabel = placeMatch.entry.keywords[0];
      const placeMeaning = placeMatch.entry.meaning;
      // Extract the interpretive core from the meaning (after "often" or the first clause)
      const meaningCore = placeMeaning
        .replace(/^[^—–\u2014]*[—–\u2014]\s*/, '')  // strip before em dash if present
        .replace(/\.$/, '');

      const settingOpenerVariants = [
        `Your dream placed you in a ${placeLabel} \u2014 a space often connected to ${meaningCore}. The fact that your mind chose this setting probably isn\u2019t a coincidence.`,
        `There\u2019s a reason this dream unfolded in a ${placeLabel}. It\u2019s a space that often touches on ${meaningCore}, and the way it showed up here suggests it was carrying something personal.`,
        `The ${placeLabel} in this dream is worth noticing. It\u2019s often tied to ${meaningCore}, and the emotional weight of the scene suggests something about that space felt meaningful to your inner world.`,
        `This dream chose a ${placeLabel} as its backdrop \u2014 a setting connected to ${meaningCore}. What happened there seems to matter more than the location itself.`,
      ] as const;
      sections.push(pickVariant(settingOpenerVariants, seed, 1));
    } else if (topMatches.length >= 2) {
      // No specific place, but multiple symbols — open with thematic overview
      const labels = topMatches.slice(0, 4).map(m => m.entry.keywords[0]);
      const integratedOpenerVariants = [
        `This dream wove together ${labels.slice(0, -1).join(', ')} and ${labels[labels.length - 1]} \u2014 and rather than being random, they seem to be circling the same feeling from different angles.`,
        `Several things stood out in this dream: ${labels.join(', ')}. Together, they trace something your inner world seems to be working through.`,
        `The combination of ${labels.join(', ')} in one dream isn\u2019t accidental. Each piece carries its own weight, but together they\u2019re pointing toward something that matters.`,
        `${labels.slice(0, -1).join(', ')} and ${labels[labels.length - 1]} all showed up in this dream, and the way they fit together is worth noticing. They seem to be part of a larger emotional thread.`,
      ] as const;
      sections.push(pickVariant(integratedOpenerVariants, seed, 1));
    } else {
      // Single symbol — integrate its meaning into the opening
      const singleMatch = topMatches[0];
      const label = singleMatch.entry.keywords[0];
      const meaning = singleMatch.entry.meaning;
      const singleOpenerVariants = [
        `${meaning} In this dream, the ${label} seems to be pointing to something your mind wants you to notice.`,
        `The ${label} in this dream stood out for a reason. ${meaning}`,
        `Something about the ${label} stayed with you, and that\u2019s usually a sign it\u2019s connected to something real. ${meaning}`,
      ] as const;
      sections.push(pickVariant(singleOpenerVariants, seed, 1));
    }
  } else if (dreamText.length > 30) {
    const noSymbolVariants = [
      'What you described may not have clear symbols, but the feeling you carried out of it is real \u2014 and that\u2019s usually the part that matters most.',
      'Even without vivid imagery, something in this dream clearly left an impression. The emotion attached to it is worth paying attention to.',
      'Sometimes the most important dreams don\u2019t come with stories or symbols. They just leave you with a feeling \u2014 and this one seems to have left you with something.',
    ] as const;
    sections.push(pickVariant(noSymbolVariants, seed, 2));
  } else if (dreamText.length > 0) {
    const briefVariants = [
      'You caught a brief fragment of something. Even a few words can hold meaning \u2014 your mind chose to remember this, and that\u2019s worth noticing.',
      'Even this short glimpse seems to carry something. Brief dream fragments often hold more concentrated emotional weight than longer ones.',
      'It was just a flash, but the fact that it stayed with you says something. Short dreams often distill a feeling down to its most essential form.',
    ] as const;
    sections.push(pickVariant(briefVariants, seed, 3));
  }

  // ════ 2. RELATIONAL / CONTEXTUAL LAYER ════════════════════════════════════
  // When people, scenarios, or relational dynamics are present, interpret them
  // in combination — not isolation. This section references the setting from
  // section 1 to maintain narrative flow.

  if (topMatches.length >= 2) {
    // Try context-linked interpretation first (symbol combination)
    const contextLinked = buildContextLinkedMeaning(
      topMatches,
      matchCategories.includes('places'),
      matchCategories.includes('people'),
      matchCategories.includes('relationships'),
      matchCategories.includes('emotions_expressed'),
      dreamText,
    );

    if (contextLinked) {
      sections.push(contextLinked);
    } else if (personMatch && scenarioMatches.length > 0) {
      // Person + scenario — weave them together
      const personLabel = personMatch.entry.keywords[0];
      const scenarioMeaning = scenarioMatches[0].entry.meaning;
      const personScenarioVariants = [
        `Having ${personLabel} there changes the emotional weight of what happened. ${scenarioMeaning}`,
        `With ${personLabel} in the scene, the dream takes on a more personal quality. ${scenarioMeaning}`,
        `${personLabel.charAt(0).toUpperCase() + personLabel.slice(1)} showing up here isn\u2019t random \u2014 they seem to be part of whatever your mind is working through. ${scenarioMeaning}`,
      ] as const;
      sections.push(pickVariant(personScenarioVariants, seed, 19));
    } else if (personMatch) {
      // Person without scenario — use their meaning connected to the dream
      const personLabel = personMatch.entry.keywords[0];
      const personMeaning = personMatch.entry.meaning;
      const personOnlyVariants = [
        `The fact that ${personLabel} was there adds a relational layer to this dream. ${personMeaning}`,
        `${personLabel.charAt(0).toUpperCase() + personLabel.slice(1)} being present makes this dream feel more personal, more connected to your real life. ${personMeaning}`,
        `With ${personLabel} in the dream, there\u2019s a relational thread worth paying attention to. ${personMeaning}`,
      ] as const;
      sections.push(pickVariant(personOnlyVariants, seed, 19));
    } else if (scenarioMatches.length >= 2) {
      // Multiple scenarios — weave their meanings
      sections.push(scenarioMatches[0].entry.meaning + ' ' + scenarioMatches[1].entry.meaning);
    } else if (scenarioMatches.length === 1) {
      sections.push(scenarioMatches[0].entry.meaning);
    }

    // Additional symbol meanings not covered above (body, objects, nature, etc.)
    if (otherMatches.length > 0 && !personMatch) {
      const extraMeanings = otherMatches.slice(0, 2).map(m => m.entry.meaning);
      sections.push(extraMeanings.join(' '));
    }
  } else if (topMatches.length === 1 && topMatches[0] !== placeMatch) {
    // Single non-place symbol already handled in opening — skip
  }

  // Text evidence snippet — connects the user's own language to the interpretation
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
        'Something in the way you put it \u2014 \u201c' + snippet + '\u201d \u2014 feels like it\u2019s carrying more than the words alone suggest.',
        'The phrase \u201c' + snippet + '\u201d stands out. That kind of language usually surfaces when a feeling is stronger than it looks.',
        'You wrote \u201c' + snippet + '\u201d \u2014 and that choice of words seems to point to something underneath that\u2019s worth sitting with.',
        'There\u2019s something in \u201c' + snippet + '\u201d that goes beyond the surface. The words you reach for in a dream often reveal what your waking mind hasn\u2019t named yet.',
      ] as const;
      sections.push(pickVariant(evidenceVariants, seed, 4));
    }
  }

  // Theme card meaning (supplements keywords when no keywords matched)
  if (rawThemeCards.length > 0) {
    const topCard = rawThemeCards[0];
    if (keywordMatches.length === 0) {
      sections.push(topCard.meaning);
    }
    if (rawThemeCards.length >= 2 && rawThemeCards[1].score >= 0.32) {
      sections.push(rawThemeCards[1].meaning);
    }
  }

  // ════ 3. EMOTIONAL THREAD — woven into dream context ══════════════════════
  // Instead of listing feelings as tags, integrate them with what the dream
  // was exploring. Reference the dream's content to connect emotion to story.

  {
    const emotionBlock: string[] = [];
    const hasSymbols = keywordMatches.length > 0;
    const dreamRef = placeMatch ? `the ${placeMatch.entry.keywords[0]}` :
                     personMatch ? `what ${personMatch.entry.keywords[0]} represents` :
                     'what came through in this dream';

    if (topFeelings.length > 0) {
      if (topFeelings.length === 1) {
        const singleEmotionVariants = hasSymbols ? [
          `The ${topFeelings[0].toLowerCase()} you felt isn\u2019t separate from ${dreamRef} \u2014 it\u2019s woven into it. That feeling colored the whole scene and made it land the way it did.`,
          `There\u2019s a steady thread of ${topFeelings[0].toLowerCase()} running through this dream, and it seems connected to ${dreamRef}. The overall experience had a ${toneWord} quality to it.`,
          `${topFeelings[0]} seems to be at the heart of this one \u2014 shaping how ${dreamRef} felt and why it stuck with you. The whole thing carried something ${toneWord}.`,
        ] as const : [
          `The ${topFeelings[0].toLowerCase()} in this dream wasn\u2019t just background noise \u2014 it was the whole atmosphere. The experience had a ${toneWord} quality that\u2019s probably still lingering.`,
          `There\u2019s a clear thread of ${topFeelings[0].toLowerCase()} here, and it seems to be what your inner world was really sitting with. The overall feeling was ${toneWord}.`,
          `${topFeelings[0]} ran through this entire dream, and the ${toneWord} quality of it suggests your mind was working on something that matters.`,
        ] as const;
        emotionBlock.push(pickVariant(singleEmotionVariants, seed, 5));
      } else {
        const feelingsList = topFeelings.map(f => f.toLowerCase());
        const multiEmotionVariants = hasSymbols ? [
          `The combination of ${feelingsList.slice(0, -1).join(', ')} and ${feelingsList[feelingsList.length - 1]} didn\u2019t arrive separately \u2014 they were braided into ${dreamRef}, creating something that felt ${toneWord} and layered.`,
          `These feelings \u2014 ${feelingsList.join(', ')} \u2014 all showed up around ${dreamRef}, and the way they overlap suggests you were processing something with real depth. The overall experience felt ${toneWord}.`,
          `Your inner world was holding ${feelingsList.join(' and ')} at the same time around ${dreamRef}. That kind of emotional complexity usually means whatever\u2019s underneath doesn\u2019t have a simple answer.`,
        ] as const : [
          `The blend of ${feelingsList.slice(0, -1).join(', ')} and ${feelingsList[feelingsList.length - 1]} gave this dream a ${toneWord} quality \u2014 not one clean feeling, but something richer and more layered.`,
          `This dream carried ${feelingsList.slice(0, -1).join(', ')} and ${feelingsList[feelingsList.length - 1]} all at once \u2014 a ${toneWord} mix that suggests your mind was sitting with something that has more than one side to it.`,
          `Your inner world was working through ${feelingsList.join(', ')} simultaneously \u2014 creating something ${toneWord} that resists easy labels.`,
        ] as const;
        emotionBlock.push(pickVariant(multiEmotionVariants, seed, 6));
      }
    } else if (triggerScores.length > 0 && keywordMatches.length === 0) {
      const inferred = inferDefaultsFromTriggers(triggerScores.slice(0, 5));
      if (inferred.valence < -0.3) toneWord = 'heavy';
      else if (inferred.valence > 0.3) toneWord = 'tender';
      else toneWord = 'unsettled';
      const inferredVariants = [
        `Based on the themes that came through, this dream seems to carry a ${toneWord} emotional undercurrent \u2014 the kind of feeling that\u2019s easier to sense than describe.`,
        `The themes in this dream give it a ${toneWord} quality, even if the feelings weren\u2019t always front and center.`,
        `Something about this dream feels ${toneWord}. Even without naming specific emotions, the emotional current is there.`,
      ] as const;
      emotionBlock.push(pickVariant(inferredVariants, seed, 7));
    }

    // Ambivalence (opposing feelings) — connected to dream content
    const activeFeelings = feelings.filter(f => f.intensity >= 2);
    const hasPositive = activeFeelings.some(f => FEELING_MAP[f.id]?.valence === 1);
    const hasNegative = activeFeelings.some(f => FEELING_MAP[f.id]?.valence === -1);
    if (hasPositive && hasNegative && Math.abs(aggregates.valenceScore) < 0.25) {
      const ambivalenceVariants = hasSymbols ? [
        `The push and pull between these feelings seems connected to ${dreamRef} \u2014 your mind holding two truths at once rather than forcing a resolution.`,
        `That tension between opposing emotions is part of what makes this dream feel so real. It\u2019s the kind of complexity that doesn\u2019t resolve neatly, and the dream isn\u2019t trying to force it.`,
        `Holding these conflicting feelings around ${dreamRef} is uncomfortable, but it\u2019s also honest. The dream seems to be saying there\u2019s more than one way to feel about this.`,
      ] as const : [
        'There\u2019s a part of you holding two things at once here, and that tension might actually be the most important part of the dream.',
        'The push and pull between these feelings suggests you\u2019re sitting at a crossroads \u2014 somewhere between two truths that both feel valid.',
        'Conflicting emotions in a dream often mean you\u2019re ready to look at something from more than one angle \u2014 even if neither view is comfortable.',
      ] as const;
      emotionBlock.push(pickVariant(ambivalenceVariants, seed, 8));
    }

    if (emotionBlock.length > 0) sections.push(emotionBlock.join(' '));
  }

  // ════ 4. DREAM QUALITY — tied to dream content ════════════════════════════

  {
    const detailBlock: string[] = [];

    if (metadata.vividness >= 4) {
      const vividHighVariants = [
        'The vividness of this dream is striking \u2014 your mind turned up the volume on purpose, as if it needed you to really feel this one.',
        'This dream was unusually vivid, which usually means something emotional was pressing hard enough to make itself impossible to ignore.',
        'The sharpness of the imagery here isn\u2019t random. When dreams are this vivid, it\u2019s often because something inside needs your full attention.',
      ] as const;
      detailBlock.push(pickVariant(vividHighVariants, seed, 9));
    } else if (metadata.vividness <= 2) {
      const vividLowVariants = [
        'This dream came through faintly, almost like catching something out of the corner of your eye. That haziness sometimes means the feeling is there, but the mind isn\u2019t quite ready to focus on it directly.',
        'The dreaminess of this one \u2014 soft, unclear, hard to hold onto \u2014 can mean something is being approached gently, from a distance your mind feels safe with.',
        'A faint dream doesn\u2019t mean an unimportant one. Sometimes the most delicate feelings surface in the quietest way.',
      ] as const;
      detailBlock.push(pickVariant(vividLowVariants, seed, 10));
    }

    if (metadata.recurring) {
      const recurringVariants = [
        'This dream keeps coming back, and that means something. Your mind doesn\u2019t repeat itself for no reason \u2014 there\u2019s unfinished emotional business here that hasn\u2019t found its resolution yet.',
        'The fact that this is a recurring dream is significant. Something in you keeps returning to this material, as if it hasn\u2019t heard the answer it\u2019s looking for.',
        'When the same dream shows up more than once, it\u2019s usually because your inner world is still circling something it can\u2019t quite let go of.',
      ] as const;
      detailBlock.push(pickVariant(recurringVariants, seed, 11));
    }

    if (metadata.controlLevel != null) {
      if (metadata.controlLevel >= 4) {
        const controlHighVariants = [
          'You had a real sense of control in this dream, and that\u2019s not nothing. It often shows up when you\u2019re finding your footing with something that used to feel overwhelming.',
          'The agency you felt here is a good sign \u2014 it usually reflects growing confidence in navigating something that once felt out of reach.',
          'Having control in a dream like this can mean your inner world is integrating something \u2014 moving from being swept up in it to finding your way through.',
        ] as const;
        detailBlock.push(pickVariant(controlHighVariants, seed, 12));
      } else if (metadata.controlLevel <= 2) {
        const controlLowVariants = [
          'There wasn\u2019t much control in this dream, which can feel unsettling. It often mirrors a place in waking life where you feel at the mercy of something you can\u2019t steer.',
          'The helplessness in this dream might reflect a real situation where agency feels limited \u2014 where things are happening to you rather than because of you.',
          'When a dream feels uncontrollable, it\u2019s usually mirroring a place in your life where the ground feels less solid than you\u2019d like.',
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
      adventure: 'Something in you is reaching toward the unknown \u2014 possibility, expansion, a life that\u2019s different from the one you\u2019re living now.',
      conflict: 'There\u2019s tension that hasn\u2019t found its way out yet \u2014 something unresolved that\u2019s still looking for a door.',
      connection: 'This dream touches on belonging, closeness, or the ache of wanting to really be met by someone.',
      transformation: 'Something inside is shifting \u2014 not all at once, but enough that a version of you that\u2019s been forming might be ready to take shape.',
      mystery: 'Part of what makes this dream feel significant is the part you can\u2019t fully name. Something is being sensed but not yet understood.',
      survival: 'There\u2019s an urgency here \u2014 a feeling of needing to protect yourself or stay ahead of something that feels overwhelming.',
      loss: 'Grief or the echo of an ending might be running underneath this dream, even if it doesn\u2019t look like loss on the surface.',
      discovery: 'Something previously hidden is starting to surface. Your mind seems to be uncovering layers that were there all along.',
      mundane: 'This dream stayed close to everyday life, processing logistics and details rather than deep symbolism.',
      surreal: 'The strangeness of this dream might feel confusing, but it often signals the mind working through something too complex for literal imagery.',
    };
    if (metadata.overallTheme) {
      const themePhrase = THEME_PHRASES[metadata.overallTheme];
      if (themePhrase) contextBlock.push(themePhrase);
    }

    const AWAKEN_PHRASES: Record<string, string> = {
      startled: 'Waking up startled usually means something in the dream hit close to home \u2014 a tension that hadn\u2019t finished resolving before your eyes opened.',
      unsettled: 'That lingering unease upon waking is your body\u2019s way of saying the dream touched something real.',
      confused: 'If you woke up confused, it might be because what the dream was processing doesn\u2019t fit into neat categories yet. That\u2019s okay.',
      heavy: 'Waking up heavy usually means your body is still holding what the dream carried. Give yourself a moment before rushing into the day.',
      relieved: 'That wave of relief upon waking \u2014 that\u2019s your mind recognizing it made it through something emotionally dense.',
      drained: 'If you woke up tired, it\u2019s because your mind was working hard overnight. Emotional processing takes real energy.',
      neutral: 'Waking neutral might mean the processing happened quietly \u2014 the emotional work got done without making a scene.',
      thoughtful: 'Waking up thoughtful is a sign the dream left you with something worth carrying into the day.',
    };
    const awakenPhrase = AWAKEN_PHRASES[metadata.awakenState];
    if (awakenPhrase) contextBlock.push(awakenPhrase);

    if (contextBlock.length > 0) sections.push(contextBlock.join(' '));
  }

  // ════ 5. SOMATIC CLOSE — connected to the dream ══════════════════════════

  {
    const branch = aggregates.dominantBranch;
    const branchPhrase = BRANCH_LABELS[branch];
    const attachPhrase = ATTACH_LABELS[aggregates.dominantAttachment];

    // Connect the body observation to the dream's content for narrative flow
    const dreamSubject = personMatch ? `what happened with ${personMatch.entry.keywords[0]}` :
                         placeMatch ? `this experience in the ${placeMatch.entry.keywords[0]}` :
                         'what this dream explored';

    const nsAttachVariants = [
      `A dream like this \u2014 especially one touching on ${dreamSubject} \u2014 can leave something physical behind. You might notice ${branchPhrase} still lingering in your body, and that\u2019s your system catching up with what the dream processed. On a relational level, ${attachPhrase} seems like part of it too.`,
      `After ${dreamSubject}, your body might still be carrying some of what the dream stirred up \u2014 ${branchPhrase}. That\u2019s normal. And underneath, there\u2019s likely ${attachPhrase} adding its own texture to the experience.`,
      `The feelings around ${dreamSubject} don\u2019t just live in your head \u2014 your body holds them too. You might still be feeling ${branchPhrase}, and relationally, ${attachPhrase} seems to be threaded through what the dream was processing.`,
      `There\u2019s a physical dimension to this dream worth acknowledging. After sitting with ${dreamSubject}, your body may still have ${branchPhrase} running through it. ${attachPhrase.charAt(0).toUpperCase() + attachPhrase.slice(1)} also seems woven into the emotional fabric of the experience.`,
    ] as const;
    sections.push(pickVariant(nsAttachVariants, seed, 14));
  }

  // ════ 6. PATTERNS ═════════════════════════════════════════════════════════

  if (patterns.comparisonCount >= 2) {
    const patternBlock: string[] = [];
    if (patterns.recurringFeelings.length > 0) {
      const labels = patterns.recurringFeelings
        .slice(0, 2)
        .map(id => FEELING_MAP[id]?.label ?? id);
      const plural = labels.length > 1;
      const patternRecurringVariants = [
        labels.join(' and ') + ' ha' + (plural ? 've' : 's') + ' been showing up across your recent dreams \u2014 your mind keeps returning to this feeling, as if it\u2019s not done with it yet.',
        labels.join(' and ') + ' keep' + (plural ? '' : 's') + ' appearing in your dreams lately. That kind of repetition usually means something in you is circling around material that needs attention.',
        'There\u2019s a thread running through your recent dreams: ' + labels.join(' and ') + '. Your inner world seems to be insisting on this one.',
      ] as const;
      patternBlock.push(pickVariant(patternRecurringVariants, seed, 15));
    }
    if (patterns.emotionalTrendDirection === 'increasing') {
      const intensityUpVariants = [
        'The emotional intensity of your recent dreams has been climbing. Something might be building toward a moment where it needs to be acknowledged.',
        'Your dreams have been getting emotionally louder lately \u2014 as if something in you is turning up the volume because it hasn\u2019t been heard.',
        'There\u2019s a rising intensity across your recent dreams that\u2019s worth noticing. Something in your inner world is gaining momentum.',
      ] as const;
      patternBlock.push(pickVariant(intensityUpVariants, seed, 16));
    } else if (patterns.emotionalTrendDirection === 'decreasing') {
      const intensityDownVariants = [
        'Your recent dreams have been getting quieter, emotionally. That\u2019s often a sign that something is settling \u2014 that your mind found what it needed.',
        'The emotional temperature of your dreams has been cooling, which usually means some kind of integration is happening beneath the surface.',
        'Things seem to be calming in your dream world lately. Whatever was being worked through may be finding its resolution.',
      ] as const;
      patternBlock.push(pickVariant(intensityDownVariants, seed, 17));
    }
    if (patternBlock.length > 0) sections.push(patternBlock.join(' '));
  }

  // ════ 7. GROUNDING CLOSE (high-distress gate) ═════════════════════════════
  if (aggregates.activationScore === 'high' && aggregates.valenceScore <= -0.3) {
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

  // ── Run Pattern Engine — pattern-first interpretation ─────────────────────
  const patternAnalysis = analyzeDreamPattern(
    dreamText,
    keywordMatches,
    feelings,
    metadata,
    aggregates,
    numericSeed,
  );

  // ── Build interpretation ──────────────────────────────────────────────────
  // When the pattern engine produces a confident result, use its flowing
  // narrative. Otherwise fall back to the existing paragraph builder.

  let paragraph: string;
  let question: string;

  if (patternAnalysis) {
    paragraph = patternAnalysis.narrative;
    question = patternAnalysis.reflectionQuestion;
  } else {
    paragraph = buildParagraph(
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
    question = pickReflectionQuestion(rawThemeCards, triggerScores, numericSeed);
  }

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
    ...(patternAnalysis ? {
      patternAnalysis: {
        primaryPattern: patternAnalysis.primaryPattern,
        secondaryPatterns: patternAnalysis.secondaryPatterns,
        confidence: patternAnalysis.confidence,
        undercurrentLabel: patternAnalysis.undercurrentLabel,
        emotionalContradictions: patternAnalysis.emotionalContradictions.map(c => ({
          poleA: c.poleA,
          poleB: c.poleB,
          intensity: c.intensity,
        })),
        endingType: patternAnalysis.endingAnalysis.type,
      },
    } : {}),
  };
}

// ─── Test-only Exports ────────────────────────────────────────────────────────
/** @internal Exposed for unit tests only; tree-shaken in production builds. */
export const __test = { GROUNDING_LINES } as const;