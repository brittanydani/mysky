import type { DailyAngle } from '../types';

export const SENSORY_EXECUTIVE_ANGLES: DailyAngle[] = [
  {
    key: 'sensory_exec_001_low_noise_need',
    patternKey: 'emotional_weather_014_low_noise_need',
    title: 'The Low-Noise Need',
    triggerSignals: ['sensory_sensitivity', 'needs_pause', 'calm_bracing'],
    sourcePriority: ['reflectionBank', 'bodyMap', 'triggerLog', 'journal', 'dailyCheckIn'],
    observation:
      'The need for quiet may be a capacity signal, not a personality flaw.',
    pattern:
      'Recent signals point toward input arriving faster or louder than your system can comfortably sort. Noise, light, clutter, interruption, or social volume may be creating a real need for lower input.',
    reframe:
      'This does not read as being difficult. It reads as a system asking for less input so it can come back to itself.',
    question:
      'What input could be lowered today before your system has to shout?',
    tone: 'grounding',
    cooldownDays: 14,
  },
  {
    key: 'sensory_exec_002_sensory_load',
    patternKey: 'body_signals_013_sensory_load',
    title: 'Input Has a Cost',
    triggerSignals: ['sensory_sensitivity', 'head_pressure', 'body_knows_first'],
    sourcePriority: ['bodyMap', 'reflectionBank', 'triggerLog', 'journal'],
    observation:
      'Your body may be tracking sensory input before your mood has words for it.',
    pattern:
      'Sound, light, texture, clutter, screens, crowding, or interruption are sitting close to body cues like head pressure, heaviness, or the need to pause.',
    reframe:
      'This does not read as being too sensitive. It reads as a system that notices the world in high resolution.',
    question:
      'Which sensory input has been costing more than it looks like from the outside?',
    tone: 'clear',
    cooldownDays: 14,
  },
  {
    key: 'sensory_exec_003_analysis_as_regulation',
    patternKey: 'cognitive_003_understanding_before_release',
    title: 'Understanding Before Release',
    triggerSignals: ['analysis_as_regulation', 'clarity_before_release', 'deep_processing'],
    sourcePriority: ['reflectionBank', 'journal'],
    observation:
      'Thinking it through may be one way your system creates enough safety to feel.',
    pattern:
      'Recent entries suggest that context, logic, mapping, or naming helps an experience become less shapeless. The thinking is not necessarily avoidance; it may be how the feeling becomes approachable.',
    reframe:
      'This does not read as staying in your head. It reads as the mind building a safer doorway into the feeling.',
    question:
      'What piece of understanding would help this feeling become easier to hold?',
    tone: 'soft',
    cooldownDays: 14,
  },
  {
    key: 'sensory_exec_004_task_switching',
    patternKey: 'cognitive_007_clarity_before_action',
    title: 'The Task-Switching Cost',
    triggerSignals: ['decision_uncertainty', 'mental_load', 'needs_pause'],
    sourcePriority: ['reflectionBank', 'journal', 'triggerLog', 'dailyCheckIn'],
    observation:
      'Switching tasks may be costing more attention than the task list shows.',
    pattern:
      'Friction around choosing, changing gears, context shifts, or holding too many open loops is part of the pattern. The delay may be less about motivation and more about transition cost.',
    reframe:
      'This does not read as procrastination. It reads as your system needing a clearer bridge between one demand and the next.',
    question:
      'What would make the next transition smaller, clearer, or less abrupt?',
    tone: 'clear',
    cooldownDays: 14,
  },
  {
    key: 'sensory_exec_005_gentle_transition',
    patternKey: 'glimmers_019_gentle_transition',
    title: 'The Transition Buffer',
    triggerSignals: ['needs_pause', 'ritual_regulation', 'calm_bracing'],
    sourcePriority: ['reflectionBank', 'glimmerLog', 'journal', 'triggerLog'],
    observation:
      'A buffer may be part of the need, not an optional extra.',
    pattern:
      'Recent signals suggest that changes in plan, routine, place, task, or pace land better when the transition has a little room around it.',
    reframe:
      'This does not read as needing too much time. It reads as transitions becoming kinder when your system is not rushed across them.',
    question:
      'Where would a small buffer make the next shift less costly?',
    tone: 'grounding',
    cooldownDays: 14,
  },
  {
    key: 'sensory_exec_006_the_edited_self',
    patternKey: 'identity_009_becoming_visible',
    title: 'Where You Edit Yourself Down',
    triggerSignals: ['becoming_visible', 'selective_vulnerability', 'wants_to_be_seen'],
    sourcePriority: ['reflectionBank', 'journal', 'relationshipMirror'],
    observation:
      'Some of the exhaustion may come from editing yourself before anyone else responds.',
    pattern:
      'Masking, performing, shrinking, or translating yourself to be easier to receive is part of the cost. That kind of self-editing can be protective and costly at the same time.',
    reframe:
      'This does not read as wanting attention. It reads as the self becoming visible after being edited for too long.',
    question:
      'Where did you have to translate yourself today, and what did that cost?',
    tone: 'soft',
    cooldownDays: 14,
  },
];
