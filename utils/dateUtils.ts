/**
 * Date utilities that respect the user's local timezone.
 *
 * JavaScript's `date.toISOString()` converts to UTC, which can shift the date
 * backward in western timezones (e.g. 2026-02-06 11pm EST → 2026-02-07 in UTC,
 * or 2026-02-06 midnight UTC → 2026-02-05 in US timezones when displayed locally).
 *
 * These helpers always use the device's local timezone.
 */

/**
 * Returns the local date as a YYYY-MM-DD string.
 * Unlike `date.toISOString().split('T')[0]`, this never shifts the day.
 *
 * @example
 * // At 11pm EST on Feb 6:
 * toLocalDateString(new Date()) // → "2026-02-06"  (correct)
 * new Date().toISOString().split('T')[0] // → "2026-02-07"  (wrong!)
 */
export function toLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parses a YYYY-MM-DD string as local midnight (not UTC).
 * Use this instead of `new Date("2024-08-01")` which JS treats as UTC midnight.
 *
 * @example
 * parseLocalDate("1992-08-01").toLocaleDateString() // → "8/1/1992" (correct)
 * new Date("1992-08-01").toLocaleDateString()        // → "7/31/1992" in US (wrong!)
 */
export function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Returns the "check-in day" as a YYYY-MM-DD string.
 *
 * A check-in day runs from 2:00 AM to 1:59 AM the following morning.
 * If the current time is before 2:00 AM, the check-in still belongs to the
 * previous calendar day.
 *
 * @example
 * // At 1:00 AM on Apr 3 → "2026-04-02" (still the Apr 2 check-in day)
 * // At 2:00 AM on Apr 3 → "2026-04-03" (new check-in day starts)
 */
export function getCheckInDateString(date: Date = new Date()): string {
  const adjusted = new Date(date);
  if (adjusted.getHours() < 2) {
    adjusted.setDate(adjusted.getDate() - 1);
  }
  return toLocalDateString(adjusted);
}

/**
 * Returns the day-of-year (1–366) for a given date.
 * Useful for deterministic daily content selection.
 */
export function dayOfYear(d: Date = new Date()): number {
  const start = new Date(d.getFullYear(), 0, 0);
  return Math.floor((d.getTime() - start.getTime()) / 86400000);
}
