// ─────────────────────────────────────────────────────────────────────────────
// MySky Metallic Design System
//
// Single source of truth for every champagne-gold Skia element in the app:
//   pills · tab icons · logo icons · badges · rings · sparkles · glows
//
// Four metallic modes:
//   inactive  flat muted champagne — inactive tabs, secondary accents
//   tiny      5-stop sweep — active tab icons, mini badges
//   soft      11-stop — pills, buttons, standard icons
//   hero      12-stop (adds specular peak) — logos, main feature icons
// ─────────────────────────────────────────────────────────────────────────────

// ── Gold palette ──────────────────────────────────────────────────────────────
export const mySkyGold = {
  specular:       '#FFFDF2',  // brightest highlight (hero only)
  glossBright:    '#FFF7E8',  // strong gloss
  glossSoft:      '#F7E7C6',  // soft gloss
  champagneLight: '#EFD596',  // upper-mid highlight
  champagne:      '#DDBA6A',  // main champagne body
  goldMid:        '#C99949',  // mid gold
  goldDeep:       '#A8742E',  // deep warm gold
  shadow:         '#7A511C',  // shadow
  shadowDeep:     '#4D2F0D',  // deep shadow
} as const;

// ── Inactive — flat, no gloss, muted (inactive tabs, secondary) ────────────
export const inactiveGoldColor = 'rgba(185, 152, 90, 0.52)';
export const metallicStopsInactive = [
  'rgba(162, 132, 68, 0.38)',
  'rgba(192, 160, 92, 0.52)',
  'rgba(162, 132, 68, 0.38)',
] as const;
export const metallicPositionsInactive = [0, 0.5, 1] as const;

// ── Tiny — 5 stops, for small tab icons & mini badges ─────────────────────
export const metallicStopsTiny = [
  mySkyGold.shadow,
  mySkyGold.goldMid,
  mySkyGold.champagneLight,
  mySkyGold.goldMid,
  mySkyGold.shadow,
] as const;
export const metallicPositionsTiny = [0, 0.22, 0.5, 0.78, 1] as const;

// ── Soft — 11 stops, for pills, buttons, standard icons ──────────────────
export const metallicStopsSoft = [
  mySkyGold.shadowDeep,
  mySkyGold.shadow,
  mySkyGold.goldDeep,
  mySkyGold.goldMid,
  mySkyGold.champagne,
  mySkyGold.champagneLight,
  mySkyGold.glossSoft,
  mySkyGold.glossBright,
  mySkyGold.champagne,
  mySkyGold.goldMid,
  mySkyGold.shadow,
] as const;
export const metallicPositionsSoft = [
  0.0, 0.08, 0.2, 0.34, 0.5, 0.62, 0.74, 0.82, 0.9, 0.96, 1.0,
] as const;

// ── Hero — 12 stops, adds specular peak, for logos & feature icons ─────────
export const metallicStopsHero = [
  mySkyGold.shadowDeep,
  mySkyGold.shadow,
  mySkyGold.goldDeep,
  mySkyGold.goldMid,
  mySkyGold.champagne,
  mySkyGold.champagneLight,
  mySkyGold.glossSoft,
  mySkyGold.glossBright,
  mySkyGold.specular,
  mySkyGold.champagne,
  mySkyGold.goldMid,
  mySkyGold.shadow,
] as const;
export const metallicPositionsHero = [
  0.0, 0.08, 0.18, 0.3, 0.44, 0.58, 0.7, 0.8, 0.84, 0.9, 0.96, 1.0,
] as const;

// ── Mode type + helper ────────────────────────────────────────────────────
export type MetallicMode = 'inactive' | 'tiny' | 'soft' | 'hero';

export function getMetallicStops(mode: MetallicMode): {
  colors: readonly string[];
  positions: readonly number[];
} {
  switch (mode) {
    case 'inactive': return { colors: metallicStopsInactive, positions: metallicPositionsInactive };
    case 'tiny':     return { colors: metallicStopsTiny,     positions: metallicPositionsTiny };
    case 'hero':     return { colors: metallicStopsHero,     positions: metallicPositionsHero };
    default:         return { colors: metallicStopsSoft,     positions: metallicPositionsSoft };
  }
}

// ── Glow system ───────────────────────────────────────────────────────────
// Values to pass to BlurMask blur + opacity.
// All glow uses mySkyGold.champagne as the base glow colour.
export const mySkyGlow = {
  subtle: { blur: 6,  opacity: 0.18 },
  soft:   { blur: 10, opacity: 0.25 },
  strong: { blur: 16, opacity: 0.35 },
  hero:   { blur: 22, opacity: 0.45 },
} as const;

export type GlowLevel = keyof typeof mySkyGlow;

// ── Stroke width multipliers ───────────────────────────────────────────────
// Multiply by `size` (the canvas dimension) to get pixel stroke width.
// E.g. strokeWidth={size * mySkyStroke.standard}
export const mySkyStroke = {
  hairline: 0.003,
  fine:     0.005,
  standard: 0.009,
  medium:   0.012,
  bold:     0.018,
} as const;

// ── Sweep gradient (rings, halos) — 10-stop SweepGradient ─────────────────
// Used by compass rings, decorative halos, any circular stroke sweep.
// Includes specular peak so rings match book/diamond brightness exactly.
export const metallicStopsSweep = [
  mySkyGold.shadowDeep,
  mySkyGold.shadow,
  mySkyGold.goldMid,
  mySkyGold.champagneLight,
  mySkyGold.glossBright,
  mySkyGold.specular,      // specular peak — matches hero gradient
  mySkyGold.champagne,
  mySkyGold.goldMid,
  mySkyGold.shadow,
  mySkyGold.shadowDeep,
] as const;
export const metallicPositionsSweep = [0, 0.10, 0.26, 0.44, 0.54, 0.60, 0.70, 0.82, 0.92, 1] as const;

// ── Hub gradient (small filled circles) ───────────────────────────────────
// Used by compass centre hub, small circular accents.
export const metallicStopsHub = [
  mySkyGold.specular,
  mySkyGold.glossBright,
  mySkyGold.champagne,
  mySkyGold.goldMid,
  mySkyGold.shadow,
] as const;
export const metallicPositionsHub = [0, 0.18, 0.46, 0.72, 1] as const;

// ── Sparkle / star gradient ────────────────────────────────────────────────
// Used by 4-point stars above the book logo and MetallicSparkleSkia.
export const metallicStopsStar = [
  mySkyGold.specular,
  mySkyGold.glossBright,
  mySkyGold.champagne,
  mySkyGold.goldMid,
  mySkyGold.shadow,
] as const;
export const metallicPositionsStar = [0, 0.15, 0.45, 0.75, 1] as const;

// ── Background palette ─────────────────────────────────────────────────────
export const mySkyBackground = {
  base:    '#020817',
  elevated:'#07101F',
  panel:   '#0B1526',
  soft:    'rgba(255,255,255,0.03)',
} as const;
