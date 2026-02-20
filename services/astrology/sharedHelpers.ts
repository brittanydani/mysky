// ─────────────────────────────────────────────────────────────
// MySky — Shared Astrology Helpers
// Single source of truth for common astrology math & lookups.
// Import from here instead of duplicating in each engine.
// ─────────────────────────────────────────────────────────────

import { ZODIAC_SIGNS } from './constants';
import { AstrologySign, ZodiacSign } from './types';

// ── Zodiac sign name list (derived from constants) ──────────

export const ZODIAC_SIGN_NAMES: string[] = ZODIAC_SIGNS.map(s => s.name);

// ── Element / modality lookups (derived from constants) ─────

export const SIGN_TO_ELEMENT: Record<string, string> = Object.fromEntries(
  ZODIAC_SIGNS.map(s => [s.name, s.element])
);

export const SIGN_TO_MODALITY: Record<string, string> = Object.fromEntries(
  ZODIAC_SIGNS.map(s => [s.name, s.modality])
);

// ── Core math ───────────────────────────────────────────────

/** Normalize any degree to [0, 360) */
export function normalize360(deg: number): number {
  const x = deg % 360;
  return x < 0 ? x + 360 : x;
}

/** Degree within a sign (0–30) */
export function degreeInSign(absDeg: number): number {
  return normalize360(absDeg) % 30;
}

/** Degree + minute from absolute degrees */
export function degMinFromAbs(absDeg: number): { degree: number; minute: number } {
  const d = degreeInSign(absDeg);
  const deg = Math.floor(d);
  const min = Math.floor((d - deg) * 60);
  return { degree: deg, minute: min };
}

/** Angular difference between two longitudes (0–180) */
export function angularDifference(a: number, b: number): number {
  let d = Math.abs(normalize360(a) - normalize360(b));
  if (d > 180) d = 360 - d;
  return d;
}

// ── Sign lookup ─────────────────────────────────────────────

/** Get zodiac sign name from absolute longitude */
export function signNameFromLongitude(absDeg: number): string {
  const idx = Math.floor(normalize360(absDeg) / 30);
  return ZODIAC_SIGN_NAMES[idx] ?? 'Aries';
}

/** Get full AstrologySign object from absolute longitude (legacy compat) */
export function signFromLongitude(absDeg: number): AstrologySign {
  const idx = Math.floor(normalize360(absDeg) / 30);
  const z = ZODIAC_SIGNS[idx] ?? ZODIAC_SIGNS[0];
  return {
    name: z.name,
    symbol: z.symbol,
    element: z.element,
    quality: z.modality,
    rulingPlanet: z.ruler.name,
    dates: SIGN_DATE_RANGES[z.name] ?? '',
  };
}

const SIGN_DATE_RANGES: Record<string, string> = {
  Aries: 'March 21 - April 19',
  Taurus: 'April 20 - May 20',
  Gemini: 'May 21 - June 20',
  Cancer: 'June 21 - July 22',
  Leo: 'July 23 - August 22',
  Virgo: 'August 23 - September 22',
  Libra: 'September 23 - October 22',
  Scorpio: 'October 23 - November 21',
  Sagittarius: 'November 22 - December 21',
  Capricorn: 'December 22 - January 19',
  Aquarius: 'January 20 - February 18',
  Pisces: 'February 19 - March 20',
};

// ── Degree extraction ───────────────────────────────────────

/**
 * Extract absolute degree from a circular-natal-horoscope-js object.
 * Handles all known nesting patterns.
 */
export function extractAbsDegree(obj: any): number | null {
  const direct =
    obj?.ChartPosition?.Ecliptic?.DecimalDegrees ??
    obj?.ChartPosition?.StartPosition?.Ecliptic?.DecimalDegrees ??
    obj?.chartPosition?.ecliptic?.decimalDegrees ??
    obj?.chartPosition?.startPosition?.ecliptic?.decimalDegrees ??
    obj?.Ecliptic?.DecimalDegrees ??
    obj?.ecliptic?.decimalDegrees ??
    obj?.absoluteDegrees ??
    obj?.longitude ??
    obj?.elon;

  if (typeof direct === 'number' && Number.isFinite(direct)) return normalize360(direct);
  return null;
}

// ── House determination ─────────────────────────────────────

/**
 * Determine which natal house a longitude falls in.
 * @returns house number 1–12, or null if cusps are invalid
 */
export function computeHouseForLongitude(absDeg: number, cuspDegrees: number[]): number | null {
  if (!Array.isArray(cuspDegrees) || cuspDegrees.length !== 12) return null;

  const lon = normalize360(absDeg);
  for (let i = 0; i < 12; i++) {
    const start = normalize360(cuspDegrees[i]);
    const end = normalize360(cuspDegrees[(i + 1) % 12]);

    if (start <= end) {
      if (lon >= start && lon < end) return i + 1;
    } else {
      // wrap-around
      if (lon >= start || lon < end) return i + 1;
    }
  }
  return null;
}

// ── Sign name extraction ────────────────────────────────────

/**
 * Extract sign name string from either a string or { name: string } object.
 * Handles the varied shapes returned by NatalChart fields.
 */
export function extractSignName(s: unknown): string {
  if (!s) return '';
  if (typeof s === 'string') return s;
  const obj = s as { name?: string };
  return obj?.name ?? '';
}

/**
 * Get the element for a sign (string or object)
 */
export function extractSignElement(s: unknown): string {
  if (!s) return '';
  if (typeof s === 'string') {
    return SIGN_TO_ELEMENT[s] ?? '';
  }
  const obj = s as { element?: string; name?: string };
  return obj?.element ?? SIGN_TO_ELEMENT[obj?.name ?? ''] ?? '';
}
