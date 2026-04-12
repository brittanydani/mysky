/**
 * Ink — Deep Espresso typography system for Desert Titanium Light Mode.
 *
 * All text sitting on Semantic Glass cards uses these ink values.
 * Rule: let the glass carry the color; let the text act as pure, high-contrast ink.
 *
 * In dark mode the palette inverts to the standard white/alpha hierarchy.
 */

// ── Static ink tokens (light mode) ─────────────────────────────────────────
export const Ink = {
  /** Deep Espresso: titles, hero metrics, dynamic highlights */
  primary: '#1A1815',
  /** Muted Espresso: body paragraphs */
  secondary: 'rgba(26, 24, 21, 0.7)',
  /** Sheer Espresso: metadata, dates, inactive cues */
  tertiary: 'rgba(26, 24, 21, 0.4)',
} as const;

// ── Inverted ink tokens (dark mode) ────────────────────────────────────────
export const InkDark = {
  primary: '#FFFFFF',
  secondary: 'rgba(255, 255, 255, 0.72)',
  tertiary: 'rgba(255, 255, 255, 0.40)',
} as const;

/** Returns the correct Ink palette for the current color mode. */
export function getInk(isDark: boolean) {
  return isDark ? InkDark : Ink;
}
