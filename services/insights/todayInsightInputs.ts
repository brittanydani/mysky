import { toLocalDateString } from '../../utils/dateUtils';

type DateLike = string | number | null | undefined;

interface TodayInsightInputSurface {
  checkIns: { date?: string | null }[];
  recentJournalEntries: {
    date?: string | null;
    content?: string | null;
    isDeleted?: boolean | null;
  }[];
  sleepEntries: {
    date?: string | null;
    quality?: number | null;
    durationHours?: number | null;
    dreamText?: string | null;
    isDeleted?: boolean | null;
  }[];
  selfKnowledgeContext: {
    dailyReflections?: {
      recentAnswers: { date?: string | null }[];
    } | null;
    somaticEntries: { date?: DateLike }[];
    triggerEvents: { timestamp?: DateLike }[];
    relationshipPatterns: { date?: DateLike }[];
  };
}

export function localDayKeyFromDateLike(value: DateLike): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const dateOnly = trimmed.slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateOnly) && trimmed.length <= 10) {
      return dateOnly;
    }

    const parsed = new Date(trimmed);
    if (Number.isFinite(parsed.getTime())) {
      return toLocalDateString(parsed);
    }

    return /^\d{4}-\d{2}-\d{2}$/.test(dateOnly) ? dateOnly : null;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    const parsed = new Date(value);
    return Number.isFinite(parsed.getTime()) ? toLocalDateString(parsed) : null;
  }

  return null;
}

function isTodayKey(value: DateLike, todayKey: string): boolean {
  return localDayKeyFromDateLike(value) === todayKey;
}

export function countTodayInsightInputs(surface: TodayInsightInputSurface, todayKey: string): number {
  const checkInCount = surface.checkIns.filter(entry => entry.date === todayKey).length;
  const journalCount = surface.recentJournalEntries.filter(entry =>
    !entry.isDeleted &&
    entry.date === todayKey &&
    typeof entry.content === 'string' &&
    entry.content.trim().length > 0,
  ).length;
  const sleepCount = surface.sleepEntries.filter(entry =>
    !entry.isDeleted &&
    entry.date === todayKey &&
    (entry.quality != null || entry.durationHours != null || !!entry.dreamText?.trim()),
  ).length;
  const selfKnowledge = surface.selfKnowledgeContext;
  const reflectionCount = selfKnowledge.dailyReflections?.recentAnswers.filter(answer =>
    answer.date === todayKey,
  ).length ?? 0;
  const somaticCount = selfKnowledge.somaticEntries.filter(entry =>
    isTodayKey(entry.date, todayKey),
  ).length;
  const triggerCount = selfKnowledge.triggerEvents.filter(event =>
    isTodayKey(event.timestamp, todayKey),
  ).length;
  const relationshipCount = selfKnowledge.relationshipPatterns.filter(entry =>
    isTodayKey(entry.date, todayKey),
  ).length;

  return checkInCount
    + journalCount
    + sleepCount
    + reflectionCount
    + somaticCount
    + triggerCount
    + relationshipCount;
}
