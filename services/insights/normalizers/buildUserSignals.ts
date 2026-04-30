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
  return [
    ...checkIns.flatMap(normalizeDailyCheckIn),
    ...checkIns.flatMap(normalizeAstrology),
    ...journalEntries.flatMap(normalizeJournal),
    ...sleepEntries.flatMap(normalizeSleep),
    ...(selfKnowledgeContext?.somaticEntries
      ? normalizeSomatic(selfKnowledgeContext.somaticEntries)
      : []),
    ...(selfKnowledgeContext?.triggerEvents
      ? normalizeTriggerEvents(selfKnowledgeContext.triggerEvents)
      : []),
    ...(selfKnowledgeContext?.relationshipPatterns
      ? normalizeRelationshipPatterns(selfKnowledgeContext.relationshipPatterns)
      : []),
    ...(selfKnowledgeContext?.dailyReflections?.recentAnswers
      ? normalizeDailyReflections(selfKnowledgeContext.dailyReflections.recentAnswers)
      : []),
  ];
}
