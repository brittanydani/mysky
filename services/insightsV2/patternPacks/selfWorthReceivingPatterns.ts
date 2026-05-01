import type { ArchivePattern, SignalKey } from '../types';

const selfWorthReceivingPattern = (
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
  category: 'selfWorthReceiving',
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

export const SELF_WORTH_RECEIVING_PATTERNS: ArchivePattern[] = [
  selfWorthReceivingPattern(
    'self_worth_receiving_001_receiving_care',
    'Receiving Care Without Earning It',
    ['receiving_care_difficulty'],
    ['receiving_openness', 'support_need', 'fear_of_being_too_much', 'enoughness'],
    'being needy',
    'worth learning to receive without first becoming useful',
    'Care may be harder to accept when the user is used to earning belonging through usefulness.',
    ['receiving', 'care', 'worth'],
  ),
  selfWorthReceivingPattern(
    'self_worth_receiving_002_enough_without_proving',
    'Enough Without Proving',
    ['enoughness'],
    ['high_standards', 'self_forgiveness', 'inner_critic_softening', 'receiving_openness'],
    'lowering standards',
    'self-worth becoming less dependent on performance',
    'Enoughness may appear when the user can feel worthy without immediately proving, fixing, or optimizing.',
    ['enoughness', 'performance', 'self-worth'],
  ),
  selfWorthReceivingPattern(
    'self_worth_receiving_003_asking_for_support',
    'The Asking-for-Support Pattern',
    ['asks_for_support'],
    ['support_need', 'minimizes_need', 'receiving_care_difficulty', 'mutuality_need'],
    'asking for too much',
    'a need becoming clear enough to let someone meet it',
    'Asking for support may signal growing self-worth where needs are allowed to be named.',
    ['asking', 'support', 'needs'],
  ),
];
