import type { DailyAngle } from '../types';

export const SUPPORT_BOUNDARY_ANGLES: DailyAngle[] = [
  {
    key: 'support_boundary_001_hard_to_ask',
    patternKey: 'support_belonging_013_hard_to_ask',
    title: 'The Hard-to-Ask Pattern',
    triggerSignals: ['minimizes_need', 'support_need', 'fear_of_being_too_much'],
    sourcePriority: ['reflectionBank', 'journal', 'relationshipMirror', 'triggerLog'],
    observation:
      'The need may be real even if it arrives softened, minimized, or hidden.',
    pattern:
      'Recent signals point toward needing support while trying not to bother anyone, make a big deal of it, or be too much. The risk may be less about the request itself and more about what asking has meant before.',
    reframe:
      'This does not read as being indirect. It reads as asking feeling risky when care has not always been easy to trust.',
    question:
      'What would be the smallest honest ask that does not require proving the whole need?',
    tone: 'soft',
    cooldownDays: 14,
  },
  {
    key: 'support_boundary_002_backup_person',
    patternKey: 'support_belonging_015_backup_person_need',
    title: 'The Backup Person Need',
    triggerSignals: ['wants_to_be_caught', 'support_need', 'consistency_need'],
    sourcePriority: ['reflectionBank', 'journal', 'relationshipMirror'],
    observation:
      'Wanting backup may be about steadiness, not helplessness.',
    pattern:
      'The archive is noticing language around wanting someone to check in, notice, follow through, or be there before the need becomes a crisis.',
    reframe:
      'This does not read as dependency. It reads as a need for reliable backup while still carrying your own life.',
    question:
      'Where would reliable backup change the cost of carrying this alone?',
    tone: 'clear',
    cooldownDays: 14,
  },
  {
    key: 'support_boundary_003_receiving_care',
    patternKey: 'support_belonging_006_receiving_care_difficulty',
    title: 'When Receiving Feels Unfamiliar',
    triggerSignals: ['receiving_care_difficulty', 'support_need', 'receiving_openness'],
    sourcePriority: ['reflectionBank', 'journal', 'glimmerLog', 'relationshipMirror'],
    observation:
      'Receiving care may be a skill your system is still learning to trust.',
    pattern:
      'Recent signals suggest that help, compliments, care, or support may be wanted and still hard to accept without deflecting, repaying, or shrinking the need.',
    reframe:
      'This does not read as being hard to help. It reads as a system that learned giving more easily than receiving.',
    question:
      'What kind of care would be easiest to receive without immediately repaying it?',
    tone: 'grounding',
    cooldownDays: 14,
  },
  {
    key: 'support_boundary_004_guilt_after_no',
    patternKey: 'boundaries_003_guilt_after_saying_no',
    title: 'The Guilt After No',
    triggerSignals: ['boundary_guilt', 'says_no', 'guilt'],
    sourcePriority: ['reflectionBank', 'journal', 'relationshipMirror', 'triggerLog'],
    observation:
      'Guilt after a no may be an old loyalty pattern adjusting to a newer truth.',
    pattern:
      'The archive is noticing no, limits, guilt, or fear of letting someone down. That after-feeling can show the nervous system catching up to a boundary the self already needed.',
    reframe:
      'This does not read as being selfish. It reads as an old loyalty pattern adjusting to the truth that limits protect connection too.',
    question:
      'What did the no protect that a yes would have cost?',
    tone: 'clear',
    cooldownDays: 14,
  },
  {
    key: 'support_boundary_005_peace_boundary',
    patternKey: 'boundaries_004_peace_boundary',
    title: 'The Boundary That Protects Peace',
    triggerSignals: ['peace_boundary', 'distance_for_safety', 'needs_pause'],
    sourcePriority: ['reflectionBank', 'journal', 'triggerLog'],
    observation:
      'Choosing quiet, space, or distance may be a boundary that protects peace.',
    pattern:
      'Recent signals point toward stepping back, needing distance, pausing, or protecting peace after something became too costly to keep negotiating with.',
    reframe:
      'This does not read as giving up. It reads as peace becoming important enough to stop negotiating with what drains it.',
    question:
      'Where is peace asking for a clearer line?',
    tone: 'grounding',
    cooldownDays: 14,
  },
  {
    key: 'support_boundary_006_autonomy_need',
    patternKey: 'boundaries_017_autonomy_need',
    title: 'The Need to Stay Connected to Yourself',
    triggerSignals: ['autonomy_need', 'inner_authority', 'choosing_self'],
    sourcePriority: ['reflectionBank', 'journal', 'triggerLog'],
    observation:
      'Resistance may be information about where choice or self-connection got too narrow.',
    pattern:
      'The archive is noticing pressure, control, trapped feelings, restricted choice, or a need to make the decision from the inside instead of only responding to demand.',
    reframe:
      "This does not read as being resistant. It reads as the need to stay connected to yourself while responding to life's demands.",
    question:
      'What choice would help you stay connected to yourself inside this demand?',
    tone: 'direct',
    cooldownDays: 14,
  },
  {
    key: 'support_boundary_007_no_protects_yes',
    patternKey: 'boundaries_010_no_protects_yes',
    title: 'The No That Protects the Yes',
    triggerSignals: ['says_no', 'energy_scarcity', 'purpose_signal'],
    sourcePriority: ['reflectionBank', 'journal', 'dailyCheckIn'],
    observation:
      'A no may be protecting the energy needed for something more important.',
    pattern:
      'Recent signals suggest that limited energy, purpose, values, or future direction may require a boundary so the right yes has enough room to live.',
    reframe:
      'This does not read as letting people down. It reads as one boundary protecting the energy needed for what matters most.',
    question:
      'What yes becomes more possible because this no exists?',
    tone: 'encouraging',
    cooldownDays: 14,
  },
];
