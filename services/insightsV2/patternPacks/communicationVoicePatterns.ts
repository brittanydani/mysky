import type { ArchivePattern, SignalKey } from '../types';

const communicationVoicePattern = (
  key: string,
  title: string,
  requiredSignals: SignalKey[],
  supportingSignals: SignalKey[],
  shameLabel: string,
  clarityReframe: string,
  description: string,
  tags: string[] = [],
): ArchivePattern => ({
  key,
  title,
  category: 'communicationVoice',
  description,
  requiredSignals,
  supportingSignals,
  shameLabel,
  clarityReframe,
  lookbackDays: 90,
  minEvidenceCount: 3,
  minScore: 0.58,
  cooldownDays: 10,
  tags,
});

const COMMUNICATION_VOICE_FOUNDATION_PATTERNS: ArchivePattern[] = [
  communicationVoicePattern(
    'communication_voice_001_exact_words',
    'The Need for Exact Words',
    ['need_for_exact_words'],
    ['deep_processing', 'truth_telling', 'repair_need', 'throat_tightness'],
    'overexplaining',
    'language trying to make the inner truth safe enough to share',
    'The user may need precise language before a feeling, repair, or boundary can feel safe to express.',
    ['language', 'precision', 'expression'],
  ),
  communicationVoicePattern(
    'communication_voice_002_voice_emerging',
    'The Emerging Voice',
    ['voice_emerging'],
    ['truth_telling', 'less_explaining', 'inner_authority', 'boundary_rebuilding'],
    'being too direct',
    'voice becoming clearer as self-trust gets stronger',
    'The archive may show a shift toward clearer expression with less apology or over-qualification.',
    ['voice', 'truth', 'self-trust'],
  ),
  communicationVoicePattern(
    'communication_voice_003_repair_conversation',
    'The Repair Conversation Pattern',
    ['repair_need'],
    ['tone_sensitivity', 'truth_over_harmony', 'overexplaining', 'rupture_sensitivity'],
    'making things awkward',
    'connection trying to become more honest instead of more fragile',
    'Repair needs may surface when the relationship wants more truth, clarity, or care after a rupture.',
    ['repair', 'conversation', 'truth'],
  ),
];

export const COMMUNICATION_VOICE_EXPANSION: ArchivePattern[] = [
  {
    key: 'communicationVoice_carefulWords',
    title: 'Careful Words',
    category: 'communicationVoice',
    description:
      'The user is choosing words carefully because being misunderstood has emotional weight.',
    requiredSignals: ['need_for_exact_words', 'tone_sensitivity'],
    supportingSignals: [
      'overexplaining',
      'wants_to_be_seen',
      'selective_vulnerability',
    ],
    conflictingSignals: ['plain_direct_speech', 'minimal_communication'],
    shameLabel: 'I am making this too complicated.',
    clarityReframe:
      'Careful wording may be your way of protecting meaning from being misunderstood.',
    lookbackDays: 45,
    minEvidenceCount: 3,
    minScore: 0.6,
    cooldownDays: 14,
    tags: ['communication', 'being understood', 'wording'],
  },
  {
    key: 'communicationVoice_repairSettles',
    title: 'Repair Helps You Settle',
    category: 'communicationVoice',
    description:
      'Repair and clarity after rupture appear important for the user’s system to settle.',
    requiredSignals: ['repair_need', 'rupture_sensitivity'],
    supportingSignals: [
      'wants_to_be_seen',
      'relationship_safety_testing',
      'tone_sensitivity',
    ],
    conflictingSignals: ['low_conversation_replay', 'lets_it_pass'],
    shameLabel: 'I should just move on.',
    clarityReframe:
      'Needing repair does not mean you want conflict. It may be how your body knows the rupture is actually over.',
    lookbackDays: 45,
    minEvidenceCount: 3,
    minScore: 0.62,
    cooldownDays: 14,
    tags: ['repair', 'rupture', 'clarity'],
  },
  {
    key: 'communicationVoice_directOverexplainer',
    title: 'Direct, Then Detailed',
    category: 'communicationVoice',
    description:
      'The user can speak directly but adds layers when accuracy or emotional stakes are high.',
    requiredSignals: ['plain_direct_speech', 'overexplaining'],
    supportingSignals: [
      'need_for_exact_words',
      'truth_telling',
      'wants_to_be_seen',
    ],
    conflictingSignals: ['minimal_communication'],
    shameLabel:
      'If I have to explain this much, I must not be clear.',
    clarityReframe:
      'The first clear version may already be there. The extra explanation may be about wanting it received accurately.',
    lookbackDays: 60,
    minEvidenceCount: 2,
    minScore: 0.55,
    cooldownDays: 21,
    tags: ['directness', 'overexplaining', 'clarity'],
  },
  {
    key: 'communicationVoice_truthOverHarmony',
    title: 'Truth Over Harmony',
    category: 'communicationVoice',
    description:
      'The user is choosing honesty even when it may disrupt surface peace.',
    requiredSignals: ['truth_over_harmony', 'truth_telling'],
    supportingSignals: ['inner_authority', 'values_conflict', 'voice_emerging'],
    conflictingSignals: [
      'smooth_over_limit',
      'avoids_clear_boundary_for_comfort',
    ],
    shameLabel:
      'Keeping peace matters more than saying what is true.',
    clarityReframe:
      'Truth may create discomfort, but avoiding it can create a different kind of cost.',
    lookbackDays: 60,
    minEvidenceCount: 2,
    minScore: 0.56,
    cooldownDays: 21,
    tags: ['truth', 'harmony', 'voice'],
  },
  {
    key: 'communicationVoice_voiceEmerging',
    title: 'Your Voice Is Emerging',
    category: 'communicationVoice',
    description:
      'The user is beginning to speak more clearly from their own truth or needs.',
    requiredSignals: ['voice_emerging'],
    supportingSignals: [
      'truth_telling',
      'less_explaining',
      'self_trust_growth',
      'inner_authority',
    ],
    conflictingSignals: ['throat_tightness', 'silence_for_safety'],
    shameLabel: 'My voice will create too much trouble.',
    clarityReframe:
      'A clearer voice does not have to be harsh. It can be honest and still carry care.',
    lookbackDays: 90,
    minEvidenceCount: 2,
    minScore: 0.52,
    cooldownDays: 21,
    tags: ['voice', 'truth', 'growth'],
  },
  {
    key: 'communicationVoice_throatTightness',
    title: 'Words Held in the Throat',
    category: 'communicationVoice',
    description:
      'Physical or emotional restraint around speaking is showing up.',
    requiredSignals: ['throat_tightness', 'expression_need'],
    supportingSignals: [
      'selective_vulnerability',
      'truth_telling',
      'fear_of_being_too_much',
    ],
    conflictingSignals: ['plain_direct_speech', 'voice_emerging'],
    shameLabel:
      'If I cannot say it easily, it must not matter.',
    clarityReframe:
      'Difficulty speaking can show that something matters enough to feel risky.',
    lookbackDays: 45,
    minEvidenceCount: 2,
    minScore: 0.56,
    cooldownDays: 21,
    tags: ['throat', 'expression', 'voice'],
  },
  {
    key: 'communicationVoice_silenceAsProtection',
    title: 'Silence as Protection',
    category: 'communicationVoice',
    description:
      'The user may hold back to avoid being misunderstood, dismissed, or emotionally exposed.',
    requiredSignals: ['selective_vulnerability', 'silence_for_safety'],
    supportingSignals: [
      'fear_of_being_too_much',
      'wants_to_be_seen',
      'tone_sensitivity',
    ],
    conflictingSignals: ['truth_telling', 'voice_emerging'],
    shameLabel: 'If I stay quiet, I am failing to communicate.',
    clarityReframe:
      'Silence may be protection, not absence. The question is whether it is still protecting you or starting to isolate you.',
    lookbackDays: 45,
    minEvidenceCount: 3,
    minScore: 0.6,
    cooldownDays: 21,
    tags: ['silence', 'protection', 'vulnerability'],
  },
  {
    key: 'communicationVoice_conversationReplay',
    title: 'Replaying the Conversation',
    category: 'communicationVoice',
    description:
      'The user replays what was said, unsaid, or possibly misunderstood after conversations.',
    requiredSignals: ['conversation_replay', 'need_for_exact_words'],
    supportingSignals: [
      'overexplaining',
      'tone_sensitivity',
      'wants_to_be_seen',
    ],
    conflictingSignals: ['low_conversation_replay'],
    shameLabel: 'I should stop thinking about this.',
    clarityReframe:
      'Replaying may be your mind trying to find the part that did not feel settled.',
    lookbackDays: 30,
    minEvidenceCount: 3,
    minScore: 0.6,
    cooldownDays: 14,
    tags: ['conversation replay', 'communication', 'understanding'],
  },
  {
    key: 'communicationVoice_beingMisunderstood',
    title: 'When Meaning Does Not Land',
    category: 'communicationVoice',
    description:
      'Being misunderstood appears more painful than the conversation itself.',
    requiredSignals: ['wants_to_be_seen', 'need_for_exact_words'],
    supportingSignals: ['rupture_sensitivity', 'overexplaining', 'repair_need'],
    conflictingSignals: ['low_reassurance_need'],
    shameLabel: 'It should not matter this much if they missed it.',
    clarityReframe:
      'Being misunderstood can hurt because the meaning mattered, not because you are too sensitive.',
    lookbackDays: 45,
    minEvidenceCount: 3,
    minScore: 0.62,
    cooldownDays: 21,
    tags: ['misunderstood', 'meaning', 'seen'],
  },
  {
    key: 'communicationVoice_lessExplaining',
    title: 'Less Explaining',
    category: 'communicationVoice',
    description:
      'The user is beginning to trust that not every truth needs a long explanation.',
    requiredSignals: ['less_explaining'],
    supportingSignals: [
      'inner_authority',
      'simple_boundary_answer',
      'truth_telling',
    ],
    conflictingSignals: ['overexplaining', 'need_for_exact_words'],
    shameLabel:
      'If I do not explain enough, I will be misunderstood.',
    clarityReframe:
      'Less explaining can be a sign that your own clarity is becoming enough to stand on.',
    lookbackDays: 90,
    minEvidenceCount: 2,
    minScore: 0.52,
    cooldownDays: 21,
    tags: ['less explaining', 'clarity', 'self-trust'],
  },
  {
    key: 'communicationVoice_minimalCommunication',
    title: 'Keeping It Brief',
    category: 'communicationVoice',
    description:
      'The user communicates with few words, which can be clear but may leave room for interpretation.',
    requiredSignals: ['minimal_communication'],
    supportingSignals: [
      'plain_direct_speech',
      'brevity_over_elaboration',
      'low_conversation_replay',
    ],
    conflictingSignals: ['overexplaining', 'need_for_exact_words'],
    shameLabel: 'More words would make this worse.',
    clarityReframe:
      'Brevity can be clear, but some moments need a little more context to create connection.',
    lookbackDays: 60,
    minEvidenceCount: 2,
    minScore: 0.54,
    cooldownDays: 21,
    tags: ['brevity', 'communication', 'context'],
  },
  {
    key: 'communicationVoice_plainDirectSpeech',
    title: 'Plain Direct Speech',
    category: 'communicationVoice',
    description:
      'The user values clear, direct language over hints, softening, or indirectness.',
    requiredSignals: ['plain_direct_speech', 'truth_telling'],
    supportingSignals: [
      'direct_communication_preference',
      'inner_authority',
      'low_conversation_replay',
    ],
    conflictingSignals: ['overexplaining', 'tone_sensitivity'],
    shameLabel: 'Directness means I am being harsh.',
    clarityReframe:
      'Directness can be caring when it keeps the truth clear and avoids unnecessary guessing.',
    lookbackDays: 60,
    minEvidenceCount: 2,
    minScore: 0.54,
    cooldownDays: 21,
    tags: ['directness', 'truth', 'clarity'],
  },
  {
    key: 'communicationVoice_expressionNeed',
    title: 'The Need to Say It',
    category: 'communicationVoice',
    description:
      'Expression itself is becoming important, even before everything is perfectly organized.',
    requiredSignals: ['expression_need'],
    supportingSignals: ['voice_emerging', 'truth_telling', 'throat_tightness'],
    conflictingSignals: ['silence_for_safety'],
    shameLabel: 'I should wait until I can say it perfectly.',
    clarityReframe:
      'Sometimes the first honest version matters more than the perfect version.',
    lookbackDays: 60,
    minEvidenceCount: 2,
    minScore: 0.55,
    cooldownDays: 21,
    tags: ['expression', 'voice', 'truth'],
  },
  {
    key: 'communicationVoice_softeningForSafety',
    title: 'Softening for Safety',
    category: 'communicationVoice',
    description:
      'The user adjusts tone or wording to reduce tension, sometimes at the cost of full truth.',
    requiredSignals: ['tone_sensitivity', 'smooth_over_limit'],
    supportingSignals: [
      'selective_vulnerability',
      'truth_over_harmony',
      'overexplaining',
    ],
    conflictingSignals: ['plain_direct_speech', 'voice_emerging'],
    shameLabel: 'If I say it directly, it will be too much.',
    clarityReframe:
      'Softening can be wise, but it becomes costly when it makes the truth disappear.',
    lookbackDays: 45,
    minEvidenceCount: 3,
    minScore: 0.6,
    cooldownDays: 21,
    tags: ['softening', 'safety', 'truth'],
  },
  {
    key: 'communicationVoice_repairOverAvoidance',
    title: 'Repair Over Avoidance',
    category: 'communicationVoice',
    description:
      'The user values repair and clarity more than pretending nothing happened.',
    requiredSignals: ['repair_need', 'truth_telling'],
    supportingSignals: [
      'rupture_sensitivity',
      'relationship_safety_testing',
      'voice_emerging',
    ],
    conflictingSignals: [
      'avoids_clear_boundary_for_comfort',
      'low_return_after_over',
    ],
    shameLabel: 'Bringing it up will make things worse.',
    clarityReframe:
      'Repair can be the thing that prevents a rupture from staying active underneath the surface.',
    lookbackDays: 60,
    minEvidenceCount: 2,
    minScore: 0.56,
    cooldownDays: 21,
    tags: ['repair', 'truth', 'relationship'],
  },
  {
    key: 'communicationVoice_accuracyUnderPressure',
    title: 'Accuracy Under Pressure',
    category: 'communicationVoice',
    description:
      'The user becomes more detailed when the emotional stakes are high.',
    requiredSignals: ['need_for_exact_words', 'high_stress'],
    supportingSignals: ['overexplaining', 'values_conflict', 'truth_telling'],
    conflictingSignals: ['minimal_communication'],
    shameLabel: 'I should be able to say this simply.',
    clarityReframe:
      'When stakes feel high, precision may be your way of trying to protect what matters from distortion.',
    lookbackDays: 45,
    minEvidenceCount: 3,
    minScore: 0.6,
    cooldownDays: 21,
    tags: ['precision', 'pressure', 'communication'],
  },
  {
    key: 'communicationVoice_voiceWithCare',
    title: 'Voice With Care',
    category: 'communicationVoice',
    description:
      'The user is learning to speak honestly without losing warmth or relational care.',
    requiredSignals: ['voice_emerging', 'truth_telling'],
    supportingSignals: ['connection_glimmer', 'repair_need', 'inner_authority'],
    conflictingSignals: ['anger', 'rupture_sensitivity'],
    shameLabel: 'Honesty has to be harsh to be real.',
    clarityReframe:
      'Your voice can be clear without becoming cruel. Care and honesty can belong in the same sentence.',
    lookbackDays: 90,
    minEvidenceCount: 2,
    minScore: 0.52,
    cooldownDays: 21,
    tags: ['voice', 'care', 'honesty'],
  },
];

export const COMMUNICATION_VOICE_PATTERNS: ArchivePattern[] = [
  ...COMMUNICATION_VOICE_FOUNDATION_PATTERNS,
  ...COMMUNICATION_VOICE_EXPANSION,
];
