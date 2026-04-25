import type { DailyAngle } from '../types';

/**
 * Rest + Capacity Daily Angles
 */

export const REST_CAPACITY_ANGLES: DailyAngle[] = [
  {
    key: 'rest_resistance_001_rest_without_earning',
    patternKey: 'rest_capacity_001_rest_resistance',
    title: 'Rest Without Earning It',
    triggerSignals: ['rest_resistance', 'low_energy', 'rest_guilt'],
    avoidIfSignals: ['high_energy', 'restorative_moment'],
    sourcePriority: ['dailyCheckIn', 'journal', 'sleep', 'bodyMap'],
    observation:
      'Your archive suggests that rest may still feel easier to accept once exhaustion has already made the case for it.',
    pattern:
      'Across recent signals, your body seems to ask for pause before your mind fully gives permission. The pattern suggests that stopping may feel more allowed when you are already depleted.',
    reframe:
      'This does not read as laziness. It reads as a body asking for care before exhaustion becomes the only permission slip.',
    question:
      'What would rest look like today if it did not need to be justified first?',
    tone: 'soft',
    cooldownDays: 30,
  },

  {
    key: 'rest_resistance_002_same_load_less_fuel',
    patternKey: 'rest_capacity_001_rest_resistance',
    title: 'The Same Load, Less Fuel',
    triggerSignals: ['low_energy', 'capacity_strain', 'responsibility_weight'],
    avoidIfSignals: ['high_energy'],
    sourcePriority: ['dailyCheckIn', 'journal', 'sleep'],
    observation:
      'Your archive suggests that today’s heaviness may be less about the size of the task and more about the energy available to carry it.',
    pattern:
      'When reserves are low, responsibility can feel louder. Small decisions can take more effort, and things that normally feel manageable can start to feel personal, urgent, or too much.',
    reframe:
      'This does not read as failure. It reads as capacity telling the truth.',
    question:
      'What would change today if you believed your limits before they had to prove themselves?',
    tone: 'grounding',
    cooldownDays: 30,
  },

  {
    key: 'rest_resistance_003_the_body_casts_the_vote',
    patternKey: 'rest_capacity_001_rest_resistance',
    title: 'The Body Casts the Vote',
    triggerSignals: ['body_knows_first', 'low_energy', 'needs_pause'],
    avoidIfSignals: ['body_lightness', 'restorative_moment'],
    sourcePriority: ['bodyMap', 'dailyCheckIn', 'journal'],
    observation:
      'Your archive suggests that your body may notice the need for rest before your mind is ready to agree.',
    pattern:
      'Physical cues near low-energy days can be a sign that your system is already negotiating with its limits. The need for pause may be showing up in sensation before it becomes clear in thought.',
    reframe:
      'This does not read as your body working against you. It reads as your body trying to be included before depletion makes the decision for you.',
    question:
      'What is your body asking for today that your mind has been postponing?',
    tone: 'grounding',
    cooldownDays: 30,
  },

  {
    key: 'rest_resistance_004_the_guilt_around_stopping',
    patternKey: 'rest_capacity_001_rest_resistance',
    title: 'The Guilt Around Stopping',
    triggerSignals: ['rest_guilt', 'guilt', 'overextension'],
    avoidIfSignals: ['restorative_moment', 'receiving_openness'],
    sourcePriority: ['journal', 'dailyCheckIn', 'reflectionBank'],
    observation:
      'Your archive suggests that the hardest part of rest may not be the pause itself, but the guilt that appears around it.',
    pattern:
      'Recent signals point toward a familiar tension: knowing you need to stop, while another part of you still wants proof that stopping is allowed. The pattern suggests that rest may be tangled with worth, usefulness, or responsibility.',
    reframe:
      'This does not read as weakness. It reads as a learned rule that your needs must be defended before they can be honored.',
    question:
      'What would you let yourself stop doing today if guilt did not get the final vote?',
    tone: 'deep',
    cooldownDays: 30,
  },

  {
    key: 'rest_resistance_005_before_empty',
    patternKey: 'rest_capacity_001_rest_resistance',
    title: 'Before Empty',
    triggerSignals: ['needs_pause', 'low_energy', 'depletion'],
    avoidIfSignals: ['high_energy', 'low_stress'],
    sourcePriority: ['dailyCheckIn', 'sleep', 'bodyMap'],
    observation:
      'Your archive suggests that your system may be asking for rest before you reach the point of empty.',
    pattern:
      'The pattern here is subtle but important: the need for pause is appearing before total depletion. That matters because rest becomes more healing when it arrives early enough to actually restore you.',
    reframe:
      'This does not read as being dramatic. It reads as an earlier signal trying to protect you from having to crash to be believed.',
    question:
      'What would help today before you hit empty?',
    tone: 'clear',
    cooldownDays: 30,
  },
];
