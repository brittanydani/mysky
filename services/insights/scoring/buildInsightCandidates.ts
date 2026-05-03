import { ARCHIVE_PATTERNS } from '../../insightsV2/patternPacks';
import { scoreArchivePattern } from '../../insightsV2/engine/scorePatterns';
import type {
  ArchivePattern,
  ArchivePatternScore,
  InsightCandidate,
  UserSignal,
} from '../../insightsV2/types';
import { archivePatternToCandidate } from '../legacy/archivePatternToCandidate';

export interface BuildInsightCandidatesInput {
  signals: readonly UserSignal[];
  now: string;
  previousScores?: readonly ArchivePatternScore[];
  archivePatterns?: readonly ArchivePattern[];
  includeDreamInterpretation?: boolean;
}

export function buildInsightCandidates({
  signals,
  now,
  previousScores = [],
  archivePatterns = ARCHIVE_PATTERNS,
  includeDreamInterpretation = false,
}: BuildInsightCandidatesInput): InsightCandidate[] {
  const previousByKey = new Map(previousScores.map(score => [score.patternKey, score]));

  return archivePatterns
    .map(pattern => ({
      pattern,
      score: scoreArchivePattern(
        pattern,
        [...signals],
        now,
        previousByKey.get(pattern.key),
      ),
    }))
    .filter(({ pattern, score }) => score.score >= pattern.minScore)
    .map(({ pattern, score }) => archivePatternToCandidate(pattern, score))
    .filter(candidate =>
      includeDreamInterpretation ||
      !candidate.allowedSurfaces.every(surface => surface === 'dreamInterpretation'),
    )
    .sort((a, b) => b.strength - a.strength);
}
