import {
  insightTaxonomyDomainForKey,
  insightTaxonomyForCategory,
  isDreamInsightCategory as isDreamTaxonomyCategory,
  isInsightCategoryAllowedOnCandidateSurface,
} from './taxonomy/insightTaxonomy';
import type {
  ArchivePattern,
  ArchivePatternScore,
  InsightCategory,
  SignalKey,
  UserSignal,
} from './types';

export type InsightSurfacePolicyTarget = 'today' | 'patternScreen';

export function insightDomainForCategory(
  category: InsightCategory,
) {
  const taxonomy = insightTaxonomyForCategory(category);
  return taxonomy ? insightTaxonomyDomainForKey(taxonomy.majorDomain) : undefined;
}

export function isDreamSignalKey(key: SignalKey | string): boolean {
  return key === 'dream' || key.startsWith('dream_') || key.includes('_dream');
}

export function isDreamSignal(signal: UserSignal): boolean {
  return signal.source === 'dream' || isDreamSignalKey(signal.key);
}

export function isDreamInsightCategory(category: InsightCategory): boolean {
  return isDreamTaxonomyCategory(category);
}

export function isInsightCategoryAllowedOnSurface(
  category: InsightCategory,
  surface: InsightSurfacePolicyTarget,
): boolean {
  return isInsightCategoryAllowedOnCandidateSurface(
    category,
    surface === 'today' ? 'today' : 'patterns',
  );
}

export function isArchivePatternAllowedOnSurface(
  pattern: ArchivePattern,
  surface: InsightSurfacePolicyTarget,
): boolean {
  if (!isInsightCategoryAllowedOnSurface(pattern.category, surface)) return false;

  const requiredSignals = pattern.requiredSignals ?? [];
  const isDreamOnlyPattern =
    requiredSignals.length > 0 &&
    requiredSignals.every(signal => isDreamSignalKey(signal));

  return !isDreamOnlyPattern;
}

export function filterSignalsForInsightSurface(
  signals: UserSignal[],
  surface: InsightSurfacePolicyTarget,
): UserSignal[] {
  if (surface !== 'today' && surface !== 'patternScreen') return signals;
  return signals.filter(signal => !isDreamSignal(signal));
}

export function sanitizePatternScoreForSurface(
  score: ArchivePatternScore,
  surface: InsightSurfacePolicyTarget,
): ArchivePatternScore {
  if (surface !== 'patternScreen' && surface !== 'today') return score;

  return {
    ...score,
    sources: score.sources.filter(source => source !== 'dream'),
    evidence: score.evidence.filter(evidence => evidence.source !== 'dream'),
  };
}

export function isPatternScoreAllowedOnSurface(
  score: ArchivePatternScore,
  surface: InsightSurfacePolicyTarget,
): boolean {
  if (!isInsightCategoryAllowedOnSurface(score.category, surface)) return false;

  const sanitized = sanitizePatternScoreForSurface(score, surface);
  const hadNonDreamSource = sanitized.sources.length > 0;
  const hadNonDreamEvidence = sanitized.evidence.length > 0;
  const hadNoEvidenceYet = score.sources.length === 0 && score.evidence.length === 0;

  return hadNonDreamSource || hadNonDreamEvidence || hadNoEvidenceYet;
}
