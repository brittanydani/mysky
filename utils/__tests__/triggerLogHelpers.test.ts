/**
 * Tests for the pure helper functions exported from app/trigger-log.tsx.
 *
 * These cover formatting and bucketing logic that is used both in the log
 * form and in history rendering.
 */

import { formatTime, formatDate, timeOfDayLabel } from '../triggerLogHelpers';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Build a timestamp for a specific date and time. */
function tsFor(year: number, month: number, day: number, h: number, m: number): number {
  return new Date(year, month - 1, day, h, m, 0, 0).getTime();
}

/** Build a timestamp for today at a specific hour+minute. */
function todayAt(h: number, m: number): number {
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.getTime();
}

/** Build a timestamp for yesterday at a specific hour+minute. */
function yesterdayAt(h: number, m: number): number {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  d.setHours(h, m, 0, 0);
  return d.getTime();
}

// ─────────────────────────────────────────────────────────────────────────────
// formatTime()
// ─────────────────────────────────────────────────────────────────────────────

describe('formatTime()', () => {
  it('formats midnight as 12:00 AM', () => {
    expect(formatTime(todayAt(0, 0))).toBe('12:00 AM');
  });

  it('formats noon as 12:00 PM', () => {
    expect(formatTime(todayAt(12, 0))).toBe('12:00 PM');
  });

  it('formats 9:05 AM with zero-padded minutes', () => {
    expect(formatTime(todayAt(9, 5))).toBe('9:05 AM');
  });

  it('formats 13:30 as 1:30 PM', () => {
    expect(formatTime(todayAt(13, 30))).toBe('1:30 PM');
  });

  it('formats 23:59 as 11:59 PM', () => {
    expect(formatTime(todayAt(23, 59))).toBe('11:59 PM');
  });

  it('formats 1:00 as 1:00 AM', () => {
    expect(formatTime(todayAt(1, 0))).toBe('1:00 AM');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// formatDate()
// ─────────────────────────────────────────────────────────────────────────────

describe('formatDate()', () => {
  it('returns Today for a timestamp from today', () => {
    expect(formatDate(todayAt(10, 0))).toBe('Today');
  });

  it('returns Yesterday for a timestamp from yesterday', () => {
    expect(formatDate(yesterdayAt(10, 0))).toBe('Yesterday');
  });

  it('returns formatted date for older timestamps', () => {
    // Use a fixed past date unambiguously in the past
    const ts = tsFor(2025, 3, 15, 10, 0); // March 15 2025
    const result = formatDate(ts);
    // Month and day should appear — exact format depends on locale but Mar and 15 will be present
    expect(result).toMatch(/Mar/i);
    expect(result).toContain('15');
  });

  it('does not return Today or Yesterday for older timestamps', () => {
    const ts = tsFor(2025, 1, 1, 10, 0);
    const result = formatDate(ts);
    expect(result).not.toBe('Today');
    expect(result).not.toBe('Yesterday');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// timeOfDayLabel()
// ─────────────────────────────────────────────────────────────────────────────

describe('timeOfDayLabel()', () => {
  it('returns Late Night for hours 0–5', () => {
    for (const h of [0, 3, 5]) {
      expect(timeOfDayLabel(todayAt(h, 0))).toBe('Late Night');
    }
  });

  it('returns Morning for hours 6–11', () => {
    for (const h of [6, 8, 11]) {
      expect(timeOfDayLabel(todayAt(h, 0))).toBe('Morning');
    }
  });

  it('returns Afternoon for hours 12–16', () => {
    for (const h of [12, 15, 16]) {
      expect(timeOfDayLabel(todayAt(h, 0))).toBe('Afternoon');
    }
  });

  it('returns Evening for hours 17–20', () => {
    for (const h of [17, 19, 20]) {
      expect(timeOfDayLabel(todayAt(h, 0))).toBe('Evening');
    }
  });

  it('returns Night for hours 21–23', () => {
    for (const h of [21, 23]) {
      expect(timeOfDayLabel(todayAt(h, 0))).toBe('Night');
    }
  });
});
