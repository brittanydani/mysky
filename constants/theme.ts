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
  bgTop: '#0A0A0F',
  bgMid: '#0A0A0F',
  bgBottom: '#0A0A0F',
  bgDeep: '#0A0A0F',

  // ─ Text hierarchy ─
  heading: '#FFFFFF',
  body: 'rgba(255,255,255,0.72)',
  muted: 'rgba(255,255,255,0.50)',

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
  cardBg: 'rgba(255, 255, 255, 0.04)',
  cardBorder: 'rgba(255, 255, 255, 0.10)',
  cardHighlight: 'rgba(255, 255, 255, 0.12)',

  // ─ Semantic accents ─
  success: '#6EBF8B',
  error: '#E07A7A',
  love: '#E07A98',
  silverBlue: '#C9AE78',
  copper: '#CD7F5D',
  amethyst: '#9D76C1',
  gold: '#D4AF37',
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

  // Burnished bronze accents
  subtitleGold: '#B8935A',
  restoreGold: '#A68042',
  featureIconGold: '#B8935A',

  // CTA / premium button surface
  ctaText: '#FFFFFF',
  ctaBorder: 'rgba(184,147,90,0.16)',
  ctaGloss: 'rgba(255,255,255,0.35)',

  // Metallic gold gradients
  goldGradient: [
    '#FFF5DE',
    '#E9D4A6',
    '#C89D5B',
    '#9B7A46',
    '#6F552E',
  ] as const,

  goldGradientSoft: [
    '#FFF8E7',
    '#EEDCB4',
    '#D1B27B',
    '#A8834F',
    '#775C33',
  ] as const,

  // Star colors
  star: 'rgba(255,255,255,0.98)',
  starDim: 'rgba(166,128,66,0.52)',

  // Glass card system — frosted sheet on warm canvas
  cardBg: 'rgba(255, 255, 255, 0.5)',
  cardBorder: 'rgba(0, 0, 0, 0.04)',
  cardHighlight: 'rgba(255, 255, 255, 0.9)',

  // Semantic accents — deeply saturated & burnished
  success: '#4A5D4E',
  error: '#8C4A42',
  love: '#9A6B75',
  silverBlue: '#7A90A8',
  copper: '#B4765B',
  amethyst: '#8B77AA',
  gold: '#B8935A',
} as const;

type ThemePalette = typeof MYSTIC | typeof AURORA;

function createTheme(palette: ThemePalette, mode: 'light' | 'dark') {
  const isDark = mode === 'dark';

  return {
    mode,
    isDark,
    blurTint: isDark ? 'dark' : 'light',
    statusBarStyle: isDark ? 'light' : 'dark',

    // Primary Colors — champagne-gold
    primary: palette.restoreGold,
    primaryLight: palette.subtitleGold,
    primaryDark: mode === 'dark' ? palette.restoreGold : '#6F552E',

    // Background Colors
    background: palette.bgTop,
    backgroundDeep: palette.bgDeep,
    backgroundSecondary: isDark ? '#101119' : '#F4F1EB',
    backgroundTertiary: isDark ? '#151724' : '#F2EFE9',
    surface: isDark ? '#12141D' : '#F7F5F0',
    surfaceLight: isDark ? '#181B27' : '#FAF8F4',

    // Accent Colors
    indigo: isDark ? '#2D3A5C' : '#6A7B96',
    plum: isDark ? '#3D2952' : '#8A6E96',
    purple: isDark ? '#4A3B6B' : '#9D8BB4',
    rose: isDark ? '#3D2940' : '#D8B7C1',

    // Human-first mood colors
    love: palette.love,
    energy: palette.success,
    growth: palette.silverBlue,
    calm: palette.success,
    soft: palette.silverBlue,
    okay: palette.restoreGold,
    heavy: palette.restoreGold,
    stormy: palette.error,

    // Text Colors
    textPrimary: palette.heading,
    textSecondary: palette.body,
    textMuted: palette.muted,
    textGold: palette.subtitleGold,

    // Semantic Colors
    success: palette.success,
    error: palette.error,
    warning: palette.restoreGold,

    // Card Colors
    cardGradientStart: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.5)',
    cardGradientEnd: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.4)',
    cardBorder: palette.cardBorder,
    cardSurface: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
    cardSurfaceStrong: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)',
    pillSurface: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
    pillSurfaceMuted: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)',

    // Locked/Premium
    lockedOverlay: isDark ? 'rgba(2, 8, 23, 0.7)' : 'rgba(247, 245, 240, 0.92)',
    premiumGlow: isDark ? 'rgba(232, 214, 174, 0.25)' : 'rgba(184, 147, 90, 0.18)',

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
        fontSize: 34,
        fontWeight: '300' as const,
        fontFamily: Platform.select({ ios: 'SFProDisplay-Thin', default: 'System' }),
        letterSpacing: 2.5,
        textTransform: 'uppercase' as const,
      },
      headerMedium: {
        fontSize: 24,
        fontWeight: '300' as const,
        fontFamily: Platform.select({ ios: 'SFProDisplay-Light', default: 'System' }),
        letterSpacing: 2.0,
        textTransform: 'uppercase' as const,
      },
      headerSmall: {
        fontSize: 18,
        fontWeight: '400' as const,
        fontFamily: Platform.select({ ios: 'SFProDisplay-Regular', default: 'System' }),
        letterSpacing: 1.5,
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
    goldGradient: palette.goldGradient,
    ctaGradient: palette.goldGradient,
    ctaTextDark: palette.ctaText,

    // Shadows
    shadows: {
      soft: {
        shadowColor: isDark ? '#000' : '#4A3F35',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: isDark ? 0.3 : 0.05,
        shadowRadius: isDark ? 8 : 24,
        elevation: 4,
      },
      glow: {
        shadowColor: isDark ? palette.restoreGold : '#4A3F35',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: isDark ? 0.3 : 0.08,
        shadowRadius: isDark ? 12 : 20,
        elevation: 6,
      },
    },

    // Glass effects
    glass: {
      base: palette.cardBg,
      border: isDark ? palette.cardHighlight : 'rgba(255, 255, 255, 0.9)',
      highlight: isDark ? 'rgba(255, 255, 255, 0.18)' : 'rgba(255, 255, 255, 0.6)',
    },

    // Light mode nested glass (callouts inside cards)
    nestedGlass: {
      base: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(255, 255, 255, 0.6)',
      border: isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(255, 255, 255, 1)',
    },

    // Input field colors
    inputBackground: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)',
    inputBorder: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',

    // Archetypal mapping
    archetypes: {
      shadow: { main: palette.amethyst, glow: isDark ? 'rgba(157, 118, 193, 0.15)' : 'rgba(139, 119, 170, 0.18)' },
      self: { main: palette.subtitleGold, glow: isDark ? 'rgba(232, 214, 174, 0.15)' : 'rgba(201, 174, 120, 0.16)' },
      threshold: { main: palette.silverBlue, glow: isDark ? 'rgba(201, 174, 120, 0.15)' : 'rgba(122, 144, 168, 0.18)' },
      transform: { main: palette.copper, glow: isDark ? 'rgba(205, 127, 93, 0.15)' : 'rgba(180, 118, 91, 0.18)' },
    },

    // Cinematic palette
    cinematic: {
      gold: palette.subtitleGold,
      silverBlue: palette.silverBlue,
      copper: palette.copper,
      emerald: palette.success,
      rose: isDark ? '#D4A3B3' : '#9A6B75',
      textMain: palette.heading,
      glassBorder: isDark ? palette.cardHighlight : 'rgba(255, 255, 255, 0.9)',
      glassHighlight: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.6)',
    },

    // Enhanced Gradients
    obsidianGradient: isDark
      ? (['rgba(14,24,48,0.40)', 'rgba(2,8,23,0.60)'] as const)
      : (['rgba(255,255,255,0.5)', 'rgba(247,245,240,0.7)'] as const),
    amethystGradient: isDark
      ? (['rgba(40, 30, 60, 0.25)', 'rgba(2,8,23,0.50)'] as const)
      : (['rgba(139,119,170,0.12)', 'rgba(247,245,240,0.5)'] as const),
  } as const;
}

export const darkTheme = createTheme(MYSTIC, 'dark');
export const lightTheme = createTheme(AURORA, 'light');

export type AppTheme = ReturnType<typeof createTheme>;

export const theme = darkTheme;
