/**
 * Prompt Library — 120+ journal prompts, tagged by system
 *
 * Every prompt is a 4-layer structure:
 *   CONTEXT   → Why now? (user sees a meaning-line, never raw astrology)
 *   QUESTION  → The prompt itself (one emotional focal point)
 *   CLOSE     → Nervous-system-friendly soft close (optional)
 *   TAGS      → Internal metadata for engine selection
 *
 * Rules baked in:
 *   • No "why" questions (too interrogative)
 *   • No astrology jargon in user-facing text
 *   • No advice — only invitation
 *   • One emotional focal point per question
 */

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type Activation =
  | 'emotional_processing'
  | 'identity_pressure'
  | 'relationship_mirroring'
  | 'inner_review'
  | 'boundary_testing'
  | 'integration_phase'
  | 'creative_release'
  | 'somatic_awareness';

export type PromptTheme =
  | 'shadow'
  | 'growth'
  | 'identity'
  | 'relationships'
  | 'purpose'
  | 'body'
  | 'creativity'
  | 'release'
  | 'safety'
  | 'expression';

export type PromptIntensity = 'gentle' | 'deep';

export type MoonPhaseTag = 'new' | 'waxing_crescent' | 'first_quarter' | 'waxing_gibbous'
  | 'full' | 'waning_gibbous' | 'last_quarter' | 'waning_crescent';

export type ElementTag = 'fire' | 'earth' | 'air' | 'water';

export type ChakraTag = 'root' | 'sacral' | 'solar_plexus' | 'heart' | 'throat' | 'third_eye' | 'crown';

export type TransitTrigger =
  | 'mars_aspect'
  | 'venus_aspect'
  | 'saturn_aspect'
  | 'jupiter_aspect'
  | 'mercury_aspect'
  | 'moon_transit'
  | 'sun_aspect'
  | 'uranus_aspect'
  | 'neptune_aspect'
  | 'pluto_aspect'
  | 'chiron_transit';

export interface PromptTags {
  activation: Activation;
  theme: PromptTheme;
  intensity: PromptIntensity;
  moonPhases?: MoonPhaseTag[];
  elements?: ElementTag[];
  chakra?: ChakraTag;
  transit?: TransitTrigger;
  stelliumHouse?: number;
  chironHouse?: number;
  nodeDirection?: 'north' | 'south';
}

export interface JournalPromptEntry {
  id: string;
  context: string;       // "Something is shifting beneath the surface."
  question: string;      // The actual prompt
  close?: string;        // "Let the answer be messy."
  tags: PromptTags;
}

// ═══════════════════════════════════════════════════════════════════════════
// GENTLE CLOSES (rotated independently)
// ═══════════════════════════════════════════════════════════════════════════

export const GENTLE_CLOSES: string[] = [
  'Write without editing.',
  'Name it without fixing it.',
  'Let this be incomplete.',
  'You don\'t have to solve this.',
  'Let the answer be messy.',
  'Write honestly, not politely.',
  'Notice where your body reacts.',
  'Write fast. Don\'t reread yet.',
  'There is no wrong answer.',
  'One sentence is enough.',
  'Stay with whatever came up first.',
  'Let this sit without a conclusion.',
  'You don\'t need clarity yet.',
  'Notice, don\'t narrate.',
  'This is just for you.',
  'No performance required.',
  'Let this breathe.',
  'Write what you mean, not what sounds good.',
  'Skip the explanation. Just feel it.',
  'Place a hand on your chest and breathe first.',
];

// ═══════════════════════════════════════════════════════════════════════════
// CONTEXT LINES (rotated by activation type)
// ═══════════════════════════════════════════════════════════════════════════

export const CONTEXT_LINES: Record<Activation, string[]> = {
  emotional_processing: [
    'Something is moving beneath the surface.',
    'Your emotional field is asking for attention.',
    'A feeling is trying to find its name.',
    'There is something here that wants to be felt.',
  ],
  identity_pressure: [
    'Something about your sense of self is shifting.',
    'The way you see yourself is being renegotiated.',
    'Identity feels less fixed than usual.',
    'You\'re being asked to show up differently.',
  ],
  relationship_mirroring: [
    'Connection is acting as a mirror today.',
    'Relationships are surfacing something personal.',
    'What\'s happening between you and others is revealing.',
    'Closeness is highlighting something important.',
  ],
  inner_review: [
    'This theme keeps returning for a reason.',
    'Something you set aside is asking for attention.',
    'An older pattern is making itself known.',
    'There\'s a review happening beneath the noise.',
  ],
  boundary_testing: [
    'Your limits are being tested — gently or not.',
    'Something is pressing against a boundary.',
    'The line between yours and not-yours is blurring.',
    'You\'re being asked to define what you need.',
  ],
  integration_phase: [
    'Pieces are coming together.',
    'Something is settling into place.',
    'This is a moment of quiet synthesis.',
    'Understanding is catching up to experience.',
  ],
  creative_release: [
    'Something wants expression.',
    'Creative energy is restless.',
    'There\'s an impulse asking to be followed.',
    'Expression is more available than usual.',
  ],
  somatic_awareness: [
    'Your system is asking for attention here.',
    'The body is holding something the mind hasn\'t named.',
    'Physical sensation carries information today.',
    'Notice where your attention goes in your body.',
  ],
};

// ═══════════════════════════════════════════════════════════════════════════
// PROMPT LIBRARY — 120+ ENTRIES
// ═══════════════════════════════════════════════════════════════════════════

export const PROMPT_LIBRARY: JournalPromptEntry[] = [

  // ───────────────────────────────────────────────────────────────────────
  // REFLECTION (🪞) — emotional_processing
  // ───────────────────────────────────────────────────────────────────────

  { id: 'ref-01', context: 'Something is moving beneath the surface.', question: 'What keeps coming up, even when you don\'t invite it?', close: 'Let this be incomplete.', tags: { activation: 'emotional_processing', theme: 'shadow', intensity: 'deep', moonPhases: ['waning_gibbous', 'last_quarter'], chakra: 'heart' } },
  { id: 'ref-02', context: 'A feeling is trying to find its name.', question: 'What are you holding that doesn\'t need to be carried anymore?', close: 'Name it without fixing it.', tags: { activation: 'emotional_processing', theme: 'release', intensity: 'deep', elements: ['water'], chakra: 'heart' } },
  { id: 'ref-03', context: 'Something is moving beneath the surface.', question: 'What emotion are you most aware of right now?', close: 'One sentence is enough.', tags: { activation: 'emotional_processing', theme: 'body', intensity: 'gentle', moonPhases: ['new', 'waning_crescent'], chakra: 'sacral' } },
  { id: 'ref-04', context: 'Your emotional field is asking for attention.', question: 'What would change if you stopped explaining how you feel?', close: 'Write honestly, not politely.', tags: { activation: 'emotional_processing', theme: 'expression', intensity: 'deep', chakra: 'throat' } },
  { id: 'ref-05', context: 'There is something here that wants to be felt.', question: 'What did you almost feel today — but pulled back from?', close: 'Stay with whatever came up first.', tags: { activation: 'emotional_processing', theme: 'shadow', intensity: 'deep', elements: ['water'], chakra: 'sacral' } },
  { id: 'ref-06', context: 'A feeling is trying to find its name.', question: 'What has been quieter than usual? Is that relief or avoidance?', close: 'There is no wrong answer.', tags: { activation: 'emotional_processing', theme: 'shadow', intensity: 'gentle', moonPhases: ['waning_gibbous', 'waning_crescent'] } },
  { id: 'ref-07', context: 'Your emotional field is asking for attention.', question: 'What does tenderness feel like in your body right now?', close: 'Place a hand on your chest and breathe first.', tags: { activation: 'emotional_processing', theme: 'body', intensity: 'gentle', chakra: 'heart' } },
  { id: 'ref-08', context: 'Something is moving beneath the surface.', question: 'What part of today surprised your feelings?', close: 'Write without editing.', tags: { activation: 'emotional_processing', theme: 'growth', intensity: 'gentle' } },

  // ───────────────────────────────────────────────────────────────────────
  // ACTIVATION (⚡) — identity_pressure / creative_release
  // ───────────────────────────────────────────────────────────────────────

  { id: 'act-01', context: 'The way you see yourself is being renegotiated.', question: 'Where are you pushing — and where are you resisting?', close: 'Notice where your body reacts.', tags: { activation: 'identity_pressure', theme: 'identity', intensity: 'deep', transit: 'mars_aspect', chakra: 'solar_plexus' } },
  { id: 'act-02', context: 'Something about your sense of self is shifting.', question: 'What version of yourself are you outgrowing?', close: 'Let the answer be messy.', tags: { activation: 'identity_pressure', theme: 'growth', intensity: 'deep', elements: ['fire'], chakra: 'solar_plexus' } },
  { id: 'act-03', context: 'Identity feels less fixed than usual.', question: 'What part of you feels most visible right now?', close: 'Write what you mean, not what sounds good.', tags: { activation: 'identity_pressure', theme: 'identity', intensity: 'gentle', stelliumHouse: 1, chakra: 'solar_plexus' } },
  { id: 'act-04', context: 'You\'re being asked to show up differently.', question: 'What would change if you stopped performing confidence?', close: 'Write honestly, not politely.', tags: { activation: 'identity_pressure', theme: 'identity', intensity: 'deep', stelliumHouse: 10, chakra: 'solar_plexus' } },
  { id: 'act-05', context: 'Something wants expression.', question: 'What would you create if no one were watching?', close: 'Skip the explanation. Just feel it.', tags: { activation: 'creative_release', theme: 'creativity', intensity: 'gentle', elements: ['fire'], chakra: 'sacral', stelliumHouse: 5 } },
  { id: 'act-06', context: 'Creative energy is restless.', question: 'What impulse have you been editing before it arrives?', close: 'Write fast. Don\'t reread yet.', tags: { activation: 'creative_release', theme: 'expression', intensity: 'deep', transit: 'mars_aspect', chakra: 'sacral' } },
  { id: 'act-07', context: 'There\'s an impulse asking to be followed.', question: 'What feels slightly dangerous but alive?', close: 'Let this breathe.', tags: { activation: 'creative_release', theme: 'creativity', intensity: 'deep', elements: ['fire'] } },
  { id: 'act-08', context: 'Expression is more available than usual.', question: 'What wants to move through you today?', close: 'No performance required.', tags: { activation: 'creative_release', theme: 'expression', intensity: 'gentle', chakra: 'throat' } },

  // ───────────────────────────────────────────────────────────────────────
  // PATTERN AWARENESS (🔁) — inner_review
  // ───────────────────────────────────────────────────────────────────────

  { id: 'pat-01', context: 'This theme keeps returning for a reason.', question: 'When this shows up, what do you usually do first?', close: 'Notice, don\'t narrate.', tags: { activation: 'inner_review', theme: 'shadow', intensity: 'deep', transit: 'saturn_aspect', chakra: 'root' } },
  { id: 'pat-02', context: 'An older pattern is making itself known.', question: 'What habit are you ready to retire?', close: 'Let this sit without a conclusion.', tags: { activation: 'inner_review', theme: 'growth', intensity: 'deep', moonPhases: ['last_quarter', 'waning_crescent'] } },
  { id: 'pat-03', context: 'Something you set aside is asking for attention.', question: 'What did you promise yourself you\'d revisit?', close: 'You don\'t need clarity yet.', tags: { activation: 'inner_review', theme: 'purpose', intensity: 'gentle', transit: 'mercury_aspect' } },
  { id: 'pat-04', context: 'There\'s a review happening beneath the noise.', question: 'What keeps resolving the same way — and what would change the loop?', close: 'Write without editing.', tags: { activation: 'inner_review', theme: 'shadow', intensity: 'deep' } },
  { id: 'pat-05', context: 'This theme keeps returning for a reason.', question: 'What would the wiser version of you say about this pattern?', close: 'This is just for you.', tags: { activation: 'inner_review', theme: 'growth', intensity: 'deep', nodeDirection: 'south' } },
  { id: 'pat-06', context: 'An older pattern is making itself known.', question: 'What have you learned from repeating this?', close: 'Let the answer be messy.', tags: { activation: 'inner_review', theme: 'shadow', intensity: 'gentle' } },
  { id: 'pat-07', context: 'Something you set aside is asking for attention.', question: 'What part of your past is trying to teach you something right now?', close: 'Name it without fixing it.', tags: { activation: 'inner_review', theme: 'shadow', intensity: 'deep', chironHouse: 4, chakra: 'heart' } },
  { id: 'pat-08', context: 'There\'s a review happening beneath the noise.', question: 'What would it take to break this cycle gently?', close: 'One sentence is enough.', tags: { activation: 'inner_review', theme: 'growth', intensity: 'gentle', transit: 'saturn_aspect' } },

  // ───────────────────────────────────────────────────────────────────────
  // RELATIONSHIP (💫) — relationship_mirroring
  // ───────────────────────────────────────────────────────────────────────

  { id: 'rel-01', context: 'Connection is acting as a mirror today.', question: 'What are you asking for — without saying it?', close: 'Write honestly, not politely.', tags: { activation: 'relationship_mirroring', theme: 'relationships', intensity: 'deep', stelliumHouse: 7, chakra: 'heart', transit: 'venus_aspect' } },
  { id: 'rel-02', context: 'Relationships are surfacing something personal.', question: 'Where do you soften yourself to stay close?', close: 'Let this be incomplete.', tags: { activation: 'relationship_mirroring', theme: 'relationships', intensity: 'deep', chakra: 'heart' } },
  { id: 'rel-03', context: 'What\'s happening between you and others is revealing.', question: 'What feels unbalanced, even if it looks fine?', close: 'Name it without fixing it.', tags: { activation: 'relationship_mirroring', theme: 'relationships', intensity: 'deep', elements: ['air'], stelliumHouse: 7 } },
  { id: 'rel-04', context: 'Closeness is highlighting something important.', question: 'What do you need from connection that you haven\'t named?', close: 'Stay with whatever came up first.', tags: { activation: 'relationship_mirroring', theme: 'relationships', intensity: 'gentle', transit: 'venus_aspect', chakra: 'heart' } },
  { id: 'rel-05', context: 'Connection is acting as a mirror today.', question: 'Who in your life reflects a part of you that you don\'t show?', close: 'This is just for you.', tags: { activation: 'relationship_mirroring', theme: 'shadow', intensity: 'deep', chironHouse: 7, chakra: 'heart' } },
  { id: 'rel-06', context: 'Relationships are surfacing something personal.', question: 'What boundary feels necessary but uncomfortable?', close: 'You don\'t have to solve this.', tags: { activation: 'relationship_mirroring', theme: 'relationships', intensity: 'deep', chakra: 'solar_plexus' } },
  { id: 'rel-07', context: 'Closeness is highlighting something important.', question: 'What does trust look like in your body right now?', close: 'Place a hand on your chest and breathe first.', tags: { activation: 'relationship_mirroring', theme: 'relationships', intensity: 'gentle', chakra: 'heart', elements: ['water'] } },
  { id: 'rel-08', context: 'What\'s happening between you and others is revealing.', question: 'What conversation are you avoiding — and what does it protect?', close: 'Write what you mean, not what sounds good.', tags: { activation: 'relationship_mirroring', theme: 'relationships', intensity: 'deep', transit: 'mercury_aspect', chakra: 'throat' } },

  // ───────────────────────────────────────────────────────────────────────
  // BOUNDARY (🛡️) — boundary_testing
  // ───────────────────────────────────────────────────────────────────────

  { id: 'bnd-01', context: 'Your limits are being tested — gently or not.', question: 'What did you agree to that doesn\'t sit right?', close: 'Write honestly, not politely.', tags: { activation: 'boundary_testing', theme: 'relationships', intensity: 'deep', transit: 'mars_aspect', chakra: 'solar_plexus' } },
  { id: 'bnd-02', context: 'Something is pressing against a boundary.', question: 'Where do you say yes when you mean no?', close: 'Name it without fixing it.', tags: { activation: 'boundary_testing', theme: 'identity', intensity: 'deep', elements: ['fire'] } },
  { id: 'bnd-03', context: 'The line between yours and not-yours is blurring.', question: 'What energy are you carrying that belongs to someone else?', close: 'Let the answer be messy.', tags: { activation: 'boundary_testing', theme: 'release', intensity: 'deep', elements: ['water'], chakra: 'sacral' } },
  { id: 'bnd-04', context: 'You\'re being asked to define what you need.', question: 'What would protecting your peace look like today?', close: 'One sentence is enough.', tags: { activation: 'boundary_testing', theme: 'safety', intensity: 'gentle', chakra: 'root' } },
  { id: 'bnd-05', context: 'Something is pressing against a boundary.', question: 'What feels intrusive — even if it comes from love?', close: 'You don\'t have to solve this.', tags: { activation: 'boundary_testing', theme: 'relationships', intensity: 'deep', chironHouse: 8, chakra: 'sacral' } },
  { id: 'bnd-06', context: 'Your limits are being tested — gently or not.', question: 'What are you tolerating that costs you energy?', close: 'Notice where your body reacts.', tags: { activation: 'boundary_testing', theme: 'body', intensity: 'gentle', transit: 'saturn_aspect', chakra: 'root' } },

  // ───────────────────────────────────────────────────────────────────────
  // INTEGRATION (🌀) — integration_phase
  // ───────────────────────────────────────────────────────────────────────

  { id: 'int-01', context: 'Pieces are coming together.', question: 'What are you beginning to understand that you couldn\'t before?', close: 'Let this sit without a conclusion.', tags: { activation: 'integration_phase', theme: 'growth', intensity: 'gentle', moonPhases: ['waxing_gibbous', 'full'], chakra: 'third_eye' } },
  { id: 'int-02', context: 'Something is settling into place.', question: 'What truth feels ready to be named?', close: 'Write without editing.', tags: { activation: 'integration_phase', theme: 'identity', intensity: 'deep', moonPhases: ['full', 'waning_gibbous'], chakra: 'crown' } },
  { id: 'int-03', context: 'This is a moment of quiet synthesis.', question: 'What have you learned recently that hasn\'t been acknowledged?', close: 'This is just for you.', tags: { activation: 'integration_phase', theme: 'growth', intensity: 'gentle', moonPhases: ['waning_gibbous'], chakra: 'third_eye' } },
  { id: 'int-04', context: 'Understanding is catching up to experience.', question: 'What insight wants to be shared — even just with yourself?', close: 'No performance required.', tags: { activation: 'integration_phase', theme: 'expression', intensity: 'gentle', transit: 'jupiter_aspect', chakra: 'crown' } },
  { id: 'int-05', context: 'Pieces are coming together.', question: 'What contradictions are you learning to hold at the same time?', close: 'Let this be incomplete.', tags: { activation: 'integration_phase', theme: 'growth', intensity: 'deep', chakra: 'third_eye' } },
  { id: 'int-06', context: 'Something is settling into place.', question: 'What used to confuse you that now makes sense?', close: 'Let the answer be messy.', tags: { activation: 'integration_phase', theme: 'growth', intensity: 'gentle', nodeDirection: 'north' } },

  // ───────────────────────────────────────────────────────────────────────
  // SOMATIC (🫀) — somatic_awareness
  // ───────────────────────────────────────────────────────────────────────

  { id: 'som-01', context: 'Your system is asking for attention here.', question: 'Where do you feel this in your body?', close: 'Place a hand on your chest and breathe first.', tags: { activation: 'somatic_awareness', theme: 'body', intensity: 'gentle', chakra: 'root', elements: ['earth'] } },
  { id: 'som-02', context: 'The body is holding something the mind hasn\'t named.', question: 'What does safety feel like in your body right now?', close: 'Notice, don\'t narrate.', tags: { activation: 'somatic_awareness', theme: 'safety', intensity: 'gentle', stelliumHouse: 4, chakra: 'root' } },
  { id: 'som-03', context: 'Physical sensation carries information today.', question: 'What part of your body relaxes when you stop trying?', close: 'You don\'t have to solve this.', tags: { activation: 'somatic_awareness', theme: 'release', intensity: 'gentle', chakra: 'root', elements: ['earth'] } },
  { id: 'som-04', context: 'Notice where your attention goes in your body.', question: 'What does your nervous system need right now — movement, stillness, or contact?', close: 'One sentence is enough.', tags: { activation: 'somatic_awareness', theme: 'body', intensity: 'gentle', chakra: 'sacral' } },
  { id: 'som-05', context: 'The body is holding something the mind hasn\'t named.', question: 'What tension are you so used to that you forgot it was there?', close: 'Notice where your body reacts.', tags: { activation: 'somatic_awareness', theme: 'body', intensity: 'deep', chakra: 'solar_plexus', transit: 'mars_aspect' } },
  { id: 'som-06', context: 'Your system is asking for attention here.', question: 'If your body could speak one sentence right now, what would it say?', close: 'Write without editing.', tags: { activation: 'somatic_awareness', theme: 'body', intensity: 'deep', chakra: 'throat' } },

  // ───────────────────────────────────────────────────────────────────────
  // MOON PHASE SPECIFIC
  // ───────────────────────────────────────────────────────────────────────

  // New Moon — intention, beginning
  { id: 'moon-01', context: 'A cycle is beginning.', question: 'What are you planting — even if you can\'t see it yet?', close: 'Let this be incomplete.', tags: { activation: 'emotional_processing', theme: 'growth', intensity: 'gentle', moonPhases: ['new'] } },
  { id: 'moon-02', context: 'Darkness holds potential.', question: 'What wants to begin before you feel ready?', close: 'You don\'t need clarity yet.', tags: { activation: 'creative_release', theme: 'growth', intensity: 'gentle', moonPhases: ['new'] } },
  { id: 'moon-03', context: 'Things are quieter now.', question: 'What intention feels most honest right now?', close: 'One sentence is enough.', tags: { activation: 'integration_phase', theme: 'purpose', intensity: 'gentle', moonPhases: ['new'] } },

  // Waxing Crescent — momentum, courage
  { id: 'moon-04', context: 'Momentum is building.', question: 'What first step have you been overthinking?', close: 'Write fast. Don\'t reread yet.', tags: { activation: 'identity_pressure', theme: 'growth', intensity: 'gentle', moonPhases: ['waxing_crescent'] } },
  { id: 'moon-05', context: 'Energy is gathering.', question: 'What feels possible today that didn\'t last week?', close: 'Let this breathe.', tags: { activation: 'creative_release', theme: 'growth', intensity: 'gentle', moonPhases: ['waxing_crescent'] } },

  // First Quarter — challenge, decision
  { id: 'moon-06', context: 'A tension point is asking for a decision.', question: 'What are you sitting on the fence about?', close: 'Name it without fixing it.', tags: { activation: 'boundary_testing', theme: 'identity', intensity: 'deep', moonPhases: ['first_quarter'] } },
  { id: 'moon-07', context: 'Action and doubt are coexisting.', question: 'What needs to be decided before it decides for you?', close: 'Write what you mean, not what sounds good.', tags: { activation: 'identity_pressure', theme: 'purpose', intensity: 'deep', moonPhases: ['first_quarter'] } },

  // Waxing Gibbous — refinement, sharing
  { id: 'moon-08', context: 'Something is almost ready.', question: 'What needs adjustment before it\'s complete?', close: 'Let the answer be messy.', tags: { activation: 'integration_phase', theme: 'growth', intensity: 'gentle', moonPhases: ['waxing_gibbous'] } },
  { id: 'moon-09', context: 'Refinement is the work right now.', question: 'What have you been perfecting that just needs to be released?', close: 'No performance required.', tags: { activation: 'inner_review', theme: 'release', intensity: 'gentle', moonPhases: ['waxing_gibbous'] } },

  // Full Moon — illumination, release
  { id: 'moon-10', context: 'Something is fully visible now.', question: 'What can you finally see clearly?', close: 'Write without editing.', tags: { activation: 'emotional_processing', theme: 'shadow', intensity: 'deep', moonPhases: ['full'] } },
  { id: 'moon-11', context: 'Illumination can feel overwhelming.', question: 'What truth is louder tonight than it was this morning?', close: 'Stay with whatever came up first.', tags: { activation: 'emotional_processing', theme: 'identity', intensity: 'deep', moonPhases: ['full'] } },
  { id: 'moon-12', context: 'The full moon reveals what was hidden.', question: 'What emotion broke through today that you\'d been containing?', close: 'This is just for you.', tags: { activation: 'emotional_processing', theme: 'release', intensity: 'deep', moonPhases: ['full'], chakra: 'crown' } },

  // Waning Gibbous — gratitude, meaning
  { id: 'moon-13', context: 'The peak has passed. Meaning is settling.', question: 'What insight arrived recently that you haven\'t fully absorbed?', close: 'Let this sit without a conclusion.', tags: { activation: 'integration_phase', theme: 'growth', intensity: 'gentle', moonPhases: ['waning_gibbous'] } },
  { id: 'moon-14', context: 'This is a sharing phase.', question: 'What did you learn that someone else might need to hear?', close: 'Write what you mean, not what sounds good.', tags: { activation: 'integration_phase', theme: 'expression', intensity: 'gentle', moonPhases: ['waning_gibbous'] } },

  // Last Quarter — release, letting go
  { id: 'moon-15', context: 'Release is the work now.', question: 'What are you holding onto out of habit, not need?', close: 'Name it without fixing it.', tags: { activation: 'inner_review', theme: 'release', intensity: 'deep', moonPhases: ['last_quarter'] } },
  { id: 'moon-16', context: 'Old structures are loosening.', question: 'What belief served you once but limits you now?', close: 'You don\'t have to solve this.', tags: { activation: 'inner_review', theme: 'shadow', intensity: 'deep', moonPhases: ['last_quarter'] } },

  // Waning Crescent — rest, surrender
  { id: 'moon-17', context: 'The quietest part of the cycle.', question: 'What does rest look like when it isn\'t earned?', close: 'Let this breathe.', tags: { activation: 'somatic_awareness', theme: 'safety', intensity: 'gentle', moonPhases: ['waning_crescent'], chakra: 'root' } },
  { id: 'moon-18', context: 'Stillness holds its own information.', question: 'What can you only notice when you stop doing?', close: 'Notice, don\'t narrate.', tags: { activation: 'somatic_awareness', theme: 'body', intensity: 'gentle', moonPhases: ['waning_crescent'] } },

  // ───────────────────────────────────────────────────────────────────────
  // TRANSIT-TRIGGERED
  // ───────────────────────────────────────────────────────────────────────

  // Mars aspects — friction, momentum, urgency
  { id: 'tr-mars-01', context: 'Friction is pointing at something.', question: 'What do you want to say, but keep editing?', close: 'Write fast. Don\'t reread yet.', tags: { activation: 'boundary_testing', theme: 'expression', intensity: 'deep', transit: 'mars_aspect', chakra: 'throat' } },
  { id: 'tr-mars-02', context: 'Energy is looking for direction.', question: 'Where does urgency feel louder than clarity?', close: 'Notice where your body reacts.', tags: { activation: 'identity_pressure', theme: 'body', intensity: 'deep', transit: 'mars_aspect', chakra: 'solar_plexus' } },
  { id: 'tr-mars-03', context: 'Something needs expression before it turns into tension.', question: 'What needs to be said, done, or moved through today?', close: 'Write without editing.', tags: { activation: 'creative_release', theme: 'expression', intensity: 'deep', transit: 'mars_aspect', elements: ['fire'] } },
  { id: 'tr-mars-04', context: 'Friction is pointing at something.', question: 'What irritation is actually pointing at something important?', close: 'Stay with whatever came up first.', tags: { activation: 'boundary_testing', theme: 'shadow', intensity: 'deep', transit: 'mars_aspect' } },

  // Venus aspects — love, value, desire
  { id: 'tr-ven-01', context: 'What you value is highlighted.', question: 'What relationship dynamic deserves your honest attention?', close: 'Write honestly, not politely.', tags: { activation: 'relationship_mirroring', theme: 'relationships', intensity: 'deep', transit: 'venus_aspect', chakra: 'heart' } },
  { id: 'tr-ven-02', context: 'Desire is asking for space.', question: 'What do you want — not what you should want?', close: 'Skip the explanation. Just feel it.', tags: { activation: 'emotional_processing', theme: 'identity', intensity: 'deep', transit: 'venus_aspect', chakra: 'sacral' } },
  { id: 'tr-ven-03', context: 'Beauty and connection feel more available.', question: 'What feels beautiful to you right now?', close: 'Let this breathe.', tags: { activation: 'emotional_processing', theme: 'creativity', intensity: 'gentle', transit: 'venus_aspect' } },
  { id: 'tr-ven-04', context: 'What you value is highlighted.', question: 'Where are you undervaluing yourself?', close: 'This is just for you.', tags: { activation: 'identity_pressure', theme: 'identity', intensity: 'deep', transit: 'venus_aspect', chakra: 'solar_plexus' } },

  // Saturn aspects — structure, limits, maturity
  { id: 'tr-sat-01', context: 'Responsibility is weighing in.', question: 'What pressure are you carrying that isn\'t yours?', close: 'You don\'t have to solve this.', tags: { activation: 'boundary_testing', theme: 'purpose', intensity: 'deep', transit: 'saturn_aspect', chakra: 'root', stelliumHouse: 10 } },
  { id: 'tr-sat-02', context: 'Structure and limitation are teachers today.', question: 'What restriction is actually protecting you?', close: 'Let the answer be messy.', tags: { activation: 'inner_review', theme: 'safety', intensity: 'deep', transit: 'saturn_aspect' } },
  { id: 'tr-sat-03', context: 'Something asks for patience.', question: 'What are you trying to rush that needs more time?', close: 'One sentence is enough.', tags: { activation: 'inner_review', theme: 'growth', intensity: 'gentle', transit: 'saturn_aspect', chakra: 'root' } },
  { id: 'tr-sat-04', context: 'Discipline and self-doubt look similar from the inside.', question: 'What standard are you holding yourself to — and who set it?', close: 'Write what you mean, not what sounds good.', tags: { activation: 'identity_pressure', theme: 'purpose', intensity: 'deep', transit: 'saturn_aspect' } },

  // Jupiter aspects — expansion, meaning, growth
  { id: 'tr-jup-01', context: 'Something is expanding.', question: 'What opportunity feels aligned — even if it\'s scary?', close: 'Let this breathe.', tags: { activation: 'integration_phase', theme: 'growth', intensity: 'gentle', transit: 'jupiter_aspect', chakra: 'third_eye' } },
  { id: 'tr-jup-02', context: 'Meaning is more available today.', question: 'What are you ready to believe about yourself that you haven\'t yet?', close: 'No performance required.', tags: { activation: 'identity_pressure', theme: 'growth', intensity: 'deep', transit: 'jupiter_aspect' } },
  { id: 'tr-jup-03', context: 'Growth is asking for space.', question: 'What would you pursue if limitation weren\'t the first thought?', close: 'Write without editing.', tags: { activation: 'creative_release', theme: 'purpose', intensity: 'gentle', transit: 'jupiter_aspect', elements: ['fire'] } },

  // Mercury aspects — thought, communication, processing
  { id: 'tr-mer-01', context: 'Your thinking wants to be heard.', question: 'What thought keeps circling that hasn\'t found its landing?', close: 'Write fast. Don\'t reread yet.', tags: { activation: 'inner_review', theme: 'expression', intensity: 'gentle', transit: 'mercury_aspect', chakra: 'throat' } },
  { id: 'tr-mer-02', context: 'Words carry more weight today.', question: 'What are you rehearsing in your head that needs to be said or released?', close: 'Write what you mean, not what sounds good.', tags: { activation: 'creative_release', theme: 'expression', intensity: 'deep', transit: 'mercury_aspect', chakra: 'throat' } },
  { id: 'tr-mer-03', context: 'Mental activity is heightened.', question: 'What are you overanalyzing? What would intuition say instead?', close: 'One sentence is enough.', tags: { activation: 'inner_review', theme: 'body', intensity: 'gentle', transit: 'mercury_aspect', chakra: 'third_eye' } },

  // Moon transit — emotional processing, needs
  { id: 'tr-moon-01', context: 'Emotional currents are shifting.', question: 'What do you need right now — not later, not tomorrow?', close: 'Stay with whatever came up first.', tags: { activation: 'emotional_processing', theme: 'body', intensity: 'gentle', transit: 'moon_transit', chakra: 'sacral' } },
  { id: 'tr-moon-02', context: 'The emotional body is active.', question: 'What feeling showed up uninvited today?', close: 'Let this be incomplete.', tags: { activation: 'emotional_processing', theme: 'shadow', intensity: 'gentle', transit: 'moon_transit' } },
  { id: 'tr-moon-03', context: 'Sensitivity is heightened.', question: 'What are you absorbing from your environment that isn\'t yours?', close: 'Name it without fixing it.', tags: { activation: 'somatic_awareness', theme: 'safety', intensity: 'gentle', transit: 'moon_transit', elements: ['water'], chakra: 'sacral' } },

  // Sun aspects — purpose, vitality
  { id: 'tr-sun-01', context: 'Your sense of direction is highlighted.', question: 'What feels meaningful right now — not important, meaningful?', close: 'This is just for you.', tags: { activation: 'identity_pressure', theme: 'purpose', intensity: 'gentle', transit: 'sun_aspect', chakra: 'solar_plexus' } },
  { id: 'tr-sun-02', context: 'Vitality and purpose are connected today.', question: 'What gives you energy — and what depletes it?', close: 'Notice where your body reacts.', tags: { activation: 'somatic_awareness', theme: 'purpose', intensity: 'gentle', transit: 'sun_aspect', elements: ['fire'] } },

  // Outer planet aspects — deep transformation
  { id: 'tr-ura-01', context: 'Something unexpected is shaking loose.', question: 'What part of your life feels ripe for disruption?', close: 'Let the answer be messy.', tags: { activation: 'identity_pressure', theme: 'growth', intensity: 'deep', transit: 'uranus_aspect' } },
  { id: 'tr-nep-01', context: 'Clarity and confusion are dancing.', question: 'What feels hazy right now — is it fog or protection?', close: 'You don\'t need clarity yet.', tags: { activation: 'emotional_processing', theme: 'shadow', intensity: 'deep', transit: 'neptune_aspect', chakra: 'third_eye', elements: ['water'] } },
  { id: 'tr-plu-01', context: 'Something deep is transforming.', question: 'What are you outgrowing that still has a grip on you?', close: 'Write honestly, not politely.', tags: { activation: 'emotional_processing', theme: 'shadow', intensity: 'deep', transit: 'pluto_aspect', chakra: 'sacral' } },

  // Chiron transit
  { id: 'tr-chi-01', context: 'Something tender is active.', question: 'What feels sensitive today?', close: 'You don\'t have to solve this.', tags: { activation: 'somatic_awareness', theme: 'body', intensity: 'gentle', transit: 'chiron_transit', chakra: 'heart' } },
  { id: 'tr-chi-02', context: 'Heightened awareness is present.', question: 'What deserves gentleness right now?', close: 'Place a hand on your chest and breathe first.', tags: { activation: 'emotional_processing', theme: 'safety', intensity: 'gentle', transit: 'chiron_transit', chakra: 'heart' } },
  { id: 'tr-chi-03', context: 'An old sensitivity is being revisited.', question: 'What part of you learned to hide — and is it ready to be seen?', close: 'Let this be incomplete.', tags: { activation: 'inner_review', theme: 'shadow', intensity: 'deep', transit: 'chiron_transit' } },

  // ───────────────────────────────────────────────────────────────────────
  // STELLIUM HOUSE PROMPTS
  // ───────────────────────────────────────────────────────────────────────

  // House 1 — Identity
  { id: 'st-h1-01', context: 'This theme has shaped how you see yourself.', question: 'Who are you trying to be today — and who are you when no one\'s watching?', close: 'Let the answer be messy.', tags: { activation: 'identity_pressure', theme: 'identity', intensity: 'deep', stelliumHouse: 1, chakra: 'solar_plexus' } },
  { id: 'st-h1-02', context: 'This theme has shaped how you see yourself.', question: 'Where does confidence feel real, not performed?', close: 'Write what you mean, not what sounds good.', tags: { activation: 'identity_pressure', theme: 'identity', intensity: 'deep', stelliumHouse: 1, chakra: 'solar_plexus' } },

  // House 2 — Worth
  { id: 'st-h2-01', context: 'Value and security are magnified here.', question: 'What makes you feel worthy — and is that measure fair?', close: 'This is just for you.', tags: { activation: 'inner_review', theme: 'identity', intensity: 'deep', stelliumHouse: 2, chakra: 'root' } },
  { id: 'st-h2-02', context: 'Value and security are magnified here.', question: 'What are you building that\'s truly yours?', close: 'Let this breathe.', tags: { activation: 'integration_phase', theme: 'purpose', intensity: 'gentle', stelliumHouse: 2, chakra: 'root' } },

  // House 3 — Voice
  { id: 'st-h3-01', context: 'Expression carries concentrated energy.', question: 'What do you wish you\'d said — or unsaid?', close: 'Write fast. Don\'t reread yet.', tags: { activation: 'creative_release', theme: 'expression', intensity: 'deep', stelliumHouse: 3, chakra: 'throat' } },
  { id: 'st-h3-02', context: 'Expression carries concentrated energy.', question: 'What feels safe to express here that isn\'t safe anywhere else?', close: 'No performance required.', tags: { activation: 'creative_release', theme: 'expression', intensity: 'gentle', stelliumHouse: 3, chakra: 'throat' } },

  // House 4 — Inner World
  { id: 'st-h4-01', context: 'Old emotional material is active.', question: 'What feels familiar — even if it no longer fits?', close: 'You don\'t have to solve this.', tags: { activation: 'emotional_processing', theme: 'safety', intensity: 'deep', stelliumHouse: 4, chakra: 'heart' } },
  { id: 'st-h4-02', context: 'Old emotional material is active.', question: 'What part of you learned this pattern early?', close: 'Name it without fixing it.', tags: { activation: 'inner_review', theme: 'shadow', intensity: 'deep', stelliumHouse: 4, chakra: 'root' } },
  { id: 'st-h4-03', context: 'Old emotional material is active.', question: 'What does safety feel like in your body right now?', close: 'Place a hand on your chest and breathe first.', tags: { activation: 'somatic_awareness', theme: 'body', intensity: 'gentle', stelliumHouse: 4, chakra: 'root' } },

  // House 5 — Joy / Expression
  { id: 'st-h5-01', context: 'Creative and emotional expression are amplified.', question: 'What would feel playful if nothing were at stake?', close: 'Skip the explanation. Just feel it.', tags: { activation: 'creative_release', theme: 'creativity', intensity: 'gentle', stelliumHouse: 5, chakra: 'sacral' } },
  { id: 'st-h5-02', context: 'Creative and emotional expression are amplified.', question: 'What do you enjoy that you\'ve stopped allowing yourself?', close: 'Let this breathe.', tags: { activation: 'emotional_processing', theme: 'creativity', intensity: 'deep', stelliumHouse: 5, chakra: 'sacral' } },

  // House 6 — Routine / Health
  { id: 'st-h6-01', context: 'Routine and wellness are in focus.', question: 'What does your body need that your schedule ignores?', close: 'One sentence is enough.', tags: { activation: 'somatic_awareness', theme: 'body', intensity: 'gentle', stelliumHouse: 6, chakra: 'solar_plexus' } },
  { id: 'st-h6-02', context: 'Routine and wellness are in focus.', question: 'Where are you optimizing instead of listening?', close: 'Notice, don\'t narrate.', tags: { activation: 'inner_review', theme: 'body', intensity: 'deep', stelliumHouse: 6, chakra: 'solar_plexus' } },

  // House 7 — Relationships
  { id: 'st-h7-01', context: 'Connection is acting as a mirror.', question: 'What are you asking for — without saying it?', close: 'Write honestly, not politely.', tags: { activation: 'relationship_mirroring', theme: 'relationships', intensity: 'deep', stelliumHouse: 7, chakra: 'heart' } },
  { id: 'st-h7-02', context: 'Connection is acting as a mirror.', question: 'Where do you soften yourself to stay close?', close: 'Let this be incomplete.', tags: { activation: 'relationship_mirroring', theme: 'relationships', intensity: 'deep', stelliumHouse: 7, chakra: 'heart' } },

  // House 8 — Depth / Trust
  { id: 'st-h8-01', context: 'Emotional depth is magnified.', question: 'What feels intense right now — and are you running toward or away from it?', close: 'Stay with whatever came up first.', tags: { activation: 'emotional_processing', theme: 'shadow', intensity: 'deep', stelliumHouse: 8, chakra: 'sacral' } },
  { id: 'st-h8-02', context: 'Emotional depth is magnified.', question: 'Where does trust feel delicate?', close: 'You don\'t have to solve this.', tags: { activation: 'relationship_mirroring', theme: 'relationships', intensity: 'deep', stelliumHouse: 8, chakra: 'sacral' } },

  // House 9 — Meaning / Belief
  { id: 'st-h9-01', context: 'Questions of meaning are active.', question: 'What belief is shifting — even slightly?', close: 'Let the answer be messy.', tags: { activation: 'inner_review', theme: 'growth', intensity: 'deep', stelliumHouse: 9, chakra: 'third_eye' } },
  { id: 'st-h9-02', context: 'Questions of meaning are active.', question: 'What no longer fits your understanding of the world?', close: 'Write without editing.', tags: { activation: 'inner_review', theme: 'growth', intensity: 'deep', stelliumHouse: 9, chakra: 'third_eye' } },

  // House 10 — Purpose
  { id: 'st-h10-01', context: 'Direction and pressure are linked today.', question: 'What expectation are you carrying that isn\'t yours?', close: 'Notice where your body reacts.', tags: { activation: 'identity_pressure', theme: 'purpose', intensity: 'deep', stelliumHouse: 10, chakra: 'solar_plexus' } },
  { id: 'st-h10-02', context: 'Direction and pressure are linked today.', question: 'What would change if you stopped proving yourself?', close: 'Write what you mean, not what sounds good.', tags: { activation: 'identity_pressure', theme: 'purpose', intensity: 'deep', stelliumHouse: 10, chakra: 'solar_plexus' } },
  { id: 'st-h10-03', context: 'Direction and pressure are linked today.', question: 'What version of success feels heavy?', close: 'Name it without fixing it.', tags: { activation: 'boundary_testing', theme: 'purpose', intensity: 'deep', stelliumHouse: 10, chakra: 'solar_plexus' } },

  // House 11 — Belonging
  { id: 'st-h11-01', context: 'Community and individuality are in tension.', question: 'Where do you feel most seen — and most different?', close: 'This is just for you.', tags: { activation: 'identity_pressure', theme: 'identity', intensity: 'deep', stelliumHouse: 11, chakra: 'heart' } },
  { id: 'st-h11-02', context: 'Community and individuality are in tension.', question: 'What part of you feels ahead of its time?', close: 'No performance required.', tags: { activation: 'identity_pressure', theme: 'identity', intensity: 'gentle', stelliumHouse: 11 } },

  // House 12 — Inner World / Unconscious
  { id: 'st-h12-01', context: 'The inner world is unusually active.', question: 'What are you sensing beneath words?', close: 'Notice, don\'t narrate.', tags: { activation: 'somatic_awareness', theme: 'shadow', intensity: 'deep', stelliumHouse: 12, chakra: 'crown' } },
  { id: 'st-h12-02', context: 'The inner world is unusually active.', question: 'What feels unspoken but real?', close: 'Let this sit without a conclusion.', tags: { activation: 'emotional_processing', theme: 'shadow', intensity: 'deep', stelliumHouse: 12, chakra: 'crown' } },

  // ───────────────────────────────────────────────────────────────────────
  // CHIRON HOUSE PROMPTS
  // ───────────────────────────────────────────────────────────────────────

  { id: 'ch-h1-01', context: 'A sensitive part of your identity is present.', question: 'What part of yourself feels most tender today?', close: 'Let this be incomplete.', tags: { activation: 'somatic_awareness', theme: 'identity', intensity: 'gentle', chironHouse: 1, chakra: 'solar_plexus' } },
  { id: 'ch-h1-02', context: 'A sensitive part of your identity is present.', question: 'When do you feel most yourself — without trying?', close: 'No performance required.', tags: { activation: 'identity_pressure', theme: 'identity', intensity: 'gentle', chironHouse: 1, chakra: 'solar_plexus' } },

  { id: 'ch-h2-01', context: 'Sensitivity around value is heightened.', question: 'What makes you feel secure right now?', close: 'One sentence is enough.', tags: { activation: 'emotional_processing', theme: 'safety', intensity: 'gentle', chironHouse: 2, chakra: 'root' } },
  { id: 'ch-h2-02', context: 'Sensitivity around value is heightened.', question: 'Where do you measure your worth too harshly?', close: 'Write honestly, not politely.', tags: { activation: 'inner_review', theme: 'identity', intensity: 'deep', chironHouse: 2, chakra: 'root' } },

  { id: 'ch-h3-01', context: 'Expression feels extra charged.', question: 'What do you wish you\'d said?', close: 'Write fast. Don\'t reread yet.', tags: { activation: 'creative_release', theme: 'expression', intensity: 'deep', chironHouse: 3, chakra: 'throat' } },
  { id: 'ch-h3-02', context: 'Expression feels extra charged.', question: 'What feels safe to express here?', close: 'This is just for you.', tags: { activation: 'creative_release', theme: 'expression', intensity: 'gentle', chironHouse: 3, chakra: 'throat' } },

  { id: 'ch-h4-01', context: 'Emotional roots are surfacing.', question: 'What feels familiar here?', close: 'You don\'t have to solve this.', tags: { activation: 'emotional_processing', theme: 'safety', intensity: 'gentle', chironHouse: 4, chakra: 'heart' } },
  { id: 'ch-h4-02', context: 'Emotional roots are surfacing.', question: 'What does comfort look like today?', close: 'Place a hand on your chest and breathe first.', tags: { activation: 'somatic_awareness', theme: 'safety', intensity: 'gentle', chironHouse: 4, chakra: 'heart' } },

  { id: 'ch-h5-01', context: 'Joy carries extra tenderness today.', question: 'What wants expression right now?', close: 'Skip the explanation. Just feel it.', tags: { activation: 'creative_release', theme: 'creativity', intensity: 'gentle', chironHouse: 5, chakra: 'sacral' } },
  { id: 'ch-h5-02', context: 'Joy carries extra tenderness today.', question: 'What would feel playful if nothing were at stake?', close: 'Let this breathe.', tags: { activation: 'creative_release', theme: 'creativity', intensity: 'gentle', chironHouse: 5, chakra: 'sacral' } },

  { id: 'ch-h6-01', context: 'Self-care and self-criticism are close together.', question: 'What does your body need today?', close: 'Notice, don\'t narrate.', tags: { activation: 'somatic_awareness', theme: 'body', intensity: 'gentle', chironHouse: 6, chakra: 'solar_plexus' } },
  { id: 'ch-h6-02', context: 'Self-care and self-criticism are close together.', question: 'Where are you trying to fix instead of listen?', close: 'Let this be incomplete.', tags: { activation: 'inner_review', theme: 'body', intensity: 'deep', chironHouse: 6, chakra: 'solar_plexus' } },

  { id: 'ch-h7-01', context: 'Connection carries extra sensitivity.', question: 'What feels tender in connection today?', close: 'Write honestly, not politely.', tags: { activation: 'relationship_mirroring', theme: 'relationships', intensity: 'gentle', chironHouse: 7, chakra: 'heart' } },
  { id: 'ch-h7-02', context: 'Connection carries extra sensitivity.', question: 'Where do you hold back to stay safe?', close: 'Name it without fixing it.', tags: { activation: 'relationship_mirroring', theme: 'relationships', intensity: 'deep', chironHouse: 7, chakra: 'heart' } },

  { id: 'ch-h8-01', context: 'Trust and vulnerability are close to the surface.', question: 'What feels intense right now?', close: 'Stay with whatever came up first.', tags: { activation: 'emotional_processing', theme: 'shadow', intensity: 'deep', chironHouse: 8, chakra: 'sacral' } },
  { id: 'ch-h8-02', context: 'Trust and vulnerability are close to the surface.', question: 'Where does trust feel delicate?', close: 'You don\'t have to solve this.', tags: { activation: 'relationship_mirroring', theme: 'relationships', intensity: 'deep', chironHouse: 8, chakra: 'sacral' } },

  { id: 'ch-h9-01', context: 'Meaning is asking deeper questions.', question: 'What belief is shifting?', close: 'Let the answer be messy.', tags: { activation: 'inner_review', theme: 'growth', intensity: 'deep', chironHouse: 9, chakra: 'third_eye' } },
  { id: 'ch-h9-02', context: 'Meaning is asking deeper questions.', question: 'What no longer fits your view of the world?', close: 'Write without editing.', tags: { activation: 'inner_review', theme: 'growth', intensity: 'deep', chironHouse: 9, chakra: 'third_eye' } },

  { id: 'ch-h10-01', context: 'Achievement and sensitivity intersect here.', question: 'What are you proving — and to whom?', close: 'Notice where your body reacts.', tags: { activation: 'identity_pressure', theme: 'purpose', intensity: 'deep', chironHouse: 10, chakra: 'solar_plexus' } },
  { id: 'ch-h10-02', context: 'Achievement and sensitivity intersect here.', question: 'What would success feel like without pressure?', close: 'Let this sit without a conclusion.', tags: { activation: 'identity_pressure', theme: 'purpose', intensity: 'deep', chironHouse: 10, chakra: 'solar_plexus' } },

  { id: 'ch-h11-01', context: 'Belonging carries extra awareness.', question: 'Where do you feel seen?', close: 'This is just for you.', tags: { activation: 'identity_pressure', theme: 'identity', intensity: 'gentle', chironHouse: 11, chakra: 'heart' } },
  { id: 'ch-h11-02', context: 'Belonging carries extra awareness.', question: 'What part of you feels ahead of its time?', close: 'No performance required.', tags: { activation: 'identity_pressure', theme: 'identity', intensity: 'gentle', chironHouse: 11, chakra: 'heart' } },

  { id: 'ch-h12-01', context: 'Inner sensing is amplified.', question: 'What are you sensing beneath words?', close: 'Notice, don\'t narrate.', tags: { activation: 'somatic_awareness', theme: 'shadow', intensity: 'deep', chironHouse: 12, chakra: 'crown' } },
  { id: 'ch-h12-02', context: 'Inner sensing is amplified.', question: 'What feels unspoken but real?', close: 'Let this be incomplete.', tags: { activation: 'emotional_processing', theme: 'shadow', intensity: 'deep', chironHouse: 12, chakra: 'crown' } },

  // ───────────────────────────────────────────────────────────────────────
  // NODE DIRECTION PROMPTS
  // ───────────────────────────────────────────────────────────────────────

  // South Node (comfort / default mode)
  { id: 'sn-01', context: 'Something familiar is activated.', question: 'When you\'re overwhelmed, what do you default to?', close: 'Let the answer be messy.', tags: { activation: 'inner_review', theme: 'shadow', intensity: 'deep', nodeDirection: 'south' } },
  { id: 'sn-02', context: 'A familiar pattern is running.', question: 'What feels safest, even if it limits you?', close: 'Name it without fixing it.', tags: { activation: 'inner_review', theme: 'safety', intensity: 'deep', nodeDirection: 'south' } },
  { id: 'sn-03', context: 'Comfort and growth are in tension.', question: 'What do you return to automatically when things get hard?', close: 'This is just for you.', tags: { activation: 'inner_review', theme: 'shadow', intensity: 'gentle', nodeDirection: 'south' } },
  { id: 'sn-04', context: 'Old strategies are presenting themselves.', question: 'What coping mechanism served you once but doesn\'t anymore?', close: 'You don\'t have to solve this.', tags: { activation: 'inner_review', theme: 'release', intensity: 'deep', nodeDirection: 'south' } },

  // North Node (growth / expansion direction)
  { id: 'nn-01', context: 'Growth is calling — not loudly, but clearly.', question: 'What feels slightly uncomfortable but intriguing?', close: 'Let this breathe.', tags: { activation: 'integration_phase', theme: 'growth', intensity: 'gentle', nodeDirection: 'north' } },
  { id: 'nn-02', context: 'Something unfamiliar is becoming available.', question: 'Where are you being invited to grow, not forced?', close: 'One sentence is enough.', tags: { activation: 'integration_phase', theme: 'growth', intensity: 'gentle', nodeDirection: 'north' } },
  { id: 'nn-03', context: 'The edge of your comfort zone is visible.', question: 'What choice feels aligned, even if it scares you?', close: 'Write without editing.', tags: { activation: 'identity_pressure', theme: 'growth', intensity: 'deep', nodeDirection: 'north' } },
  { id: 'nn-04', context: 'Growth is calling — not loudly, but clearly.', question: 'What would growth look like if it felt safe?', close: 'No performance required.', tags: { activation: 'integration_phase', theme: 'growth', intensity: 'gentle', nodeDirection: 'north' } },

  // ───────────────────────────────────────────────────────────────────────
  // FALLBACK PROMPTS (when nothing is tight)
  // ───────────────────────────────────────────────────────────────────────

  { id: 'fb-01', context: 'A quiet moment of reflection.', question: 'What are you noticing more often lately?', close: 'Write without editing.', tags: { activation: 'integration_phase', theme: 'growth', intensity: 'gentle' } },
  { id: 'fb-02', context: 'Sometimes the quietest days hold the most.', question: 'What feels unresolved, but quieter now?', close: 'Let this sit without a conclusion.', tags: { activation: 'emotional_processing', theme: 'release', intensity: 'gentle' } },
  { id: 'fb-03', context: 'Growth happens in the in-between.', question: 'What are you outgrowing?', close: 'Name it without fixing it.', tags: { activation: 'inner_review', theme: 'growth', intensity: 'gentle' } },
  { id: 'fb-04', context: 'Today is yours.', question: 'What moment from today do you want to remember?', close: 'One sentence is enough.', tags: { activation: 'integration_phase', theme: 'growth', intensity: 'gentle' } },
  { id: 'fb-05', context: 'Reflection doesn\'t need a reason.', question: 'What would you tell a friend who felt exactly like you do right now?', close: 'This is just for you.', tags: { activation: 'emotional_processing', theme: 'relationships', intensity: 'gentle' } },
  { id: 'fb-06', context: 'This space is just for you.', question: 'What\'s on your mind that you haven\'t said out loud yet?', close: 'Write honestly, not politely.', tags: { activation: 'emotional_processing', theme: 'expression', intensity: 'gentle' } },
  { id: 'fb-07', context: 'Some things only become clear on paper.', question: 'What are you carrying that could be set down, even briefly?', close: 'Let this be incomplete.', tags: { activation: 'somatic_awareness', theme: 'release', intensity: 'gentle' } },
  { id: 'fb-08', context: 'Take a breath before you begin.', question: 'Where are you right now — really?', close: 'Stay with whatever came up first.', tags: { activation: 'somatic_awareness', theme: 'body', intensity: 'gentle' } },
];
