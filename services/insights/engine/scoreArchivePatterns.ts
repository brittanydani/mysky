import {
  ArchivePattern,
  ArchivePatternScore,
  ConfidenceLevel,
  PatternMovement,
  UserSignal,
} from '../types/knowledgeEngine';

/**
 * Scores an ArchivePattern based on normalized UserSignals.
 */
export function scoreArchivePattern(
  pattern: ArchivePattern,
  signals: UserSignal[],
  now: string,
): ArchivePatternScore {
  const nowMs = new Date(now).getTime();
  const windowStartMs = nowMs - pattern.lookbackDays * 86_400_000;

  const relevantSignals = signals.filter((signal) => {
    const signalMs = new Date(signal.date).getTime();
    return (
      signalMs >= windowStartMs &&
      [...pattern.requiredSignals, ...pattern.supportingSignals].includes(signal.key)
    );
  });

  const requiredMatches = relevantSignals.filter((signal) =>
    pattern.requiredSignals.includes(signal.key)
  );

  const supportingMatches = relevantSignals.filter((signal) =>
    pattern.supportingSignals.includes(signal.key)
  );

  const sourceCount = new Set(relevantSignals.map((signal) => signal.source)).size;

  const frequencyScore = Math.min(relevantSignals.length / pattern.minEvidenceCount, 1);
  const requiredScore = requiredMatches.length > 0 ? 1 : 0;
  const sourceScore = Math.min(sourceCount / 3, 1);
  const strengthScore =
    relevantSignals.reduce((sum, signal) => sum + signal.strength, 0) /
    Math.max(relevantSignals.length, 1);

  const score =
    requiredScore * 0.35 +
    frequencyScore * 0.25 +
    sourceScore * 0.2 +
    strengthScore * 0.2;

  let confidence: ConfidenceLevel = 'emerging';
  if (score > 0.85) confidence = 'veryStrong';
  else if (score > 0.7) confidence = 'strong';
  else if (score > 0.55) confidence = 'moderate';

  // Sort evidence by recency
  const evidence = relevantSignals
    .map((s) => s.evidence)
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
    movement: 'repeating', // Logic for movement will be in a separate step
    timeframeDays: pattern.lookbackDays,
    sources: Array.from(new Set(relevantSignals.map((signal) => signal.source))),
    evidence,
    lastSeenAt,
  };
}
