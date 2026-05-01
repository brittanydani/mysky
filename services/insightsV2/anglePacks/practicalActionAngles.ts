import type { DailyAngle } from '../types';

export const PRACTICAL_ACTION_ANGLES: DailyAngle[] = [
  {
    key: 'practical_001_time_pressure',
    patternKey: 'scarcity_006_time_scarcity',
    title: 'When Time Feels Too Small',
    triggerSignals: ['time_scarcity', 'responsibility_weight', 'high_stress'],
    sourcePriority: ['reflectionBank', 'journal', 'dailyCheckIn', 'triggerLog'],
    observation:
      'The pressure today may be less about poor timing and more about too much trying to fit into too little room.',
    pattern:
      'Recent signals point toward time becoming a scarce resource in your system. Deadlines, rushing, and responsibility can make the day feel smaller than the actual number of hours available.',
    reframe:
      'This does not read as poor time management. It reads as load needing a more realistic container.',
    question:
      'What would change today if the size of the load, not your discipline, was the first thing adjusted?',
    tone: 'clear',
    cooldownDays: 14,
  },
  {
    key: 'practical_002_always_on',
    patternKey: 'rest_capacity_009_always_on_pattern',
    title: 'The Readiness Switch',
    triggerSignals: ['always_on', 'preparedness', 'mental_load'],
    avoidIfSignals: ['quiet_safety', 'restorative_moment'],
    sourcePriority: ['reflectionBank', 'journal', 'triggerLog', 'bodyMap'],
    observation:
      'Your system may be staying ready even when the next demand has not arrived yet.',
    pattern:
      'Across recent entries, attention seems to keep scanning for what needs to be handled, planned, checked, or prevented. That readiness can be useful, but it also keeps the body and mind from fully standing down.',
    reframe:
      'This does not read as being unable to relax. It reads as a system that learned readiness as a form of care.',
    question:
      'Where could readiness be allowed to clock out today?',
    tone: 'grounding',
    cooldownDays: 14,
  },
  {
    key: 'practical_003_decision_before_action',
    patternKey: 'cognitive_007_clarity_before_action',
    title: 'Clarity Before Action',
    triggerSignals: ['decision_uncertainty', 'clarity_before_release', 'seeks_context'],
    sourcePriority: ['reflectionBank', 'journal', 'relationshipMirror'],
    observation:
      'The pause before action may be your system asking for enough clarity to move without self-abandoning.',
    pattern:
      'Recent signals suggest that decisions get heavier when more than one value, need, or consequence is involved. The delay may be an attempt to find the step that still feels internally honest.',
    reframe:
      'This does not read as procrastination. It reads as clarity trying to protect alignment before momentum takes over.',
    question:
      'What is the smallest next step that would preserve your self-trust?',
    tone: 'clear',
    cooldownDays: 14,
  },
  {
    key: 'practical_004_ideas_capacity_gap',
    patternKey: 'creativity_010_unfinished_ideas',
    title: 'More Ideas Than Capacity',
    triggerSignals: ['vision_gap', 'wants_to_build', 'creative_aliveness'],
    avoidIfSignals: ['restorative_moment'],
    sourcePriority: ['reflectionBank', 'journal', 'glimmerLog'],
    observation:
      'There may be more possibility moving through you than your current capacity can hold at once.',
    pattern:
      'The archive is picking up a gap between what you can imagine or build and what the day realistically has room to execute. That gap can feel like failure when it may actually be a capacity and sequencing problem.',
    reframe:
      'This does not read as never finishing anything. It reads as vision needing order, pacing, and a place to land.',
    question:
      'Which idea needs a container today, and which one only needs to be safely parked?',
    tone: 'encouraging',
    cooldownDays: 14,
  },
  {
    key: 'practical_005_inner_standard',
    patternKey: 'values_018_inner_standard',
    title: 'The Standard Under the Pressure',
    triggerSignals: ['high_standards', 'excellence_pressure', 'creative_standards'],
    sourcePriority: ['reflectionBank', 'journal'],
    observation:
      'The pressure to do it well may be carrying a real standard, not just self-criticism.',
    pattern:
      'Recent entries suggest that quality, accuracy, usefulness, or integrity matter to you. The strain appears when the standard becomes so loud that the person holding it gets less room to breathe.',
    reframe:
      'This does not read as expecting too much. It reads as care for quality needing a kinder operating system.',
    question:
      'What would "good enough with integrity" look like today?',
    tone: 'direct',
    cooldownDays: 14,
  },
  {
    key: 'practical_006_household_load',
    patternKey: 'family_019_household_load',
    title: 'The Work That Keeps Life Running',
    triggerSignals: ['invisible_labor', 'mental_load', 'responsibility_weight'],
    sourcePriority: ['reflectionBank', 'journal', 'triggerLog'],
    observation:
      'Some of the load may be coming from work that only becomes visible when it is not done.',
    pattern:
      'Planning, tracking, remembering, cleaning, scheduling, and logistics can create a real internal workload. The archive is noticing the weight of what keeps life running.',
    reframe:
      'This does not read as resentment. It reads as invisible labor becoming visible enough to be redistributed or reduced.',
    question:
      'Which piece of invisible work needs to be named before it can be shared or simplified?',
    tone: 'clear',
    cooldownDays: 14,
  },
];
