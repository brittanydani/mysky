/**
 * Shared statistical utility functions.
 *
 * Canonical implementations of mean, stdDev, linearRegression, confidence,
 * and trend computation.  Import these instead of defining local copies in
 * each analysis module.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type ConfidenceLevel = 'low' | 'medium' | 'high';
export type TrendDirection = 'up' | 'down' | 'stable';

export interface TrendResult {
  direction: TrendDirection;
  change: number;
  method: 'regression' | 'delta';
  displayChange: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Descriptive statistics
// ─────────────────────────────────────────────────────────────────────────────

/** Arithmetic mean.  Returns 0 for an empty array. */
export function mean(vals: number[]): number {
  if (vals.length === 0) return 0;
  return vals.reduce((s, v) => s + v, 0) / vals.length;
}

/** Sample standard deviation (Bessel-corrected).  Returns 0 for < 2 values. */
export function stdDev(vals: number[]): number {
  if (vals.length < 2) return 0;
  const m = mean(vals);
  return Math.sqrt(vals.reduce((s, v) => s + (v - m) ** 2, 0) / (vals.length - 1));
}

/** Clamp a number to [lo, hi]. */
export function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

// ─────────────────────────────────────────────────────────────────────────────
// Regression
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Ordinary-least-squares slope over an evenly-spaced series (x = 0, 1, …).
 * Returns `{ slope }`.  Slope is 0 for < 2 values.
 */
export function linearRegression(ys: number[]): { slope: number } {
  const n = ys.length;
  if (n < 2) return { slope: 0 };
  const sumX = (n * (n - 1)) / 2;
  const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;
  const sumY = ys.reduce((s, v) => s + v, 0);
  const sumXY = ys.reduce((s, v, i) => s + i * v, 0);
  const denom = n * sumX2 - sumX * sumX;
  if (denom === 0) return { slope: 0 };
  return { slope: (n * sumXY - sumX * sumY) / denom };
}

// ─────────────────────────────────────────────────────────────────────────────
// Trend
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Unified trend computation.
 *
 * - n >= 10 → regression slope × (n-1) gives total change
 * - n <  10 → split-half delta (second half avg − first half avg)
 * - Threshold: |change| > 0.6 → "up" or "down", else "stable"
 */
export function computeTrend(vals: number[]): TrendResult {
  const n = vals.length;
  if (n < 2) return { direction: 'stable', change: 0, method: 'delta', displayChange: '0' };

  let change: number;
  let method: TrendResult['method'];

  if (n >= 10) {
    const { slope } = linearRegression(vals);
    change = slope * (n - 1);
    method = 'regression';
  } else {
    const mid = Math.floor(n / 2);
    change = mean(vals.slice(mid)) - mean(vals.slice(0, mid));
    method = 'delta';
  }

  const direction: TrendDirection =
    change > 0.6 ? 'up' : change < -0.6 ? 'down' : 'stable';

  return {
    direction,
    change: parseFloat(change.toFixed(1)),
    method,
    displayChange: change >= 0 ? `+${change.toFixed(1)}` : change.toFixed(1),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Confidence
// ─────────────────────────────────────────────────────────────────────────────

/** Confidence level based on sample size. */
export function confidence(count: number): ConfidenceLevel {
  if (count < 14) return 'low';
  if (count < 30) return 'medium';
  return 'high';
}

/** Human-readable label for a confidence level. */
export function confidenceLabel(level: ConfidenceLevel): string {
  switch (level) {
    case 'high': return 'Strong';
    case 'medium': return 'Growing';
    case 'low': return 'Emerging';
  }
}

/** Trend direction arrow for display. */
export function trendArrow(dir: TrendDirection): string {
  return dir === 'up' ? '↑' : dir === 'down' ? '↓' : '→';
}

/** Inverted arrow for stress (down is good). */
export function stressTrendArrow(dir: TrendDirection): string {
  return dir === 'down' ? '↓' : dir === 'up' ? '↑' : '→';
}
