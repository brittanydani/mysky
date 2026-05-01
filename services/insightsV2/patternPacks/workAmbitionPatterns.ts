import type { ArchivePattern, SignalKey } from '../types';

const workAmbitionPattern = (
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
  category: 'workAmbition',
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

export const WORK_AMBITION_PATTERNS: ArchivePattern[] = [
  workAmbitionPattern(
    'work_ambition_001_excellence_pressure',
    'The Excellence Pressure Pattern',
    ['excellence_pressure'],
    ['high_standards', 'creative_standards', 'capacity_strain', 'self_blame'],
    'never being satisfied',
    'a high inner standard asking for structure instead of punishment',
    'High standards may become pressure when achievement is used to prove safety, value, or enoughness.',
    ['excellence', 'standards', 'pressure'],
  ),
  workAmbitionPattern(
    'work_ambition_002_building_drive',
    'The Building Drive',
    ['wants_to_build'],
    ['purpose_signal', 'creative_aliveness', 'future_self_orientation', 'vision_gap'],
    'wanting too much',
    'ambition pointing toward something meaningful that wants form',
    'The user may feel pulled toward building, creating, or shaping something beyond the current chapter.',
    ['ambition', 'building', 'purpose'],
  ),
  workAmbitionPattern(
    'work_ambition_003_productivity_cost',
    'The Productivity Cost',
    ['overextension'],
    ['burnout_risk', 'always_on', 'rest_resistance', 'energy_scarcity'],
    'falling behind',
    'output costing more when recovery has not been treated as part of the work',
    'Productivity may come with a visible cost when effort continues past the body capacity line.',
    ['productivity', 'burnout', 'recovery'],
  ),
];
