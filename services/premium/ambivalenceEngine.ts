// ambivalenceEngine.ts

import type { ShadowTrigger } from "./dreamTypes";

export type AmbivalenceResult = {
  detected: boolean;
  pairs: Array<{
    positiveTrigger: ShadowTrigger;
    negativeTrigger: ShadowTrigger;
    intensity: number; // 0..1
  }>;
};

const AMBIVALENT_PAIRS: Array<[ShadowTrigger, ShadowTrigger]> = [
  ["intimacy", "danger"],
  ["intimacy", "shame"],
  ["sexuality", "shame"],
  ["belonging", "rejection"],
  ["belonging", "abandonment"],
  ["power", "helplessness"],
  ["control", "unpredictability"],
  ["worthiness", "failure"],
  ["transformation", "grief"],
];

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function detectAmbivalence(
  triggerScores: Partial<Record<ShadowTrigger, number>>
): AmbivalenceResult {
  const pairs: AmbivalenceResult["pairs"] = [];

  for (const [a, b] of AMBIVALENT_PAIRS) {
    const scoreA = triggerScores[a] ?? 0;
    const scoreB = triggerScores[b] ?? 0;

    if (scoreA > 0.35 && scoreB > 0.35) {
      pairs.push({
        positiveTrigger: a,
        negativeTrigger: b,
        intensity: clamp((scoreA + scoreB) / 2, 0, 1),
      });
    }
  }

  return {
    detected: pairs.length > 0,
    pairs,
  };
}
