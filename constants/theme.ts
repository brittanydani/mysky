// File: constants/theme.ts
// MySky Unified Theme
// Premium Edge-Lit Velvet Glass — pure OLED black + Desert Titanium visual system

import { Platform } from 'react-native';

// ── Desert Titanium palette — replacing the dated yellow-gold ──────
export const METALLIC_GOLD = {
  highlight1: '#FFFFFF',
  highlight2: '#E8E3DD',
  light: '#D4C9BD',
  mid: '#C5B5A1', // Base Desert Titanium
  shadow1: '#A09383',
  shadow2: '#736A5E',
  deepShadow: '#403A34',
  rim: 'rgba(197, 181, 161, 0.60)',
  glow: 'rgba(197, 181, 161, 0.22)',
  gloss: 'rgba(255, 255, 255, 0.15)',
  /** 6-stop pill gradient from crisp highlight to matte shadow */
  pillGradient: [
    '#FFFFFF',
    '#E8E3DD',
    '#D4C9BD',
    '#C5B5A1',
    '#A09383',
    '#736A5E',
  ] as const,
} as const;

// ── Solid Titanium text colors for body / label text ────────────────
export const GOLD_TEXT = {
  primary: '#C5B5A1',
  secondary: '#A09383',
  bright: '#F5F5F7',
} as const;

// ── Single source of truth for the MySky visual system ──────────────
export const MYSTIC = {
  // ─ Backgrounds (Pure OLED) ─
  bgTop: '#000000',
  bgBottom: '#050505',
  bgDeep: '#000000',

  // ─ Text hierarchy (Apple Editorial) ─
  heading: '#F5F5F7',
  body: '#D1D1D6',
  muted: '#86868B',

  // ─ Titanium accents ─
  subtitleGold: '#C5B5A1',
  restoreGold: '#C5B5A1',
  featureIconGold: '#C5B5A1',

  // ─ CTA / premium button surface ─
  ctaText: '#000000',
  ctaBorder: 'rgba(197, 181, 161, 0.35)',
  ctaGloss: 'rgba(255, 255, 255, 0.12)',

  // ─ Metallic Titanium gradients ─
  goldGradient: [
    '#FFFFFF',
    '#E8E3DD',
    '#C5B5A1',
    '#A09383',
    '#736A5E',
  ] as const,

  goldGradientSoft: [
    '#F5F5F7',
    '#D4C9BD',
    '#C5B5A1',
    '#8C7D6B',
    '#594F43',
  ] as const,

  // ─ Star colors ─
  star: 'rgba(255, 255, 255, 0.95)',
  starDim: 'rgba(255, 255, 255, 0.50)',

  // ─ Velvet Glass card system ─
  cardBg: 'rgba(15, 15, 15, 0.4)',
  cardBorder: 'rgba(197, 181, 161, 0.25)',
  cardHighlight: 'rgba(255, 255, 255, 0.08)',

  // ─ Semantic accents (Sophisticated & Desaturated) ─
  success: '#30D158', // iOS Dark Mode Green
  error: '#FF453A',   // iOS Dark Mode Red
  love: '#FF375F',    // iOS Dark Mode Pink
  silverBlue: '#64D2FF', // iOS Dark Mode Light Blue
  copper: '#FF9F0A',  // iOS Dark Mode Orange
  amethyst: '#BF5AF2', // iOS Dark Mode Purple
  gold: '#C5B5A1',    // Desert Titanium
} as const;

export const theme = {
  // Primary Colors
  primary: MYSTIC.restoreGold,
  primaryLight: '#E8E3DD',
  primaryDark: '#A09383',

  // Background Colors — OLED Black
  background: MYSTIC.bgTop,
  backgroundDeep: MYSTIC.bgDeep,
  backgroundSecondary: '#0A0A0A',
  backgroundTertiary: '#121212',
  surface: '#0A0A0A',
  surfaceLight: '#1A1A1A',

  // Accent Colors (Deep Space)
  indigo: '#1C1C1E',
  plum: '#2C1C2E',
  purple: '#281A3A',
  rose: '#331C24',

  // Human-first mood colors (Refined iOS Palette)
  love: MYSTIC.love,
  energy: MYSTIC.success,
  growth: MYSTIC.silverBlue,
  calm: '#32ADE6', // Deep cyan
  soft: '#E5E5EA',
  okay: MYSTIC.restoreGold,
  heavy: '#48484A',
  stormy: MYSTIC.error,

  // Text Colors
  textPrimary: MYSTIC.heading,
  textSecondary: MYSTIC.body,
  textMuted: MYSTIC.muted,
  textGold: MYSTIC.subtitleGold,

  // Semantic Colors
  success: MYSTIC.success,
  error: MYSTIC.error,
  warning: MYSTIC.copper,

  // Card Colors — Velvet Glass
  cardGradientStart: 'rgba(25, 25, 25, 0.6)',
  cardGradientEnd: 'rgba(15, 15, 15, 0.6)',
  cardBorder: MYSTIC.cardBorder,

  // Locked/Premium
  lockedOverlay: 'rgba(0, 0, 0, 0.75)',
  premiumGlow: 'rgba(197, 181, 161, 0.25)',

  // Spacing
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
  },

  // Border Radius
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    full: 9999,
  },

  // Typography (Strict Apple Editorial Hierarchy)
  typography: {
    headerLarge: {
      fontSize: 34,
      fontWeight: '800' as const,
      fontFamily: Platform.select({ ios: 'SFProDisplay-Bold', android: 'sans-serif-bold', default: 'System' }),
      letterSpacing: -0.5,
    },
    headerMedium: {
      fontSize: 24,
      fontWeight: '700' as const,
      fontFamily: Platform.select({ ios: 'SFProDisplay-Bold', android: 'sans-serif-bold', default: 'System' }),
      letterSpacing: -0.3,
    },
    headerSmall: {
      fontSize: 18,
      fontWeight: '600' as const,
      fontFamily: Platform.select({ ios: 'SFProDisplay-Semibold', android: 'sans-serif-medium', default: 'System' }),
      letterSpacing: 0,
    },

    bodyLarge: {
      fontSize: 17,
      fontWeight: '400' as const,
      lineHeight: 24,
      letterSpacing: -0.1,
    },
    bodyMedium: {
      fontSize: 15,
      fontWeight: '400' as const,
      lineHeight: 22,
    },
    bodySmall: {
      fontSize: 13,
      fontWeight: '400' as const,
      lineHeight: 18,
    },
    caption: {
      fontSize: 11,
      fontWeight: '600' as const,
      textTransform: 'uppercase' as const,
      letterSpacing: 1.2,
    },
  },

  // Titanium gradient (used for CTAs / premium buttons)
  goldGradient: MYSTIC.goldGradient,
  ctaGradient: MYSTIC.goldGradient,
  ctaTextDark: MYSTIC.ctaText,

  // Shadows
  shadows: {
    soft: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
      elevation: 4,
    },
    glow: {
      shadowColor: MYSTIC.restoreGold,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.35,
      shadowRadius: 16,
      elevation: 6,
    },
  },

  // High-end OLED Velvet Glass effects
  glass: {
    base: MYSTIC.cardBg,
    border: MYSTIC.cardBorder,
    highlight: 'rgba(255, 255, 255, 0.1)',
  },

  // Archetypal mapping
  archetypes: {
    shadow: { main: MYSTIC.amethyst, glow: 'rgba(191, 90, 242, 0.15)' },
    self: { main: MYSTIC.subtitleGold, glow: 'rgba(197, 181, 161, 0.15)' },
    threshold: { main: MYSTIC.silverBlue, glow: 'rgba(100, 210, 255, 0.15)' },
    transform: { main: MYSTIC.copper, glow: 'rgba(255, 159, 10, 0.15)' },
  },

  // Cinematic palette
  cinematic: {
    gold: MYSTIC.subtitleGold,
    silverBlue: MYSTIC.silverBlue,
    copper: MYSTIC.copper,
    emerald: MYSTIC.success,
    rose: MYSTIC.love,
    textMain: MYSTIC.heading,
    glassBorder: MYSTIC.cardBorder,
    glassHighlight: 'rgba(255, 255, 255, 0.1)',
  },

  // Enhanced Gradients — Deep Space
  obsidianGradient: ['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.8)'] as const,
  amethystGradient: ['rgba(28, 20, 38, 0.4)', 'rgba(0,0,0,0.8)'] as const,
} as const;
