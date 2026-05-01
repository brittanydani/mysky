import type { DailyAngle } from '../types';

export const POSITIVE_CAPACITY_ANGLES: DailyAngle[] = [
  {
    key: 'positive_001_rest_as_safety',
    patternKey: 'rest_capacity_007_rest_as_safety',
    title: 'Rest That Actually Repairs',
    triggerSignals: ['restorative_moment', 'quiet_safety', 'body_lightness'],
    avoidIfSignals: ['rest_guilt', 'rest_resistance'],
    sourcePriority: ['reflectionBank', 'glimmerLog', 'bodyMap', 'sleep', 'journal'],
    observation:
      'Rest may be showing up as something your system can receive, not only something you collapse into.',
    pattern:
      'Recent signals point toward pause, sleep, quiet, or softness functioning as real repair. The useful part is not just that you stopped, but that stopping gave your system something back.',
    reframe:
      'This does not read as doing nothing. It reads as restoration becoming evidence your body can trust.',
    question:
      'What helped rest feel safer or more possible this time?',
    tone: 'grounding',
    cooldownDays: 14,
  },
  {
    key: 'positive_002_quiet_relief',
    patternKey: 'glimmers_001_quiet_relief',
    title: 'What Actually Softens You',
    triggerSignals: ['glimmer_softening', 'relief', 'tension_release'],
    sourcePriority: ['glimmerLog', 'bodyMap', 'reflectionBank', 'journal'],
    observation:
      'The archive is noticing what helped your system soften.',
    pattern:
      'A glimmer, body shift, moment of relief, or small safety cue may not solve everything, but it gives your nervous system specific evidence about what helps.',
    reframe:
      'This does not read as needing perfect conditions. It reads as your system showing what safety feels like in practice.',
    question:
      'What specific condition helped you soften, even a little?',
    tone: 'soft',
    cooldownDays: 14,
  },
  {
    key: 'positive_003_enoughness',
    patternKey: 'scarcity_002_enoughness',
    title: 'Enoughness Became Noticeable',
    triggerSignals: ['enoughness', 'support_abundance_shift', 'receiving_openness'],
    sourcePriority: ['reflectionBank', 'journal', 'glimmerLog', 'dailyCheckIn'],
    observation:
      'A small signal of enoughness may be easier for your system to recognize right now.',
    pattern:
      'Recent data points toward support, time, care, money, energy, or steadiness feeling slightly less scarce. This kind of evidence matters because enoughness often arrives in small, ordinary proofs.',
    reframe:
      'This does not read as needing reassurance. It reads as your system learning to recognize sufficiency when it appears.',
    question:
      'Where did life feel even one notch less scarce today?',
    tone: 'encouraging',
    cooldownDays: 14,
  },
  {
    key: 'positive_004_connection_restores',
    patternKey: 'relationships_018_relationship_that_restores',
    title: 'Connection That Restores',
    triggerSignals: ['connection_glimmer', 'relief', 'receiving_openness'],
    sourcePriority: ['relationshipMirror', 'glimmerLog', 'reflectionBank', 'journal'],
    observation:
      'Some connection may be functioning as regulation, not just company.',
    pattern:
      'The archive is picking up warmth, being understood, receiving care, or body softening near connection. That suggests a relationship or interaction helped your system come back to itself.',
    reframe:
      'This does not read as dependency. It reads as connection becoming a real source of return.',
    question:
      'What kind of connection left you more like yourself afterward?',
    tone: 'soft',
    cooldownDays: 14,
  },
  {
    key: 'positive_005_creative_aliveness',
    patternKey: 'creativity_006_creative_aliveness',
    title: 'When Making Brings You Back',
    triggerSignals: ['creative_aliveness', 'wants_to_build', 'creative_processing'],
    sourcePriority: ['reflectionBank', 'journal', 'glimmerLog'],
    observation:
      'Creative energy may be helping you feel more alive, not merely more productive.',
    pattern:
      'Recent entries suggest that making, writing, designing, building, imagining, or arranging something can restore identity and energy. The aliveness matters as much as the output.',
    reframe:
      'This does not read as wasting time. It reads as creation giving your system a way back into movement.',
    question:
      'Which act of making brought you closer to yourself?',
    tone: 'encouraging',
    cooldownDays: 14,
  },
  {
    key: 'positive_006_quiet_hope',
    patternKey: 'emotional_weather_010_quiet_hope_signal',
    title: 'A Small Hope Signal',
    triggerSignals: ['hope', 'relief', 'mood_improvement'],
    sourcePriority: ['reflectionBank', 'journal', 'glimmerLog', 'dailyCheckIn'],
    observation:
      'Hope may be present in a small enough form that it can be trusted.',
    pattern:
      'The archive is noticing relief, mood lift, or a gentler inner weather signal. It may not mean everything is resolved; it means something in the system found a little more room.',
    reframe:
      'This does not read as pretending everything is fine. It reads as a real shift, even if it is still small.',
    question:
      'What tiny sign of hope deserves to be counted today?',
    tone: 'encouraging',
    cooldownDays: 14,
  },
];
