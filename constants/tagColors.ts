/**
 * Canonical Tag Colors & Icons
 *
 * Single source of truth for tag styling across
 * Check-In, Mood, Journal, and Archive screens.
 * Every tag retains the same color dot / icon across the app.
 */

// ── Influence tag colors ──
export const TAG_COLORS: Record<string, string> = {
  // Influence tags
  sleep: '#8BC4E8',        // silver-blue
  work: '#CD7F5D',         // copper
  social: '#9D76C1',       // amethyst
  relationships: '#F4C2C2', // soft pink
  conflict: '#E07A7A',     // warm red
  health: '#6EBF8B',       // emerald
  movement: '#6EBF8B',     // emerald
  nature: '#98FB98',       // pale green
  alone_time: '#8BC4E8',   // silver-blue
  finances: '#C9AE78',     // gold
  weather: '#48D1CC',      // turquoise
  food: '#FFEA70',         // pale yellow
  screens: '#A9A9A9',      // steel
  kids: '#F4C2C2',         // soft pink
  productivity: '#C9AE78', // gold
  substances: '#CD7F5D',   // copper
  intimacy: '#F4C2C2',     // soft pink

  // Emotional quality tags
  eq_calm: '#6EBF8B',
  eq_anxious: '#E07A7A',
  eq_motivated: '#C9AE78',
  eq_restless: '#CD7F5D',
  eq_grateful: '#9D76C1',
  eq_overwhelmed: '#E07A7A',
  eq_creative: '#FFEA70',
  eq_numb: '#A9A9A9',
  eq_hopeful: '#8BC4E8',
  eq_irritable: '#CD7F5D',
  eq_connected: '#F4C2C2',
  eq_lonely: '#9D76C1',
  eq_focused: '#C9AE78',
  eq_scattered: '#A9A9A9',

  // Legacy / combined tags
  confidence: '#C9AE78',
  money: '#C9AE78',
  family: '#F4C2C2',
  creativity: '#FFEA70',
  boundaries: '#9D76C1',
  career: '#CD7F5D',
  anxiety: '#E07A7A',
  joy: '#6EBF8B',
};

/** Fallback color when a tag is unknown */
export const TAG_COLOR_DEFAULT = 'rgba(226,232,240,0.45)';

/**
 * Resolve a tag to its canonical color.
 * Falls back to a neutral muted tone for unknown tags.
 */
export function getTagColor(tag: string): string {
  return TAG_COLORS[tag] ?? TAG_COLOR_DEFAULT;
}
