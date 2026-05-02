import type { DailyAngle } from '../types';

export const LIFE_CONTEXT_ANGLES: DailyAngle[] = [
  {
    key: 'context_001_belonging_context',
    patternKey: 'support_belonging_008_belonging_ache',
    title: 'Belonging Has Context',
    triggerSignals: ['belonging_ache', 'wants_to_be_seen', 'selective_vulnerability'],
    sourcePriority: ['reflectionBank', 'journal', 'relationshipMirror', 'glimmerLog'],
    observation:
      'The ache around belonging may be about context, not personal failure.',
    pattern:
      'Recent signals point toward rooms, groups, cultures, or communities where more translation may be required before you feel fully received. That kind of belonging work can be tiring even when nothing dramatic happens.',
    reframe:
      'This does not read as being hard to include. It reads as the need for belonging that does not require performance.',
    question:
      'Where did you feel most able to arrive without translating yourself?',
    tone: 'soft',
    cooldownDays: 14,
  },
  {
    key: 'context_002_chosen_circle',
    patternKey: 'support_belonging_009_chosen_circle',
    title: 'The Circle You Are Building',
    triggerSignals: ['chosen_family', 'connection_glimmer', 'mutuality_need'],
    sourcePriority: ['glimmerLog', 'reflectionBank', 'journal', 'relationshipMirror'],
    observation:
      'Some belonging may be getting built deliberately, not inherited automatically.',
    pattern:
      'Chosen family, community care, mutuality, or people who help the self feel less translated are becoming part of the support structure. This kind of support can be quiet and still structurally important.',
    reframe:
      'This does not read as not having a normal support system. It reads as belonging being built with care.',
    question:
      'Which connection has been acting like real support, even in a small way?',
    tone: 'encouraging',
    cooldownDays: 14,
  },
  {
    key: 'context_003_roots_and_place',
    patternKey: 'family_005_rooting_need',
    title: 'The Need for Roots',
    triggerSignals: ['rooting_need', 'home_as_safety', 'ritual_regulation'],
    sourcePriority: ['reflectionBank', 'bodyMap', 'glimmerLog', 'journal'],
    observation:
      'Stability may be part of your growth conditions, not a sign of rigidity.',
    pattern:
      'Recent entries suggest that place, routine, housing, familiar space, or a stable base changes how much the rest of life can ask of you.',
    reframe:
      'This does not read as being rigid. It reads as roots giving growth somewhere safe to happen from.',
    question:
      'What would make today feel more rooted, even if only by one small degree?',
    tone: 'grounding',
    cooldownDays: 14,
  },
  {
    key: 'context_004_inherited_role',
    patternKey: 'family_010_family_role',
    title: 'The Role That Precedes You',
    triggerSignals: ['family_pattern_awareness', 'caretaking_pressure', 'responsibility_weight'],
    sourcePriority: ['reflectionBank', 'journal', 'triggerLog', 'relationshipMirror'],
    observation:
      'Some responsibility may be arriving through an old role, not only through today.',
    pattern:
      'Family, culture, caregiving, or inherited-role language is sitting close to responsibility and caretaking. The weight may be bigger than the current task because the role has history.',
    reframe:
      'This does not read as being stuck in old roles. It reads as an old role becoming visible enough to renegotiate.',
    question:
      'Which role did you step into today before you had a chance to choose it?',
    tone: 'clear',
    cooldownDays: 14,
  },
  {
    key: 'context_005_security_pressure',
    patternKey: 'scarcity_001_scarcity_scanner',
    title: 'Security on the Radar',
    triggerSignals: ['scarcity_scanning', 'fear_of_loss', 'energy_scarcity'],
    sourcePriority: ['reflectionBank', 'journal', 'triggerLog', 'dailyCheckIn'],
    observation:
      'Money, housing, work, energy, or stability may be taking up real background attention.',
    pattern:
      'Recent signals point toward security scanning: bills, rent, job stability, time, energy, support, or the possibility of losing what finally feels steady. That scanning can look like anxiety while still tracking real context.',
    reframe:
      'This does not read as being anxious or ungrateful. It reads as a system tracking what has not always felt secure.',
    question:
      'Which security concern needs a concrete next step, and which one only needs to be named?',
    tone: 'direct',
    cooldownDays: 14,
  },
  {
    key: 'context_006_values_inside_systems',
    patternKey: 'values_017_values_misalignment',
    title: 'When the System Does Not Fit',
    triggerSignals: ['values_conflict', 'justice_sensitivity', 'fairness_need'],
    sourcePriority: ['reflectionBank', 'journal', 'triggerLog'],
    observation:
      'Some discomfort may be coming from a context that asks you to move against your values.',
    pattern:
      'Misalignment around work, school, institutions, community expectations, culture, fairness, or systems is part of the strain. This may not be only personal; it may be contextual.',
    reframe:
      'This does not read as being dissatisfied. It reads as your inner compass noticing where life no longer fits.',
    question:
      'What part of this situation felt misaligned with what you know matters?',
    tone: 'clear',
    cooldownDays: 14,
  },
];
