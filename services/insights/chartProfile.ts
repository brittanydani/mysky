/**
 * Chart Profile — Derived Baseline
 *
 * Extracts a stable, cacheable profile from a NatalChart.
 * This is "how you're wired" — it doesn't change unless the chart changes.
 *
 * Used by the insights engine for:
 *  - Regulation style suggestions (element-based)
 *  - Emotional needs (Moon sign/house)
 *  - Growth edge (Saturn)
 *  - Healing theme (Chiron)
 *  - Blended insight rule matching
 */

import { NatalChart, PlanetPlacement } from '../astrology/types';
import { ChartProfile, Element, Modality } from './types';

/**
 * Derive a ChartProfile from a NatalChart.
 * Pure function — no side effects.
 */
export function deriveChartProfile(chart: NatalChart): ChartProfile {
  const timeKnown = !chart.birthData.hasUnknownTime;
  const personal = [chart.sun, chart.moon, chart.mercury, chart.venus, chart.mars];

  // ── Element counts ───────────────────────────────────────────────────────
  const elementCounts: Record<Element, number> = { Fire: 0, Earth: 0, Air: 0, Water: 0 };
  for (const p of personal) {
    const el = p.sign.element as Element;
    if (el in elementCounts) {
      elementCounts[el]++;
    }
  }
  const dominantElement = (Object.entries(elementCounts) as [Element, number][])
    .sort((a, b) => b[1] - a[1])[0][0];

  // ── Modality counts ──────────────────────────────────────────────────────
  const modalityCounts: Record<Modality, number> = { Cardinal: 0, Fixed: 0, Mutable: 0 };
  for (const p of personal) {
    const mod = p.sign.modality as Modality;
    if (mod in modalityCounts) {
      modalityCounts[mod]++;
    }
  }
  const dominantModality = (Object.entries(modalityCounts) as [Modality, number][])
    .sort((a, b) => b[1] - a[1])[0][0];

  // ── Moon ─────────────────────────────────────────────────────────────────
  const moonSign = chart.moon.sign.name;
  const moonHouse = timeKnown && chart.moon.house > 0 ? chart.moon.house : 0;

  // ── Saturn ───────────────────────────────────────────────────────────────
  const saturnSign = chart.saturn.sign.name;
  const saturnHouse = timeKnown && chart.saturn.house > 0 ? chart.saturn.house : 0;

  // ── Chiron ───────────────────────────────────────────────────────────────
  const chiron = chart.planets?.find(p => p.planet === 'Chiron');
  const chironSign = chiron?.sign ?? null;
  const chironHouse = chiron?.house ?? 0;

  // ── House emphasis ───────────────────────────────────────────────────────
  const has6thHouseEmphasis = timeKnown && personal.filter(p => p.house === 6).length >= 2;
  const has12thHouseEmphasis = timeKnown && personal.filter(p => p.house === 12).length >= 2;

  // ── Stelliums (3+ planets in same sign, across all placements) ────────
  const signCounts: Record<string, number> = {};
  for (const p of chart.placements) {
    const sign = p.sign.name;
    signCounts[sign] = (signCounts[sign] ?? 0) + 1;
  }
  const stelliums = Object.entries(signCounts)
    .filter(([, count]) => count >= 3)
    .map(([sign, count]) => ({ sign, count }))
    .sort((a, b) => b.count - a.count);

  // ── Version hash for cache invalidation ──────────────────────────────────
  const hashInput = [
    chart.id,
    dominantElement,
    dominantModality,
    moonSign,
    moonHouse,
    saturnSign,
    saturnHouse,
    chironSign,
    chironHouse,
    has6thHouseEmphasis,
    has12thHouseEmphasis,
    stelliums.map(s => `${s.sign}:${s.count}`).join(','),
  ].join('|');

  // Simple string hash (djb2)
  let hash = 5381;
  for (let i = 0; i < hashInput.length; i++) {
    hash = ((hash << 5) + hash + hashInput.charCodeAt(i)) & 0xffffffff;
  }
  const versionHash = Math.abs(hash).toString(36);

  return {
    dominantElement,
    dominantModality,
    moonSign,
    moonHouse,
    saturnSign,
    saturnHouse,
    chironSign,
    chironHouse,
    has6thHouseEmphasis,
    has12thHouseEmphasis,
    stelliums,
    elementCounts,
    modalityCounts,
    timeKnown,
    versionHash,
  };
}

/**
 * Get the regulation style description for a dominant element.
 */
export function regulationStyle(element: Element): string {
  const styles: Record<Element, string> = {
    Earth: 'structure and routine',
    Water: 'emotional processing and release',
    Air: 'talking, journaling, and perspective',
    Fire: 'movement, action, and expression',
  };
  return styles[element];
}

/**
 * Get the emotional needs description for a Moon sign element.
 */
export function emotionalNeeds(moonSign: string, moonHouse: number): string {
  const houseNeeds: Record<number, string> = {
    1: 'visible self-expression and being seen',
    2: 'stability, comfort, and sensory grounding',
    3: 'communication, learning, and mental stimulation',
    4: 'home, safety, and emotional foundation',
    5: 'creativity, play, and heartfelt recognition',
    6: 'daily rhythm, health routines, and purposeful work',
    7: 'partnership, connection, and relational harmony',
    8: 'depth, trust, and transformative intimacy',
    9: 'meaning, freedom, and expansive vision',
    10: 'achievement, purpose, and public contribution',
    11: 'community, belonging, and shared ideals',
    12: 'solitude, rest, and inner reflection',
  };
  return moonHouse > 0
    ? houseNeeds[moonHouse] ?? 'emotional attunement'
    : 'emotional attunement';
}
