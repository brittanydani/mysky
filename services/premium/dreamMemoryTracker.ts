// dreamMemoryTracker.ts

import type { ShadowTrigger } from "./dreamTypes";

export type DreamHistoryEntry = {
  date: string;
  triggerScores: Partial<Record<ShadowTrigger, number>>;
};

export type DreamTrendResult = {
  recurringTriggers: ShadowTrigger[];
  escalationTriggers: ShadowTrigger[];
  integrationTriggers: ShadowTrigger[];
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function analyzeDreamTrends(
  history: DreamHistoryEntry[],
  current: Partial<Record<ShadowTrigger, number>>
): DreamTrendResult {
  const recurring: ShadowTrigger[] = [];
  const escalating: ShadowTrigger[] = [];
  const integrating: ShadowTrigger[] = [];

  if (history.length < 2) {
    return { recurringTriggers: [], escalationTriggers: [], integrationTriggers: [] };
  }

  const avgPast: Partial<Record<ShadowTrigger, number>> = {};

  for (const entry of history) {
    for (const key in entry.triggerScores) {
      const t = key as ShadowTrigger;
      avgPast[t] = (avgPast[t] ?? 0) + (entry.triggerScores[t] ?? 0);
    }
  }

  for (const key in avgPast) {
    const t = key as ShadowTrigger;
    avgPast[t] = (avgPast[t]! / history.length);
  }

  for (const key in current) {
    const t = key as ShadowTrigger;
    const currentScore = current[t] ?? 0;
    const pastScore = avgPast[t] ?? 0;

    if (pastScore > 0.4) recurring.push(t);

    if (currentScore > pastScore + 0.25) escalating.push(t);

    if (pastScore > 0.5 && currentScore < pastScore - 0.25)
      integrating.push(t);
  }

  return {
    recurringTriggers: recurring,
    escalationTriggers: escalating,
    integrationTriggers: integrating,
  };
}
