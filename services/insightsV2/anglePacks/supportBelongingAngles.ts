import type { DailyAngle } from '../types';

export const SUPPORT_BELONGING_ANGLES: DailyAngle[] = [
  {
    key: 'support_belonging_001_gratitude_and_grief',
    patternKey: 'support_belonging_001_support_scarcity',
    title: 'Gratitude and Grief Can Coexist',
    triggerSignals: ['relief', 'envy_as_longing', 'asks_for_support'],
    observation: 'Your archive suggests that support is not just something you want. It is something your system keeps checking for.',
    pattern: 'Across recent entries, the same emotional shape appears around needing backup, feeling grateful for the people you do have, and still aching for a wider safety net.',
    reframe: 'This does not read as greed. It reads as grief for the kind of care that arrives before you have to prove how much you need it.',
    question: 'What kind of support would feel easiest to receive today?',
    tone: 'deep',
  }
];
