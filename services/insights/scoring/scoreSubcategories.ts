import {
  INSIGHT_SUBCATEGORIES,
  type InsightSubcategory,
} from '../taxonomy/insightSubcategories';
import type { UserSignal } from '../../insightsV2/types';

export interface InsightSubcategoryScore {
  majorDomain: string;
  subcategory: string;
  category: InsightSubcategory['category'];
  score: number;
  matchedAnchors: string[];
  matchedSignalTypes: string[];
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function signalSearchText(signals: readonly UserSignal[]): string {
  return normalize(
    signals.map(signal => [
      signal.key,
      signal.source,
      ...(signal.roles ?? []),
      signal.evidence?.label,
      signal.evidence?.phrase,
      signal.evidence?.signal,
    ].filter(Boolean).join(' ')).join(' '),
  );
}

export function scoreSubcategories(
  signals: readonly UserSignal[],
  taxonomy: readonly InsightSubcategory[] = INSIGHT_SUBCATEGORIES,
): InsightSubcategoryScore[] {
  const haystack = signalSearchText(signals);
  const signalSources = new Set(signals.map(signal => signal.source));

  return taxonomy
    .map(entry => {
      const matchedAnchors = entry.anchors.filter(anchor => haystack.includes(normalize(anchor)));
      const matchedSignalTypes = entry.signalTypes.filter(signalType => signalSources.has(signalType as UserSignal['source']));
      const signalStrength = signals.reduce((sum, signal) => sum + signal.strength, 0) / Math.max(signals.length, 1);
      const score = Math.min(1, matchedAnchors.length * 0.12 + matchedSignalTypes.length * 0.08 + signalStrength * 0.35);

      return {
        majorDomain: entry.majorDomain,
        subcategory: entry.subcategory,
        category: entry.category,
        score: Number(score.toFixed(3)),
        matchedAnchors: unique(matchedAnchors),
        matchedSignalTypes: unique(matchedSignalTypes),
      };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score);
}
