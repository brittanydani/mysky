import {
  ArchivePatternScore,
  DailyInsightContext,
  GeneratedInsight,
  UserSignal,
  ArchivePattern,
} from './types/knowledgeEngine';
import { normalizeDailyCheckIn } from './normalizers/normalizeDailyCheckIn';
import { normalizeJournal } from './normalizers/normalizeJournal';
import { normalizeSleep } from './normalizers/normalizeSleep';
import { normalizeSomatic } from './normalizers/normalizeSomatic';
import { ARCHIVE_PATTERNS } from './archivePatterns';
import { scoreArchivePattern } from './engine/scoreArchivePatterns';
import { buildDailyInsightContext } from './engine/detectMovement';
import { selectDailyInsight } from './engine/selectInsights';
import { generateInsightCopy } from './generator/generateInsightCopy';
import { filterAndPolishInsight } from './generator/insightSafetyFilter';
import { DailyCheckIn } from '../patterns/types';
import { JournalEntry, SleepEntry } from '../storage/models';
import { SelfKnowledgeContext } from './selfKnowledgeContext';

/**
 * The main entry point for the Knowledge Engine.
 */
export function runKnowledgeEngine(
  checkIns: DailyCheckIn[],
  journals: JournalEntry[],
  sleep: SleepEntry[],
  skContext: SelfKnowledgeContext | null,
  now: string,
  history: { recentlyShownPatternKeys: string[]; recentlyShownCopyHashes: string[] },
): GeneratedInsight | null {
  // 1. Normalize all signals
  const allSignals: UserSignal[] = [
    ...checkIns.flatMap(normalizeDailyCheckIn),
    ...journals.flatMap(normalizeJournal),
    ...sleep.flatMap(normalizeSleep),
    ...(skContext?.somaticEntries ? normalizeSomatic(skContext.somaticEntries) : []),
  ];

  // 2. Score Archive Patterns (last 90 days)
  const archiveScores: ArchivePatternScore[] = ARCHIVE_PATTERNS.map((p: ArchivePattern) =>
    scoreArchivePattern(p, allSignals, now),
  );

  // 3. Extract today's signals
  const todaySignals = allSignals.filter((s) => s.date === now.split('T')[0]);

  // 4. Extract recent signals (last 14 days) for movement baseline
  const recentSignals = allSignals.filter((s) => {
    const sMs = new Date(s.date).getTime();
    const nowMs = new Date(now).getTime();
    return sMs < nowMs && sMs >= nowMs - 14 * 86_400_000;
  });

  // 5. Build Context
  const context = buildDailyInsightContext(
    todaySignals,
    recentSignals,
    archiveScores,
    now,
    history,
  );

  // 6. Select Best Insight
  const match = selectDailyInsight(context);
  if (!match) return null;

  // 7. Generate Copy
  const insight = generateInsightCopy(match.pattern, match.angle, context);

  // 8. Filter & Polish
  return filterAndPolishInsight(insight);
}
