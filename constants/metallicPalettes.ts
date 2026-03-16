// ─────────────────────────────────────────────────────────────────────────────
// Metallic Gradient Palettes
//
// Defines symmetric metallic gradient color stops for every accent color
// in the MySky design system. Each palette follows the pattern:
//   light → mid → core → mid → light
// to create a brushed-metal / foil reflection effect.
// ─────────────────────────────────────────────────────────────────────────────

/** Champagne-gold metallic — matches existing GoldSubtitle. */
export const METALLIC_GOLD = ['#FFF4D6', '#E9D9B8', '#C9AE78', '#E9D9B8', '#FFF4D6'] as const;

/** Amethyst / deep purple metallic. */
export const METALLIC_PURPLE = ['#E8D5F5', '#C9A8E0', '#9D76C1', '#C9A8E0', '#E8D5F5'] as const;

/** Silver-blue metallic. */
export const METALLIC_BLUE = ['#D6EEFF', '#B0D8F0', '#8BC4E8', '#B0D8F0', '#D6EEFF'] as const;

/** Emerald-green metallic. */
export const METALLIC_GREEN = ['#D6F5E3', '#A8E0BD', '#6EBF8B', '#A8E0BD', '#D6F5E3'] as const;

/** Copper metallic. */
export const METALLIC_COPPER = ['#F5E0D6', '#E0AA90', '#CD7F5D', '#E0AA90', '#F5E0D6'] as const;

/** Rose / soft pink metallic. */
export const METALLIC_ROSE = ['#F5D6E0', '#E0B0C1', '#D4A3B3', '#E0B0C1', '#F5D6E0'] as const;

/** Error-red metallic. */
export const METALLIC_RED = ['#F5D6D6', '#E0A0A0', '#E07A7A', '#E0A0A0', '#F5D6D6'] as const;

/** Lavender / soft violet metallic. */
export const METALLIC_LAVENDER = ['#E0D6F0', '#C4B5DC', '#A89BC8', '#C4B5DC', '#E0D6F0'] as const;

/** Love-pink metallic (deeper than rose). */
export const METALLIC_LOVE = ['#F5D0DA', '#E09FB4', '#E07A98', '#E09FB4', '#F5D0DA'] as const;

/** Warm yellow / solar metallic. */
export const METALLIC_YELLOW = ['#FFF8D6', '#F0E5B0', '#E0D07A', '#F0E5B0', '#FFF8D6'] as const;

/** Deep blue / throat-chakra metallic. */
export const METALLIC_DEEP_BLUE = ['#D6E4FF', '#AAC4F0', '#7AA8E0', '#AAC4F0', '#D6E4FF'] as const;

/** Deep purple / third-eye metallic. */
export const METALLIC_DEEP_PURPLE = ['#DCD0F5', '#BCA8E8', '#9B7AE0', '#BCA8E8', '#DCD0F5'] as const;

/** Light lavender / crown metallic. */
export const METALLIC_CROWN = ['#EDE6F8', '#DDD0EE', '#D0C8E8', '#DDD0EE', '#EDE6F8'] as const;

/** Tan / sacral metallic. */
export const METALLIC_TAN = ['#F5EDD6', '#E8DDB8', '#D8C39A', '#E8DDB8', '#F5EDD6'] as const;

/** Teal / aqua metallic. */
export const METALLIC_TEAL = ['#CCF5F0', '#80E8DD', '#48D1CC', '#80E8DD', '#CCF5F0'] as const;

/** Amber / orange metallic. */
export const METALLIC_ORANGE = ['#FFE4CC', '#FFB880', '#FF8C00', '#FFB880', '#FFE4CC'] as const;

/** Bright cyan metallic. */
export const METALLIC_CYAN = ['#D6F8FF', '#8EEEFF', '#49DFFF', '#8EEEFF', '#D6F8FF'] as const;

/** Indigo / Jupiter metallic. */
export const METALLIC_INDIGO = ['#E0D6F5', '#BBA8E8', '#9370DB', '#BBA8E8', '#E0D6F5'] as const;

/** Violet / slate-blue metallic. */
export const METALLIC_VIOLET = ['#E6D6F5', '#C4A8ED', '#7B68EE', '#C4A8ED', '#E6D6F5'] as const;

/** Warm gold accent (#D4B872). */
export const METALLIC_WARM_GOLD = ['#FFF6DC', '#ECDDBA', '#D4B872', '#ECDDBA', '#FFF6DC'] as const;

/** Pale gold accent (#D9BF8C). */
export const METALLIC_PALE_GOLD = ['#FFF8E6', '#EDE0C4', '#D9BF8C', '#EDE0C4', '#FFF8E6'] as const;

/** Hero gold (#E8C97A) metallic. */
export const METALLIC_HERO_GOLD = ['#FFF8E0', '#F2E4BA', '#E8C97A', '#F2E4BA', '#FFF8E0'] as const;

/** Feature-icon gold (#E3CFA4) metallic. */
export const METALLIC_FEATURE_GOLD = ['#FFF8EA', '#F0E3C8', '#E3CFA4', '#F0E3C8', '#FFF8EA'] as const;

/** Challenge-red metallic (#C87878). */
export const METALLIC_CHALLENGE = ['#F2D6D6', '#DCA8A8', '#C87878', '#DCA8A8', '#F2D6D6'] as const;

/** Warning-red (#D98C8C) metallic. */
export const METALLIC_WARNING = ['#F5DCDC', '#E4B0B0', '#D98C8C', '#E4B0B0', '#F5DCDC'] as const;

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
 * Falls back to gold if no match is found.
 */
export function metallicForHex(hex: string): readonly string[] {
  const map: Record<string, readonly string[]> = {
    '#C9AE78': METALLIC_GOLD,
    '#DDBA6A': METALLIC_GOLD,
    '#D4AF37': METALLIC_GOLD,
    '#E8C97A': METALLIC_HERO_GOLD,
    '#E3CFA4': METALLIC_FEATURE_GOLD,
    '#D9BF8C': METALLIC_PALE_GOLD,
    '#D4B872': METALLIC_WARM_GOLD,
    '#E8D6AE': METALLIC_GOLD,
    '#9D76C1': METALLIC_PURPLE,
    '#A89BC8': METALLIC_LAVENDER,
    '#4A3B6B': METALLIC_PURPLE,
    '#8BC4E8': METALLIC_BLUE,
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
    '#CFAE73': METALLIC_GOLD,
    '#C3CAD6': METALLIC_BLUE,
    '#F0C87E': METALLIC_GOLD,
    '#E2C27A': METALLIC_GOLD,
    '#6E8CB4': METALLIC_BLUE,
    '#8CBEAA': METALLIC_GREEN,
    '#FF7A5C': METALLIC_RED,
    '#9ACD32': METALLIC_GREEN,
    '#49DFFF': METALLIC_CYAN,
    '#7B68EE': METALLIC_VIOLET,
    '#9370DB': METALLIC_INDIGO,
    '#FFEA70': METALLIC_YELLOW,
    '#48D1CC': METALLIC_TEAL,
    '#FF8C00': METALLIC_ORANGE,
  };
  return map[hex.toUpperCase()] ?? map[hex] ?? METALLIC_GOLD;
}
