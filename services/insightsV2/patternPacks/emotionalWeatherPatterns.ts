import type { ArchivePattern } from '../types';

/**
 * Emotional Weather Archive Patterns
 */

export const EMOTIONAL_WEATHER_PATTERNS: ArchivePattern[] = [
  {
    key: 'emotional_weather_001_low_capacity_day',
    title: 'The Low-Capacity Day Pattern',
    category: 'emotionalWeather',
    description: 'A pattern of days where multiple signals point toward thin reserves and high sensitivity.',
    requiredSignals: ['low_capacity'],
    supportingSignals: ['low_energy', 'low_mood', 'high_stress', 'emotional_heaviness'],
    shameLabel: 'failing',
    clarityReframe: 'capacity telling the truth',
    lookbackDays: 30,
    minEvidenceCount: 3,
    minScore: 0.6,
  },
  {
    key: 'emotional_weather_002_heavy_morning',
    title: 'The Heavy Morning Pattern',
    category: 'emotionalWeather',
    description: 'A pattern where the start of the day consistently carries a lower emotional baseline.',
    requiredSignals: ['low_energy', 'low_mood'], // Simplification: morning context handled in normalization
    supportingSignals: ['poor_sleep_quality', 'low_sleep', 'body_heaviness'],
    shameLabel: 'starting wrong',
    clarityReframe: 'a body that needs a gentler transition into the day',
    lookbackDays: 14,
    minEvidenceCount: 3,
    minScore: 0.55,
  }
];
