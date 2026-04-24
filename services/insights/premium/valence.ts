import {
  HARD_BLOCK_POSITIVE_WORDS,
  type ConditionRole,
  type ValenceClass,
  type ValenceEvidence,
} from './types';

export function classifyValence({
  positiveCount,
  negativeCount,
  neutralCount,
}: Pick<ValenceEvidence, 'positiveCount' | 'negativeCount' | 'neutralCount'>): ValenceClass {
  const total = positiveCount + negativeCount + neutralCount;
  if (total === 0) return 'unknown';

  const max = Math.max(positiveCount, negativeCount, neutralCount);

  if (positiveCount === max && positiveCount > negativeCount * 1.5 && positiveCount > neutralCount) {
    return 'positive';
  }
  if (negativeCount === max && negativeCount > positiveCount * 1.5 && negativeCount > neutralCount) {
    return 'negative';
  }
  if (neutralCount === max && neutralCount >= positiveCount && neutralCount >= negativeCount) {
    return 'neutral';
  }
  return 'mixed';
}

export function classifyConditionRole(
  label: string,
  evidence: ValenceEvidence,
): ConditionRole {
  const normalized = label.toLowerCase().trim();

  const {
    positiveCount,
    negativeCount,
    neutralCount,
    improvementFollowCount,
    worseningFollowCount,
  } = evidence;

  const positiveDominant =
    positiveCount >= 3 && positiveCount > negativeCount * 2;

  const improvementDominant =
    improvementFollowCount >= 3 &&
    improvementFollowCount > worseningFollowCount * 2;

  const negativeDominant =
    negativeCount >= 3 && negativeCount > positiveCount * 2;

  const worseningDominant =
    worseningFollowCount >= 3 &&
    worseningFollowCount > improvementFollowCount * 2;

  const mostlyNeutral =
    neutralCount > positiveCount && neutralCount > negativeCount;

  if (HARD_BLOCK_POSITIVE_WORDS.has(normalized) && !(positiveDominant || improvementDominant)) {
    if (negativeDominant || worseningDominant) return 'drain';
    if (mostlyNeutral) return 'context';
    return 'mixed';
  }

  if (positiveDominant || improvementDominant) return 'restorer';
  if (negativeDominant || worseningDominant) return 'drain';
  if (mostlyNeutral) return 'context';
  return 'mixed';
}

export function canUseAsPositiveSupport(label: string, evidence: ValenceEvidence): boolean {
  return classifyConditionRole(label, evidence) === 'restorer';
}
