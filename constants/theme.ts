// Celestial Companion Theme
// Premium astrology app with luxurious celestial aesthetic
// "Velvet book feel" - soft, warm, intimate

import { Platform } from 'react-native';

export const theme = {
  // Primary Colors - Warm gold with slight rose undertones
  primary: '#C9A962', // Soft gold
  primaryLight: '#E0C88A',
  primaryDark: '#A68B4B',

  // Background Colors - Deep velvet night sky
  background: '#0D1421', // Deep midnight
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
  okay: '#C9A962',
  heavy: '#E0B07A',
  stormy: '#E07A7A',

  // Text Colors
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.7)',
  textMuted: 'rgba(255, 255, 255, 0.5)',
  textGold: '#C9A962',

  // Semantic Colors
  success: '#6EBF8B',
  error: '#E07A7A',
  warning: '#E0B07A',

  // Card Colors
  cardGradientStart: '#1A2740',
  cardGradientEnd: '#0D1421',
  cardBorder: 'rgba(201, 169, 98, 0.2)',

  // Locked/Premium
  lockedOverlay: 'rgba(13, 20, 33, 0.7)',
  premiumGlow: 'rgba(201, 169, 98, 0.3)',

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
      shadowColor: '#C9A962',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 6,
    },
  },
} as const;
