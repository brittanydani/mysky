import { useMemo } from 'react';

/**
 * Maps Body Check-In nodes to specific breathing ratios.
 * High-end logic: Dynamically alters Inhale/Exhale duration based on tension Y-axis.
 */
export const useSomaticBreathing = (touchY: number | null, intensity: number = 1) => {
  return useMemo(() => {
    // If no interaction yet, return a baseline balanced breath
    if (touchY === null) {
      return { inhale: 4, exhale: 4, label: 'Mapping required...', color: '#6A8CA1' };
    }

    // Upper body (Head/Shoulders) -> Needs longer exhales to drop heart rate
    if (touchY < 0.3) {
      return { inhale: 4, exhale: 8, label: 'Cooling Breath', color: '#8BC4E8' };
    }
    // Mid body (Heart/Chest) -> Needs equal balance for coherence
    if (touchY < 0.6) {
      return { inhale: 5, exhale: 5, label: 'Coherence Breath', color: '#6EBF8B' };
    }
    // Lower body (Core) -> Needs energizing inhales
    return { inhale: 7, exhale: 4, label: 'Igniting Breath', color: '#D4AF37' };
  }, [touchY, intensity]);
};
