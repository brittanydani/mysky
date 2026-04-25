import type { DailyAngle } from '../types';

export const EMOTIONAL_WEATHER_ANGLES: DailyAngle[] = [
  {
    key: 'emotional_weather_001_capacity_truth',
    patternKey: 'emotional_weather_001_low_capacity_day',
    title: 'Capacity Telling the Truth',
    triggerSignals: ['low_capacity'],
    observation: 'Your archive suggests that today’s heaviness may be a signal from your capacity.',
    pattern: 'Across recent entries, multiple signals have pointed toward thin reserves.',
    reframe: 'This does not read as failing. It reads as capacity telling the truth.',
    question: 'What would you adjust if your capacity got a real vote today?',
    tone: 'grounding',
  }
];
