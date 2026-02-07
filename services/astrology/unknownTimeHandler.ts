import { EnhancedAstrologyCalculator } from './calculator';
import { BirthData, NatalChart, PlanetPosition } from './types';

export interface FeatureAvailability {
  risingSign: boolean;
  houses: boolean;
  angles: boolean;
  houseBasedInterpretations: boolean;
  exactBirthTime: boolean;
}

interface UnknownTimeResult {
  chart: NatalChart;
  featureAvailability: FeatureAvailability;
  warnings: string[];
  solarChartUsed: boolean;
}

const UNKNOWN_TIME_WARNINGS = [
  'Birth time is required for Rising sign and houses',
  'Planetary positions shown are calculated for 12:00 noon local time',
  'House-based interpretations are not available without exact birth time',
  'Angles (Ascendant, Midheaven, etc.) cannot be determined',
  'For complete accuracy, please provide exact birth time if available',
];

const UNKNOWN_TIME_FEATURES = [
  'sun-sign',
  'moon-sign',
  'planetary-positions',
  'planetary-aspects',
  'retrograde-status',
  'sign-based-interpretations',
  'planetary-dignities',
  'lunar-phases',
  'planetary-transits',
];

const TIME_REQUIRED_FEATURES = new Set([
  'rising-sign',
  'houses',
  'angles',
  'midheaven',
  'house-based-interpretations',
]);

export class UnknownTimeHandler {
  static processUnknownTimeChart(birthData: BirthData): UnknownTimeResult {
    if (!birthData.hasUnknownTime) {
      throw new Error('UnknownTimeHandler called for birth data with known time');
    }

    const chart = this.generateSolarChart(birthData);
    const featureAvailability = this.validateTimeRequiredFeatures(chart);

    chart.timeBasedFeaturesAvailable = featureAvailability;

    if (chart.calculationAccuracy) {
      chart.calculationAccuracy = {
        ...chart.calculationAccuracy,
        validationStatus: 'approximate',
        housePositions: 0,
      };
    }

    return {
      chart,
      featureAvailability,
      warnings: [
        'Birth time is unknown - Rising sign cannot be determined',
        'Birth time is unknown - House positions are not available',
        'Planetary positions calculated using 12:00 noon local time as reference',
      ],
      solarChartUsed: true,
    };
  }

  static generateSolarChart(birthData: BirthData): NatalChart {
    if (!birthData.hasUnknownTime) {
      throw new Error('Solar chart generation is only for unknown birth times');
    }

    const noonBirthData: BirthData = {
      ...birthData,
      time: '12:00',
      hasUnknownTime: true,
      accuracyLevel: 'unknown-time',
    };

    const chart = EnhancedAstrologyCalculator.generateNatalChart(noonBirthData);

    return this.stripTimeBasedDetails(chart);
  }

  static validateTimeRequiredFeatures(chart: NatalChart): FeatureAvailability {
    const isUnknown = this.isUnknownTimeChart(chart);
    const availability = {
      risingSign: !isUnknown,
      houses: !isUnknown,
      angles: !isUnknown,
      houseBasedInterpretations: !isUnknown,
      exactBirthTime: !isUnknown,
    };

    return availability;
  }

  static isUnknownTimeChart(chart: NatalChart): boolean {
    if (chart.birthData?.hasUnknownTime) return true;
    if (chart.risingSign === null) return true;
    if (chart.timeBasedFeaturesAvailable?.exactBirthTime === false) return true;
    return false;
  }

  static getUnknownTimeWarnings(chart: NatalChart): string[] {
    if (!this.isUnknownTimeChart(chart)) {
      return [];
    }
    return [...UNKNOWN_TIME_WARNINGS];
  }

  static isTimeRequiredForFeature(feature: string): boolean {
    return TIME_REQUIRED_FEATURES.has(feature);
  }

  static getAvailableFeaturesForUnknownTime(): string[] {
    return [...UNKNOWN_TIME_FEATURES];
  }

  private static stripTimeBasedDetails(chart: NatalChart): NatalChart {
    const sanitizedPlanets = this.stripHouseAssignments(chart.planets);

    return {
      ...chart,
      risingSign: null,
      houses: [],
      angles: [],
      houseCusps: [],
      planets: sanitizedPlanets,
    };
  }

  private static stripHouseAssignments(planets?: PlanetPosition[]): PlanetPosition[] | undefined {
    if (!planets) return planets;
    return planets.map((planet) => {
      if (planet.house === undefined) return planet;
      const { house, ...rest } = planet;
      return rest;
    });
  }

}
