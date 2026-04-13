// MySky Unified Theme
// Premium Lunar Sky + Midnight Slate Visual System
// Gold is reserved for metallic text/icons only. No gold background fills.

import { Platform } from 'react-native';

// ── Metallic gold palette — High-contrast 3-stop foil ──────
export const METALLIC_GOLD = {
  highlight: '#F9DF9F',
  mid: '#D4AF37',
  shadow: '#936B16',
  rim: 'rgba(255, 248, 220, 0.60)',
  glow: 'rgba(247, 231, 194, 0.15)',
  /** The Gold Foil stencil gradient used for headers and icons */
  foilGradient: ['#F9DF9F', '#D4AF37', '#936B16'] as const,
} as const;

// ── Single source of truth for the MySky visual system ──────────────
export const MYSTIC = {
  // ─ Backgrounds ─
  bgTop: '#0A0A0F',
  bgMid: '#0A0A0F',
  bgBottom: '#0A0A0F',
  bgDeep: '#0A0A0F',

  // ─ Text hierarchy — Data is the Light ─
  heading: '#FFFFFF',
  body: 'rgba(255, 255, 255, 0.65)',
  muted: 'rgba(255, 255, 255, 0.40)',

  // ─ CTA / premium button surface ─
  ctaText: '#0B1220',
  ctaBorder: 'rgba(255, 255, 255, 0.25)',
  ctaGloss: 'rgba(255, 255, 255, 0.10)',

  // ─ Glass card system — Elevated Smoked Glass ─
  cardBg: 'rgba(255, 255, 255, 0.08)',
  cardBorder: 'rgba(255, 255, 255, 0.10)',
  cardHighlight: 'rgba(255, 255, 255, 0.20)',

  // ─ Semantic accents ─
  success: '#6B9080',
  error: '#E5989B',
  love: '#E07A98',
  silverBlue: '#A2C2E1',
  copper: '#CD7F5D',
  amethyst: '#A88BEB',
  brandGold: '#D4AF37',

  // ─ Lunar Sky Smoked Glass Washes (Dark Mode) ─
  // Midnight Slate Wash — Anchor cards (Daily Balance, This Week, Snapshot)
  midnightSlateWash: ['rgba(44, 54, 69, 0.85)', 'rgba(26, 30, 41, 0.40)'] as const,
  // Atmosphere Wash — calm dashboard states (Internal Weather, Affirmation)
  atmosphereWash: ['rgba(162, 194, 225, 0.20)', 'rgba(162, 194, 225, 0.05)'] as const,
  // Stratosphere Wash — deep focus / logic (Cognitive Style, Archetypes)
  stratosphereWash: ['rgba(92, 124, 170, 0.20)', 'rgba(92, 124, 170, 0.05)'] as const,
  // Nebula Wash — dreams / subconscious (Sleep entries)
  nebulaWash: ['rgba(168, 139, 235, 0.20)', 'rgba(168, 139, 235, 0.05)'] as const,
  // Sage Wash — growth / somatic (Glimmers, Resonance)
  sageWash: ['rgba(107, 144, 128, 0.20)', 'rgba(107, 144, 128, 0.05)'] as const,
  // Ember Wash — tension / warning (Stress spikes)
  emberWash: ['rgba(220, 80, 80, 0.20)', 'rgba(220, 80, 80, 0.05)'] as const,
  
  // Interactive Selectors
  activeIcyBorder: 'rgba(162, 194, 225, 0.4)',
  selectedFill: 'rgba(162, 194, 225, 0.15)',
} as const;

export const AURORA = {
  // Backgrounds — Desert Titanium warm alabaster canvas
  bgTop: '#F7F5F0',
  bgMid: '#F4F1EB',
  bgBottom: '#F2EFE9',
  bgDeep: '#EDE9E2',

  // Text hierarchy — rich espresso ink
  heading: '#1A1815',
  body: 'rgba(26, 24, 21, 0.7)',
  muted: 'rgba(26, 24, 21, 0.4)',

  // Glass card system — frosted sheet on warm canvas
  cardBg: 'rgba(255, 255, 255, 0.5)',
  cardBorder: 'rgba(0, 0, 0, 0.04)',
  cardHighlight: 'rgba(255, 255, 255, 0.9)',

  // Saturated Ink Accents
  success: '#4A5D4E',
  error: '#8C4A42',
  love: '#9A6B75',
  silverBlue: '#7A90A8',
  copper: '#B4765B',
  amethyst: '#8B77AA',
  gold: '#D4AF37',
} as const;

type ThemePalette = typeof MYSTIC | typeof AURORA;

function createTheme(palette: ThemePalette, mode: 'light' | 'dark') {
  const isDark = mode === 'dark';

  return {
    mode,
    isDark,
    blurTint: isDark ? 'dark' : 'light',
    statusBarStyle: isDark ? 'light' : 'dark',

    // Primary Colors
    primary: isDark ? METALLIC_GOLD.mid : (palette as typeof AURORA).gold,
    primaryDark: METALLIC_GOLD.shadow,
    background: palette.bgTop,
    backgroundSecondary: palette.bgMid,
    backgroundDeep: palette.bgDeep,
    backgroundTertiary: isDark ? 'rgba(255, 255, 255, 0.05)' : '#FFFFFF',
    surface: isDark ? palette.cardBg : 'rgba(255, 255, 255, 0.75)',

    // Text Colors
    textPrimary: palette.heading,
    textSecondary: palette.body,
    textMuted: palette.muted,
    textInk: isDark ? '#FFFFFF' : '#1A1815', // Pure white data in Dark mode
    textGold: isDark ? METALLIC_GOLD.mid : (palette as typeof AURORA).gold,
    titanium: METALLIC_GOLD.mid,

    // Semantic Colors
    success: palette.success,
    error: palette.error,
    love: palette.love,
    silverBlue: palette.silverBlue,
    copper: palette.copper,
    amethyst: palette.amethyst,

    // ── Semantic Card Surfaces (Dark Mode Refactored) ──────────────────────────
    
    // Anchor cards use the rich Midnight Slate blue you loved
    cardSurfaceAnchor: isDark ? (palette as typeof MYSTIC).midnightSlateWash : (['#FFFFFF', '#F7F5F0'] as const),
    
    // Standard dashboard / values logic
    cardSurfaceValues: isDark ? (palette as typeof MYSTIC).atmosphereWash : (['rgba(242, 247, 253, 0.7)', 'rgba(242, 247, 253, 0.4)'] as const),
    
    // Cognitive / Intelligence analytical logic
    cardSurfaceCognitive: isDark ? (palette as typeof MYSTIC).stratosphereWash : (['rgba(240, 245, 252, 0.7)', 'rgba(240, 245, 252, 0.4)'] as const),
    
    // Dream / Relationship logic
    cardSurfaceRelational: isDark ? (palette as typeof MYSTIC).nebulaWash : (['rgba(245, 238, 240, 0.7)', 'rgba(245, 238, 240, 0.4)'] as const),
    
    // Growth / Body awareness logic
    cardSurfaceSomatic: isDark ? (palette as typeof MYSTIC).sageWash : (['rgba(235, 242, 238, 0.7)', 'rgba(235, 242, 238, 0.4)'] as const),
    
    // Tension / Stress logic
    cardSurfaceTension: isDark ? (palette as typeof MYSTIC).emberWash : (['rgba(247, 238, 233, 0.7)', 'rgba(247, 238, 233, 0.4)'] as const),

    // Generic Smoked Glass
    cardSurface: isDark ? palette.cardBg : 'rgba(255, 255, 255, 0.75)',
    cardSurfaceStrong: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.92)',
    surfaceLight: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.92)',
    cardGradientStart: isDark ? 'rgba(44, 54, 69, 0.85)' : 'rgba(255, 255, 255, 0.98)',
    cardGradientEnd: isDark ? 'rgba(26, 30, 41, 0.40)' : 'rgba(244, 238, 229, 0.98)',
    cardBorder: palette.cardBorder,
    cardHighlight: isDark ? 'rgba(255, 255, 255, 0.20)' : 'rgba(255, 255, 255, 0.90)',
    pillSurface: isDark ? 'rgba(255, 255, 255, 0.08)' : '#FFFFFF',
    pillSurfaceMuted: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.58)',
    inputBackground: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(255, 255, 255, 0.92)',
    inputBorder: isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(0, 0, 0, 0.08)',
    glass: {
      highlight: isDark ? 'rgba(255, 255, 255, 0.20)' : 'rgba(255, 255, 255, 0.90)',
    },

    // ── Velvet Glass Directional Light Catch ──────────────────────────────────
    // Spread into styles for the 1px light-machined look.
    velvetBorder: {
      borderWidth: 1 as const,
      borderTopColor: isDark ? 'rgba(255, 255, 255, 0.20)' : 'rgba(255, 255, 255, 0.90)',
      borderLeftColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.75)',
      borderRightColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.04)',
      borderBottomColor: isDark ? 'rgba(0, 0, 0, 0.25)' : 'rgba(0, 0, 0, 0.05)',
    } as const,

    // Typography
    typography: {
      headerLarge: {
        fontSize: 34,
        fontWeight: '800' as const,
        letterSpacing: -0.5,
      },
      dataHero: {
        fontSize: 56,
        fontWeight: '700' as const,
        color: isDark ? '#FFFFFF' : '#1A1815',
      },
      caption: {
        fontSize: 10,
        fontWeight: '800' as const,
        textTransform: 'uppercase' as const,
        letterSpacing: 2,
        color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(26, 24, 21, 0.5)',
      },
    },

    // Shadows
    shadows: {
      soft: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: isDark ? 0.5 : 0.05,
        shadowRadius: isDark ? 12 : 24,
        elevation: 4,
      },
    },

    // Spacing & Radius
    spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 },
    borderRadius: { sm: 8, md: 12, lg: 16, xl: 24, full: 9999 },

    // Metallic system access
    goldGradient: METALLIC_GOLD.foilGradient,
  } as const;
}

export const darkTheme = createTheme(MYSTIC, 'dark');
export const lightTheme = createTheme(AURORA, 'light');

export type AppTheme = ReturnType<typeof createTheme>;
export const theme = darkTheme;
