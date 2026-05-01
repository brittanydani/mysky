import type { DailyCheckIn } from '../../patterns/types';
import type { JournalEntry, SleepEntry } from '../../storage/models';
import type { SelfKnowledgeContext } from '../selfKnowledgeContext';
import type { UserSignal } from '../types/knowledgeEngine';
import { normalizeAstrology } from './normalizeAstrology';
import { normalizeDailyCheckIn } from './normalizeDailyCheckIn';
import { normalizeDailyReflections } from './normalizeDailyReflections';
import { normalizeJournal } from './normalizeJournal';
import { normalizeRelationshipPatterns } from './normalizeRelationshipPatterns';
import { normalizeSleep } from './normalizeSleep';
import { normalizeSomatic } from './normalizeSomatic';
import { normalizeTriggerEvents } from './normalizeTriggerEvents';
import { compareSignalsByPrimarySource } from '../sourcePriority';

export interface BuildUserSignalsInput {
  checkIns: DailyCheckIn[];
  journalEntries?: JournalEntry[];
  sleepEntries?: SleepEntry[];
  selfKnowledgeContext?: SelfKnowledgeContext | null;
}

/**
 * Single source list for insight evidence.
 */
export function buildUserSignals({
  checkIns,
  journalEntries = [],
  sleepEntries = [],
  selfKnowledgeContext,
}: BuildUserSignalsInput): UserSignal[] {
  const signals = [
    ...(selfKnowledgeContext?.dailyReflections?.recentAnswers
      ? normalizeDailyReflections(selfKnowledgeContext.dailyReflections.recentAnswers)
      : []),
    ...(selfKnowledgeContext?.somaticEntries
      ? normalizeSomatic(selfKnowledgeContext.somaticEntries)
      : []),
    ...(selfKnowledgeContext?.triggerEvents
      ? normalizeTriggerEvents(selfKnowledgeContext.triggerEvents)
      : []),
    ...(selfKnowledgeContext?.relationshipPatterns
      ? normalizeRelationshipPatterns(selfKnowledgeContext.relationshipPatterns)
      : []),
    ...journalEntries.flatMap(normalizeJournal),
    ...checkIns.flatMap(normalizeDailyCheckIn),
    ...sleepEntries.flatMap(normalizeSleep),
    ...checkIns.flatMap(normalizeAstrology),
  ];

  return signals.sort(compareSignalsByPrimarySource);
}
