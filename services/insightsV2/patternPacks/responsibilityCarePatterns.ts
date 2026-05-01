import type { ArchivePattern, SignalKey } from '../types';

const responsibilityCarePattern = (
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
  category: 'responsibilityCare',
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

export const RESPONSIBILITY_CARE_PATTERNS: ArchivePattern[] = [
  responsibilityCarePattern(
    'responsibility_care_001_invisible_labor',
    'The Invisible Labor Pattern',
    ['invisible_labor'],
    ['mental_load', 'responsibility_weight', 'caretaking_pressure', 'always_on'],
    'making too much of small things',
    'real labor becoming visible after being carried quietly',
    'The archive may show effort spent tracking needs, details, risks, and feelings before anyone else notices them.',
    ['invisible-labor', 'mental-load', 'care'],
  ),
  responsibilityCarePattern(
    'responsibility_care_002_capable_one',
    'The Capable One Pattern',
    ['responsibility_weight'],
    ['overfunctioning', 'preparedness', 'high_standards', 'support_need'],
    'being unable to relax',
    'capability becoming a role that deserves support too',
    'Being capable may turn into a repeated role where the user handles more because others trust they can.',
    ['capability', 'role', 'support'],
  ),
  responsibilityCarePattern(
    'responsibility_care_003_care_without_reciprocity',
    'Care Without Enough Return',
    ['caretaking_pressure'],
    ['mutuality_need', 'support_scarcity', 'depletion', 'receiving_care_difficulty'],
    'keeping score',
    'care asking for mutuality so generosity can stay alive',
    'Giving, noticing, or accommodating may become costly when mutuality is missing.',
    ['caretaking', 'mutuality', 'depletion'],
  ),
];
