/**
 * dateUtils — unit tests
 *
 * Covers toLocalDateString, parseLocalDate, and dayOfYear.
 * All functions are pure, so no mocking is needed.
 */

import { toLocalDateString, parseLocalDate, dayOfYear } from '../dateUtils';

// ─────────────────────────────────────────────────────────────────────────────
// toLocalDateString
// ─────────────────────────────────────────────────────────────────────────────

describe('toLocalDateString', () => {
  it('formats a known local date correctly', () => {
    const d = new Date(2026, 1, 6); // Feb 6 2026 (month is 0-based)
    expect(toLocalDateString(d)).toBe('2026-02-06');
  });

  it('zero-pads month', () => {
    const d = new Date(2026, 0, 15); // Jan 15
    expect(toLocalDateString(d)).toBe('2026-01-15');
  });

  it('zero-pads day', () => {
    const d = new Date(2026, 11, 3); // Dec 3
    expect(toLocalDateString(d)).toBe('2026-12-03');
  });

  it('handles Jan 1', () => {
    const d = new Date(2026, 0, 1);
    expect(toLocalDateString(d)).toBe('2026-01-01');
  });

  it('handles Dec 31', () => {
    const d = new Date(2026, 11, 31);
    expect(toLocalDateString(d)).toBe('2026-12-31');
  });

  it('returns a YYYY-MM-DD string (length 10)', () => {
    const result = toLocalDateString(new Date(2026, 5, 20));
    expect(result).toHaveLength(10);
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('defaults to today when called with no argument', () => {
    const today = new Date();
    const expected = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    expect(toLocalDateString()).toBe(expected);
  });

  it('does not shift the date for late-evening times', () => {
    // 11:45 PM local
    const d = new Date(2026, 6, 15, 23, 45, 0);
    expect(toLocalDateString(d)).toBe('2026-07-15');
  });

  it('does not shift the date for midnight', () => {
    const d = new Date(2026, 3, 10, 0, 0, 0);
    expect(toLocalDateString(d)).toBe('2026-04-10');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// parseLocalDate
// ─────────────────────────────────────────────────────────────────────────────

describe('parseLocalDate', () => {
  it('parses a date string to local midnight', () => {
    const d = parseLocalDate('1992-08-01');
    expect(d.getFullYear()).toBe(1992);
    expect(d.getMonth()).toBe(7); // August (0-based)
    expect(d.getDate()).toBe(1);
  });

  it('returns hours=0, minutes=0, seconds=0', () => {
    const d = parseLocalDate('2026-03-15');
    expect(d.getHours()).toBe(0);
    expect(d.getMinutes()).toBe(0);
    expect(d.getSeconds()).toBe(0);
  });

  it('round-trips with toLocalDateString', () => {
    const original = '2026-11-22';
    const parsed = parseLocalDate(original);
    expect(toLocalDateString(parsed)).toBe(original);
  });

  it('handles Jan 1', () => {
    const d = parseLocalDate('2000-01-01');
    expect(d.getFullYear()).toBe(2000);
    expect(d.getMonth()).toBe(0);
    expect(d.getDate()).toBe(1);
  });

  it('handles Dec 31', () => {
    const d = parseLocalDate('2025-12-31');
    expect(d.getFullYear()).toBe(2025);
    expect(d.getMonth()).toBe(11);
    expect(d.getDate()).toBe(31);
  });

  it('handles year 1900', () => {
    const d = parseLocalDate('1900-06-15');
    expect(d.getFullYear()).toBe(1900);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// dayOfYear
// ─────────────────────────────────────────────────────────────────────────────

describe('dayOfYear', () => {
  it('returns 1 for Jan 1', () => {
    const d = new Date(2026, 0, 1);
    expect(dayOfYear(d)).toBe(1);
  });

  it('returns 32 for Feb 1', () => {
    const d = new Date(2026, 1, 1); // non-leap year
    expect(dayOfYear(d)).toBe(32);
  });

  it('returns 365 for Dec 31 in a non-leap year', () => {
    const d = new Date(2026, 11, 31);
    expect(dayOfYear(d)).toBe(365);
  });

  it('returns 366 for Dec 31 in a leap year', () => {
    const d = new Date(2024, 11, 31); // 2024 is a leap year
    expect(dayOfYear(d)).toBe(366);
  });

  it('is deterministic — same date returns same value', () => {
    const d = new Date(2026, 5, 20);
    expect(dayOfYear(d)).toBe(dayOfYear(d));
  });

  it('returns different values for consecutive days', () => {
    const d1 = new Date(2026, 2, 10);
    const d2 = new Date(2026, 2, 11);
    expect(dayOfYear(d2)).toBe(dayOfYear(d1) + 1);
  });

  it('defaults to today when called with no argument', () => {
    const result = dayOfYear();
    expect(result).toBeGreaterThanOrEqual(1);
    expect(result).toBeLessThanOrEqual(366);
  });
});
