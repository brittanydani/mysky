import {
  DailyInsightAngle,
  GeneratedInsight,
  ArchivePatternScore,
  DailyInsightContext,
} from '../types/knowledgeEngine';
import { ARCHIVE_PATTERNS } from '../archivePatterns';

/**
 * Selects the best insight candidate for today.
 */
export function selectDailyInsight(context: DailyInsightContext): {
  pattern: typeof ARCHIVE_PATTERNS[number];
  angle: DailyInsightAngle;
  score: number;
} | null {
  const candidates: Array<{
    pattern: typeof ARCHIVE_PATTERNS[number];
    angle: DailyInsightAngle;
    score: number;
  }> = [];

  for (const pattern of ARCHIVE_PATTERNS) {
    // Skip if shown recently
    if (context.recentlyShownPatternKeys.includes(pattern.key)) continue;

    const patternScore = context.archivePatterns.find((p) => p.patternKey === pattern.key);
    if (!patternScore || patternScore.score < pattern.minConfidence) continue;

    for (const angle of pattern.dailyAngles) {
      // Basic Trigger Check
      const hasTrigger = angle.triggerSignals.some((ts) =>
        context.todaySignals.some((s) => s.key === ts),
      );

      // Scoring factors
      let matchScore = patternScore.score * 0.4;
      if (hasTrigger) matchScore += 0.5;

      // Cross-source bonus
      const crossMatch = angle.triggerSignals.some((ts) =>
        context.crossSourceMatches.includes(ts),
      );
      if (crossMatch) matchScore += 0.3;

      candidates.push({ pattern, angle, score: matchScore });
    }
  }

  // Sort by score descending
  candidates.sort((a, b) => b.score - a.score);

  return candidates[0] ?? null;
}
