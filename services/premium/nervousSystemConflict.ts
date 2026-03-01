// nervousSystemConflict.ts

import type { NervousSystemBranch } from "./dreamTypes";

export type NervousConflict = {
  conflictScore: number; // 0..1
  dominantStates: NervousSystemBranch[];
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function detectNervousSystemConflict(
  profile: Partial<Record<NervousSystemBranch, number>>
): NervousConflict {
  const entries = Object.entries(profile)
    .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0));

  if (entries.length < 2) {
    return { conflictScore: 0, dominantStates: [] };
  }

  const top1 = entries[0];
  const top2 = entries[1];

  const score = clamp((top1[1] ?? 0) * (top2[1] ?? 0), 0, 1);

  return {
    conflictScore: score,
    dominantStates: [top1[0] as NervousSystemBranch, top2[0] as NervousSystemBranch],
  };
}
