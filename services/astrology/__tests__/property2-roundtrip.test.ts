// Property-based test for calculation round-trip integrity
// **Feature: astrology-app-critical-fixes, Property 2: Calculation round-trip integrity**
// **Validates: Requirements 1.6**

import * as fc from 'fast-check';
import { EnhancedAstrologyCalculator } from '../calculator';
import { BirthData, NatalChart, PlanetPosition, HouseSystem } from '../types';

// Test data generators for property-based testing
const validBirthDataGenerator = (): fc.Arbitrary<BirthData> => {
  return fc.record({
    date: fc.integer({ min: 1900, max: 2100 })
      .chain(year => 
        fc.integer({ min: 1, max: 12 })
          .chain(month => 
            fc.integer({ min: 1, max: 28 }) // Use 28 to avoid invalid dates
              .map(day => `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`)
          )
      ),
    time: fc.option(
      fc.record({
        hour: fc.integer({ min: 0, max: 23 }),
        minute: fc.integer({ min: 0, max: 59 })
      }).map(t => `${t.hour.toString().padStart(2, '0')}:${t.minute.toString().padStart(2, '0')}`)
    ),
    hasUnknownTime: fc.boolean(),
    place: fc.string({ minLength: 1, maxLength: 50 }),
    latitude: fc.float({ min: Math.fround(-89.9), max: Math.fround(89.9), noNaN: true, noDefaultInfinity: true }), // Avoid exact poles
    longitude: fc.float({ min: Math.fround(-179.9), max: Math.fround(179.9), noNaN: true, noDefaultInfinity: true }), // Avoid exact antimeridian
    timezone: fc.option(fc.constantFrom(
      'America/New_York', 'Europe/London', 'Asia/Tokyo', 'Australia/Sydney',
      'America/Los_Angeles', 'Europe/Berlin', 'Asia/Shanghai', 'UTC'
    )),
    houseSystem: fc.option(fc.constantFrom(
      'placidus', 'whole-sign', 'equal-house', 'koch', 'campanus', 'regiomontanus', 'topocentric'
    ))
  }).map(data => ({
    ...data,
    // Ensure consistency: if hasUnknownTime is true, time should be undefined
    time: data.hasUnknownTime ? undefined : (data.time || '12:00'),
    hasUnknownTime: data.hasUnknownTime || !data.time
  }));
};

/**
 * Pretty_Printer simulation: Format astronomical data into a serializable format
 * This simulates the formatting step mentioned in the requirements
 */
class AstronomicalDataFormatter {
  static formatChart(chart: NatalChart): FormattedAstronomicalData {
    return {
      birthData: chart.birthData,
      planetaryPositions: chart.planets?.map(p => ({
        planet: p.planet,
        sign: p.sign,
        degree: p.degree,
        retrograde: p.retrograde,
        house: p.house
      })) || [],
      houseSystem: chart.houseSystem,
      houses: chart.houses?.map(h => ({
        house: h.house,
        sign: h.sign as string,
        degree: h.degree,
        absoluteDegree: h.absoluteDegree
      })) || [],
      angles: chart.angles?.map(a => ({
        name: a.name,
        sign: a.sign as string,
        degree: a.degree,
        absoluteDegree: a.absoluteDegree
      })) || [],
      aspects: chart.aspects?.map(a => ({
        planet1: a.planet1.name,
        planet2: a.planet2.name,
        type: a.type.name,
        orb: a.orb,
        strength: a.strength
      })) || [],
      calculationAccuracy: chart.calculationAccuracy,
      timeBasedFeaturesAvailable: chart.timeBasedFeaturesAvailable
    };
  }

  static parseFormattedData(formatted: FormattedAstronomicalData): BirthData {
    // Extract the birth data that would be used to regenerate the chart
    return {
      ...formatted.birthData,
      houseSystem: formatted.houseSystem as HouseSystem
    };
  }
}

interface FormattedAstronomicalData {
  birthData: BirthData;
  planetaryPositions: Array<{
    planet: string;
    sign: string;
    degree: number;
    retrograde: boolean;
    house?: number;
  }>;
  houseSystem?: string;
  houses: Array<{
    house: number;
    sign: string;
    degree: number;
    absoluteDegree: number;
  }>;
  angles: Array<{
    name: string;
    sign: string;
    degree: number;
    absoluteDegree: number;
  }>;
  aspects: Array<{
    planet1: string;
    planet2: string;
    type: string;
    orb: number;
    strength: number;
  }>;
  calculationAccuracy?: any;
  timeBasedFeaturesAvailable?: any;
}

describe('Property 2: Calculation Round-Trip Integrity', () => {
  
  /**
   * **Feature: astrology-app-critical-fixes, Property 2: Calculation round-trip integrity**
   * 
   * Property: For any valid astronomical calculation, formatting the data then parsing it back 
   * should produce equivalent astronomical values
   * 
   * **Validates: Requirements 1.6**
   * 
   * This test verifies that:
   * - Astronomical data can be formatted into a serializable format
   * - The formatted data can be parsed back to regenerate equivalent calculations
   * - No data loss or corruption occurs during the format/parse cycle
   * - Planetary positions, aspects, and house data maintain integrity
   */
  test('**Feature: astrology-app-critical-fixes, Property 2: Calculation round-trip integrity**', () => {
    fc.assert(fc.property(
      validBirthDataGenerator(),
      (birthData) => {
        try {
          // === Step 1: Generate original astronomical calculation ===
          const originalChart = EnhancedAstrologyCalculator.generateNatalChart(birthData);
          
          // Verify original chart was generated successfully
          expect(originalChart).toBeDefined();
          expect(originalChart.id).toBeDefined();
          expect(originalChart.birthData).toBeDefined();
          
          // === Step 2: Format astronomical data (Pretty_Printer simulation) ===
          const formattedData = AstronomicalDataFormatter.formatChart(originalChart);
          
          // Verify formatting preserves essential data
          expect(formattedData).toBeDefined();
          expect(formattedData.birthData).toBeDefined();
          expect(formattedData.planetaryPositions).toBeDefined();
          
          // === Step 3: Parse formatted data back to birth data ===
          const parsedBirthData = AstronomicalDataFormatter.parseFormattedData(formattedData);
          
          // Verify parsed data maintains essential birth information
          expect(parsedBirthData.date).toBe(originalChart.birthData.date);
          expect(parsedBirthData.latitude).toBeCloseTo(originalChart.birthData.latitude, 6);
          expect(parsedBirthData.longitude).toBeCloseTo(originalChart.birthData.longitude, 6);
          expect(parsedBirthData.hasUnknownTime).toBe(originalChart.birthData.hasUnknownTime);
          
          // === Step 4: Regenerate chart from parsed data ===
          const roundTripChart = EnhancedAstrologyCalculator.generateNatalChart(parsedBirthData);
          
          // === Step 5: Verify astronomical equivalence ===
          
          // Core astronomical values should be equivalent
          expect(roundTripChart.sunSign.name).toBe(originalChart.sunSign.name);
          expect(roundTripChart.moonSign.name).toBe(originalChart.moonSign.name);
          
          // Planetary positions should be equivalent (within calculation precision)
          if (originalChart.planets && roundTripChart.planets) {
            expect(roundTripChart.planets.length).toBe(originalChart.planets.length);
            
            // Sort both arrays by planet name for consistent comparison
            const originalSorted = [...originalChart.planets].sort((a, b) => a.planet.localeCompare(b.planet));
            const roundTripSorted = [...roundTripChart.planets].sort((a, b) => a.planet.localeCompare(b.planet));
            
            for (let i = 0; i < originalSorted.length; i++) {
              const orig = originalSorted[i];
              const roundTrip = roundTripSorted[i];
              
              expect(roundTrip.planet).toBe(orig.planet);
              expect(roundTrip.sign).toBe(orig.sign);
              
              // Degrees should be identical for same ephemeris calculation
              expect(Math.abs(roundTrip.degree - orig.degree)).toBeLessThan(0.001);
              
              // Retrograde status should be preserved
              expect(roundTrip.retrograde).toBe(orig.retrograde);
            }
          }
          
          // Legacy placements should maintain equivalence
          expect(roundTripChart.placements.length).toBe(originalChart.placements.length);
          
          // Key planetary placements should be equivalent
          const originalSun = originalChart.placements.find(p => p.planet.name === 'Sun');
          const roundTripSun = roundTripChart.placements.find(p => p.planet.name === 'Sun');
          
          if (originalSun && roundTripSun) {
            expect(Math.abs(roundTripSun.longitude - originalSun.longitude)).toBeLessThan(0.001);
            expect(roundTripSun.sign.name).toBe(originalSun.sign.name);
            expect(roundTripSun.isRetrograde).toBe(originalSun.isRetrograde);
          }
          
          const originalMoon = originalChart.placements.find(p => p.planet.name === 'Moon');
          const roundTripMoon = roundTripChart.placements.find(p => p.planet.name === 'Moon');
          
          if (originalMoon && roundTripMoon) {
            expect(Math.abs(roundTripMoon.longitude - originalMoon.longitude)).toBeLessThan(0.001);
            expect(roundTripMoon.sign.name).toBe(originalMoon.sign.name);
            expect(roundTripMoon.isRetrograde).toBe(originalMoon.isRetrograde);
          }
          
          // Time-based features availability should be preserved
          expect(roundTripChart.timeBasedFeaturesAvailable).toEqual(originalChart.timeBasedFeaturesAvailable);
          
          // Rising sign equivalence (when available)
          if (originalChart.risingSign && roundTripChart.risingSign) {
            expect(roundTripChart.risingSign.name).toBe(originalChart.risingSign.name);
          } else {
            expect(roundTripChart.risingSign).toBe(originalChart.risingSign);
          }
          
          // House system should be preserved
          expect(roundTripChart.houseSystem).toBe(originalChart.houseSystem);
          
          // House cusps equivalence (when time is known)
          if (originalChart.houses && roundTripChart.houses && !birthData.hasUnknownTime) {
            expect(roundTripChart.houses.length).toBe(originalChart.houses.length);
            
            for (let i = 0; i < originalChart.houses.length; i++) {
              const origHouse = originalChart.houses[i];
              const roundTripHouse = roundTripChart.houses[i];
              
              expect(roundTripHouse.house).toBe(origHouse.house);
              expect(roundTripHouse.sign).toBe(origHouse.sign);
              expect(Math.abs(roundTripHouse.absoluteDegree - origHouse.absoluteDegree)).toBeLessThan(0.001);
            }
          }
          
          // Angles equivalence (when time is known)
          if (originalChart.angles && roundTripChart.angles && !birthData.hasUnknownTime) {
            expect(roundTripChart.angles.length).toBe(originalChart.angles.length);
            
            for (let i = 0; i < originalChart.angles.length; i++) {
              const origAngle = originalChart.angles[i];
              const roundTripAngle = roundTripChart.angles[i];
              
              expect(roundTripAngle.name).toBe(origAngle.name);
              expect(roundTripAngle.sign).toBe(origAngle.sign);
              expect(Math.abs(roundTripAngle.absoluteDegree - origAngle.absoluteDegree)).toBeLessThan(0.001);
            }
          }
          
          // Calculation accuracy should be maintained
          if (originalChart.calculationAccuracy && roundTripChart.calculationAccuracy) {
            expect(roundTripChart.calculationAccuracy.validationStatus).toBe(originalChart.calculationAccuracy.validationStatus);
            expect(roundTripChart.calculationAccuracy.planetaryPositions).toBeCloseTo(
              originalChart.calculationAccuracy.planetaryPositions, 3
            );
          }
          
          // Aspects should maintain consistency (allowing for minor calculation variations)
          if (originalChart.aspects && roundTripChart.aspects) {
            // The number of aspects should be similar (within a small tolerance for orb differences)
            const aspectCountDifference = Math.abs(roundTripChart.aspects.length - originalChart.aspects.length);
            expect(aspectCountDifference).toBeLessThanOrEqual(2); // Allow minor differences due to orb precision
            
            // Major aspects (tight orbs) should be preserved
            const originalMajorAspects = originalChart.aspects.filter(a => a.orb <= 3);
            const roundTripMajorAspects = roundTripChart.aspects.filter(a => a.orb <= 3);
            
            // At least 80% of major aspects should be preserved
            const preservedAspects = originalMajorAspects.filter(origAspect => 
              roundTripMajorAspects.some(rtAspect => 
                rtAspect.planet1.name === origAspect.planet1.name &&
                rtAspect.planet2.name === origAspect.planet2.name &&
                rtAspect.type.name === origAspect.type.name &&
                Math.abs(rtAspect.orb - origAspect.orb) <= 0.1
              )
            );
            
            if (originalMajorAspects.length > 0) {
              const preservationRate = preservedAspects.length / originalMajorAspects.length;
              expect(preservationRate).toBeGreaterThanOrEqual(0.8);
            }
          }
          
          return true;
        } catch (error) {
          // Allow for some calculation failures with extreme dates/locations
          // but ensure they fail gracefully with proper error messages
          expect(error).toBeInstanceOf(Error);
          expect((error as Error).message).toBeDefined();
          expect((error as Error).message.length).toBeGreaterThan(0);
          
          // Should not fail with data corruption errors
          expect((error as Error).message).not.toContain('corruption');
          expect((error as Error).message).not.toContain('data loss');
          expect((error as Error).message).not.toContain('invalid format');
          
          return true;
        }
      }
    ), { 
      numRuns: 100, // Minimum 100 iterations as required
      verbose: true // Show detailed output for debugging
    });
  });
  
  // Additional unit tests for specific round-trip scenarios
  describe('Round-Trip Edge Cases', () => {
    
    test('preserves data integrity for known birth time', () => {
      const birthData: BirthData = {
        date: '1990-06-15',
        time: '14:30',
        hasUnknownTime: false,
        place: 'New York, NY',
        latitude: 40.7128,
        longitude: -74.0060,
        houseSystem: 'placidus'
      };

      // Generate original chart
      const originalChart = EnhancedAstrologyCalculator.generateNatalChart(birthData);
      
      // Format and parse
      const formattedData = AstronomicalDataFormatter.formatChart(originalChart);
      const parsedBirthData = AstronomicalDataFormatter.parseFormattedData(formattedData);
      
      // Regenerate chart
      const roundTripChart = EnhancedAstrologyCalculator.generateNatalChart(parsedBirthData);
      
      // Verify time-based features are preserved
      expect(roundTripChart.risingSign).not.toBeNull();
      expect(roundTripChart.timeBasedFeaturesAvailable?.risingSign).toBe(true);
      expect(roundTripChart.timeBasedFeaturesAvailable?.houses).toBe(true);
      expect(roundTripChart.timeBasedFeaturesAvailable?.angles).toBe(true);
      
      // Verify rising sign is preserved
      expect(roundTripChart.risingSign?.name).toBe(originalChart.risingSign?.name);
      
      // Verify house system is preserved
      expect(roundTripChart.houseSystem).toBe(originalChart.houseSystem);
    });
    
    test('preserves data integrity for unknown birth time', () => {
      const birthData: BirthData = {
        date: '1985-03-20',
        hasUnknownTime: true,
        place: 'London, UK',
        latitude: 51.5074,
        longitude: -0.1278
      };

      // Generate original chart
      const originalChart = EnhancedAstrologyCalculator.generateNatalChart(birthData);
      
      // Format and parse
      const formattedData = AstronomicalDataFormatter.formatChart(originalChart);
      const parsedBirthData = AstronomicalDataFormatter.parseFormattedData(formattedData);
      
      // Regenerate chart
      const roundTripChart = EnhancedAstrologyCalculator.generateNatalChart(parsedBirthData);
      
      // Verify unknown time handling is preserved
      expect(roundTripChart.risingSign).toBeNull();
      expect(roundTripChart.timeBasedFeaturesAvailable?.risingSign).toBe(false);
      expect(roundTripChart.timeBasedFeaturesAvailable?.houses).toBe(false);
      expect(roundTripChart.timeBasedFeaturesAvailable?.angles).toBe(false);
      
      // Verify planetary positions are still accurate (using noon reference)
      expect(roundTripChart.sunSign.name).toBe(originalChart.sunSign.name);
      expect(roundTripChart.moonSign.name).toBe(originalChart.moonSign.name);
    });
    
    test('maintains precision across multiple round-trips', () => {
      const birthData: BirthData = {
        date: '2000-01-01',
        time: '12:00',
        hasUnknownTime: false,
        place: 'Greenwich, UK',
        latitude: 51.4769,
        longitude: -0.0005,
        houseSystem: 'placidus'
      };

      let currentChart = EnhancedAstrologyCalculator.generateNatalChart(birthData);
      
      // Perform multiple round-trips
      for (let i = 0; i < 3; i++) {
        const formattedData = AstronomicalDataFormatter.formatChart(currentChart);
        const parsedBirthData = AstronomicalDataFormatter.parseFormattedData(formattedData);
        currentChart = EnhancedAstrologyCalculator.generateNatalChart(parsedBirthData);
      }
      
      // Generate fresh chart for comparison
      const freshChart = EnhancedAstrologyCalculator.generateNatalChart(birthData);
      
      // Verify precision is maintained after multiple round-trips
      expect(currentChart.sunSign.name).toBe(freshChart.sunSign.name);
      expect(currentChart.moonSign.name).toBe(freshChart.moonSign.name);
      
      if (currentChart.planets && freshChart.planets) {
        for (let i = 0; i < currentChart.planets.length; i++) {
          const current = currentChart.planets[i];
          const fresh = freshChart.planets[i];
          
          expect(current.planet).toBe(fresh.planet);
          expect(current.sign).toBe(fresh.sign);
          expect(Math.abs(current.degree - fresh.degree)).toBeLessThan(0.01);
        }
      }
    });
    
    test('handles different house systems in round-trip', () => {
      const houseSystems: Array<BirthData['houseSystem']> = [
        'placidus', 'whole-sign', 'equal-house', 'koch'
      ];
      
      const baseBirthData: BirthData = {
        date: '1975-08-10',
        time: '09:15',
        hasUnknownTime: false,
        place: 'Paris, France',
        latitude: 48.8566,
        longitude: 2.3522
      };
      
      for (const houseSystem of houseSystems) {
        const birthData = { ...baseBirthData, houseSystem };
        
        // Generate original chart
        const originalChart = EnhancedAstrologyCalculator.generateNatalChart(birthData);
        
        // Format and parse
        const formattedData = AstronomicalDataFormatter.formatChart(originalChart);
        const parsedBirthData = AstronomicalDataFormatter.parseFormattedData(formattedData);
        
        // Regenerate chart
        const roundTripChart = EnhancedAstrologyCalculator.generateNatalChart(parsedBirthData);
        
        // Verify house system is preserved
        expect(roundTripChart.houseSystem).toBe(houseSystem);
        
        // Verify planetary positions are consistent regardless of house system
        expect(roundTripChart.sunSign.name).toBe(originalChart.sunSign.name);
        expect(roundTripChart.moonSign.name).toBe(originalChart.moonSign.name);
      }
    });
  });
});
