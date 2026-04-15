jest.mock('../../storage/localDb', () => ({
  localDb: {
    getCheckIns:      jest.fn(),
    getCheckInCount:  jest.fn(),
    getSleepEntries:  jest.fn(),
    getJournalEntries: jest.fn(),
  },
}));

jest.mock('../../../utils/logger', () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn() },
}));

// selfKnowledgeCrossRef exports used in getTriggerCrossRefInsight
jest.mock('../../../utils/selfKnowledgeCrossRef', () => ({
  DRAIN_TAG_MAP:   { conflict: 'conflict' },
  RESTORE_TAG_MAP: { nature: 'nature' },
}));

import { getDailyLoopData, getStreakStatus, getWeeklyReflection } from '../dailyLoop';
import { localDb } from '../../storage/localDb';
import { toLocalDateString } from '../../../utils/dateUtils';

// ── Helpers ────────────────────────────────────────────────────────────────

type MockCheckIn = { date: string; moodScore: number; energyLevel: string; stressLevel: string; tags: string[]; timeOfDay: string; createdAt: string };

function makeCheckIns(daysBack: number[], moodScore = 7): MockCheckIn[] {
  // Base date mirrors getCheckInDateString's 2AM cutoff: before 2 AM still belongs to yesterday.
  const base = new Date();
  if (base.getHours() < 2) base.setDate(base.getDate() - 1);
  return daysBack.map(d => {
    const dt = new Date(base);
    dt.setDate(dt.getDate() - d);
    const date = toLocalDateString(dt);
    return { date, moodScore, energyLevel: 'medium', stressLevel: 'low', tags: [], timeOfDay: 'morning', createdAt: `${date}T12:00:00Z` };
  });
}

function makeSleepEntries(daysBack: number[], hours = 8) {
  const base = new Date();
  if (base.getHours() < 2) base.setDate(base.getDate() - 1);
  return daysBack.map(d => {
    const dt = new Date(base);
    dt.setDate(dt.getDate() - d);
    const date = toLocalDateString(dt);
    return { date, durationHours: hours, chartId: 'test', createdAt: `${date}T07:00:00Z` };
  });
}

// ── getStreakStatus ────────────────────────────────────────────────────────

describe('getStreakStatus()', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns zeros with empty check-ins', async () => {
    (localDb.getCheckIns as jest.Mock).mockResolvedValue([]);
    (localDb.getCheckInCount as jest.Mock).mockResolvedValue(0);

    const result = await getStreakStatus('chart-1');
    expect(result.current).toBe(0);
    expect(result.checkedInToday).toBe(false);
    expect(result.atRisk).toBe(false);
    expect(result.milestone).toBeNull();
    expect(result.daysSinceLastCheckIn).toBe(-1);
  });

  it('detects today check-in → streak of 1', async () => {
    (localDb.getCheckIns as jest.Mock).mockResolvedValue(makeCheckIns([0]));
    (localDb.getCheckInCount as jest.Mock).mockResolvedValue(1);

    const result = await getStreakStatus('chart-1');
    expect(result.checkedInToday).toBe(true);
    expect(result.current).toBe(1);
    expect(result.atRisk).toBe(false);
  });

  it('calculates a 5-day consecutive streak', async () => {
    (localDb.getCheckIns as jest.Mock).mockResolvedValue(makeCheckIns([0, 1, 2, 3, 4]));
    (localDb.getCheckInCount as jest.Mock).mockResolvedValue(5);

    const result = await getStreakStatus('chart-1');
    expect(result.current).toBe(5);
    expect(result.checkedInToday).toBe(true);
  });

  it('breaks streak on a gap (days 0, 1, 3, 4 → streak = 2)', async () => {
    (localDb.getCheckIns as jest.Mock).mockResolvedValue(makeCheckIns([0, 1, 3, 4]));
    (localDb.getCheckInCount as jest.Mock).mockResolvedValue(4);

    const result = await getStreakStatus('chart-1');
    expect(result.current).toBe(2);
  });

  it('detects at-risk when yesterday checked in but not today', async () => {
    // Check-ins only for yesterday and the day before
    (localDb.getCheckIns as jest.Mock).mockResolvedValue(makeCheckIns([1, 2, 3]));
    (localDb.getCheckInCount as jest.Mock).mockResolvedValue(3);

    const result = await getStreakStatus('chart-1');
    expect(result.checkedInToday).toBe(false);
    expect(result.atRisk).toBe(true);
    // at-risk shows the streak they'd lose (3 days starting from yesterday)
    expect(result.current).toBe(3);
  });

  it('detects 7-day milestone', async () => {
    (localDb.getCheckIns as jest.Mock).mockResolvedValue(makeCheckIns([0, 1, 2, 3, 4, 5, 6]));
    (localDb.getCheckInCount as jest.Mock).mockResolvedValue(7);

    const result = await getStreakStatus('chart-1');
    expect(result.current).toBe(7);
    expect(result.milestone).toBe(7);
  });

  it('detects 30-day milestone', async () => {
    (localDb.getCheckIns as jest.Mock).mockResolvedValue(makeCheckIns(Array.from({ length: 30 }, (_, i) => i)));
    (localDb.getCheckInCount as jest.Mock).mockResolvedValue(30);

    const result = await getStreakStatus('chart-1');
    expect(result.current).toBe(30);
    expect(result.milestone).toBe(30);
  });

  it('returns non-milestone null for streak of 8', async () => {
    (localDb.getCheckIns as jest.Mock).mockResolvedValue(makeCheckIns(Array.from({ length: 8 }, (_, i) => i)));
    (localDb.getCheckInCount as jest.Mock).mockResolvedValue(8);

    const result = await getStreakStatus('chart-1');
    expect(result.current).toBe(8);
    expect(result.milestone).toBeNull();
  });

  it('returns safe defaults when localDb throws', async () => {
    (localDb.getCheckIns as jest.Mock).mockRejectedValue(new Error('db failure'));

    const result = await getStreakStatus('chart-1');
    expect(result.current).toBe(0);
    expect(result.checkedInToday).toBe(false);
    expect(result.milestone).toBeNull();
    expect(result.daysSinceLastCheckIn).toBe(-1);
  });

  it('daysSinceLastCheckIn is 0 when checked in today', async () => {
    (localDb.getCheckIns as jest.Mock).mockResolvedValue(makeCheckIns([0]));
    (localDb.getCheckInCount as jest.Mock).mockResolvedValue(1);

    const result = await getStreakStatus('chart-1');
    expect(result.daysSinceLastCheckIn).toBe(0);
  });

  it('daysSinceLastCheckIn is 2 when last check-in was 2 days ago', async () => {
    (localDb.getCheckIns as jest.Mock).mockResolvedValue(makeCheckIns([2, 3, 4]));
    (localDb.getCheckInCount as jest.Mock).mockResolvedValue(3);

    const result = await getStreakStatus('chart-1');
    expect(result.daysSinceLastCheckIn).toBe(2);
  });
});

// ── getWeeklyReflection ────────────────────────────────────────────────────

describe('getWeeklyReflection()', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (localDb.getJournalEntries as jest.Mock).mockResolvedValue([]);
  });

  it('returns zeros for empty data', async () => {
    (localDb.getCheckIns as jest.Mock).mockResolvedValue([]);
    (localDb.getSleepEntries as jest.Mock).mockResolvedValue([]);

    const result = await getWeeklyReflection('chart-1');
    expect(result.avgMood).toBe(0);
    expect(result.checkInCount).toBe(0);
    expect(result.hasEnoughData).toBe(false);
    expect(result.prevAvgMood).toBeNull();
  });

  it('hasEnoughData is false with fewer than 3 check-ins this week', async () => {
    (localDb.getCheckIns as jest.Mock).mockResolvedValue(makeCheckIns([0, 1]));
    (localDb.getSleepEntries as jest.Mock).mockResolvedValue([]);

    const result = await getWeeklyReflection('chart-1');
    expect(result.hasEnoughData).toBe(false);
  });

  it('hasEnoughData is true with 3+ check-ins this week', async () => {
    (localDb.getCheckIns as jest.Mock).mockResolvedValue(makeCheckIns([0, 1, 2]));
    (localDb.getSleepEntries as jest.Mock).mockResolvedValue([]);

    const result = await getWeeklyReflection('chart-1');
    expect(result.hasEnoughData).toBe(true);
    expect(result.avgMood).toBe(7);
  });

  it('calculates correct avgMood', async () => {
    const checkIns = [
      ...makeCheckIns([0], 8),
      ...makeCheckIns([1], 6),
      ...makeCheckIns([2], 7),
    ];
    (localDb.getCheckIns as jest.Mock).mockResolvedValue(checkIns);
    (localDb.getSleepEntries as jest.Mock).mockResolvedValue([]);

    const result = await getWeeklyReflection('chart-1');
    expect(result.avgMood).toBeCloseTo(7, 1);
  });

  it('detects moodDirection "up" when this week > last week by > 0.3', async () => {
    const thisWeek = makeCheckIns([0, 1, 2, 3], 8);
    const lastWeek = makeCheckIns([7, 8, 9, 10], 5);
    (localDb.getCheckIns as jest.Mock).mockResolvedValue([...thisWeek, ...lastWeek]);
    (localDb.getSleepEntries as jest.Mock).mockResolvedValue([]);

    const result = await getWeeklyReflection('chart-1');
    expect(result.moodDirection).toBe('up');
  });

  it('detects moodDirection "down" when this week < last week by > 0.3', async () => {
    const thisWeek = makeCheckIns([0, 1, 2, 3], 4);
    const lastWeek = makeCheckIns([7, 8, 9, 10], 8);
    (localDb.getCheckIns as jest.Mock).mockResolvedValue([...thisWeek, ...lastWeek]);
    (localDb.getSleepEntries as jest.Mock).mockResolvedValue([]);

    const result = await getWeeklyReflection('chart-1');
    expect(result.moodDirection).toBe('down');
  });

  it('detects stable mood when change is within ±0.3', async () => {
    const thisWeek = makeCheckIns([0, 1, 2, 3], 7);
    const lastWeek = makeCheckIns([7, 8, 9, 10], 7);
    (localDb.getCheckIns as jest.Mock).mockResolvedValue([...thisWeek, ...lastWeek]);
    (localDb.getSleepEntries as jest.Mock).mockResolvedValue([]);

    const result = await getWeeklyReflection('chart-1');
    expect(result.moodDirection).toBe('stable');
  });

  it('calculates avgSleep from this week sleep entries', async () => {
    (localDb.getCheckIns as jest.Mock).mockResolvedValue(makeCheckIns([0, 1, 2]));
    (localDb.getSleepEntries as jest.Mock).mockResolvedValue(makeSleepEntries([0, 1, 2], 8));

    const result = await getWeeklyReflection('chart-1');
    expect(result.avgSleep).toBe(8);
  });

  it('prevAvgMood is null when no last week data', async () => {
    (localDb.getCheckIns as jest.Mock).mockResolvedValue(makeCheckIns([0, 1, 2]));
    (localDb.getSleepEntries as jest.Mock).mockResolvedValue([]);

    const result = await getWeeklyReflection('chart-1');
    expect(result.prevAvgMood).toBeNull();
  });

  it('summary starts with tracking prompt when 0 check-ins', async () => {
    (localDb.getCheckIns as jest.Mock).mockResolvedValue([]);
    (localDb.getSleepEntries as jest.Mock).mockResolvedValue([]);

    const result = await getWeeklyReflection('chart-1');
    expect(result.summary).toContain('Start tracking');
  });

  it('summary mentions count when 1 check-in', async () => {
    (localDb.getCheckIns as jest.Mock).mockResolvedValue(makeCheckIns([0]));
    (localDb.getSleepEntries as jest.Mock).mockResolvedValue([]);

    const result = await getWeeklyReflection('chart-1');
    expect(result.summary).toContain('once');
  });

  it('summary includes mood average when hasEnoughData', async () => {
    (localDb.getCheckIns as jest.Mock).mockResolvedValue(makeCheckIns([0, 1, 2]));
    (localDb.getSleepEntries as jest.Mock).mockResolvedValue([]);

    const result = await getWeeklyReflection('chart-1');
    expect(result.summary).toContain('7.0');
  });

  it('returns safe defaults when localDb throws', async () => {
    (localDb.getCheckIns as jest.Mock).mockRejectedValue(new Error('db error'));

    const result = await getWeeklyReflection('chart-1');
    expect(result.avgMood).toBe(0);
    expect(result.moodDirection).toBe('stable');
    expect(result.hasEnoughData).toBe(false);
  });
});

describe('getDailyLoopData()', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (localDb.getJournalEntries as jest.Mock).mockResolvedValue([]);
  });

  it('prioritizes milestone insights over other available insight types', async () => {
    const streakCheckIns = makeCheckIns([0, 1, 2, 3, 4, 5, 6], 7);
    (localDb.getCheckIns as jest.Mock).mockResolvedValue(streakCheckIns);
    (localDb.getCheckInCount as jest.Mock).mockResolvedValue(7);
    (localDb.getSleepEntries as jest.Mock).mockResolvedValue(makeSleepEntries([0, 1, 2, 3, 4, 5, 6], 8));

    const result = await getDailyLoopData('chart-1');

    expect(result.todayInsight.type).toBe('milestone');
    expect(result.todayInsight.text).toContain('One week');
    expect(result.returnNudge).toBeNull();
  });

  it('uses trigger cross-reference insight before generic pattern insight when self-knowledge confirms it', async () => {
    const checkIns = [
      ...makeCheckIns([0], 8).map((entry) => ({ ...entry, tags: ['nature'] })),
      ...makeCheckIns([2], 8).map((entry) => ({ ...entry, tags: ['nature'] })),
      ...makeCheckIns([4], 8).map((entry) => ({ ...entry, tags: ['nature'] })),
      ...makeCheckIns([6], 5).map((entry) => ({ ...entry, tags: ['screens'] })),
      ...makeCheckIns([8], 5).map((entry) => ({ ...entry, tags: ['work'] })),
    ];
    (localDb.getCheckIns as jest.Mock).mockResolvedValue(checkIns);
    (localDb.getCheckInCount as jest.Mock).mockResolvedValue(checkIns.length);
    (localDb.getSleepEntries as jest.Mock).mockResolvedValue([]);

    const result = await getDailyLoopData('chart-1', {
      coreValues: null,
      archetypeProfile: null,
      cognitiveStyle: null,
      somaticEntries: [],
      triggers: { drains: ['conflict'], restores: ['nature'] },
      relationshipPatterns: [],
      dailyReflections: null,
    } as any);

    expect(result.todayInsight.type).toBe('pattern');
    expect(result.todayInsight.text).toContain('data confirms it');
    expect(result.todayInsight.text).toContain('nature');
  });

  it('builds a motivating return nudge when a streak is at risk', async () => {
    const checkIns = makeCheckIns([1, 2, 3], 6);
    (localDb.getCheckIns as jest.Mock).mockResolvedValue(checkIns);
    (localDb.getCheckInCount as jest.Mock).mockResolvedValue(checkIns.length);
    (localDb.getSleepEntries as jest.Mock).mockResolvedValue([]);

    const result = await getDailyLoopData('chart-1');

    expect(result.returnNudge).toEqual(expect.objectContaining({
      ctaLabel: 'Quick Check-In',
      urgency: 'motivating',
      ctaRoute: '/(tabs)/internal-weather',
    }));
  });

  it('falls back to encouragement and a restart nudge after a longer gap', async () => {
    const checkIns = makeCheckIns([4, 5, 6], 6);
    (localDb.getCheckIns as jest.Mock).mockResolvedValue(checkIns);
    (localDb.getCheckInCount as jest.Mock).mockResolvedValue(checkIns.length);
    (localDb.getSleepEntries as jest.Mock).mockResolvedValue([]);

    const result = await getDailyLoopData('chart-1');

    expect(result.todayInsight.type).toBe('encouragement');
    expect(result.returnNudge).toEqual(expect.objectContaining({
      ctaLabel: 'Start Again',
      urgency: 'gentle',
    }));
  });
});
