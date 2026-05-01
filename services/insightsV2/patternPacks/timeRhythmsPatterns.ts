import type { ArchivePattern, SignalKey } from '../types';

const timeRhythmsPattern = (
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
  category: 'timeRhythms',
  description,
  requiredSignals,
  supportingSignals,
  shameLabel,
  clarityReframe,
  lookbackDays: 60,
  minEvidenceCount: 3,
  minScore: 0.56,
  cooldownDays: 10,
  tags,
});

export const TIME_RHYTHMS_PATTERNS: ArchivePattern[] = [
  timeRhythmsPattern(
    'time_rhythms_001_time_scarcity',
    'The Time Scarcity Pattern',
    ['time_scarcity'],
    ['high_stress', 'overextension', 'responsibility_weight', 'always_on'],
    'poor time management',
    'time feeling tight because too much is trying to fit into too little space',
    'Rushing or time pressure may reveal the shape of demand more than a flaw in discipline.',
    ['time', 'pressure', 'demand'],
  ),
  timeRhythmsPattern(
    'time_rhythms_002_energy_window',
    'The Energy Window',
    ['high_energy'],
    ['creative_aliveness', 'wants_to_build', 'mood_improvement', 'body_lightness'],
    'being inconsistent',
    'capacity having a rhythm that can be worked with instead of forced',
    'Energy may arrive in repeatable windows that are easier to protect when the pattern is named.',
    ['energy', 'rhythm', 'timing'],
  ),
  timeRhythmsPattern(
    'time_rhythms_003_late_day_capacity_drop',
    'The Late-Day Capacity Drop',
    ['mood_drop'],
    ['low_energy', 'depletion', 'capacity_strain', 'needs_pause'],
    'losing momentum',
    'the day showing where capacity naturally thins',
    'Mood or energy may drop after sustained demand, pointing to a rhythm that needs earlier support.',
    ['evening', 'capacity', 'drop'],
  ),
];
