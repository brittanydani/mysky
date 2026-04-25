import type { DailyAngle } from '../types';

export const BODY_SIGNAL_ANGLES: DailyAngle[] = [
  {
    key: 'body_signals_001_body_knows',
    patternKey: 'body_signals_001_body_knows_first',
    title: 'The Body Knows First',
    triggerSignals: ['body_knows_first', 'low_energy'],
    observation: 'Your archive suggests that your body often notices pressure before your thoughts have words.',
    pattern: 'Across recent entries, physical cues have appeared near emotional shifts or lower-capacity days.',
    reframe: 'This does not read as weakness. It reads as body intelligence speaking before the story is fully formed.',
    question: 'What is your body saying before your mind explains it?',
    tone: 'grounding',
  }
];
