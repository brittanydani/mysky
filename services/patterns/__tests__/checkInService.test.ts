/**
 * checkInService.test.ts
 *
 * Tests the pure-logic layer of CheckInService:
 *   - detectTimeOfDay (via getCurrentTimeSlot) — hour boundary conditions
 *   - getLogicalToday — pre-6am rolls back to yesterday
 *   - CheckInService.getCurrentStreak — streak counting with mocked DB
 *   - CheckInService.getCheckInCount — delegates to localDb correctly
 */

import { getLogicalToday, CheckInService, TIME_OF_DAY_LABELS, TIME_OF_DAY_ORDER } from '../checkInService';
import type { DailyCheckIn } from '../types';

// ─── Mock localDb so no SQLite / expo-sqlite is loaded ────────────────────────

jest.mock('../../storage/localDb', () => ({
  localDb: {
    getCheckIns: jest.fn(),
    getCheckInCount: jest.fn(),
    getCheckInsByDate: jest.fn(),
    getCheckInByDate: jest.fn(),
    getCheckInByDateAndTime: jest.fn(),
    getCheckInsInRange: jest.fn(),
    saveCheckIn: jest.fn(),
  },
}));

import { localDb } from '../../storage/localDb';

const mockDb = localDb as jest.Mocked<typeof localDb>;

// ─── Minimal fixture ──────────────────────────────────────────────────────────

function makeCheckIn(date: string): DailyCheckIn {
  return {
    id: `id-${date}`,
    date,
    chartId: 'chart-1',
    timeOfDay: 'morning',
    moodScore: 5,
    energyLevel: 'medium',
    stressLevel: 'low',
    tags: [],
    moonSign: 'Aries',
    moonHouse: 1,
    sunHouse: 1,
    transitEvents: [],
    lunarPhase: 'new',
    retrogrades: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// TIME_OF_DAY constants
// ─────────────────────────────────────────────────────────────────────────────

describe('TIME_OF_DAY_LABELS', () => {
  it('has entries for all four slots', () => {
    expect(Object.keys(TIME_OF_DAY_LABELS)).toEqual(
      expect.arrayContaining(['morning', 'afternoon', 'evening', 'night']),
    );
  });

  it('every slot has label, emoji, icon, and hours', () => {
    for (const key of TIME_OF_DAY_ORDER) {
      const entry = TIME_OF_DAY_LABELS[key];
      expect(typeof entry.label).toBe('string');
      expect(typeof entry.emoji).toBe('string');
      expect(typeof entry.icon).toBe('string');
      expect(typeof entry.hours).toBe('string');
    }
  });
});

describe('TIME_OF_DAY_ORDER', () => {
  it('lists slots in chronological order', () => {
    expect(TIME_OF_DAY_ORDER).toEqual(['morning', 'afternoon', 'evening', 'night']);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// detectTimeOfDay — via CheckInService.getCurrentTimeSlot()
// ─────────────────────────────────────────────────────────────────────────────

describe('detectTimeOfDay (via getCurrentTimeSlot)', () => {
  beforeEach(() => { jest.useFakeTimers(); });
  afterEach(() => { jest.useRealTimers(); });

  const cases: [string, string, number][] = [
    // [description, expected slot, hour]
    ['5:59am → night',      'night',     5],
    ['6:00am → morning',    'morning',   6],
    ['11:00am → morning',   'morning',  11],
    ['12:00pm → afternoon', 'afternoon', 12],
    ['17:00pm → afternoon', 'afternoon', 17],
    ['18:00pm → evening',   'evening',  18],
    ['21:00pm → evening',   'evening',  21],
    ['22:00pm → night',     'night',    22],
    ['midnight → night',    'night',     0],
  ];

  test.each(cases)('%s', (_desc, expected, hour) => {
    jest.setSystemTime(new Date(2026, 2, 29, hour, 0, 0));
    expect(CheckInService.getCurrentTimeSlot()).toBe(expected);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getLogicalToday
// ─────────────────────────────────────────────────────────────────────────────

describe('getLogicalToday', () => {
  beforeEach(() => { jest.useFakeTimers(); });
  afterEach(() => { jest.useRealTimers(); });

  it('returns today after 6am', () => {
    jest.setSystemTime(new Date(2026, 2, 29, 9, 0, 0)); // 9am March 29
    expect(getLogicalToday()).toBe('2026-03-29');
  });

  it('returns yesterday before 6am (still in the night window)', () => {
    jest.setSystemTime(new Date(2026, 2, 29, 3, 30, 0)); // 3:30am March 29
    expect(getLogicalToday()).toBe('2026-03-28');
  });

  it('returns today exactly at 6:00am', () => {
    jest.setSystemTime(new Date(2026, 2, 29, 6, 0, 0));
    expect(getLogicalToday()).toBe('2026-03-29');
  });

  it('returns yesterday at 5:59am', () => {
    jest.setSystemTime(new Date(2026, 2, 29, 5, 59, 0));
    expect(getLogicalToday()).toBe('2026-03-28');
  });

  it('handles month roll-over at midnight', () => {
    // 2am on April 1 — should report March 31
    jest.setSystemTime(new Date(2026, 3, 1, 2, 0, 0));
    expect(getLogicalToday()).toBe('2026-03-31');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CheckInService.getCurrentStreak
// ─────────────────────────────────────────────────────────────────────────────

describe('CheckInService.getCurrentStreak', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    // Fix "today" at March 29, 2026 at 10am
    jest.setSystemTime(new Date(2026, 2, 29, 10, 0, 0));
    mockDb.getCheckIns.mockReset();
  });

  afterEach(() => { jest.useRealTimers(); });

  it('returns 0 when there are no check-ins', async () => {
    mockDb.getCheckIns.mockResolvedValue([]);
    expect(await CheckInService.getCurrentStreak('chart-1')).toBe(0);
  });

  it('returns 1 when only today has a check-in', async () => {
    mockDb.getCheckIns.mockResolvedValue([makeCheckIn('2026-03-29')]);
    expect(await CheckInService.getCurrentStreak('chart-1')).toBe(1);
  });

  it('returns 3 for three consecutive days ending today', async () => {
    mockDb.getCheckIns.mockResolvedValue([
      makeCheckIn('2026-03-29'),
      makeCheckIn('2026-03-28'),
      makeCheckIn('2026-03-27'),
    ]);
    expect(await CheckInService.getCurrentStreak('chart-1')).toBe(3);
  });

  it('stops at a gap — only counts from today', async () => {
    mockDb.getCheckIns.mockResolvedValue([
      makeCheckIn('2026-03-29'),
      makeCheckIn('2026-03-28'),
      // gap: March 27 missing
      makeCheckIn('2026-03-26'),
    ]);
    expect(await CheckInService.getCurrentStreak('chart-1')).toBe(2);
  });

  it('counts 0 when today is missing even if yesterday is present', async () => {
    mockDb.getCheckIns.mockResolvedValue([
      makeCheckIn('2026-03-28'),
      makeCheckIn('2026-03-27'),
    ]);
    expect(await CheckInService.getCurrentStreak('chart-1')).toBe(0);
  });

  it('counts multiple check-ins on the same day as 1 streak day', async () => {
    mockDb.getCheckIns.mockResolvedValue([
      makeCheckIn('2026-03-29'),
      makeCheckIn('2026-03-29'), // duplicate slot (e.g. morning + evening)
      makeCheckIn('2026-03-28'),
    ]);
    expect(await CheckInService.getCurrentStreak('chart-1')).toBe(2);
  });

  it('queries with chartId and the 90-day limit', async () => {
    mockDb.getCheckIns.mockResolvedValue([]);
    await CheckInService.getCurrentStreak('chart-abc');
    expect(mockDb.getCheckIns).toHaveBeenCalledWith('chart-abc', 90);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CheckInService.getCheckInCount
// ─────────────────────────────────────────────────────────────────────────────

describe('CheckInService.getCheckInCount', () => {
  beforeEach(() => { mockDb.getCheckInCount.mockReset(); });

  it('delegates to localDb.getCheckInCount with the chartId', async () => {
    mockDb.getCheckInCount.mockResolvedValue(42);
    const result = await CheckInService.getCheckInCount('chart-1');
    expect(mockDb.getCheckInCount).toHaveBeenCalledWith('chart-1');
    expect(result).toBe(42);
  });

  it('returns 0 when the DB returns 0', async () => {
    mockDb.getCheckInCount.mockResolvedValue(0);
    expect(await CheckInService.getCheckInCount('chart-1')).toBe(0);
  });
});
