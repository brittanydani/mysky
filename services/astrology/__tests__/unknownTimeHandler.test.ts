// Unit tests for UnknownTimeHandler class
// Tests proper handling of unknown birth time scenarios

// Mock the EnhancedAstrologyCalculator before importing
jest.mock('../calculator', () => ({
  EnhancedAstrologyCalculator: {
    generateNatalChart: jest.fn()
  }
}));

import { UnknownTimeHandler, FeatureAvailability } from '../unknownTimeHandler';
import { BirthData, NatalChart } from '../types';
import { EnhancedAstrologyCalculator } from '../calculator';

describe('UnknownTimeHandler', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('processUnknownTimeChart', () => {
    
    test('processes unknown time birth data correctly', () => {
      const birthData: BirthData = {
        date: '1990-06-15',
        hasUnknownTime: true,
        place: 'New York, NY',
        latitude: 40.7128,
        longitude: -74.0060
      };
      
      const mockChart = {
        id: 'test-chart',
        birthData: { ...birthData, time: '12:00' },
        sunSign: { name: 'Gemini', symbol: '♊', element: 'Air', quality: 'Mutable', rulingPlanet: 'Mercury', dates: 'May 21 - June 20' },
        moonSign: { name: 'Leo', symbol: '♌', element: 'Fire', quality: 'Fixed', rulingPlanet: 'Sun', dates: 'July 23 - August 22' },
        risingSign: { name: 'Virgo', symbol: '♍', element: 'Earth', quality: 'Mutable', rulingPlanet: 'Mercury', dates: 'August 23 - September 22' },
        planets: [
          { planet: 'Sun', sign: 'Gemini', degree: 24.5, retrograde: false },
          { planet: 'Moon', sign: 'Leo', degree: 12.3, retrograde: false }
        ],
        placements: [],
        houses: [
          { house: 1, sign: 'Virgo', degree: 15.2, absoluteDegree: 165.2 }
        ],
        angles: [
          { name: 'Ascendant', sign: 'Virgo', degree: 15.2, absoluteDegree: 165.2 }
        ],
        aspects: [],
        calculationAccuracy: {
          planetaryPositions: 0.01,
          housePositions: 0.1,
          aspectOrbs: 0.05,
          validationStatus: 'verified'
        },
        timeBasedFeaturesAvailable: {
          risingSign: true,
          houses: true,
          angles: true,
          houseBasedInterpretations: true,
          exactBirthTime: true
        }
      };
      
      (EnhancedAstrologyCalculator.generateNatalChart as jest.Mock).mockReturnValue(mockChart);
      
      const result = UnknownTimeHandler.processUnknownTimeChart(birthData);
      
      // Verify chart modifications for unknown time
      expect(result.chart.risingSign).toBeNull();
      expect(result.chart.houses).toEqual([]);
      expect(result.chart.angles).toEqual([]);
      
      // Verify feature availability
      expect(result.featureAvailability.risingSign).toBe(false);
      expect(result.featureAvailability.houses).toBe(false);
      expect(result.featureAvailability.angles).toBe(false);
      expect(result.featureAvailability.houseBasedInterpretations).toBe(false);
      expect(result.featureAvailability.exactBirthTime).toBe(false);
      
      // Verify warnings
      expect(result.warnings).toContain('Birth time is unknown - Rising sign cannot be determined');
      expect(result.warnings).toContain('Birth time is unknown - House positions are not available');
      expect(result.warnings).toContain('Planetary positions calculated using 12:00 noon local time as reference');
      
      // Verify solar chart flag
      expect(result.solarChartUsed).toBe(true);
      
      // Verify planets have house assignments removed
      expect(result.chart.planets![0].house).toBeUndefined();
      expect(result.chart.planets![1].house).toBeUndefined();
      
      // Verify accuracy status updated
      expect(result.chart.calculationAccuracy!.validationStatus).toBe('approximate');
      expect(result.chart.calculationAccuracy!.housePositions).toBe(0);
    });
    
    test('throws error when called with known time data', () => {
      const birthData: BirthData = {
        date: '1990-06-15',
        time: '14:30',
        hasUnknownTime: false,
        place: 'New York, NY',
        latitude: 40.7128,
        longitude: -74.0060
      };
      
      expect(() => {
        UnknownTimeHandler.processUnknownTimeChart(birthData);
      }).toThrow('UnknownTimeHandler called for birth data with known time');
    });
    
    test('calls calculator with noon reference time', () => {
      const birthData: BirthData = {
        date: '1985-03-20',
        hasUnknownTime: true,
        place: 'London, UK',
        latitude: 51.5074,
        longitude: -0.1278
      };
      
      const mockChart = {
        id: 'test-chart',
        birthData: birthData,
        sunSign: { name: 'Pisces', symbol: '♓', element: 'Water', quality: 'Mutable', rulingPlanet: 'Neptune', dates: 'February 19 - March 20' },
        moonSign: { name: 'Aries', symbol: '♈', element: 'Fire', quality: 'Cardinal', rulingPlanet: 'Mars', dates: 'March 21 - April 19' },
        risingSign: null,
        planets: [],
        placements: [],
        houses: [],
        angles: [],
        aspects: []
      };
      
      (EnhancedAstrologyCalculator.generateNatalChart as jest.Mock).mockReturnValue(mockChart);
      
      UnknownTimeHandler.processUnknownTimeChart(birthData);
      
      // Verify calculator was called with noon time
      expect(EnhancedAstrologyCalculator.generateNatalChart).toHaveBeenCalledWith({
        ...birthData,
        time: '12:00',
        hasUnknownTime: true,
        accuracyLevel: 'unknown-time'
      });
    });
  });
  
  describe('generateSolarChart', () => {
    
    test('generates solar chart for unknown time', () => {
      const birthData: BirthData = {
        date: '1975-08-10',
        hasUnknownTime: true,
        place: 'Paris, France',
        latitude: 48.8566,
        longitude: 2.3522
      };
      
      const mockChart = {
        id: 'solar-chart',
        birthData: birthData,
        sunSign: { name: 'Leo', symbol: '♌', element: 'Fire', quality: 'Fixed', rulingPlanet: 'Sun', dates: 'July 23 - August 22' },
        moonSign: { name: 'Scorpio', symbol: '♏', element: 'Water', quality: 'Fixed', rulingPlanet: 'Pluto', dates: 'October 23 - November 21' },
        risingSign: { name: 'Libra', symbol: '♎', element: 'Air', quality: 'Cardinal', rulingPlanet: 'Venus', dates: 'September 23 - October 22' },
        planets: [
          { planet: 'Sun', sign: 'Leo', degree: 17.8, retrograde: false, house: 10 }
        ],
        placements: [],
        houses: [{ house: 1, sign: 'Libra', degree: 5.0, absoluteDegree: 185.0 }],
        angles: [{ name: 'Ascendant', sign: 'Libra', degree: 5.0, absoluteDegree: 185.0 }],
        aspects: []
      };
      
      (EnhancedAstrologyCalculator.generateNatalChart as jest.Mock).mockReturnValue(mockChart);
      
      const result = UnknownTimeHandler.generateSolarChart(birthData);
      
      // Verify time-dependent features are disabled
      expect(result.risingSign).toBeNull();
      expect(result.houses).toEqual([]);
      expect(result.angles).toEqual([]);
      
      // Verify planets have house assignments removed
      expect(result.planets![0].house).toBeUndefined();
    });
    
    test('throws error for known time data', () => {
      const birthData: BirthData = {
        date: '1975-08-10',
        time: '09:15',
        hasUnknownTime: false,
        place: 'Paris, France',
        latitude: 48.8566,
        longitude: 2.3522
      };
      
      expect(() => {
        UnknownTimeHandler.generateSolarChart(birthData);
      }).toThrow('Solar chart generation is only for unknown birth times');
    });
  });
  
  describe('validateTimeRequiredFeatures', () => {
    
    test('returns correct availability for known time chart', () => {
      const chart = {
        id: 'known-time-chart',
        birthData: {
          date: '1990-06-15',
          time: '14:30',
          hasUnknownTime: false,
          place: 'New York, NY',
          latitude: 40.7128,
          longitude: -74.0060
        },
        sunSign: { name: 'Gemini', symbol: '♊', element: 'Air', quality: 'Mutable', rulingPlanet: 'Mercury', dates: 'May 21 - June 20' },
        moonSign: { name: 'Leo', symbol: '♌', element: 'Fire', quality: 'Fixed', rulingPlanet: 'Sun', dates: 'July 23 - August 22' },
        risingSign: { name: 'Virgo', symbol: '♍', element: 'Earth', quality: 'Mutable', rulingPlanet: 'Mercury', dates: 'August 23 - September 22' },
        planets: [],
        placements: [],
        houses: [],
        angles: [],
        aspects: []
      };
      
      const availability = UnknownTimeHandler.validateTimeRequiredFeatures(chart as NatalChart);
      
      expect(availability.risingSign).toBe(true);
      expect(availability.houses).toBe(true);
      expect(availability.angles).toBe(true);
      expect(availability.houseBasedInterpretations).toBe(true);
      expect(availability.exactBirthTime).toBe(true);
    });
    
    test('returns correct availability for unknown time chart', () => {
      const chart = {
        id: 'unknown-time-chart',
        birthData: {
          date: '1990-06-15',
          hasUnknownTime: true,
          place: 'New York, NY',
          latitude: 40.7128,
          longitude: -74.0060
        },
        sunSign: { name: 'Gemini', symbol: '♊', element: 'Air', quality: 'Mutable', rulingPlanet: 'Mercury', dates: 'May 21 - June 20' },
        moonSign: { name: 'Leo', symbol: '♌', element: 'Fire', quality: 'Fixed', rulingPlanet: 'Sun', dates: 'July 23 - August 22' },
        risingSign: null,
        planets: [],
        placements: [],
        houses: [],
        angles: [],
        aspects: []
      };
      
      const availability = UnknownTimeHandler.validateTimeRequiredFeatures(chart as NatalChart);
      
      expect(availability.risingSign).toBe(false);
      expect(availability.houses).toBe(false);
      expect(availability.angles).toBe(false);
      expect(availability.houseBasedInterpretations).toBe(false);
      expect(availability.exactBirthTime).toBe(false);
    });
  });
  
  describe('isUnknownTimeChart', () => {
    
    test('identifies unknown time chart by hasUnknownTime flag', () => {
      const chart = {
        id: 'test',
        birthData: { date: '1990-01-01', hasUnknownTime: true, place: 'Test', latitude: 0, longitude: 0 },
        sunSign: { name: 'Capricorn', symbol: '♑', element: 'Earth', quality: 'Cardinal', rulingPlanet: 'Saturn', dates: 'December 22 - January 19' },
        moonSign: { name: 'Aries', symbol: '♈', element: 'Fire', quality: 'Cardinal', rulingPlanet: 'Mars', dates: 'March 21 - April 19' },
        risingSign: { name: 'Leo', symbol: '♌', element: 'Fire', quality: 'Fixed', rulingPlanet: 'Sun', dates: 'July 23 - August 22' },
        planets: [], placements: [], houses: [], angles: [], aspects: []
      };
      
      expect(UnknownTimeHandler.isUnknownTimeChart(chart as NatalChart)).toBe(true);
    });
    
    test('identifies unknown time chart by null rising sign', () => {
      const chart = {
        id: 'test',
        birthData: { date: '1990-01-01', hasUnknownTime: false, place: 'Test', latitude: 0, longitude: 0 },
        sunSign: { name: 'Capricorn', symbol: '♑', element: 'Earth', quality: 'Cardinal', rulingPlanet: 'Saturn', dates: 'December 22 - January 19' },
        moonSign: { name: 'Aries', symbol: '♈', element: 'Fire', quality: 'Cardinal', rulingPlanet: 'Mars', dates: 'March 21 - April 19' },
        risingSign: null,
        planets: [], placements: [], houses: [], angles: [], aspects: []
      };
      
      expect(UnknownTimeHandler.isUnknownTimeChart(chart as NatalChart)).toBe(true);
    });
    
    test('identifies known time chart correctly', () => {
      const chart = {
        id: 'test',
        birthData: { date: '1990-01-01', time: '12:00', hasUnknownTime: false, place: 'Test', latitude: 0, longitude: 0 },
        sunSign: { name: 'Capricorn', symbol: '♑', element: 'Earth', quality: 'Cardinal', rulingPlanet: 'Saturn', dates: 'December 22 - January 19' },
        moonSign: { name: 'Aries', symbol: '♈', element: 'Fire', quality: 'Cardinal', rulingPlanet: 'Mars', dates: 'March 21 - April 19' },
        risingSign: { name: 'Leo', symbol: '♌', element: 'Fire', quality: 'Fixed', rulingPlanet: 'Sun', dates: 'July 23 - August 22' },
        planets: [], placements: [], houses: [], angles: [], aspects: [],
        timeBasedFeaturesAvailable: { risingSign: true, houses: true, angles: true, houseBasedInterpretations: true, exactBirthTime: true }
      };
      
      expect(UnknownTimeHandler.isUnknownTimeChart(chart as NatalChart)).toBe(false);
    });
  });
  
  describe('getUnknownTimeWarnings', () => {
    
    test('returns warnings for unknown time chart', () => {
      const chart = {
        id: 'test',
        birthData: { date: '1990-01-01', hasUnknownTime: true, place: 'Test', latitude: 0, longitude: 0 },
        sunSign: { name: 'Capricorn', symbol: '♑', element: 'Earth', quality: 'Cardinal', rulingPlanet: 'Saturn', dates: 'December 22 - January 19' },
        moonSign: { name: 'Aries', symbol: '♈', element: 'Fire', quality: 'Cardinal', rulingPlanet: 'Mars', dates: 'March 21 - April 19' },
        risingSign: null,
        planets: [], placements: [], houses: [], angles: [], aspects: []
      };
      
      const warnings = UnknownTimeHandler.getUnknownTimeWarnings(chart as NatalChart);
      
      expect(warnings).toContain('Birth time is required for Rising sign and houses');
      expect(warnings).toContain('Planetary positions shown are calculated for 12:00 noon local time');
      expect(warnings).toContain('House-based interpretations are not available without exact birth time');
      expect(warnings).toContain('Angles (Ascendant, Midheaven, etc.) cannot be determined');
      expect(warnings).toContain('For complete accuracy, please provide exact birth time if available');
    });
    
    test('returns empty array for known time chart', () => {
      const chart = {
        id: 'test',
        birthData: { date: '1990-01-01', time: '12:00', hasUnknownTime: false, place: 'Test', latitude: 0, longitude: 0 },
        sunSign: { name: 'Capricorn', symbol: '♑', element: 'Earth', quality: 'Cardinal', rulingPlanet: 'Saturn', dates: 'December 22 - January 19' },
        moonSign: { name: 'Aries', symbol: '♈', element: 'Fire', quality: 'Cardinal', rulingPlanet: 'Mars', dates: 'March 21 - April 19' },
        risingSign: { name: 'Leo', symbol: '♌', element: 'Fire', quality: 'Fixed', rulingPlanet: 'Sun', dates: 'July 23 - August 22' },
        planets: [], placements: [], houses: [], angles: [], aspects: [],
        timeBasedFeaturesAvailable: { risingSign: true, houses: true, angles: true, houseBasedInterpretations: true, exactBirthTime: true }
      };
      
      const warnings = UnknownTimeHandler.getUnknownTimeWarnings(chart as NatalChart);
      
      expect(warnings).toEqual([]);
    });
  });
  
  describe('isTimeRequiredForFeature', () => {
    
    test('identifies time-required features correctly', () => {
      expect(UnknownTimeHandler.isTimeRequiredForFeature('rising-sign')).toBe(true);
      expect(UnknownTimeHandler.isTimeRequiredForFeature('houses')).toBe(true);
      expect(UnknownTimeHandler.isTimeRequiredForFeature('angles')).toBe(true);
      expect(UnknownTimeHandler.isTimeRequiredForFeature('midheaven')).toBe(true);
      expect(UnknownTimeHandler.isTimeRequiredForFeature('house-based-interpretations')).toBe(true);
    });
    
    test('identifies non-time-required features correctly', () => {
      expect(UnknownTimeHandler.isTimeRequiredForFeature('sun-sign')).toBe(false);
      expect(UnknownTimeHandler.isTimeRequiredForFeature('moon-sign')).toBe(false);
      expect(UnknownTimeHandler.isTimeRequiredForFeature('planetary-aspects')).toBe(false);
      expect(UnknownTimeHandler.isTimeRequiredForFeature('retrograde-status')).toBe(false);
    });
  });
  
  describe('getAvailableFeaturesForUnknownTime', () => {
    
    test('returns correct available features', () => {
      const features = UnknownTimeHandler.getAvailableFeaturesForUnknownTime();
      
      expect(features).toContain('sun-sign');
      expect(features).toContain('moon-sign');
      expect(features).toContain('planetary-positions');
      expect(features).toContain('planetary-aspects');
      expect(features).toContain('retrograde-status');
      expect(features).toContain('sign-based-interpretations');
      expect(features).toContain('planetary-dignities');
      expect(features).toContain('lunar-phases');
      expect(features).toContain('planetary-transits');
    });
  });
});