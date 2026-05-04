import type {
  ArchivePattern,
  ArchivePatternScore,
  DailyAngle,
  DailyInsightContext,
  InsightCategory,
  InsightDataSource,
  InsightSlot,
  InsightSurface,
  UserSignal,
} from '../types';
import { ARCHIVE_PATTERNS } from '../patternPacks';
import { DAILY_ANGLES } from '../anglePacks';
import { checkInsightFreshness } from '../insightFreshness';
import { isArchivePatternAllowedOnSurface } from '../insightSurfacePolicy';

export type FreshInsightCandidate = {
  pattern: ArchivePattern;
  patternScore: ArchivePatternScore;
  angle: DailyAngle;
  score: number;
  matchingSignals: UserSignal[];
  crossSourceScore: number;
  noveltyScore: number;
};

const CATEGORY_SOURCE_PREFERENCES: Partial<Record<InsightCategory, InsightDataSource[]>> = {
  bodySignals: ['bodyMap', 'triggerLog'],
  glimmersRegulation: ['glimmerLog'],
  natalChartReflection: ['natalChart'],
  relationships: ['relationshipMirror', 'triggerLog'],
  timeRhythms: ['dailyCheckIn', 'sleep', 'journal'],
};

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function angleSourcePriorityScore(
  angle: DailyAngle,
  matchingSignals: UserSignal[],
): number {
  if (!angle.sourcePriority?.length || matchingSignals.length === 0) return 0;
  const matchingSources = new Set(matchingSignals.map(signal => signal.source));
  const bestIndex = angle.sourcePriority.findIndex(source => matchingSources.has(source));
  if (bestIndex < 0) return 0;
  return (angle.sourcePriority.length - bestIndex) / angle.sourcePriority.length;
}

function categorySourceFitScore(
  category: InsightCategory,
  matchingSignals: UserSignal[],
): number {
  const preferredSources = CATEGORY_SOURCE_PREFERENCES[category];
  if (!preferredSources?.length) return 0;
  return matchingSignals.some(signal => preferredSources.includes(signal.source)) ? 1 : 0;
}

function angleEvidencePhraseScore(
  angle: DailyAngle,
  matchingSignals: UserSignal[],
): number {
  const angleText = normalizeText([
    angle.key,
    angle.title,
    angle.observation,
    angle.pattern,
    angle.question,
  ].join(' '));
  const phrases = matchingSignals
    .flatMap(signal => [
      signal.evidence?.label,
      signal.evidence?.phrase,
      signal.evidence?.signal,
    ])
    .filter((value): value is string => typeof value === 'string' && value.trim().length >= 4)
    .map(normalizeText);

  return phrases.some(phrase => angleText.includes(phrase)) ? 1 : 0;
}

/**
 * Selects the best fresh insight candidates for a given slot.
 */
export function selectFreshInsight(
  context: DailyInsightContext,
  slot: InsightSlot,
  surface: InsightSurface,
): FreshInsightCandidate | null {
  const candidates: FreshInsightCandidate[] = [];

  for (const pattern of ARCHIVE_PATTERNS) {
    if (surface === 'today' && !isArchivePatternAllowedOnSurface(pattern, 'today')) continue;

    const patternScore = context.archivePatterns.find(p => p.patternKey === pattern.key);
    // Be lenient for tests or specific patterns
    const minScore = pattern.minScore ?? 0.55; 
    if (!patternScore || patternScore.score < minScore) continue;

    const patternAngles = DAILY_ANGLES.filter(a => a.patternKey === pattern.key);

    for (const angle of patternAngles) {
      // 1. Match Trigger Signals
      const matchingSignals = context.todaySignals.filter(s =>
        angle.triggerSignals.includes(s.key),
      );
      if (surface === 'today' && matchingSignals.length === 0) continue;

      // 2. Check Avoid Signals
      const hasAvoidSignals = angle.avoidIfSignals?.some(key =>
        context.todaySignals.some(s => s.key === key),
      );
      if (hasAvoidSignals) continue;

      // 3. Freshness Check
      const freshness = checkInsightFreshness({
        patternScore,
        angle,
        slot,
        surface,
        history: context.history,
        now: context.date,
        evidence: patternScore.evidence,
        copyPreview: `${angle.title}\n${angle.observation}\n${angle.pattern}\n${angle.reframe}`,
      });

      if (!freshness.allowed) continue;

      // 4. Scoring
      const todaySignalMatch = matchingSignals.length > 0 ? 1 : 0;
      const triggerCoverageScore = Math.min(
        matchingSignals.length / Math.max(angle.triggerSignals.length, 1),
        1,
      );
      const crossSourceCount = new Set(matchingSignals.map(s => s.source)).size;
      const crossSourceScore = Math.min(crossSourceCount / 2, 1);
      const sourcePriorityScore = angleSourcePriorityScore(angle, matchingSignals);
      const sourceFitScore = categorySourceFitScore(pattern.category, matchingSignals);
      const evidencePhraseScore = angleEvidencePhraseScore(angle, matchingSignals);
      const noveltyScore = 1 - freshness.penalty;

      const finalScore =
        patternScore.score * 0.3 +
        todaySignalMatch * 0.12 +
        triggerCoverageScore * 0.13 +
        crossSourceScore * 0.18 +
        sourcePriorityScore * 0.09 +
        sourceFitScore * 0.28 +
        evidencePhraseScore * 0.06 +
        noveltyScore * 0.1 +
        0.1; // Baseline utility

      candidates.push({
        pattern,
        patternScore,
        angle,
        score: finalScore,
        matchingSignals,
        crossSourceScore,
        noveltyScore,
      });
    }
  }

  if (candidates.length === 0) return null;

  // Rank and return top
  return candidates.sort((a, b) => b.score - a.score)[0];
}
