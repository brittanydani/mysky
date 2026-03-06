// Celestial Companion Theme
// Premium astrology app with luxurious celestial aesthetic
// "Velvet book feel" - soft, warm, intimate

import { Platform } from 'react-native';

export const theme = {
  // Primary Colors - Shiny premium gold
  primary: '#D8C39A', // Bright shiny gold
  primaryLight: '#E9D9B8',
  primaryDark: '#D8C39A',

  // Background Colors - Deep velvet night sky
  background: '#0D1421', // Deep midnight
  backgroundDeep: '#07090F', // True black — used as root container bg
  backgroundSecondary: '#141E2E',
  backgroundTertiary: '#1A2740',
  surface: '#1E2D47',
  surfaceLight: '#243651',

  // Accent Colors - Rich jewel tones for depth
  indigo: '#2D3A5C',
  plum: '#3D2952', // Adds warmth
  purple: '#4A3B6B',
  rose: '#3D2940', // Velvet rose undertone
  
  // Human-first mood colors
  love: '#E07A98', // Soft pink for love/heart sections
  energy: '#6EBF8B', // Gentle green for vitality
  growth: '#8BC4E8', // Soft blue for growth/expansion
  calm: '#6EBF8B',
  soft: '#8BC4E8',
  okay: '#D8C39A',
  heavy: '#D8C39A',
  stormy: '#E07A7A',

  // Text Colors
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.7)',
  textMuted: 'rgba(255, 255, 255, 0.5)',
  textGold: '#D8C39A',

  // Semantic Colors
  success: '#6EBF8B',
  error: '#E07A7A',
  warning: '#D8C39A',

  // Card Colors
  cardGradientStart: '#1A2740',
  cardGradientEnd: '#0D1421',
  cardBorder: 'rgba(216, 195, 154, 0.2)',

  // Locked/Premium
  lockedOverlay: 'rgba(13, 20, 33, 0.7)',
  premiumGlow: 'rgba(216, 195, 154, 0.3)',

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
    // “Serif-like” headers; avoids relying on a font that might not exist on Android
    headerLarge: {
      fontSize: 28,
      fontWeight: '700' as const,
      fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
      letterSpacing: 0.5,
    },
    headerMedium: {
      fontSize: 22,
      fontWeight: '600' as const,
      fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
      letterSpacing: 0.3,
    },
    headerSmall: {
      fontSize: 18,
      fontWeight: '600' as const,
      fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    },

    // Sans body
    bodyLarge: {
      fontSize: 16,
      fontWeight: '400' as const,
      lineHeight: 24,
    },
    bodyMedium: {
      fontSize: 14,
      fontWeight: '400' as const,
      lineHeight: 20,
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
  goldGradient: ['#FFF4D6', '#E9D9B8', '#C5B493', '#9A8661', '#6E5E40'] as const,
  ctaGradient: ['#FFF4D6', '#E9D9B8', '#C5B493', '#9A8661', '#6E5E40'] as const,
  ctaTextDark: '#1A1A1A', // Dark text on gold CTA buttons

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
      shadowColor: '#D8C39A',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 6,
    },
  },

  // High-end obsidian glass effects
  glass: {
    base: 'rgba(15, 18, 25, 0.85)',
    border: 'rgba(255, 255, 255, 0.06)',
    highlight: 'rgba(255, 255, 255, 0.12)',
  },
  
  // Archetypal mapping for dynamic card styling
  archetypes: {
    shadow: { main: '#9D76C1', glow: 'rgba(157, 118, 193, 0.2)' }, // Amethyst
    self: { main: '#D8C39A', glow: 'rgba(216, 195, 154, 0.2)' },   // gold
    threshold: { main: '#8BC4E8', glow: 'rgba(139, 196, 232, 0.2)' }, // SilverBlue
    transform: { main: '#CD7F5D', glow: 'rgba(205, 127, 93, 0.2)' }, // Copper
  },

  // Cinematic palette — shared accent colors used across screens
  cinematic: {
    gold: '#D8C39A',
    silverBlue: '#8BC4E8',
    copper: '#CD7F5D',
    emerald: '#6EBF8B',
    rose: '#D4A3B3',
    textMain: '#FDFBF7',
    glassBorder: 'rgba(255,255,255,0.06)',
    glassHighlight: 'rgba(255,255,255,0.12)',
  },

  // Enhanced Gradients
  obsidianGradient: ['rgba(35, 40, 55, 0.4)', 'rgba(20, 24, 34, 0.7)'] as const,
  amethystGradient: ['rgba(40, 30, 60, 0.4)', 'rgba(20, 24, 34, 0.7)'] as const,
} as const;
