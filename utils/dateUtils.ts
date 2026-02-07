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
