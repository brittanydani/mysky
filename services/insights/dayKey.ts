/**
 * Day Key Utility
 *
 * Computes YYYY-MM-DD in the user's local timezone from any timestamp.
 * This is the universal merge key for tying together mood check-ins,
 * journal entries, energy data, and daily context.
 */

import { DayKey } from './types';

/**
 * Convert an ISO timestamp (or Date) to a local YYYY-MM-DD day key.
 * Uses the device's local timezone by default.
 */
export function toDayKey(input: string | Date): DayKey {
  const d = typeof input === 'string' ? new Date(input) : input;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get today's day key in local timezone.
 */
export function todayDayKey(): DayKey {
  return toDayKey(new Date());
}

/**
 * Get the day key for N days ago.
 */
export function daysAgoDayKey(n: number): DayKey {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return toDayKey(d);
}

/**
 * Count calendar days between two day keys (inclusive of both endpoints = diff + 1).
 */
export function daysBetweenKeys(a: DayKey, b: DayKey): number {
  const da = new Date(a + 'T00:00:00');
  const db = new Date(b + 'T00:00:00');
  return Math.round(Math.abs(db.getTime() - da.getTime()) / 86_400_000);
}

/**
 * Get the day-of-week (0=Sunday) for a day key.
 */
export function dayOfWeek(key: DayKey): number {
  return new Date(key + 'T12:00:00').getDay();
}

/**
 * Get the ISO week number for weekly aggregation.
 * Returns `YYYY-Wnn` (e.g. "2026-W08").
 */
export function weekKey(key: DayKey): string {
  const d = new Date(key + 'T12:00:00');
  const dayNum = d.getDay() || 7; // Make Sunday = 7
  d.setDate(d.getDate() + 4 - dayNum); // Set to nearest Thursday
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
  return `${d.getFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}
