// Property-based test for aspect calculation precision
// **Feature: astrology-app-critical-fixes, Property 9: Aspect calculation precision**
// **Validates: Requirements 5.4**

import * as fc from 'fast-check';
import { EnhancedAstrologyCalculator } from '../calculator';
import { ASPECT_TYPES } from '../constants';
import { BirthData } from '../types';

const aspectOrbByName = (name: string) => {
  const aspect = ASPECT_TYPES.find((a) => a.name.toLowerCase() === name.toLowerCase());
  return aspect?.orb ?? 8;
};

const validBirthDataGenerator = (): fc.Arbitrary<BirthData> => {
  return fc.record({
    date: fc.integer({ min: 1960, max: 2040 })
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
    place: fc.string({ minLength: 1, maxLength: 30 }).filter((value) => value.trim().length > 0),
    latitude: fc.float({ min: Math.fround(-70), max: Math.fround(70), noNaN: true, noDefaultInfinity: true }),
    longitude: fc.float({ min: Math.fround(-150), max: Math.fround(150), noNaN: true, noDefaultInfinity: true }),
    timezone: fc.option(fc.constantFrom('America/New_York', 'Europe/London', 'UTC'))
  });
};

describe('Property 9: Aspect calculation precision', () => {
  test('**Feature: astrology-app-critical-fixes, Property 9: Aspect calculation precision**', () => {
    fc.assert(fc.property(
      validBirthDataGenerator(),
      (birthData) => {
        const chart = EnhancedAstrologyCalculator.generateNatalChart(birthData);
        const aspects = chart.aspects || [];

        aspects.forEach((aspect) => {
          const allowedOrb = aspectOrbByName(aspect.type.name);
          expect(aspect.orb).toBeGreaterThanOrEqual(0);
          expect(aspect.orb).toBeLessThanOrEqual(allowedOrb);
        });
      }
    ), {
      numRuns: 50,
      verbose: true,
    });
  });
});
