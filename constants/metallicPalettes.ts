// ─────────────────────────────────────────────────────────────────────────────
// Metallic Gradient Palettes
//
// Defines symmetric metallic gradient color stops for every accent color
// in the MySky design system. Each palette follows the pattern:
//   light → mid → core → mid → light
// to create a brushed-metal / foil reflection effect.
//
// Updated to "Lunar Sky" Aesthetic:
// 1. Purged muddy golds, flat tans, and brown-leaning coppers.
// 2. Unified gold variants to the high-contrast Lunar Gold (#D4AF37).
// 3. Implemented Atmosphere, Nebula, Sage, and Ember as core colorful variants.
// ─────────────────────────────────────────────────────────────────────────────

/** Lunar Gold metallic (replaces muddy champagne). */
export const METALLIC_GOLD = ['#F4EBD0', '#DDC488', '#D4AF37', '#DDC488', '#F4EBD0'] as const;

/** Lunar Gold for light mode — reduced white, stronger body/shadow. */
export const METALLIC_GOLD_LIGHT = ['#DDC488', '#B5892D', '#8C631F', '#B5892D', '#DDC488'] as const;

/** Nebula (Amethyst) metallic. */
export const METALLIC_PURPLE = ['#EBE4F9', '#CDBCF4', '#A88BEB', '#CDBCF4', '#EBE4F9'] as const;

/** Atmosphere (Icy Blue) metallic. */
export const METALLIC_BLUE = ['#E8F0F8', '#C5D9ED', '#A2C2E1', '#C5D9ED', '#E8F0F8'] as const;

/** Sage (Emerald) metallic. */
export const METALLIC_GREEN = ['#D9E6DF', '#A3C2B4', '#6B9080', '#A3C2B4', '#D9E6DF'] as const;

/** Copper metallic. */
export const METALLIC_COPPER = ['#F4E2DA', '#E2BBA9', '#CD7F5D', '#E2BBA9', '#F4E2DA'] as const;

/** Rose metallic. */
export const METALLIC_ROSE = ['#F7E5EB', '#E6C0CD', '#D4A3B3', '#E6C0CD', '#F7E5EB'] as const;

/** Ember (Red) metallic. */
export const METALLIC_RED = ['#F7D9D9', '#EB9B9B', '#DC5050', '#EB9B9B', '#F7D9D9'] as const;

/** Lavender metallic. */
export const METALLIC_LAVENDER = ['#F0EBF8', '#D5CAEE', '#A89BC8', '#D5CAEE', '#F0EBF8'] as const;

/** Love-pink metallic. */
export const METALLIC_LOVE = ['#F7DFE6', '#EBB0C4', '#D4A3B3', '#EBB0C4', '#F7DFE6'] as const;

/** Warm yellow / solar metallic (Pushed toward Lunar Gold). */
export const METALLIC_YELLOW = ['#FFFBE6', '#F5E49C', '#D4AF37', '#F5E49C', '#FFFBE6'] as const;

/** Deep blue / Stratosphere metallic. */
export const METALLIC_DEEP_BLUE = ['#E2EAF4', '#A5BEE0', '#5C7CAA', '#A5BEE0', '#E2EAF4'] as const;

/** Deep purple metallic. */
export const METALLIC_DEEP_PURPLE = ['#E6E0F5', '#BCA8E8', '#8B6BE8', '#BCA8E8', '#E6E0F5'] as const;

/** Crown metallic. */
export const METALLIC_CROWN = ['#F2EDF8', '#DDD0EE', '#C4B5DC', '#DDD0EE', '#F2EDF8'] as const;

/** Platinum/Silver (Replaces the muddy tan palette). */
export const METALLIC_TAN = ['#FFFFFF', '#E2E8F0', '#94A3B8', '#E2E8F0', '#FFFFFF'] as const;

/** Teal metallic. */
export const METALLIC_TEAL = ['#E0F7F4', '#99E8DF', '#3DD9CF', '#99E8DF', '#E0F7F4'] as const;

/** Orange metallic. */
export const METALLIC_ORANGE = ['#FCECD9', '#F0C797', '#CD7F5D', '#F0C797', '#FCECD9'] as const;

/** Cyan metallic. */
export const METALLIC_CYAN = ['#E6F9FC', '#A8EDF5', '#A2C2E1', '#A8EDF5', '#E6F9FC'] as const;

/** Indigo metallic. */
export const METALLIC_INDIGO = ['#E8E4F5', '#BCA8E8', '#8B6BE8', '#BCA8E8', '#E8E4F5'] as const;

/** Violet metallic. */
export const METALLIC_VIOLET = ['#EBE4F9', '#CDBCF4', '#A88BEB', '#CDBCF4', '#EBE4F9'] as const;

// ── Unified Gold Aliases (killing the mud) ──
export const METALLIC_WARM_GOLD = METALLIC_GOLD;
export const METALLIC_PALE_GOLD = METALLIC_GOLD;
export const METALLIC_HERO_GOLD = METALLIC_GOLD;
export const METALLIC_FEATURE_GOLD = METALLIC_GOLD;

// ── Unified Alert Aliases ──
export const METALLIC_CHALLENGE = METALLIC_COPPER;
export const METALLIC_WARNING = METALLIC_RED;

// ── Lookup by hex-code — for dynamic/runtime colour matching ────────────
export type MetallicVariant =
  | 'gold' | 'purple' | 'blue' | 'green' | 'copper'
  | 'rose' | 'red' | 'lavender' | 'love' | 'yellow'
  | 'deepBlue' | 'deepPurple' | 'crown' | 'tan'
  | 'warmGold' | 'paleGold' | 'heroGold' | 'featureGold'
  | 'challenge' | 'warning'
  | 'teal' | 'orange' | 'cyan' | 'indigo' | 'violet';

export const METALLIC_VARIANTS: Record<MetallicVariant, readonly string[]> = {
  gold: METALLIC_GOLD,
  purple: METALLIC_PURPLE,
  blue: METALLIC_BLUE,
  green: METALLIC_GREEN,
  copper: METALLIC_COPPER,
  rose: METALLIC_ROSE,
  red: METALLIC_RED,
  lavender: METALLIC_LAVENDER,
  love: METALLIC_LOVE,
  yellow: METALLIC_YELLOW,
  deepBlue: METALLIC_DEEP_BLUE,
  deepPurple: METALLIC_DEEP_PURPLE,
  crown: METALLIC_CROWN,
  tan: METALLIC_TAN,
  warmGold: METALLIC_WARM_GOLD,
  paleGold: METALLIC_PALE_GOLD,
  heroGold: METALLIC_HERO_GOLD,
  featureGold: METALLIC_FEATURE_GOLD,
  challenge: METALLIC_CHALLENGE,
  warning: METALLIC_WARNING,
  teal: METALLIC_TEAL,
  orange: METALLIC_ORANGE,
  cyan: METALLIC_CYAN,
  indigo: METALLIC_INDIGO,
  violet: METALLIC_VIOLET,
};

/**
 * Given a flat hex colour, return the closest metallic gradient stops.
 * Falls back to Lunar Gold if no match is found.
 */
export function metallicForHex(hex: string): readonly string[] {
  const map: Record<string, readonly string[]> = {
    // Legacy Muddy Golds -> Lunar Gold
    '#D4AF37': METALLIC_GOLD,
    '#DDBA6A': METALLIC_GOLD,
    '#E8C97A': METALLIC_GOLD,
    '#E3CFA4': METALLIC_GOLD,
    '#D9BF8C': METALLIC_GOLD,
    '#D4B872': METALLIC_GOLD,
    '#E8D6AE': METALLIC_GOLD,
    '#C3CAD6': METALLIC_GOLD,
    '#F0C87E': METALLIC_GOLD,
    '#E2C27A': METALLIC_GOLD,
    
    // Core Lunar Sky Palette
    '#F4EBD0': METALLIC_GOLD,
    '#A2C2E1': METALLIC_BLUE,
    '#A88BEB': METALLIC_PURPLE,
    '#6B9080': METALLIC_GREEN,
    '#DC5050': METALLIC_RED,
    '#5C7CAA': METALLIC_DEEP_BLUE,
    '#2C3645': METALLIC_DEEP_BLUE,
    '#1A1E29': METALLIC_DEEP_BLUE,
    
    // Auxiliary Mappings
    '#9D76C1': METALLIC_PURPLE,
    '#A89BC8': METALLIC_LAVENDER,
    '#4A3B6B': METALLIC_PURPLE,
    '#6EBF8B': METALLIC_GREEN,
    '#CD7F5D': METALLIC_COPPER,
    '#D4A3B3': METALLIC_ROSE,
    '#E07A98': METALLIC_LOVE,
    '#E07A7A': METALLIC_RED,
    '#D98C8C': METALLIC_WARNING,
    '#C87878': METALLIC_CHALLENGE,
    '#E0D07A': METALLIC_YELLOW,
    '#7AA8E0': METALLIC_DEEP_BLUE,
    '#9B7AE0': METALLIC_DEEP_PURPLE,
    '#D0C8E8': METALLIC_CROWN,
    '#D8C39A': METALLIC_TAN,
    '#6E8CB4': METALLIC_BLUE,
    '#8CBEAA': METALLIC_GREEN,
    '#D4826A': METALLIC_COPPER,
    '#6BAED6': METALLIC_BLUE,
    '#C8A4A4': METALLIC_ROSE,
    '#FF7A5C': METALLIC_RED,
    '#9ACD32': METALLIC_GREEN,
    '#49DFFF': METALLIC_CYAN,
    '#7B68EE': METALLIC_VIOLET,
    '#9370DB': METALLIC_INDIGO,
    '#FFEA70': METALLIC_YELLOW,
    '#48D1CC': METALLIC_TEAL,
    '#FF8C00': METALLIC_ORANGE,
    
    // Core Force Map palette
    '#E8A838': METALLIC_ORANGE,
    '#3DD9CF': METALLIC_TEAL,
    '#E8628C': METALLIC_LOVE,
    '#8B6BE8': METALLIC_INDIGO,
    '#5EC87A': METALLIC_GREEN,
    '#E87050': METALLIC_COPPER,
  };
  return map[hex.toUpperCase()] ?? map[hex] ?? METALLIC_GOLD;
}

interface ResolveMetallicGradientOptions {
  variant?: MetallicVariant;
  color?: string;
  colors?: readonly string[];
  isDark?: boolean;
}

export function resolveMetallicGradient({
  variant,
  color,
  colors,
  isDark = true,
}: ResolveMetallicGradientOptions): readonly string[] {
  if (colors) {
    return colors;
  }

  const resolved = variant
    ? METALLIC_VARIANTS[variant]
    : color
      ? metallicForHex(color)
      : METALLIC_GOLD;

  if (!isDark && resolved === METALLIC_GOLD) {
    return METALLIC_GOLD_LIGHT;
  }

  return resolved;
}
