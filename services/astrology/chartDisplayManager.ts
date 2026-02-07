import { EmotionalPattern, NatalChart } from './types';
import { FeatureAvailability, UnknownTimeHandler } from './unknownTimeHandler';

export interface DisplayChart {
  chart: NatalChart;
  warnings: string[];
  unavailableFeatures: string[];
  timeBasedFeaturesAvailable: FeatureAvailability;
}

export class ChartDisplayManager {
  static formatChartWithTimeWarnings(chart: NatalChart): DisplayChart {
    const timeBasedFeaturesAvailable = UnknownTimeHandler.validateTimeRequiredFeatures(chart);
    const warnings = UnknownTimeHandler.getUnknownTimeWarnings(chart);
    const unavailableFeatures = Object.entries(timeBasedFeaturesAvailable)
      .filter(([, available]) => !available)
      .map(([feature]) => feature);

    return {
      chart: {
        ...chart,
        timeBasedFeaturesAvailable,
      },
      warnings,
      unavailableFeatures,
      timeBasedFeaturesAvailable,
    };
  }

  static hideTimeBasedInterpretations(
    chart: NatalChart,
    interpretations: EmotionalPattern[]
  ): EmotionalPattern[] {
    if (!UnknownTimeHandler.isUnknownTimeChart(chart)) {
      return interpretations;
    }

    return interpretations.filter((pattern) => !this.isHouseBasedPattern(pattern));
  }

  private static isHouseBasedPattern(pattern: EmotionalPattern): boolean {
    return pattern.triggers?.some((rule) => typeof rule.house === 'number') ?? false;
  }
}
