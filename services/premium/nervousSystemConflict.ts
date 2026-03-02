// nervousSystemConflict.ts

import type { NervousSystemBranch } from "./dreamTypes";

export type NervousConflict = {
  conflictScore: number; // 0..1
  dominantStates: NervousSystemBranch[];
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

/**
 * Detect conflict between competing nervous system states.
 *
 * Uses `min(top1, top2) / max(top1, 0.01)` so that two branches with
 * similar activation (e.g. 0.35 and 0.30) produce a high conflict score,
 * while a clearly dominant branch (0.70 vs 0.15) produces a low one.
 *
 * Previous formula `top1 * top2` made the 0.35 flag threshold nearly
 * unreachable — it required both branches > 0.59 in a sum-to-1 profile.
 */
export function detectNervousSystemConflict(
  profile: Partial<Record<NervousSystemBranch, number>>
): NervousConflict {
  const entries = Object.entries(profile)
    .filter(([, v]) => (v ?? 0) > 0)
    .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0) || a[0].localeCompare(b[0]));

  if (entries.length < 2) {
    return { conflictScore: 0, dominantStates: [] };
  }

  const top1Val = entries[0][1] ?? 0;
  const top2Val = entries[1][1] ?? 0;

  // Ratio of second-strongest to strongest branch.
  // 1.0 = perfect tie (max conflict), 0.0 = one branch dominates (no conflict).
  const score = clamp(top2Val / Math.max(top1Val, 0.01), 0, 1);

  return {
    conflictScore: score,
    dominantStates: [entries[0][0] as NervousSystemBranch, entries[1][0] as NervousSystemBranch],
  };
}
