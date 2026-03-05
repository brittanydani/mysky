// File: hooks/useStabilityEngine.ts
/**
 * useStabilityEngine
 * Processes Triad inputs against the Circadian Blueprint.
 * Returns the Delta and updates the local resilience database.
 */

import { useMemo } from 'react';
import { calculateStabilityDelta } from '../logic/StabilityEngine';
import { getContextualWeight } from '../utils/ContextMapper';

export const useStabilityEngine = (currentWindow: 'Gold' | 'Silver' | 'Indigo') => {
  
  const syncUpdate = async (metrics: { mood: number, energy: number, stress: number }) => {
    // 1. Calculate how far we are from the "Window Ideal"
    const delta = calculateStabilityDelta(metrics, currentWindow);
    
    // 2. Map the context (Development, Parenting, etc.)
    const context = getContextualWeight({ x: metrics.energy, y: metrics.mood }, currentWindow);

    // 3. Construct the High-End Data Object
    const update = {
      timestamp: new Date().toISOString(),
      delta,
      metrics,
      context,
      window: currentWindow,
    };

    // 4. Persistence (Push to your LocalDB/Supabase)
    // await saveToArchive(update);

    return update;
  };

  return { syncUpdate };
};