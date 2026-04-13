// ─────────────────────────────────────────────────────────────────────────────
// MySky Metallic Design System
//
// Single source of truth for every champagne-gold Skia element in the app:
// pills · tab icons · logo icons · badges · rings · sparkles · glows
//
// Updated to "Lunar Sky" Aesthetic:
// 1. Purged muddy bronzes and flat tan mid-tones.
// 2. Implemented high-contrast "Lunar Specular" peaks for machined depth.
// 3. Refined multi-stop sweeps for bioluminescent light-scatter.
// ─────────────────────────────────────────────────────────────────────────────

// ── Gold palette (Purged Muddy Bronzes) ──────────────────────────────────────
export const mySkyGold = {
  specular:       '#FFFFFF',  // pure light peak
  glossBright:    '#F4EBD0',  // brilliant ivory
  glossSoft:      '#E9D9B8',  // soft light-catch
  champagneLight: '#DDC488',  // illuminated core
  champagne:      '#D4AF37',  // MAIN BRAND GOLD (High-End)
  base:           '#D4AF37',  
  goldMid:        '#B5892D',  // mid gold anchor
  goldDeep:       '#8C631F',  // deep warm gold (machined edge)
  shadow:         '#5A4015',  // clean shadow
  shadowDeep:     '#2C1E0A',  // deep obsidian gold
} as const;

// ── Inactive — flat, no gloss, muted (Atmosphere Blue influence) ────────────
export const inactiveGoldColor = 'rgba(162, 194, 225, 0.32)';
export const metallicStopsInactive = [
  'rgba(162, 194, 225, 0.20)',
  'rgba(162, 194, 225, 0.35)',
  'rgba(162, 194, 225, 0.20)',
] as const;
export const metallicPositionsInactive = [0, 0.5, 1] as const;

// ── Tiny — 5 stops, for small tab icons & mini badges ─────────────────────
export const metallicStopsTiny = [
  mySkyGold.shadow,
  mySkyGold.goldMid,
  mySkyGold.glossBright,
  mySkyGold.goldMid,
  mySkyGold.shadow,
] as const;
export const metallicPositionsTiny = [0, 0.25, 0.5, 0.75, 1] as const;

// ── Soft — 11 stops, for pills, buttons, standard icons ──────────────────
export const metallicStopsSoft: string[] = [
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
];
export const metallicPositionsSoft: number[] = [
  0.0, 0.1, 0.22, 0.35, 0.5, 0.65, 0.78, 0.85, 0.92, 0.97, 1.0,
];

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
  0.0, 0.08, 0.18, 0.32, 0.45, 0.58, 0.72, 0.8, 0.85, 0.9, 0.96, 1.0,
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

// ── Glow system (Bioluminescent Bloom) ────────────────────────────────────
export const mySkyGlow = {
  subtle: { blur: 8,  opacity: 0.20 },
  soft:   { blur: 12, opacity: 0.28 },
  strong: { blur: 20, opacity: 0.40 },
  hero:   { blur: 32, opacity: 0.55 },
} as const;

export type GlowLevel = keyof typeof mySkyGlow;

// ── Stroke width multipliers ───────────────────────────────────────────────
export const mySkyStroke = {
  hairline: 0.004,
  fine:     0.006,
  standard: 0.010,
  medium:   0.014,
  bold:     0.020,
} as const;

// ── Fill gradient — 24k gold with reflective glass overlay ────────────────
// Deep amber shadow → warm gold → narrow cool-white glass flare → gold specular → return.
// The glass flare (#F0EFFF spike at 0.44–0.50) simulates a glass lens over metal.
export const metallicFillColors = [
  '#2E1A04',  // deep amber shadow root
  '#7A4D0C',  // machined bronze edge
  '#C8921A',  // rich warm gold body
  '#F0EFFF',  // glass flare — cool specular spike (glass-over-gold illusion)
  '#FFE99A',  // warm gold specular return
  '#DDB84A',  // illuminated gold
  '#7A4D0C',  // machined bronze edge return
  '#1E1003',  // deep shadow close
] as const;
export const metallicFillPositions = [0, 0.12, 0.30, 0.44, 0.52, 0.68, 0.85, 1.0] as const;

// ── Background palette (Midnight Slate System) ─────────────────────────────
export const mySkyBackground = {
  base:    '#0A0A0F', // Absolute Midnight
  elevated:'#1A1E29', // Slate Deep (Anchor)
  panel:   '#2C3645', // Slate Mid (Glass)
  soft:    'rgba(162, 194, 225, 0.04)', // Atmosphere Tint
} as const;
