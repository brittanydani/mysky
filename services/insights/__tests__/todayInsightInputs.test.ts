import {
  countTodayInsightInputs,
  localDayKeyFromDateLike,
} from '../todayInsightInputs';
import { toLocalDateString } from '../../../utils/dateUtils';

type SurfaceInput = Parameters<typeof countTodayInsightInputs>[0];

function emptySurface(overrides: Partial<SurfaceInput> = {}): SurfaceInput {
  const selfKnowledgeOverrides: Partial<SurfaceInput['selfKnowledgeContext']> =
    overrides.selfKnowledgeContext ?? {};

  return {
    checkIns: overrides.checkIns ?? [],
    recentJournalEntries: overrides.recentJournalEntries ?? [],
    sleepEntries: overrides.sleepEntries ?? [],
    selfKnowledgeContext: {
      dailyReflections: selfKnowledgeOverrides.dailyReflections ?? null,
      somaticEntries: selfKnowledgeOverrides.somaticEntries ?? [],
      triggerEvents: selfKnowledgeOverrides.triggerEvents ?? [],
      relationshipPatterns: selfKnowledgeOverrides.relationshipPatterns ?? [],
    },
  };
}

describe('today insight input counting', () => {
  const today = '2026-04-24';

  it('counts every same-day input source Home can use for Today insights', () => {
    const surface = emptySurface({
      checkIns: [{ date: today }],
      recentJournalEntries: [{
        date: today,
        content: 'A journal note with enough signal.',
        isDeleted: false,
      }],
      sleepEntries: [{
        date: today,
        durationHours: 6.5,
        quality: 3,
        isDeleted: false,
      }],
      selfKnowledgeContext: {
        dailyReflections: {
          recentAnswers: [{ date: today }],
        },
        somaticEntries: [{ date: `${today}T08:00:00` }],
        triggerEvents: [{ timestamp: new Date(2026, 3, 24, 9, 0).getTime() }],
        relationshipPatterns: [{ date: today }],
      },
    });

    expect(countTodayInsightInputs(surface, today)).toBe(7);
  });

  it('ignores stale, deleted, empty, or unsupported rows', () => {
    const surface = emptySurface({
      checkIns: [{ date: '2026-04-23' }],
      recentJournalEntries: [
        { date: today, content: '   ', isDeleted: false },
        { date: today, content: 'Deleted note', isDeleted: true },
        { date: '2026-04-23', content: 'Old note', isDeleted: false },
      ],
      sleepEntries: [
        { date: today, isDeleted: false },
        { date: today, dreamText: 'Deleted dream', isDeleted: true },
        { date: '2026-04-23', quality: 4, isDeleted: false },
      ],
      selfKnowledgeContext: {
        dailyReflections: {
          recentAnswers: [{ date: '2026-04-23' }],
        },
        somaticEntries: [{ date: '2026-04-23T12:00:00' }],
        triggerEvents: [{ timestamp: new Date(2026, 3, 23, 9, 0).getTime() }],
        relationshipPatterns: [{ date: '2026-04-23' }],
      },
    });

    expect(countTodayInsightInputs(surface, today)).toBe(0);
  });

  it('uses local day keys for timestamped self-knowledge signals', () => {
    const localEvening = new Date(2026, 3, 24, 23, 30);
    const localDay = toLocalDateString(localEvening);
    const surface = emptySurface({
      selfKnowledgeContext: {
        dailyReflections: null,
        somaticEntries: [{ date: localEvening.toISOString() }],
        triggerEvents: [{ timestamp: localEvening.getTime() }],
        relationshipPatterns: [{ date: localEvening.toISOString() }],
      },
    });

    expect(localDayKeyFromDateLike(localEvening.toISOString())).toBe(localDay);
    expect(countTodayInsightInputs(surface, localDay)).toBe(3);
  });
});
