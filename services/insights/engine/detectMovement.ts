import {
  DailyInsightContext,
  DailyMovement,
  UserSignal,
  ArchivePatternScore,
} from '../types/knowledgeEngine';

/**
 * Detects movements between today's signals and the recent baseline.
 */
export function detectDailyMovement(
  todaySignals: UserSignal[],
  recentSignals: UserSignal[],
): DailyMovement[] {
  const movements: DailyMovement[] = [];

  if (todaySignals.length === 0) return movements;

  // Cross-source match detection
  const todaySources = new Set(todaySignals.map((s) => s.source));
  if (todaySources.size >= 2) {
    movements.push('cross_source_match');
  }

  // New signal detection
  const recentKeys = new Set(recentSignals.map((s) => s.key));
  for (const signal of todaySignals) {
    if (!recentKeys.has(signal.key)) {
      movements.push('new_signal');
      break;
    }
  }

  return movements;
}

/**
 * Builds the context for selecting today's insight.
 */
export function buildDailyInsightContext(
  todaySignals: UserSignal[],
  recentSignals: UserSignal[],
  archivePatterns: ArchivePatternScore[],
  date: string,
  history: { recentlyShownPatternKeys: string[]; recentlyShownCopyHashes: string[] },
): DailyInsightContext {
  const movement = detectDailyMovement(todaySignals, recentSignals);

  const strongestTodaySignal = [...todaySignals].sort((a, b) => b.strength - a.strength)[0] ?? null;
  const strongestArchivePattern = [...archivePatterns].sort((a, b) => b.score - a.score)[0] ?? null;

  // Identify cross-source matches (keys appearing in >1 source today)
  const keyCounts: Record<string, number> = {};
  const keySources: Record<string, Set<string>> = {};
  for (const s of todaySignals) {
    keyCounts[s.key] = (keyCounts[s.key] ?? 0) + 1;
    if (!keySources[s.key]) keySources[s.key] = new Set();
    keySources[s.key].add(s.source);
  }
  const crossSourceMatches = Object.keys(keySources).filter((k) => keySources[k].size >= 2);

  return {
    date,
    todaySignals,
    recentSignals,
    archivePatterns,
    strongestTodaySignal,
    strongestArchivePattern,
    crossSourceMatches,
    movement,
    unusedAngles: [], // To be populated by selector
    recentlyShownPatternKeys: history.recentlyShownPatternKeys,
    recentlyShownCopyHashes: history.recentlyShownCopyHashes,
  };
}
