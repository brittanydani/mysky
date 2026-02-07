// Property-based test for input validation completeness
// **Feature: astrology-app-critical-fixes, Property 10: Input validation completeness**
// **Validates: Requirements 8.1, 8.2, 8.3, 8.5**

import * as fc from 'fast-check';
import { InputValidator } from '../inputValidator';
import { BirthData } from '../types';

const maxYear = new Date().getFullYear() + 100;

const baseBirthData = (): BirthData => ({
  date: '2000-01-01',
  time: '12:00',
  hasUnknownTime: false,
  place: 'Test City',
  latitude: 10,
  longitude: 10,
});

describe('Property 10: Input validation completeness', () => {
  test('**Feature: astrology-app-critical-fixes, Property 10: Input validation completeness**', () => {
    fc.assert(fc.property(
      fc.record({
        badLatitude: fc.oneof(
          fc.float({ min: Math.fround(-180), max: Math.fround(-91) }),
          fc.float({ min: Math.fround(91), max: Math.fround(180) })
        ),
        badLongitude: fc.oneof(
          fc.float({ min: Math.fround(-360), max: Math.fround(-181) }),
          fc.float({ min: Math.fround(181), max: Math.fround(360) })
        ),
        badYear: fc.oneof(
          fc.integer({ min: 1500, max: 1899 }),
          fc.integer({ min: maxYear + 1, max: maxYear + 50 })
        ),
      }),
      ({ badLatitude, badLongitude, badYear }) => {
        const invalidLat: BirthData = { ...baseBirthData(), latitude: badLatitude };
        const invalidLon: BirthData = { ...baseBirthData(), longitude: badLongitude };
        const invalidDate: BirthData = { ...baseBirthData(), date: `${badYear}-01-01` };
        const invalidTime: BirthData = { ...baseBirthData(), time: '25:99' };

        expect(InputValidator.validateBirthData(invalidLat).valid).toBe(false);
        expect(InputValidator.validateBirthData(invalidLon).valid).toBe(false);
        expect(InputValidator.validateBirthData(invalidDate).valid).toBe(false);
        expect(InputValidator.validateBirthData(invalidTime).valid).toBe(false);
      }
    ), {
      numRuns: 60,
      verbose: true,
    });
  });
});
