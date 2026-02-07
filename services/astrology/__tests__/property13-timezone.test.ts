// Property-based test for historical timezone accuracy
// **Feature: astrology-app-critical-fixes, Property 13: Historical timezone accuracy**
// **Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5**

import * as fc from 'fast-check';
import { TimezoneHandler } from '../timezoneHandler';

const nyc = { latitude: 40.7128, longitude: -74.0060 };
const london = { latitude: 51.5074, longitude: -0.1278 };

const winterDate = '2020-01-15T12:00:00';
const summerDate = '2020-07-15T12:00:00';

describe('Property 13: Historical timezone accuracy', () => {
  test('**Feature: astrology-app-critical-fixes, Property 13: Historical timezone accuracy**', () => {
    fc.assert(fc.property(
      fc.constantFrom('nyc', 'london'),
      (city) => {
        const location = city === 'nyc' ? nyc : london;
        const winter = TimezoneHandler.resolveHistoricalTimezone(
          winterDate,
          location.latitude,
          location.longitude
        );
        const summer = TimezoneHandler.resolveHistoricalTimezone(
          summerDate,
          location.latitude,
          location.longitude
        );

        expect(TimezoneHandler.isValidTimezone(winter.timezone)).toBe(true);
        expect(TimezoneHandler.isValidTimezone(summer.timezone)).toBe(true);
        expect(typeof winter.offset).toBe('number');
        expect(typeof summer.offset).toBe('number');

        if (city === 'nyc') {
          expect(winter.timezone).toBe('America/New_York');
          expect(summer.timezone).toBe('America/New_York');
          expect(winter.isDST).toBe(false);
          expect(summer.isDST).toBe(true);
          expect(summer.offset - winter.offset).toBe(60);
        } else {
          expect(winter.timezone).toBe('Europe/London');
          expect(summer.timezone).toBe('Europe/London');
          expect(winter.isDST).toBe(false);
          expect(summer.isDST).toBe(true);
          expect(summer.offset - winter.offset).toBe(60);
        }
      }
    ), {
      numRuns: 10,
      verbose: true,
    });
  });
});
