import type {
  ArchivePattern,
  ArchivePatternScore,
  PatternConfidence,
  PatternMovement,
  UserSignal,
} from '../types';
import {
  compareEvidenceByPrimarySource,
  orderSourcesByPrimaryPriority,
  sourcePriorityScore,
} from '../sourcePriority';

const DAY_MS = 24 * 60 * 60 * 1000;

function dateKeyToTime(value: string): number {
  const key = value.slice(0, 10);
  const parsed = new Date(`${key}T00:00:00Z`).getTime();
  if (Number.isFinite(parsed)) return parsed;

  const fallback = new Date(value).getTime();
  return Number.isFinite(fallback) ? fallback : Number.NaN;
}

/**
 * Scores an ArchivePattern based on normalized UserSignals.
 */
export function scoreArchivePattern(
  pattern: ArchivePattern,
  signals: UserSignal[],
  now: string,
  previousScore?: ArchivePatternScore,
): ArchivePatternScore {
  const nowTime = dateKeyToTime(now);
  const safeNowTime = Number.isFinite(nowTime) ? nowTime : Date.now();
  const cutoff = safeNowTime - Math.max(pattern.lookbackDays - 1, 0) * DAY_MS;
  const matchedSignalKeys = new Set([
    ...pattern.requiredSignals,
    ...pattern.supportingSignals,
  ]);
  const conflictingSignalKeys = new Set(pattern.conflictingSignals ?? []);

  const relevantSignals = signals.filter(s => {
    const sTime = dateKeyToTime(s.date);
    return (
      Number.isFinite(sTime) &&
      sTime >= cutoff &&
      matchedSignalKeys.has(s.key)
    );
  });

  const requiredMatches = relevantSignals.filter(s =>
    pattern.requiredSignals.includes(s.key),
  );

  const supportingMatches = relevantSignals.filter(s =>
    pattern.supportingSignals.includes(s.key),
  );

  const conflictingMatches = signals.filter(s => {
    const sTime = dateKeyToTime(s.date);
    return (
      Number.isFinite(sTime) &&
      sTime >= cutoff &&
      conflictingSignalKeys.has(s.key)
    );
  });

  const sourceCount = new Set(relevantSignals.map(s => s.source)).size;

  const frequencyScore = Math.min(relevantSignals.length / pattern.minEvidenceCount, 1);
  const requiredScore = requiredMatches.length > 0 ? 1 : 0;
  const sourceScore = Math.min(sourceCount / 3, 1);
  const strengthScore =
    relevantSignals.reduce((sum, s) => sum + s.strength, 0) /
    Math.max(relevantSignals.length, 1);
  const primarySourceScore = relevantSignals.length
    ? Math.max(...relevantSignals.map(s => sourcePriorityScore(s.source)))
    : 0;
  const evidenceMomentCount = new Set(
    relevantSignals.map(signal => `${signal.source}:${signal.date.slice(0, 10)}`),
  ).size;
  
  const conflictPenalty = Math.min(conflictingMatches.length * 0.2, 0.4);

  const rawScore = Math.max(0,
    (requiredScore * 0.35 +
    frequencyScore * 0.25 +
    sourceScore * 0.18 +
    strengthScore * 0.17 +
    primarySourceScore * 0.05) - conflictPenalty
  );
  const hasEnoughEvidence =
    relevantSignals.length >= pattern.minEvidenceCount &&
    evidenceMomentCount >= Math.min(2, pattern.minEvidenceCount);
  const score = hasEnoughEvidence
    ? rawScore
    : Math.min(rawScore, 0.49);

  let confidence: PatternConfidence = 'emerging';
  if (hasEnoughEvidence) {
    if (score > 0.85) confidence = 'veryStrong';
    else if (score > 0.7) confidence = 'strong';
    else if (score > 0.55) confidence = 'moderate';
  }

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
    .sort(compareEvidenceByPrimarySource)
    .slice(0, 6);

  const lastSeenAt = relevantSignals.length > 0
    ? [...relevantSignals].sort((a, b) => dateKeyToTime(b.date) - dateKeyToTime(a.date))[0].date
    : now;

  return {
    patternKey: pattern.key,
    title: pattern.title,
    category: pattern.category,
    score,
    confidence,
    movement,
    timeframeDays: pattern.lookbackDays,
    sources: orderSourcesByPrimaryPriority(relevantSignals.map(s => s.source)),
    evidence,
    lastSeenAt,
  };
}
