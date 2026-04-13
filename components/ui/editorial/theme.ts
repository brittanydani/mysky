import { Platform } from 'react-native';

// 1. THE SUBSTRATE & VELVET GLASS PALETTE
export const Colors = {
  // The absolute background of the app (Deepest Navy/Black)
  substrate: '#030712', 
  
  // Velvet Glass Base Tints
  glassNavy: '#071439',
  glassSage: '#7E8C54',  // Harmonious / Ease
  glassCoral: '#FB5E63', // Challenging / Tension
  
  // Typography & Accents
  textPrimary: '#FFFFFF',
  textSecondary: '#D6C7B4', // The refined Taupe
  divider: 'rgba(214, 199, 180, 0.15)', // Taupe at 15% opacity for 1px lines
  
  // Gold Shaders (For React Native Skia Gradients)
  goldGradient: ['#F9F0D4', '#D4AF37', '#9A7B2C'], // Champagne -> Pure Gold -> Antique Brass
};

// 2. THE STRICT 8PT SPACING GRID
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,       // Standard internal card padding
  xl: 32,
  xxl: 48,      // Standard separation between related groups
  section: 64,  // Massive breaks between distinct architectural concepts
};

// 3. APPLE EDITORIAL TYPOGRAPHY SCALE
// Using the system font ensures we get SF Pro on iOS natively.
const systemFont = Platform.OS === 'ios' ? 'System' : 'sans-serif';

export const Typography = {
  // Hero Titles (e.g., "Your Chart Story")
  hero: {
    fontFamily: systemFont,
    fontSize: 34,
    fontWeight: '800' as const,
    letterSpacing: -1, // Severe negative tracking for bespoke feel
    lineHeight: 41,
    color: Colors.textPrimary,
  },
  
  // Section Headers (e.g., "Core Self")
  h1: {
    fontFamily: systemFont,
    fontSize: 24,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
    lineHeight: 30,
    color: Colors.textPrimary,
  },
  
  // Deep-Dive Titles
  h2: {
    fontFamily: systemFont,
    fontSize: 18,
    fontWeight: '600' as const,
    letterSpacing: -0.3,
    lineHeight: 24,
    color: Colors.textPrimary,
  },

  // Editorial Body Text (High Line Height for breathing room)
  body: {
    fontFamily: systemFont,
    fontSize: 16,
    fontWeight: '400' as const,
    letterSpacing: 0,
    lineHeight: 24, // 150% leading
    color: Colors.textSecondary,
  },

  // Micro-Data & Bullet points
  bodyDetail: {
    fontFamily: systemFont,
    fontSize: 14,
    fontWeight: '400' as const,
    letterSpacing: 0,
    lineHeight: 20,
    color: Colors.textSecondary,
  },

  // Pill Badges (The ONLY place we use all-caps)
  pillLabel: {
    fontFamily: systemFont,
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 0.8, // Positive tracking for legibility at small sizes
    textTransform: 'uppercase' as const,
    color: Colors.textPrimary,
  },
};

// 4. ARCHITECTURAL BORDERS
export const Layout = {
  cardRadius: 24,
  pillRadius: 12,
};
