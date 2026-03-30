/**
 * dayKey — unit tests
 *
 * Covers toDayKey, todayDayKey, daysAgoDayKey, daysBetweenKeys,
 * dayOfWeek, and weekKey.
 * All functions are pure (except todayDayKey / daysAgoDayKey which use
 * new Date() internally — tested for invariants rather than exact values).
 */

import {
  toDayKey,
  todayDayKey,
  daysAgoDayKey,
  daysBetweenKeys,
  dayOfWeek,
  weekKey,
} from '../dayKey';

// ─────────────────────────────────────────────────────────────────────────────
// toDayKey
// ─────────────────────────────────────────────────────────────────────────────

describe('toDayKey', () => {
  it('converts a local Date to YYYY-MM-DD', () => {
    const d = new Date(2026, 1, 15, 10, 30); // Feb 15 2026 10:30am local
    expect(toDayKey(d)).toBe('2026-02-15');
  });

  it('zero-pads month and day', () => {
    const d = new Date(2026, 0, 5); // Jan 5
    expect(toDayKey(d)).toBe('2026-01-05');
  });

  it('accepts an ISO string with time component', () => {
    // mid-day UTC string — result depends on local offset, but must be YYYY-MM-DD
    const result = toDayKey('2026-04-10T12:00:00.000Z');
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('accepts a Date object directly', () => {
    const d = new Date(2026, 6, 4, 14, 0); // Jul 4 2026
    expect(toDayKey(d)).toBe('2026-07-04');
  });

  it('handles Dec 31', () => {
    const d = new Date(2025, 11, 31);
    expect(toDayKey(d)).toBe('2025-12-31');
  });

  it('returns a 10-character string in YYYY-MM-DD format', () => {
    const result = toDayKey(new Date(2026, 5, 20));
    expect(result).toHaveLength(10);
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// todayDayKey
// ─────────────────────────────────────────────────────────────────────────────

describe('todayDayKey', () => {
  it('returns a valid YYYY-MM-DD string', () => {
    expect(todayDayKey()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('matches what toDayKey(new Date()) returns', () => {
    // Call both within the same tick to avoid midnight boundary flicker
    const before = toDayKey(new Date());
    const today = todayDayKey();
    const after = toDayKey(new Date());
    // today must equal before or after (could cross midnight between calls)
    expect([before, after]).toContain(today);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// daysAgoDayKey
// ─────────────────────────────────────────────────────────────────────────────

describe('daysAgoDayKey', () => {
  it('0 days ago equals todayDayKey', () => {
    const before = todayDayKey();
    const result = daysAgoDayKey(0);
    const after = todayDayKey();
    expect([before, after]).toContain(result);
  });

  it('1 day ago is exactly one day before today', () => {
    const today = toDayKey(new Date());
    const yesterday = daysAgoDayKey(1);
    const diff = daysBetweenKeys(today, yesterday);
    expect(diff).toBe(1);
  });

  it('7 days ago is exactly 7 days before today', () => {
    const today = toDayKey(new Date());
    const weekAgo = daysAgoDayKey(7);
    expect(daysBetweenKeys(today, weekAgo)).toBe(7);
  });

  it('returns a valid YYYY-MM-DD string', () => {
    expect(daysAgoDayKey(30)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// daysBetweenKeys
// ─────────────────────────────────────────────────────────────────────────────

describe('daysBetweenKeys', () => {
  it('returns 0 for the same day key', () => {
    expect(daysBetweenKeys('2026-03-15', '2026-03-15')).toBe(0);
  });

  it('returns 1 for consecutive days', () => {
    expect(daysBetweenKeys('2026-03-15', '2026-03-16')).toBe(1);
  });

  it('is symmetric (order of arguments does not matter)', () => {
    expect(daysBetweenKeys('2026-01-01', '2026-12-31')).toBe(
      daysBetweenKeys('2026-12-31', '2026-01-01'),
    );
  });

  it('correctly counts days across a month boundary', () => {
    expect(daysBetweenKeys('2026-01-28', '2026-02-04')).toBe(7);
  });

  it('correctly counts days across a year boundary', () => {
    expect(daysBetweenKeys('2025-12-31', '2026-01-01')).toBe(1);
  });

  it('returns 365 for one full non-leap year', () => {
    expect(daysBetweenKeys('2026-01-01', '2027-01-01')).toBe(365);
  });

  it('returns 366 for one full leap year', () => {
    expect(daysBetweenKeys('2024-01-01', '2025-01-01')).toBe(366);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// dayOfWeek
// ─────────────────────────────────────────────────────────────────────────────

describe('dayOfWeek', () => {
  it('March 29 2026 is a Sunday (0)', () => {
    expect(dayOfWeek('2026-03-29')).toBe(0);
  });

  it('March 30 2026 is a Monday (1)', () => {
    expect(dayOfWeek('2026-03-30')).toBe(1);
  });

  it('April 4 2026 is a Saturday (6)', () => {
    expect(dayOfWeek('2026-04-04')).toBe(6);
  });

  it('returns a value in 0–6 range', () => {
    const dow = dayOfWeek('2026-06-15');
    expect(dow).toBeGreaterThanOrEqual(0);
    expect(dow).toBeLessThanOrEqual(6);
  });

  it('consecutive days increment by 1 (mod 7)', () => {
    const d1 = dayOfWeek('2026-03-30');
    const d2 = dayOfWeek('2026-03-31');
    expect((d1 + 1) % 7).toBe(d2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// weekKey
// ─────────────────────────────────────────────────────────────────────────────

describe('weekKey', () => {
  it('returns YYYY-Wnn format', () => {
    expect(weekKey('2026-03-29')).toMatch(/^\d{4}-W\d{2}$/);
  });

  it('consecutive days in the same week return the same weekKey', () => {
    // Week containing Mar 30 (Mon) through Apr 5 (Sun) 2026
    const monday = weekKey('2026-03-30');
    const friday = weekKey('2026-04-03');
    expect(monday).toBe(friday);
  });

  it('days in different weeks return different weekKeys', () => {
    const week1 = weekKey('2026-03-23');
    const week2 = weekKey('2026-03-30');
    expect(week1).not.toBe(week2);
  });

  it('Jan 1 2026 is in week 1 of 2026', () => {
    // Jan 1 2026 is a Thursday — ISO week 1
    expect(weekKey('2026-01-01')).toBe('2026-W01');
  });

  it('Dec 28 2026 is in the last week of 2026', () => {
    const wk = weekKey('2026-12-28');
    expect(wk.startsWith('2026-W')).toBe(true);
  });
});
