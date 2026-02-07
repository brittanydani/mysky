// Property-based test for unknown birth time handling
// **Feature: astrology-app-critical-fixes, Property 7: Unknown birth time handling**
// **Validates: Requirements 3.1, 3.2, 3.3, 3.5**

import * as fc from 'fast-check';
import { UnknownTimeHandler } from '../unknownTimeHandler';
import { BirthData } from '../types';

const unknownTimeBirthDataGenerator = (): fc.Arbitrary<BirthData> => {
  return fc.record({
    date: fc.integer({ min: 1900, max: 2100 })
      .chain((year) =>
        fc.integer({ min: 1, max: 12 })
          .chain((month) =>
            fc.integer({ min: 1, max: 28 })
              .map((day) => `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`)
          )
      ),
    hasUnknownTime: fc.constant(true),
    place: fc.string({ minLength: 1, maxLength: 50 }).filter((value) => value.trim().length > 0),
    latitude: fc.float({ min: Math.fround(-89.9), max: Math.fround(89.9), noNaN: true, noDefaultInfinity: true }),
    longitude: fc.float({ min: Math.fround(-179.9), max: Math.fround(179.9), noNaN: true, noDefaultInfinity: true }),
    timezone: fc.option(fc.constantFrom(
      'America/New_York', 'Europe/London', 'Asia/Tokyo', 'Australia/Sydney',
      'America/Los_Angeles', 'Europe/Berlin', 'Asia/Shanghai', 'UTC'
    ))
  }).map((data) => ({
    ...data,
    time: undefined,
    hasUnknownTime: true
  }));
};

describe('Property 7: Unknown birth time handling', () => {
  /**
   * **Feature: astrology-app-critical-fixes, Property 7: Unknown birth time handling**
   *
   * Property: For any birth data with unknown time, the chart must
   * - Set risingSign to null (Req 3.1)
   * - Omit house calculations (Req 3.2)
   * - Use 12:00 noon local time reference for planetary positions (Req 3.3)
   * - Hide house-based interpretations/house cusps (Req 3.5)
   */
  test('**Feature: astrology-app-critical-fixes, Property 7: Unknown birth time handling**', () => {
    fc.assert(fc.property(
      unknownTimeBirthDataGenerator(),
      (birthData) => {
        const result = UnknownTimeHandler.processUnknownTimeChart(birthData);

        // Requirement 3.1: risingSign is null
        expect(result.chart.risingSign).toBeNull();

        // Requirement 3.2: house calculations omitted
        expect(result.chart.houses).toEqual([]);
        expect(result.chart.angles).toEqual([]);
        expect(result.chart.houseCusps).toEqual([]);

        // Requirement 3.3: planetary positions use 12:00 reference
        expect(result.chart.birthData.time).toBe('12:00');

        // Requirement 3.5: house-based interpretations unavailable
        expect(result.featureAvailability.houseBasedInterpretations).toBe(false);
        expect(result.featureAvailability.houses).toBe(false);
        expect(result.featureAvailability.angles).toBe(false);

        return true;
      }
    ), {
      numRuns: 100,
      verbose: true
    });
  });
});
