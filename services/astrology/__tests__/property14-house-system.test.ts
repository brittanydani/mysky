// Property-based test for house system support
// **Feature: astrology-app-critical-fixes, Property 14: House system support**
// **Validates: Requirements 5.5**

import { EnhancedAstrologyCalculator } from '../calculator';
import { BirthData, HouseSystem } from '../types';

describe('Property 14: House system support', () => {
  test('**Feature: astrology-app-critical-fixes, Property 14: House system support**', () => {
    const baseBirthData: BirthData = {
      date: '1992-04-12',
      time: '13:45',
      hasUnknownTime: false,
      place: 'San Francisco, CA',
      latitude: 37.7749,
      longitude: -122.4194,
    };

    const houseSystems: HouseSystem[] = ['placidus', 'whole-sign', 'equal-house'];

    houseSystems.forEach((houseSystem) => {
      const chart = EnhancedAstrologyCalculator.generateNatalChart({
        ...baseBirthData,
        houseSystem,
      });

      expect(chart.houseSystem).toBe(houseSystem);
      expect(chart.houses).toBeDefined();
      expect(chart.houses!.length).toBe(12);
    });
  });
});
