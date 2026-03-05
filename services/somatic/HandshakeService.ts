export type SomaticConfig = {
  ratio: [number, number, number, number]; // inhale, hold, exhale, hold
  color: string;
  frequency: number; // For the Skia shader speed
  label: string;
};

export const CHAKRA_HANDSHAKE: Record<string, SomaticConfig> = {
  'Root': { ratio: [4, 4, 4, 4], color: '#CD7F5D', frequency: 0.5, label: 'Box Breathing for Grounding' },
  'Sacral': { ratio: [5, 0, 5, 0], color: '#CD7F5D', frequency: 1.2, label: 'Flow State Coherence' },
  'Solar Plexus': { ratio: [4, 2, 6, 0], color: '#C5B493', frequency: 0.8, label: 'Personal Power Release' },
  'Heart': { ratio: [6, 0, 6, 0], color: '#6EBF8B', frequency: 0.6, label: 'Heart-Brain Coherence' },
  'Throat': { ratio: [4, 0, 8, 0], color: '#8BC4E8', frequency: 1.5, label: 'Expressive Release' },
  'Third Eye': { ratio: [4, 4, 4, 4], color: '#9D76C1', frequency: 0.3, label: 'Insight Stillness' },
  'Crown': { ratio: [8, 0, 8, 0], color: '#FDFBF7', frequency: 0.2, label: 'Unified Presence' },
};
