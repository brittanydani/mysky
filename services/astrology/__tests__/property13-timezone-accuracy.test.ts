// Property-based test for historical timezone accuracy
// **Feature: astrology-app-critical-fixes, Property 13: Historical timezone accuracy**
// **Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5**

import * as fc from 'fast-check';
import { TimezoneHandler } from '../timezoneHandler';

const TZ_LIST = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Berlin',
  'Europe/Paris',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Kolkata',
  'Australia/Sydney',
  'Pacific/Auckland',
];

const dateArb = () =>
  fc.record({
    year: fc.integer({ min: 1900, max: 2100 }),
    month: fc.integer({ min: 1, max: 12 }),
    day: fc.integer({ min: 1, max: 28 }),
    hour: fc.integer({ min: 0, max: 23 }),
    minute: fc.integer({ min: 0, max: 59 }),
  }).map(({ year, month, day, hour, minute }) => ({
    date: `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`,
    time: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
  }));

describe('Property 13: Historical timezone accuracy', () => {
  test('**Feature: astrology-app-critical-fixes, Property 13: Historical timezone accuracy**', () => {
    fc.assert(fc.property(
      dateArb(),
      fc.float({ min: Math.fround(-89.9), max: Math.fround(89.9) }),
      fc.float({ min: Math.fround(-179.9), max: Math.fround(179.9) }),
      fc.option(fc.constantFrom(...TZ_LIST)),
      ({ date, time }, latitude, longitude, timezone) => {
        const dateTimeString = `${date}T${time}`;
        const info = TimezoneHandler.resolveHistoricalTimezone(
          dateTimeString,
          latitude,
          longitude,
          timezone ?? undefined
        );

        expect(info.timezone).toBeDefined();
        expect(info.localDateTime.isValid).toBe(true);
        expect(info.utcDateTime.isValid).toBe(true);

        // UTC conversion consistency
        const roundTripUtc = info.localDateTime.toUTC().toISO();
        expect(roundTripUtc).toBe(info.utcDateTime.toISO());

        // Offset sanity check (minutes within plausible range)
        expect(info.offset).toBeGreaterThanOrEqual(-12 * 60);
        expect(info.offset).toBeLessThanOrEqual(14 * 60);

        // DST flag should be boolean
        expect(typeof info.isDST).toBe('boolean');

        return true;
      }
    ), { numRuns: 100, verbose: true });
  });
});
