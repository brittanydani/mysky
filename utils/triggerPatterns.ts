/**
 * triggerPatterns.ts
 *
 * Pure analytics utilities for TriggerEvent history.
 * Extracted from growth.tsx so these computations can be unit-tested
 * independently of the React rendering layer.
 */

import { TriggerEvent } from './triggerEventTypes';

export interface TriggerPatternSummary {
  drainCount: number;
  glimmerCount: number;
  /** glimmerCount / drainCount — Infinity when no drains */
  ratio: number;
  /** Life area with the most drain entries, or null if none tagged */
  topDrainArea: string | null;
  /** Time-of-day bucket with the most drain entries, or null if fewer than 4 drains */
  topDrainTimeOfDay: string | null;
  /** Mean intensity across drains that have intensity recorded, or null */
  avgDrainIntensity: number | null;
  /** Number of drain entries that have a resolution recorded */
  resolvedDrainCount: number;
}

/**
 * Derive a human-readable time-of-day bucket from a Unix timestamp.
 * Mirrors the logic used in trigger-log.tsx — keep in sync if buckets change.
 */
export function timestampToTimeOfDay(ts: number): string {
  const h = new Date(ts).getHours();
  if (h < 6) return 'Late Night';
  if (h < 12) return 'Morning';
  if (h < 17) return 'Afternoon';
  if (h < 21) return 'Evening';
  return 'Night';
}

/**
 * Compute a nervous-system pattern summary from an array of TriggerEvents.
 *
 * @param events  All events to analyse (typically already filtered to a window).
 * @param minDrainsForTod  Minimum drain count required to report topDrainTimeOfDay.
 *                         Defaults to 4 — fewer events produce noisy time patterns.
 */
export function computeTriggerPatternSummary(
  events: TriggerEvent[],
  minDrainsForTod = 4,
): TriggerPatternSummary {
  const drains = events.filter(e => e.mode === 'drain');
  const glimmers = events.filter(e => e.mode === 'nourish');

  // ── Top drain area ──────────────────────────────────────────────────────────
  const areaCounts: Record<string, number> = {};
  for (const e of drains) {
    if (e.contextArea) {
      areaCounts[e.contextArea] = (areaCounts[e.contextArea] ?? 0) + 1;
    }
  }
  const topDrainArea = Object.entries(areaCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  // ── Top drain time-of-day ───────────────────────────────────────────────────
  const todCounts: Record<string, number> = {};
  for (const e of drains) {
    const label = timestampToTimeOfDay(e.timestamp);
    todCounts[label] = (todCounts[label] ?? 0) + 1;
  }
  const topDrainTimeOfDay =
    drains.length >= minDrainsForTod
      ? (Object.entries(todCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null)
      : null;

  // ── Average intensity ───────────────────────────────────────────────────────
  const withIntensity = drains.filter(e => e.intensity != null);
  const avgDrainIntensity = withIntensity.length
    ? withIntensity.reduce((sum, e) => sum + (e.intensity ?? 0), 0) / withIntensity.length
    : null;

  // ── Resolution count ────────────────────────────────────────────────────────
  const resolvedDrainCount = drains.filter(e => !!e.resolution?.trim()).length;

  return {
    drainCount: drains.length,
    glimmerCount: glimmers.length,
    ratio: drains.length === 0 ? Infinity : glimmers.length / drains.length,
    topDrainArea,
    topDrainTimeOfDay,
    avgDrainIntensity,
    resolvedDrainCount,
  };
}

/**
 * Build the narrative body text shown on the Patterns screen.
 * Kept separate from computeTriggerPatternSummary so each concern is testable.
 */
export function buildTriggerPatternNarrative(summary: TriggerPatternSummary): string {
  const { drainCount, glimmerCount, ratio, topDrainArea, topDrainTimeOfDay, avgDrainIntensity, resolvedDrainCount } = summary;

  const ratioText =
    ratio >= 1
      ? `Restoring moments are keeping pace with harder moments (${glimmerCount} vs ${drainCount}).`
      : `Hard moments are outpacing restoring moments ${drainCount} to ${glimmerCount}. Keep the next step small and concrete.`;

  const areaText = topDrainArea
    ? ` Your nervous system is most frequently activated in the context of ${topDrainArea.toLowerCase()}.`
    : '';

  const todText = topDrainTimeOfDay
    ? ` Drains tend to cluster in the ${topDrainTimeOfDay.toLowerCase()}.`
    : '';

  const intensityText = avgDrainIntensity != null
    ? ` Average drain intensity: ${avgDrainIntensity.toFixed(1)}/5.`
    : '';

  const resolutionText =
    resolvedDrainCount > 0
      ? ` You've noted what helped in ${resolvedDrainCount} of ${drainCount} hard moments. That is a real regulation toolkit taking shape.`
      : '';

  const nextStepText =
    ratio < 1
      ? ' Next step: protect one low-effort glimmer today, even if it only lasts five minutes.'
      : ' Next step: keep repeating the moments that help your system come back.';

  return `${ratioText}${areaText}${todText}${intensityText}${resolutionText}${nextStepText}`;
}
