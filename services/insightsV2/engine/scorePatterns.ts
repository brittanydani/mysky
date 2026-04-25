import type {
  ArchivePattern,
  ArchivePatternScore,
  PatternConfidence,
  PatternMovement,
  UserSignal,
} from '../types';

/**
 * Scores an ArchivePattern based on normalized UserSignals.
 */
export function scoreArchivePattern(
  pattern: ArchivePattern,
  signals: UserSignal[],
  now: string,
  previousScore?: ArchivePatternScore,
): ArchivePatternScore {
  const nowTime = new Date(now).getTime();
  const cutoff = nowTime - pattern.lookbackDays * 24 * 60 * 60 * 1000;

  const relevantSignals = signals.filter(s => {
    const sTime = new Date(s.date).getTime();
    return (
      sTime >= cutoff &&
      [...pattern.requiredSignals, ...pattern.supportingSignals].includes(s.key)
    );
  });

  const requiredMatches = relevantSignals.filter(s =>
    pattern.requiredSignals.includes(s.key),
  );

  const supportingMatches = relevantSignals.filter(s =>
    pattern.supportingSignals.includes(s.key),
  );

  const conflictingMatches = signals.filter(s =>
    pattern.conflictingSignals?.includes(s.key),
  );

  const sourceCount = new Set(relevantSignals.map(s => s.source)).size;

  const frequencyScore = Math.min(relevantSignals.length / pattern.minEvidenceCount, 1);
  const requiredScore = requiredMatches.length > 0 ? 1 : 0;
  const sourceScore = Math.min(sourceCount / 3, 1);
  const strengthScore =
    relevantSignals.reduce((sum, s) => sum + s.strength, 0) /
    Math.max(relevantSignals.length, 1);
  
  const conflictPenalty = Math.min(conflictingMatches.length * 0.2, 0.4);

  const score = Math.max(0,
    (requiredScore * 0.35 +
    frequencyScore * 0.25 +
    sourceScore * 0.2 +
    strengthScore * 0.2) - conflictPenalty
  );

  let confidence: PatternConfidence = 'emerging';
  if (score > 0.85) confidence = 'veryStrong';
  else if (score > 0.7) confidence = 'strong';
  else if (score > 0.55) confidence = 'moderate';

  // Movement Detection
  let movement: PatternMovement = 'new';
  if (previousScore) {
    const diff = score - previousScore.score;
    if (Math.abs(diff) < 0.05) movement = 'repeating';
    else if (diff >= 0.05) movement = 'intensifying';
    else if (diff <= -0.05) movement = 'softening';
  }

  const evidence = relevantSignals
    .map(s => s.evidence)
    .filter((e): e is any => !!e)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 6);

  const lastSeenAt = relevantSignals.length > 0 ? relevantSignals[0].date : now;

  return {
    patternKey: pattern.key,
    title: pattern.title,
    category: pattern.category,
    score,
    confidence,
    movement,
    timeframeDays: pattern.lookbackDays,
    sources: Array.from(new Set(relevantSignals.map(s => s.source))),
    evidence,
    lastSeenAt,
  };
}
