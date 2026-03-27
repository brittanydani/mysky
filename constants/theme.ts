// MySky Unified Theme
// Premium celestial app — dark obsidian + champagne-gold visual system

import { Platform } from 'react-native';

// ── Metallic gold palette — matches MySky logo reflective look ──────
export const METALLIC_GOLD = {
  highlight1: '#FFF8E3',
  highlight2: '#F7E7C2',
  light: '#EED9A7',
  mid: '#CFAE73',
  shadow1: '#9B7A46',
  shadow2: '#6F552E',
  deepShadow: '#4E3A1F',
  rim: 'rgba(255,248,220,0.60)',
  glow: 'rgba(247,231,194,0.22)',
  gloss: 'rgba(255,255,255,0.18)',
  /** 6-stop pill gradient from bright highlight to deep shadow */
  pillGradient: [
    '#FFF8E3',
    '#F7E7C2',
    '#EED9A7',
    '#CFAE73',
    '#9B7A46',
    '#6F552E',
  ] as const,
} as const;

// ── Solid gold text colors for body / label text ────────────────────
// Use these for non-gradient gold text (RN <Text> components).
// For gradient metallic headlines, use LuxuryGoldTextSkia instead.
export const GOLD_TEXT = {
  primary: '#FFFFFF',
  secondary: '#FFFFFF',
  bright: '#FFFFFF',
} as const;

// ── Single source of truth for the MySky visual system ──────────────
export const MYSTIC = {
  // ─ Backgrounds ─
  bgTop: '#020817',
  bgBottom: '#030A18',
  bgDeep: '#020817',

  // ─ Text hierarchy ─
  heading: '#FFFFFF',
  body: 'rgba(226,232,240,0.78)',
  muted: 'rgba(226,232,240,0.45)',

  // ─ Champagne-gold accents ─
  subtitleGold: '#FFFFFF',
  restoreGold: '#FFFFFF',
  featureIconGold: '#E3CFA4',

  // ─ CTA / premium button surface ─
  ctaText: '#0B1220',
  ctaBorder: 'rgba(255,244,214,0.30)',
  ctaGloss: 'rgba(255,255,255,0.10)',

  // ─ Metallic gold gradients ─
  goldGradient: [
    '#FFF4D6',
    '#E9D9B8',
    '#C9AE78',
    '#9B7A46',
    '#6B532E',
  ] as const,

  goldGradientSoft: [
    '#FDF3D7',
    '#E8D7B0',
    '#CBB07A',
    '#9B7B47',
    '#6F562F',
  ] as const,

  // ─ Star colors ─
  star: 'rgba(255,255,255,0.95)',
  starDim: 'rgba(255,255,255,0.72)',

  // ─ Glass card system ─
  cardBg: 'transparent',
  cardBorder: 'rgba(232,214,174,0.18)',
  cardHighlight: 'rgba(255,255,255,0.06)',

  // ─ Semantic accents ─
  success: '#6EBF8B',
  error: '#E07A7A',
  love: '#E07A98',
  silverBlue: '#8BC4E8',
  copper: '#CD7F5D',
  amethyst: '#9D76C1',
  gold: '#D4AF37',
} as const;

export const theme = {
  // Primary Colors — champagne-gold
  primary: MYSTIC.restoreGold,
  primaryLight: MYSTIC.subtitleGold,
  primaryDark: MYSTIC.restoreGold,

  // Background Colors — dark navy-obsidian
  background: MYSTIC.bgTop,
  backgroundDeep: MYSTIC.bgDeep,
  backgroundSecondary: '#0A1224',
  backgroundTertiary: '#0E1830',
  surface: '#0E1830',
  surfaceLight: '#122040',

  // Accent Colors
  indigo: '#2D3A5C',
  plum: '#3D2952',
  purple: '#4A3B6B',
  rose: '#3D2940',

  // Human-first mood colors
  love: MYSTIC.love,
  energy: MYSTIC.success,
  growth: MYSTIC.silverBlue,
  calm: MYSTIC.success,
  soft: MYSTIC.silverBlue,
  okay: MYSTIC.restoreGold,
  heavy: MYSTIC.restoreGold,
  stormy: MYSTIC.error,

  // Text Colors
  textPrimary: MYSTIC.heading,
  textSecondary: MYSTIC.body,
  textMuted: MYSTIC.muted,
  textGold: MYSTIC.subtitleGold,

  // Semantic Colors
  success: MYSTIC.success,
  error: MYSTIC.error,
  warning: MYSTIC.restoreGold,

  // Card Colors — transparent glass
  cardGradientStart: 'transparent',
  cardGradientEnd: 'transparent',
  cardBorder: MYSTIC.cardBorder,

  // Locked/Premium
  lockedOverlay: 'rgba(2, 8, 23, 0.7)',
  premiumGlow: 'rgba(232, 214, 174, 0.25)',

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

  // Typography
  typography: {
    headerLarge: {
      fontSize: 28,
      fontWeight: '700' as const,
      fontFamily: Platform.select({ ios: 'SFProDisplay-Bold', android: 'sans-serif', default: 'System' }),
      letterSpacing: 0.5,
    },
    headerMedium: {
      fontSize: 22,
      fontWeight: '600' as const,
      fontFamily: Platform.select({ ios: 'SFProDisplay-Semibold', android: 'sans-serif-medium', default: 'System' }),
      letterSpacing: 0.3,
    },
    headerSmall: {
      fontSize: 18,
      fontWeight: '600' as const,
      fontFamily: Platform.select({ ios: 'SFProDisplay-Semibold', android: 'sans-serif-medium', default: 'System' }),
    },

    bodyLarge: {
      fontSize: 16,
      fontWeight: '400' as const,
      lineHeight: 26,
    },
    bodyMedium: {
      fontSize: 14,
      fontWeight: '400' as const,
      lineHeight: 22,
    },
    bodySmall: {
      fontSize: 12,
      fontWeight: '400' as const,
      lineHeight: 18,
    },
    caption: {
      fontSize: 11,
      fontWeight: '500' as const,
      textTransform: 'uppercase' as const,
      letterSpacing: 1,
    },
  },

  // Gold gradient (used for CTAs / premium buttons)
  goldGradient: MYSTIC.goldGradient,
  ctaGradient: MYSTIC.goldGradient,
  ctaTextDark: MYSTIC.ctaText,

  // Shadows
  shadows: {
    soft: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    glow: {
      shadowColor: MYSTIC.restoreGold,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 6,
    },
  },

  // High-end obsidian glass effects
  glass: {
    base: MYSTIC.cardBg,
    border: MYSTIC.cardHighlight,
    highlight: 'rgba(255, 255, 255, 0.08)',
  },

  // Archetypal mapping
  archetypes: {
    shadow: { main: MYSTIC.amethyst, glow: 'rgba(157, 118, 193, 0.15)' },
    self: { main: MYSTIC.subtitleGold, glow: 'rgba(232, 214, 174, 0.15)' },
    threshold: { main: MYSTIC.silverBlue, glow: 'rgba(139, 196, 232, 0.15)' },
    transform: { main: MYSTIC.copper, glow: 'rgba(205, 127, 93, 0.15)' },
  },

  // Cinematic palette
  cinematic: {
    gold: MYSTIC.subtitleGold,
    silverBlue: MYSTIC.silverBlue,
    copper: MYSTIC.copper,
    emerald: MYSTIC.success,
    rose: '#D4A3B3',
    textMain: MYSTIC.heading,
    glassBorder: MYSTIC.cardHighlight,
    glassHighlight: 'rgba(255,255,255,0.08)',
  },

  // Enhanced Gradients — transparent glass
  obsidianGradient: ['rgba(14,24,48,0.40)', 'rgba(2,8,23,0.60)'] as const,
  amethystGradient: ['rgba(40, 30, 60, 0.25)', 'rgba(2,8,23,0.50)'] as const,
} as const;
