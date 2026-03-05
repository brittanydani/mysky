/**
 * Aggregates daily biometric and somatic data into a weekly score.
 * High-end logic: Focuses on "Recovery Rate" rather than just "Mood".
 */

import { useMemo } from 'react';

export const useResilienceShield = (weeklyData: any[]) => {
  return useMemo(() => {
    if (!weeklyData.length) return 0;

    // 1. Calculate Regulation Ratio (Somatic Gate completions)
    const totalPossibleChecks = 28; // 4x daily * 7
    const actualChecks = weeklyData.length;
    const regScore = (actualChecks / totalPossibleChecks) * 50;

    // 2. Calculate Recovery Slope (Average positive Delta)
    const avgDelta = weeklyData.reduce((acc, curr) => acc + curr.delta, 0) / actualChecks;
    const deltaScore = Math.max(0, avgDelta * 30); // Max 30 points

    // 3. Final weighted aggregation
    const totalResilience = Math.min(100, regScore + deltaScore + 20); // +20 base for Blueprint alignment
    
    return Math.round(totalResilience);
  }, [weeklyData]);
};
