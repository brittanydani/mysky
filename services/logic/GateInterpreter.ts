export type BreathProfile = {
  inhale: number;
  hold: number;
  exhale: number;
  colorPalette: string[];
  animationSpeed: number;
};

export const calculateBreathProfile = (
  highestIntensityKeyword: string, 
  volatility: number
): BreathProfile => {
  // If volatility is high and keywords are "Pressure" (Copper), 
  // we use a Parasympathetic focus (Long Exhale).
  if (volatility > 0.7) {
    return {
      inhale: 4,
      hold: 2,
      exhale: 8,
      colorPalette: ['#CD7F5D', '#9D76C1'], // Copper to Amethyst (Cooling)
      animationSpeed: 0.5, // Slow, grounding movement
    };
  }

  // Default Coherence Profile
  return {
    inhale: 5,
    hold: 0,
    exhale: 5,
    colorPalette: ['#C5B493', '#6EBF8B'], // Gold to Emerald (Vitality)
    animationSpeed: 1,
  };
};
