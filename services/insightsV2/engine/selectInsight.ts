import type {
  ArchivePattern,
  ArchivePatternScore,
  DailyAngle,
  DailyInsightContext,
  InsightSlot,
  InsightSurface,
  UserSignal,
} from '../types';
import { ARCHIVE_PATTERNS } from '../patternPacks';
import { DAILY_ANGLES } from '../anglePacks';
import { checkInsightFreshness } from '../insightFreshness';

export type InsightCandidate = {
  pattern: ArchivePattern;
  patternScore: ArchivePatternScore;
  angle: DailyAngle;
  score: number;
  matchingSignals: UserSignal[];
  crossSourceScore: number;
  noveltyScore: number;
};

/**
 * Selects the best fresh insight candidates for a given slot.
 */
export function selectFreshInsight(
  context: DailyInsightContext,
  slot: InsightSlot,
  surface: InsightSurface,
): InsightCandidate | null {
  const candidates: InsightCandidate[] = [];

  for (const pattern of ARCHIVE_PATTERNS) {
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
      const crossSourceCount = new Set(matchingSignals.map(s => s.source)).size;
      const crossSourceScore = Math.min(crossSourceCount / 2, 1);
      const noveltyScore = 1 - freshness.penalty;

      const finalScore =
        patternScore.score * 0.3 +
        todaySignalMatch * 0.25 +
        crossSourceScore * 0.2 +
        noveltyScore * 0.15 +
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
