import type { DailyAngle } from '../types';

export const SYMBOLIC_SOURCE_ANGLES: DailyAngle[] = [
  {
    key: 'symbolic_001_unfinished_dream_processing',
    patternKey: 'dreams_001_unfinished_processing',
    title: 'The Dream That Continued the Day',
    triggerSignals: ['dream_unfinished_processing', 'dream_after_stress', 'dream_emotional_tone'],
    sourcePriority: ['dream', 'journal', 'dailyCheckIn'],
    observation:
      'The dream may be carrying emotional residue that the waking day did not fully metabolize.',
    pattern:
      'Recent dream signals point toward the inner world continuing a conversation through images, feeling, plot, or atmosphere. The dream does not need to be decoded perfectly to show what still has charge.',
    reframe:
      'This does not read as reading too much into dreams. It reads as your inner world trying another language for what has not fully settled yet.',
    question:
      'What feeling from the dream stayed with you after the plot faded?',
    tone: 'soft',
    cooldownDays: 14,
  },
  {
    key: 'symbolic_002_repeated_dream_symbol',
    patternKey: 'dreams_003_repeated_symbol',
    title: 'The Symbol That Repeats',
    triggerSignals: ['dream_repeated_symbol', 'dream_home', 'dream_searching'],
    sourcePriority: ['dream', 'journal', 'reflectionBank'],
    observation:
      'Repetition may be making one dream image part of your symbolic archive.',
    pattern:
      'Recurring people, places, rooms, searches, or images are showing up with emotional weight. The repetition may matter less as prediction and more as a way your system marks something that wants attention.',
    reframe:
      'This does not read as being weird or superstitious. It reads as repetition asking to be noticed as part of your symbolic archive.',
    question:
      'What does this repeated image seem to gather around: safety, loss, direction, belonging, or choice?',
    tone: 'deep',
    cooldownDays: 14,
  },
  {
    key: 'symbolic_003_protection_dream',
    patternKey: 'dreams_006_protection',
    title: 'Protective Instincts in Dream Form',
    triggerSignals: ['dream_protection', 'responsibility_weight', 'protective_care'],
    sourcePriority: ['dream', 'journal', 'triggerLog'],
    observation:
      'Protective energy may be showing up symbolically before it has a clear waking action.',
    pattern:
      'Recent signals around guarding, hiding, rescuing, protecting, or responsibility suggest that care is active in the dream layer too.',
    reframe:
      'This does not read as always needing to be responsible. It reads as your protective instincts showing up in symbolic form.',
    question:
      'What in the dream seemed to need protection, and what might that represent today?',
    tone: 'grounding',
    cooldownDays: 14,
  },
  {
    key: 'symbolic_004_home_dream',
    patternKey: 'dreams_008_home',
    title: 'When Place Becomes Symbol',
    triggerSignals: ['dream_home', 'home_as_safety', 'family_pattern_awareness'],
    sourcePriority: ['dream', 'reflectionBank', 'journal'],
    observation:
      'A home, room, or familiar place in a dream may be carrying memory, safety, identity, or belonging.',
    pattern:
      'Place-based dream material is active here: houses, rooms, childhood spaces, apartments, hallways, or unfamiliar homes. These may be ways the inner world explores what feels safe or unsettled.',
    reframe:
      'This does not read as dreams being random. It reads as your inner world using place to explore safety, identity, memory, or belonging.',
    question:
      'What part of the dream-place felt safe, restricted, missing, or unresolved?',
    tone: 'poetic',
    cooldownDays: 14,
  },
  {
    key: 'symbolic_005_chart_archive_language',
    patternKey: 'chart_001_theme_confirmed',
    title: 'When Symbolic Language Helps',
    triggerSignals: ['chart_theme_confirmed', 'pattern_recognition', 'meaning_making'],
    sourcePriority: ['reflectionBank', 'journal', 'natalChart'],
    observation:
      'A chart theme may be useful when it gives language to something your lived pattern already carries.',
    pattern:
      'Recent signals suggest that symbolic language and lived data may be pointing toward the same area. The chart is not treated as a verdict here; it works best as a mirror for patterns already becoming visible.',
    reframe:
      'This does not read as being boxed in by a label. It reads as a symbolic mirror becoming useful only when your lived archive agrees.',
    question:
      'Which part of the symbolic language feels confirmed by real life, and which part does not?',
    tone: 'clear',
    cooldownDays: 30,
  },
  {
    key: 'symbolic_006_communication_theme',
    patternKey: 'chart_003_communication_theme',
    title: 'Language as a Self-Knowledge Tool',
    triggerSignals: ['chart_communication_theme', 'need_for_exact_words', 'creative_processing'],
    sourcePriority: ['reflectionBank', 'journal', 'natalChart'],
    observation:
      'Communication themes may be more useful when they connect to how you actually process, write, or need words to land.',
    pattern:
      'Exact wording, journaling, expression, or the need for language that finds the center of the feeling is carrying symbolic weight.',
    reframe:
      'This does not read as over-explaining. It reads as language becoming one of the ways your inner world finds form.',
    question:
      'Where did precise language help you feel more known or more settled?',
    tone: 'clear',
    cooldownDays: 30,
  },
  {
    key: 'symbolic_007_chart_relationship_theme',
    patternKey: 'chart_004_relationship_theme',
    title: 'Relationship Themes in the Archive',
    triggerSignals: ['chart_relationship_theme', 'relationship_safety_testing', 'connection_glimmer'],
    sourcePriority: ['relationshipMirror', 'journal', 'natalChart'],
    observation:
      'A relationship chart theme becomes more meaningful when the lived archive echoes it.',
    pattern:
      'Recent data may be connecting symbolic relationship themes with real signals around trust, repair, closeness, availability, or connection.',
    reframe:
      'This does not read as caring too much about connection. It reads as relationship patterns becoming clearer when symbolic themes meet lived evidence.',
    question:
      'Which relationship theme feels lived, not just symbolically interesting?',
    tone: 'soft',
    cooldownDays: 30,
  },
  {
    key: 'symbolic_008_chart_values_theme',
    patternKey: 'chart_009_values_theme',
    title: 'Values as the Deeper Thread',
    triggerSignals: ['chart_values_theme', 'values_conflict', 'purpose_signal'],
    sourcePriority: ['reflectionBank', 'journal', 'natalChart'],
    observation:
      'A values theme may be most useful when it helps name the choices already asking for integrity.',
    pattern:
      'Purpose, truth, misalignment, or the cost of choosing what matters is showing up as symbolic values material.',
    reframe:
      'This does not read as taking meaning too seriously. It reads as values becoming the deeper thread connecting your choices.',
    question:
      'Which value keeps showing up as non-optional in real life?',
    tone: 'deep',
    cooldownDays: 30,
  },
];
