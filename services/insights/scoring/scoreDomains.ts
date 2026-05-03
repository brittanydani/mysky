import type { UserSignal } from '../../insightsV2/types';
import { scoreSubcategories } from './scoreSubcategories';

export interface InsightDomainScore {
  majorDomain: string;
  score: number;
  matchedSubcategories: string[];
  matchedAnchors: string[];
  matchedSignalTypes: string[];
}

export function scoreDomains(signals: readonly UserSignal[]): InsightDomainScore[] {
  const byDomain = new Map<string, InsightDomainScore>();

  for (const subcategoryScore of scoreSubcategories(signals)) {
    const existing = byDomain.get(subcategoryScore.majorDomain) ?? {
      majorDomain: subcategoryScore.majorDomain,
      score: 0,
      matchedSubcategories: [],
      matchedAnchors: [],
      matchedSignalTypes: [],
    };

    existing.score = Math.max(existing.score, subcategoryScore.score);
    existing.matchedSubcategories.push(subcategoryScore.subcategory);
    existing.matchedAnchors.push(...subcategoryScore.matchedAnchors);
    existing.matchedSignalTypes.push(...subcategoryScore.matchedSignalTypes);
    byDomain.set(subcategoryScore.majorDomain, existing);
  }

  return Array.from(byDomain.values())
    .map(score => ({
      ...score,
      matchedSubcategories: Array.from(new Set(score.matchedSubcategories)),
      matchedAnchors: Array.from(new Set(score.matchedAnchors)),
      matchedSignalTypes: Array.from(new Set(score.matchedSignalTypes)),
    }))
    .sort((a, b) => b.score - a.score);
}
