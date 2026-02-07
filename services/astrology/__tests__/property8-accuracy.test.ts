// Property-based test for astronomical accuracy standards
// **Feature: astrology-app-critical-fixes, Property 8: Astronomical accuracy standards**
// **Validates: Requirements 5.1, 5.2, 5.3**

import * as fc from 'fast-check';
import { EnhancedAstrologyCalculator } from '../calculator';
import { BirthData } from '../types';

const validBirthDataGenerator = (): fc.Arbitrary<BirthData> => {
  return fc.record({
    date: fc.integer({ min: 1950, max: 2050 })
      .chain(year =>
        fc.integer({ min: 1, max: 12 })
          .chain(month =>
            fc.integer({ min: 1, max: 28 })
              .map(day => `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`)
          )
      ),
    time: fc.record({
      hour: fc.integer({ min: 0, max: 23 }),
      minute: fc.integer({ min: 0, max: 59 })
    }).map(t => `${t.hour.toString().padStart(2, '0')}:${t.minute.toString().padStart(2, '0')}`),
    hasUnknownTime: fc.constant(false),
    place: fc.string({ minLength: 1, maxLength: 40 }).filter((value) => value.trim().length > 0),
    latitude: fc.float({ min: Math.fround(-80), max: Math.fround(80), noNaN: true, noDefaultInfinity: true }),
    longitude: fc.float({ min: Math.fround(-170), max: Math.fround(170), noNaN: true, noDefaultInfinity: true }),
    timezone: fc.option(fc.constantFrom(
      'America/New_York', 'Europe/London', 'Asia/Tokyo', 'Australia/Sydney',
      'America/Los_Angeles', 'Europe/Berlin', 'Asia/Shanghai', 'UTC'
    ))
  });
};

describe('Property 8: Astronomical accuracy standards', () => {
  test('**Feature: astrology-app-critical-fixes, Property 8: Astronomical accuracy standards**', () => {
    fc.assert(fc.property(
      validBirthDataGenerator(),
      (birthData) => {
        const chart = EnhancedAstrologyCalculator.generateNatalChart(birthData);

        expect(chart.calculationAccuracy).toBeDefined();
        const accuracy = chart.calculationAccuracy!;
        expect(accuracy.planetaryPositions).toBeLessThanOrEqual(0.1);
        expect(accuracy.housePositions).toBeLessThanOrEqual(0.1);
        expect(accuracy.aspectOrbs).toBeGreaterThanOrEqual(0);

        const comparison = accuracy.referenceComparison;
        expect(comparison).toBeDefined();
        expect(comparison!.reference).toBe('ephemeris');
        expect(comparison!.comparisons.length).toBeGreaterThan(5);

        comparison!.comparisons.forEach((item) => {
          expect(item.difference).toBeGreaterThanOrEqual(0);
          expect(item.threshold).toBeGreaterThan(0);
        });
      }
    ), {
      numRuns: 50,
      verbose: true,
    });
  });
});
