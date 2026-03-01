/**
 * Trigger Taxonomy — Single Source of Truth
 *
 * Defines the psychological foundation for every ShadowTrigger used across
 * the dream interpretation engine. Each trigger has:
 *
 *   - coreDefinition: What this trigger represents psychologically
 *   - interpretationFrame: How to frame it in dream context (non-deterministic)
 *   - defaultValence: Typical emotional valence when no feelings are selected (−1, 0, +1)
 *   - defaultActivation: Typical arousal level (0 = low, 1 = high)
 *   - reflectionQuestions: 3–5 standardized questions per trigger
 *   - evidenceHints: What to look for in dream text / feelings
 *   - cautionNote: Optional sensitivity flag for the renderer
 *
 * This file is imported by:
 *   - themeDefinitions.ts (auto-enriches ThemeCards with trigger psychology)
 *   - dreamInterpretation.ts (builds richer evidence + summaries)
 *   - dreamSynthesisEngine.ts (no-feelings fallback using defaults)
 *
 * TONE: Warm but not poetic. Grounded. Never predictive. Never absolute.
 */

import type { ShadowTrigger, NervousSystemBranch, AttachmentStyle } from './dreamTypes';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TriggerTaxonomyEntry {
  /** The trigger key — must match ShadowTrigger union */
  trigger: ShadowTrigger;

  /** 1–2 sentence psychological definition */
  coreDefinition: string;

  /**
   * How this trigger typically manifests in dreams.
   * Used by the renderer to enrich "what it may reflect" copy.
   * Language: "may", "could", "often" — never absolute.
   */
  interpretationFrame: string;

  /** Default valence when user didn't pick feelings: −1 (negative), 0 (neutral), +1 (positive) */
  defaultValence: -1 | 0 | 1;

  /** Default activation when user didn't pick feelings: 0 (low energy), 1 (high energy) */
  defaultActivation: 0 | 1;

  /** Nervous system branches most associated with this trigger */
  associatedBranches: NervousSystemBranch[];

  /** Attachment styles most associated with this trigger */
  associatedAttachment: AttachmentStyle[];

  /** 3–5 standardized reflection questions for this trigger */
  reflectionQuestions: string[];

  /** Short phrases describing what to look for in dream text or feelings */
  evidenceHints: string[];

  /** Optional sensitivity flag — renderer should handle with extra care */
  cautionNote?: string;
}

// ─── Taxonomy Map ─────────────────────────────────────────────────────────────

export const TRIGGER_TAXONOMY: Record<ShadowTrigger, TriggerTaxonomyEntry> = {
  abandonment: {
    trigger: 'abandonment',
    coreDefinition:
      'A deep fear or experience of being left behind, forgotten, or deemed unworthy of someone\'s continued presence. Often rooted in early attachment disruption.',
    interpretationFrame:
      'Dreams involving abandonment may reflect an active or dormant fear that connection is conditional — that the people you depend on could leave without warning.',
    defaultValence: -1,
    defaultActivation: 1,
    associatedBranches: ['flight', 'collapse'],
    associatedAttachment: ['anxious', 'disorganized'],
    reflectionQuestions: [
      'Who or what felt absent in this dream — and where do you recognize that feeling from?',
      'Is there a relationship right now where you feel uncertain of your place?',
      'What would it look like to give yourself the reassurance you\'re seeking from others?',
      'When this feeling arises, what is the first thing your body does?',
    ],
    evidenceHints: ['being left alone', 'empty rooms', 'people disappearing', 'calling out with no answer'],
  },

  rejection: {
    trigger: 'rejection',
    coreDefinition:
      'The experience or fear of being actively pushed away, excluded, or told you are not wanted. Distinct from abandonment in its directness.',
    interpretationFrame:
      'Dreams with rejection themes may reflect a wound around belonging — a fear that your authentic self will be turned away if fully seen.',
    defaultValence: -1,
    defaultActivation: 1,
    associatedBranches: ['flight', 'freeze'],
    associatedAttachment: ['anxious', 'avoidant'],
    reflectionQuestions: [
      'Who rejected you in the dream, and what part of you were they rejecting?',
      'Is there somewhere in your life right now where you\'re bracing for a "no"?',
      'What would change if you believed the rejection said more about them than about you?',
      'Where in your body do you feel rejection most strongly?',
    ],
    evidenceHints: ['being turned away', 'doors closing', 'being told to leave', 'social exclusion'],
  },

  betrayal: {
    trigger: 'betrayal',
    coreDefinition:
      'A violation of trust by someone who was expected to be safe. Creates a rupture between what was believed and what actually happened.',
    interpretationFrame:
      'Dreams with betrayal themes may surface when trust has been broken — or when you\'re afraid it could be. The dreaming mind often rehearses worst-case scenarios to prepare.',
    defaultValence: -1,
    defaultActivation: 1,
    associatedBranches: ['fight', 'freeze'],
    associatedAttachment: ['disorganized', 'avoidant'],
    reflectionQuestions: [
      'Who broke your trust in the dream — and does that person remind you of someone in waking life?',
      'Is there a situation right now where you\'re unsure if someone is being honest with you?',
      'What would rebuilding trust require in this situation — and is that realistic?',
      'What boundary might need strengthening right now?',
    ],
    evidenceHints: ['deception', 'hidden motives', 'allies turning hostile', 'discovering lies'],
  },

  shame: {
    trigger: 'shame',
    coreDefinition:
      'A global negative self-evaluation — not "I did something bad" but "I am bad." Shame attacks identity rather than behavior.',
    interpretationFrame:
      'Shame in dreams often manifests as scenes of humiliation, inadequacy, or being fundamentally flawed. The dreaming mind may be processing a part of you that feels unacceptable.',
    defaultValence: -1,
    defaultActivation: 0,
    associatedBranches: ['freeze', 'collapse'],
    associatedAttachment: ['avoidant', 'disorganized'],
    reflectionQuestions: [
      'What felt shameful in the dream — a specific moment, or a pervasive feeling?',
      'Whose voice does the shame sound like? Is it yours, or someone else\'s?',
      'If a friend described this same scenario, would you judge them the way you\'re judging yourself?',
      'What part of you is the shame trying to hide?',
    ],
    evidenceHints: ['humiliation', 'being laughed at', 'feeling fundamentally wrong', 'hiding'],
  },

  exposure: {
    trigger: 'exposure',
    coreDefinition:
      'The fear of being seen in a way that feels unsafe — of having private, vulnerable, or imperfect parts of the self revealed without consent.',
    interpretationFrame:
      'Exposure dreams may reflect anxiety about being "found out" — that something you guard internally could become visible to others.',
    defaultValence: -1,
    defaultActivation: 1,
    associatedBranches: ['freeze', 'flight'],
    associatedAttachment: ['avoidant'],
    reflectionQuestions: [
      'What was being exposed in the dream — and who was watching?',
      'Is there something in your life right now that you\'re carefully keeping hidden?',
      'What would actually happen if people saw what you\'re afraid of showing?',
      'Where does the need to hide come from — is it protecting something real, or an old script?',
    ],
    evidenceHints: ['nakedness', 'public scrutiny', 'secrets revealed', 'being watched', 'vulnerability'],
  },

  control: {
    trigger: 'control',
    coreDefinition:
      'The need to manage outcomes, environments, or other people\'s behavior — often driven by underlying anxiety that without control, things will fall apart.',
    interpretationFrame:
      'Control themes in dreams may surface when something feels unpredictable or beyond your influence. The need to control often masks a deeper fear underneath.',
    defaultValence: -1,
    defaultActivation: 1,
    associatedBranches: ['fight', 'flight'],
    associatedAttachment: ['avoidant', 'anxious'],
    reflectionQuestions: [
      'What were you trying to control in the dream, and what were you afraid would happen if you couldn\'t?',
      'Is there an area of your life right now where you\'re gripping too tightly?',
      'What would "enough" control actually look like — what\'s the minimum you need to feel safe?',
      'What fear sits underneath the need to control this?',
    ],
    evidenceHints: ['driving', 'organizing', 'commanding', 'inability to steer', 'things going wrong'],
  },

  power: {
    trigger: 'power',
    coreDefinition:
      'The dynamics of agency, dominance, and authority — who has it, who lacks it, and how it\'s wielded. Can be about personal empowerment or about being overpowered.',
    interpretationFrame:
      'Power themes in dreams may reflect how you relate to your own agency. Are you stepping into it, giving it away, or having it taken from you?',
    defaultValence: 0,
    defaultActivation: 1,
    associatedBranches: ['fight', 'ventral_safety'],
    associatedAttachment: ['secure', 'disorganized'],
    reflectionQuestions: [
      'Who held the power in this dream — and was that role familiar to you?',
      'Is there a place in your life where you feel overpowered or underpowered right now?',
      'What would it feel like to claim the power this dream is pointing to?',
      'When power shows up in your dreams, does it feel like something to claim or something to fear?',
    ],
    evidenceHints: ['authority figures', 'feeling strong or weak', 'weapons', 'commanding others'],
  },

  helplessness: {
    trigger: 'helplessness',
    coreDefinition:
      'The experience of being unable to act, protect yourself, or change an outcome. A core feature of traumatic overwhelm.',
    interpretationFrame:
      'Helplessness in dreams may echo moments when your options felt foreclosed — when no amount of effort could change what was happening.',
    defaultValence: -1,
    defaultActivation: 0,
    associatedBranches: ['freeze', 'collapse'],
    associatedAttachment: ['disorganized'],
    reflectionQuestions: [
      'Where in the dream did you feel most stuck — and what would you have needed to move?',
      'Does this helplessness echo a real situation, past or present?',
      'What\'s one small area of your life where you could reclaim some agency this week?',
      'Is the helplessness pointing to something beyond your control, or to something you haven\'t tried yet?',
    ],
    evidenceHints: ['paralysis', 'inability to move or speak', 'watching bad things happen', 'failed attempts'],
  },

  danger: {
    trigger: 'danger',
    coreDefinition:
      'The perception or presence of physical, emotional, or psychological threat. Activates the survival system regardless of whether the danger is real or imagined.',
    interpretationFrame:
      'Danger in dreams may represent something your nervous system is tracking — a real or perceived threat that hasn\'t been fully processed by your waking mind.',
    defaultValence: -1,
    defaultActivation: 1,
    associatedBranches: ['fight', 'flight'],
    associatedAttachment: ['anxious', 'disorganized'],
    reflectionQuestions: [
      'What was the source of danger — something external, or something inside you?',
      'How did your body respond to the danger in the dream?',
      'Is there a situation in your life right now that your body perceives as threatening, even if your mind says it\'s fine?',
      'What would safety look like in this context?',
    ],
    evidenceHints: ['chasing', 'weapons', 'falling', 'natural disasters', 'intruders', 'violence'],
  },

  intimacy: {
    trigger: 'intimacy',
    coreDefinition:
      'The desire for or fear of deep emotional closeness — being truly known by another person. Carries both longing and vulnerability.',
    interpretationFrame:
      'Intimacy themes in dreams may reflect your current relationship to closeness — whether you\'re reaching for it, pulling away from it, or grieving its absence.',
    defaultValence: 0,
    defaultActivation: 0,
    associatedBranches: ['ventral_safety', 'freeze'],
    associatedAttachment: ['anxious', 'secure'],
    reflectionQuestions: [
      'Who were you close to in this dream — and what made it feel safe or unsafe?',
      'Is there a relationship in your life where you want more closeness but something is in the way?',
      'What would it cost you to be fully seen right now?',
      'What conditions do you need before you can let someone in?',
    ],
    evidenceHints: ['closeness', 'tenderness', 'pulling away', 'eye contact', 'embracing', 'trust'],
  },

  sexuality: {
    trigger: 'sexuality',
    coreDefinition:
      'The expression of desire, bodily autonomy, and erotic energy. In dreams, often represents creative life force, vulnerability, or unmet need rather than literal sexual content.',
    interpretationFrame:
      'Sexual content in dreams may reflect desire, vulnerability, creative energy, or the integration of parts of yourself you keep private. It\'s rarely only about sex.',
    defaultValence: 0,
    defaultActivation: 1,
    associatedBranches: ['ventral_safety', 'fight'],
    associatedAttachment: ['secure', 'avoidant'],
    reflectionQuestions: [
      'Was the sexuality in this dream about desire, vulnerability, power, or something else entirely?',
      'Is there a part of your creative or emotional life that feels suppressed right now?',
      'What would it mean to own this energy without judgment?',
    ],
    evidenceHints: ['sexual content', 'desire', 'arousal', 'attraction', 'physical vulnerability'],
    cautionNote: 'Handle with sensitivity — avoid pathologizing sexual dream content.',
  },

  consent_violation: {
    trigger: 'consent_violation',
    coreDefinition:
      'The experience of having one\'s boundaries crossed — physically, emotionally, or psychologically — without permission. Can trigger deep survival responses.',
    interpretationFrame:
      'Dreams involving boundary violations may be processing current or past experiences of having your "no" overridden. They deserve careful, gentle attention.',
    defaultValence: -1,
    defaultActivation: 1,
    associatedBranches: ['freeze', 'collapse', 'fight'],
    associatedAttachment: ['disorganized'],
    reflectionQuestions: [
      'What boundary was crossed in this dream — and who crossed it?',
      'Is there a boundary in your current life that isn\'t being respected?',
      'What support would help you hold this boundary more firmly?',
    ],
    evidenceHints: ['forced actions', 'inability to say no', 'violation', 'coercion', 'trapped with someone'],
    cautionNote: 'This trigger may relate to trauma. Language must be especially gentle and non-prescriptive. Never minimize.',
  },

  worthiness: {
    trigger: 'worthiness',
    coreDefinition:
      'The question of whether one deserves love, success, belonging, or good things. A core self-worth wound that often runs beneath other triggers.',
    interpretationFrame:
      'Worthiness themes in dreams may surface when something good is happening — or could happen — and a part of you isn\'t sure you\'ve earned it.',
    defaultValence: -1,
    defaultActivation: 0,
    associatedBranches: ['freeze', 'collapse'],
    associatedAttachment: ['anxious', 'avoidant'],
    reflectionQuestions: [
      'What did the dream suggest you weren\'t worthy of — and do you believe that?',
      'Where did you first learn that you had to earn your place?',
      'What would change if you believed you were already enough?',
      'Is there something good in your life right now that you\'re unconsciously sabotaging?',
    ],
    evidenceHints: ['not measuring up', 'being passed over', 'imposter feelings', 'comparing self to others'],
  },

  responsibility: {
    trigger: 'responsibility',
    coreDefinition:
      'The weight of obligation — caring for others, meeting expectations, or carrying burdens that may or may not be yours. Can become crushing when boundaries are unclear.',
    interpretationFrame:
      'Responsibility themes in dreams may reflect an imbalance between what you\'re carrying and what\'s actually yours to carry.',
    defaultValence: -1,
    defaultActivation: 0,
    associatedBranches: ['freeze', 'fight'],
    associatedAttachment: ['anxious'],
    reflectionQuestions: [
      'What burden were you carrying in this dream — and was it actually yours?',
      'Is there an obligation in your life right now that you\'ve taken on without questioning?',
      'What would happen if you put one thing down this week?',
      'Who taught you that you\'re the one who has to hold everything together?',
    ],
    evidenceHints: ['carrying weight', 'being responsible for others', 'failing duties', 'overwhelming tasks'],
  },

  failure: {
    trigger: 'failure',
    coreDefinition:
      'The experience or fear of falling short — of not meeting a standard that feels essential to identity or survival.',
    interpretationFrame:
      'Failure in dreams may reflect real performance anxiety — or it may point to an impossible standard you\'re holding yourself to without realizing it.',
    defaultValence: -1,
    defaultActivation: 1,
    associatedBranches: ['flight', 'freeze'],
    associatedAttachment: ['anxious', 'avoidant'],
    reflectionQuestions: [
      'What were you failing at in this dream — and whose standard were you measuring yourself against?',
      'What would "good enough" actually look like in this area of your life?',
      'If failure weren\'t shameful, how would you feel about this situation?',
      'Is the fear of failure preventing you from trying something that matters?',
    ],
    evidenceHints: ['tests', 'missed deadlines', 'public failure', 'incompetence', 'disappointing someone'],
  },

  grief: {
    trigger: 'grief',
    coreDefinition:
      'The natural response to loss — of a person, a role, a version of yourself, or a future that won\'t happen. Grief has its own timeline and doesn\'t follow rules.',
    interpretationFrame:
      'Grief in dreams may mean something is being mourned — even if you haven\'t consciously named the loss in waking life.',
    defaultValence: -1,
    defaultActivation: 0,
    associatedBranches: ['collapse', 'mixed'],
    associatedAttachment: ['anxious', 'secure'],
    reflectionQuestions: [
      'What or who were you losing in this dream?',
      'Is there a loss in your life right now that you haven\'t fully acknowledged?',
      'What would it look like to give this grief some space — without trying to fix it?',
      'What is the grief protecting or honoring?',
    ],
    evidenceHints: ['death', 'endings', 'funerals', 'loss of loved ones', 'things disappearing', 'emptiness'],
  },

  identity: {
    trigger: 'identity',
    coreDefinition:
      'The question of who you are — your sense of self, your roles, your authenticity. Identity confusion may arise during transitions or when external expectations conflict with inner truth.',
    interpretationFrame:
      'Identity themes in dreams may reflect a part of you that\'s changing — or a question about who you\'re becoming that hasn\'t been answered yet.',
    defaultValence: 0,
    defaultActivation: 0,
    associatedBranches: ['mixed', 'freeze'],
    associatedAttachment: ['disorganized', 'avoidant'],
    reflectionQuestions: [
      'Who were you in this dream — and was that person familiar or strange to you?',
      'Is there a part of your identity right now that feels uncertain or in flux?',
      'What role are you playing in your life that doesn\'t quite fit anymore?',
      'If you could shed one expectation others have of you, which would it be?',
    ],
    evidenceHints: ['mirrors', 'name changes', 'disguises', 'not recognizing yourself', 'being multiple people'],
  },

  belonging: {
    trigger: 'belonging',
    coreDefinition:
      'The need to be included, to have a place in a group, family, or community. The absence of belonging creates a particular kind of pain that\'s often underrecognized.',
    interpretationFrame:
      'Belonging themes in dreams may reflect your current relationship to community — are you seeking it, losing it, or questioning whether you fit?',
    defaultValence: 0,
    defaultActivation: 0,
    associatedBranches: ['ventral_safety', 'flight'],
    associatedAttachment: ['anxious', 'secure'],
    reflectionQuestions: [
      'Where did you belong in this dream — or where were you excluded?',
      'Is there a group or relationship where you feel like an outsider right now?',
      'What would it take to feel like you truly belong somewhere?',
      'Are you waiting for an invitation, or could you create the space yourself?',
    ],
    evidenceHints: ['groups', 'communities', 'being included or excluded', 'searching for home'],
  },

  unpredictability: {
    trigger: 'unpredictability',
    coreDefinition:
      'The distress of not knowing what will happen next. For some nervous systems, uncertainty itself is the threat — even when the actual outcome may be neutral or positive.',
    interpretationFrame:
      'Unpredictability in dreams may surface when your life feels uncertain — when you can\'t plan, predict, or prepare for what\'s coming.',
    defaultValence: -1,
    defaultActivation: 1,
    associatedBranches: ['flight', 'freeze'],
    associatedAttachment: ['anxious', 'disorganized'],
    reflectionQuestions: [
      'What was unpredictable in this dream — the environment, a person, or your own reactions?',
      'Where in your life right now does uncertainty feel most uncomfortable?',
      'What\'s the smallest amount of certainty that would help you feel grounded?',
      'Is the unpredictability truly dangerous, or is your nervous system reading it that way?',
    ],
    evidenceHints: ['sudden changes', 'chaotic scenes', 'unexpected events', 'ground shifting', 'confusion'],
  },

  punishment: {
    trigger: 'punishment',
    coreDefinition:
      'The experience or fear of being punished, penalized, or made to suffer for something — whether the "crime" is real, imagined, or simply existing.',
    interpretationFrame:
      'Punishment themes in dreams may reflect internalized guilt, a harsh inner critic, or an environment where mistakes feel catastrophic.',
    defaultValence: -1,
    defaultActivation: 1,
    associatedBranches: ['freeze', 'fight'],
    associatedAttachment: ['disorganized', 'anxious'],
    reflectionQuestions: [
      'What were you being punished for in this dream — and did the punishment feel deserved?',
      'Whose voice delivers punishment in your inner world?',
      'Is there something you\'re punishing yourself for that might deserve compassion instead?',
      'What would forgiveness look like here — not excusing, but releasing?',
    ],
    evidenceHints: ['authority figures', 'courts', 'imprisonment', 'being scolded', 'pain as consequence'],
  },

  isolation: {
    trigger: 'isolation',
    coreDefinition:
      'Being cut off from others — either by choice (withdrawal) or by circumstance (exclusion). Different from abandonment: isolation may have no villain, just distance.',
    interpretationFrame:
      'Isolation in dreams may reflect a real or perceived disconnection from others — or a part of you that has withdrawn for self-protection.',
    defaultValence: -1,
    defaultActivation: 0,
    associatedBranches: ['collapse', 'freeze'],
    associatedAttachment: ['avoidant', 'disorganized'],
    reflectionQuestions: [
      'Were you alone in this dream by choice, or was isolation imposed on you?',
      'Is there a part of your life right now where you feel disconnected?',
      'What would it take to reach toward one person this week?',
      'Is the isolation protecting you from something, or keeping you from something?',
    ],
    evidenceHints: ['being alone', 'empty spaces', 'no one answering', 'walls', 'sealed rooms'],
  },

  transformation: {
    trigger: 'transformation',
    coreDefinition:
      'The process of fundamental change — death of an old self, birth of a new one. Transformation is rarely comfortable, but it\'s the mechanism of growth.',
    interpretationFrame:
      'Transformation themes in dreams may signal that something is ending or becoming — even if you can\'t yet see what\'s on the other side.',
    defaultValence: 0,
    defaultActivation: 1,
    associatedBranches: ['mixed', 'ventral_safety'],
    associatedAttachment: ['secure', 'disorganized'],
    reflectionQuestions: [
      'What was changing in this dream — and how did it feel?',
      'Is there a version of yourself that\'s completing or dissolving right now?',
      'What are you becoming — and what might you need to leave behind?',
      'What would it look like to cooperate with this change rather than resist it?',
      'What is the transformation asking you to trust?',
    ],
    evidenceHints: ['metamorphosis', 'death and rebirth', 'new landscapes', 'shedding', 'becoming something new'],
  },
};

// ─── Lookup Helpers ───────────────────────────────────────────────────────────

/** Get the taxonomy entry for a single trigger. */
export function getTriggerTaxonomy(trigger: ShadowTrigger): TriggerTaxonomyEntry {
  return TRIGGER_TAXONOMY[trigger];
}

/** Get a reflection question for a trigger, deterministic via seed. */
export function getTriggerReflectionQuestion(trigger: ShadowTrigger, seed: number): string {
  const entry = TRIGGER_TAXONOMY[trigger];
  if (!entry.reflectionQuestions.length) return '';
  const idx = Math.abs(Math.floor(seed * 997)) % entry.reflectionQuestions.length;
  return entry.reflectionQuestions[idx];
}

/** Get interpretation frame text for a set of triggers, combined. */
export function getInterpretationFrames(triggers: ShadowTrigger[], maxFrames = 2): string[] {
  return triggers
    .slice(0, maxFrames)
    .map(t => TRIGGER_TAXONOMY[t].interpretationFrame);
}

/**
 * Infer default valence and activation from dominant triggers
 * when the user didn't select any feelings.
 */
export function inferDefaultsFromTriggers(
  triggers: { trigger: ShadowTrigger; score: number }[],
): { valence: number; activation: number } {
  if (triggers.length === 0) return { valence: 0, activation: 0.5 };

  let totalWeight = 0;
  let weightedValence = 0;
  let weightedActivation = 0;

  for (const t of triggers) {
    const entry = TRIGGER_TAXONOMY[t.trigger];
    const w = t.score;
    totalWeight += w;
    weightedValence += entry.defaultValence * w;
    weightedActivation += entry.defaultActivation * w;
  }

  return {
    valence: totalWeight > 0 ? weightedValence / totalWeight : 0,
    activation: totalWeight > 0 ? weightedActivation / totalWeight : 0.5,
  };
}

/**
 * Get all triggers that carry a caution note.
 * Useful for the renderer to flag sensitive content.
 */
export function getCautionTriggers(
  triggers: ShadowTrigger[],
): { trigger: ShadowTrigger; note: string }[] {
  return triggers
    .filter(t => TRIGGER_TAXONOMY[t].cautionNote != null)
    .map(t => ({ trigger: t, note: TRIGGER_TAXONOMY[t].cautionNote! }));
}
