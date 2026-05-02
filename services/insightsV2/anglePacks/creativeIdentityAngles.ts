import type { DailyAngle } from '../types';

export const CREATIVE_IDENTITY_ANGLES: DailyAngle[] = [
  {
    key: 'creative_identity_001_creation_as_processing',
    patternKey: 'creativity_001_creative_alchemy',
    title: 'Making as Processing',
    triggerSignals: ['creative_processing', 'expression_need', 'voice_emerging'],
    sourcePriority: ['reflectionBank', 'journal', 'glimmerLog'],
    observation:
      'Creating may be one of the ways your system metabolizes what happened.',
    pattern:
      'Recent signals point toward writing, making, designing, moving, arranging, or imagining as more than a hobby. Expression may be helping feeling become form.',
    reframe:
      'This does not read as distraction. It reads as transformation through expression.',
    question:
      'What wanted to become form instead of staying internal today?',
    tone: 'encouraging',
    cooldownDays: 14,
  },
  {
    key: 'creative_identity_002_voice_emerging',
    patternKey: 'creativity_002_voice_emerging',
    title: 'The Voice Getting Clearer',
    triggerSignals: ['voice_emerging', 'truth_telling', 'becoming_visible'],
    sourcePriority: ['reflectionBank', 'journal', 'relationshipMirror'],
    observation:
      'Your voice may be becoming easier to hear after being edited down.',
    pattern:
      'Speaking more clearly, saying what is true, naming yourself, or letting more of the self be visible is becoming part of the pattern.',
    reframe:
      'This does not read as wanting attention. It reads as a self becoming easier to hear after being edited down.',
    question:
      'What did your voice know before you softened it for anyone else?',
    tone: 'clear',
    cooldownDays: 14,
  },
  {
    key: 'creative_identity_003_blocked_expression',
    patternKey: 'creativity_012_blocked_expression',
    title: 'Expression Waiting for Safety',
    triggerSignals: ['creative_block', 'throat_tightness', 'wants_to_be_seen'],
    sourcePriority: ['reflectionBank', 'bodyMap', 'journal'],
    observation:
      'A block may be protecting expression until there is enough safety to move.',
    pattern:
      'Recent signals point toward no words, a blank page, throat tightness, self-editing, or wanting to be seen while not yet feeling safe enough to be fully visible.',
    reframe:
      'This does not read as having nothing to say. It reads as expression waiting for enough safety to move.',
    question:
      'What part of the expression needs more safety before it can come through?',
    tone: 'soft',
    cooldownDays: 14,
  },
  {
    key: 'creative_identity_004_designing_safety',
    patternKey: 'creativity_009_designing_safety',
    title: 'Designing a Safer Atmosphere',
    triggerSignals: ['beauty_making', 'quiet_safety', 'somatic_safety'],
    sourcePriority: ['glimmerLog', 'bodyMap', 'journal', 'reflectionBank'],
    observation:
      'Changing the space may be part of how your system changes state.',
    pattern:
      'Atmosphere, lighting, color, arrangement, beauty, order, or sensory design are showing up near steadiness. The environment may be participating in regulation.',
    reframe:
      'This does not read as being particular. It reads as the environment becoming part of the support system.',
    question:
      'What detail in the space helped your body feel more able to settle?',
    tone: 'grounding',
    cooldownDays: 14,
  },
  {
    key: 'creative_identity_005_future_self_builder',
    patternKey: 'identity_006_future_self_builder',
    title: 'Building for Your Future Self',
    triggerSignals: ['future_self_orientation', 'wants_to_build', 'purpose_signal'],
    sourcePriority: ['reflectionBank', 'journal', 'dailyCheckIn'],
    observation:
      'Some of today’s effort may be devotion to a future self who can breathe easier.',
    pattern:
      'Recent entries point toward goals, building, purpose, or choices made for the life you are becoming capable of living.',
    reframe:
      'This does not read as putting pressure on yourself. It reads as devotion to building a life your future self can breathe inside.',
    question:
      'Which small choice today belongs to the future self you are building for?',
    tone: 'encouraging',
    cooldownDays: 14,
  },
  {
    key: 'creative_identity_006_chapter_shift',
    patternKey: 'identity_003_chapter_shift',
    title: 'The Chapter Shift',
    triggerSignals: ['chapter_shift', 'transformation_season', 'identity_rewriting'],
    sourcePriority: ['reflectionBank', 'journal', 'dream'],
    observation:
      'A life chapter may be changing before every part of you has caught up.',
    pattern:
      'New-chapter, old-story, identity, becoming, or transition language is active here. This may be a real shift even if it has not fully stabilized yet.',
    reframe:
      'This does not read as instability. It reads as a life chapter changing before every part of you has caught up.',
    question:
      'What part of the old chapter no longer fits the person you are becoming?',
    tone: 'deep',
    cooldownDays: 14,
  },
  {
    key: 'creative_identity_007_new_permission',
    patternKey: 'identity_013_new_permission',
    title: 'A New Permission',
    triggerSignals: ['permission_shift', 'choosing_self', 'self_trust_growth'],
    sourcePriority: ['reflectionBank', 'journal', 'relationshipMirror'],
    observation:
      'Permission may be becoming less about approval and more about self-respect.',
    pattern:
      'Recent signals suggest a shift toward letting yourself want, need, rest, say no, choose yourself, or trust what you know without waiting for external permission.',
    reframe:
      'This does not read as being self-indulgent. It reads as permission becoming a form of self-respect.',
    question:
      'What are you allowed to stop asking permission for?',
    tone: 'clear',
    cooldownDays: 14,
  },
];
