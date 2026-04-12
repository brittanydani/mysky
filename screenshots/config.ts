/**
 * Screenshot Visual System Configuration
 *
 * Defines all screenshot data, colors, typography specs, and layout constants
 * for Apple App Store screenshots matching the "premium wellness app" aesthetic.
 *
 * Target: iPhone 6.7" — 1290 × 2796 px
 */

// ─── Base Gradient (Obsidian) ──────────────────────────────────────
export const OBSIDIAN_GRADIENT = ['#05060A', '#0B0F1A', '#131A2B'] as const;

// ─── Ambient Nebula Glow Colors ────────────────────────────────────
export const NEBULA_COLORS = {
  gold: '#D4AF37',
  indigo: '#243B6B',
  emerald: '#2E7A68',
  silverBlue: '#A2C2E1',
  copper: '#A46B4C',
  rose: '#D4A3B3',
} as const;

// ─── Screenshot Dimensions ─────────────────────────────────────────
export const SCREENSHOT = {
  width: 1290,
  height: 2796,
  phoneScale: 0.67, // 67% of screenshot height
  phoneShadowBlur: 40,
  phoneShadowOpacity: 0.3,
  phoneShadowOffsetY: 20,
} as const;

// ─── Typography Specs ──────────────────────────────────────────────
export const TYPOGRAPHY = {
  headline: {
    fontFamily: 'PlayfairDisplay-Bold',
    fallbackFamily: 'Georgia',
    fontSize: 120,
    letterSpacing: 4,
    color: '#F3F4F6',
    luxuryAccent: '#D6C39A',
  },
  subtext: {
    fontFamily: 'Inter-Medium',
    fallbackFamily: 'System',
    fontSize: 50,
    color: '#C9CDD6',
    maxWords: 12,
  },
} as const;

// ─── Starfield Settings ────────────────────────────────────────────
export const STARFIELD = {
  count: 40,
  sizeRange: [1, 2] as const,
  opacityRange: [0.1, 0.2] as const,
} as const;

// ─── Screenshot Data ───────────────────────────────────────────────
export interface ScreenshotConfig {
  id: number;
  slug: string;
  step: string;
  headline: string;
  subtext: string;
  purpose: string;
  accentColor: string;
  nebulaColors: string[];
  nebulaOpacity: number;
  nebulaBlur: number;
  highlightElement: string;
  appScreen: string;
}

export const SCREENSHOTS: ScreenshotConfig[] = [
  {
    id: 1,
    slug: 'dashboard',
    step: 'Start Your Day',
    headline: 'Understand Your\nDaily Balance',
    subtext: 'A calm space to track mood, sleep, and reflection.',
    purpose: 'Instantly show what the app does',
    accentColor: NEBULA_COLORS.gold,
    nebulaColors: [NEBULA_COLORS.gold, NEBULA_COLORS.indigo],
    nebulaOpacity: 0.12,
    nebulaBlur: 300,
    highlightElement: 'aura-orb',
    appScreen: 'home',
  },
  {
    id: 2,
    slug: 'mood',
    step: 'Check In With Yourself',
    headline: 'Log Your Mood\nin Seconds',
    subtext: 'A simple daily check-in helps build awareness.',
    purpose: 'Show ease of use',
    accentColor: NEBULA_COLORS.emerald,
    nebulaColors: [NEBULA_COLORS.emerald, NEBULA_COLORS.gold],
    nebulaOpacity: 0.10,
    nebulaBlur: 280,
    highlightElement: 'mood-sphere',
    appScreen: 'mood',
  },
  {
    id: 3,
    slug: 'journal',
    step: 'Reflect',
    headline: 'Pause · Breathe\nReflect',
    subtext: 'Capture thoughts in a quiet space designed for reflection.',
    purpose: 'Show emotional value',
    accentColor: NEBULA_COLORS.indigo,
    nebulaColors: [NEBULA_COLORS.indigo, NEBULA_COLORS.rose],
    nebulaOpacity: 0.12,
    nebulaBlur: 320,
    highlightElement: 'breathing-portal',
    appScreen: 'journal',
  },
  {
    id: 4,
    slug: 'sleep',
    step: 'Sleep & Recovery',
    headline: 'Rest & Recovery\nInsights',
    subtext: 'Explore the relationship between sleep and wellbeing.',
    purpose: 'Show real usefulness',
    accentColor: NEBULA_COLORS.silverBlue,
    nebulaColors: [NEBULA_COLORS.silverBlue, NEBULA_COLORS.indigo],
    nebulaOpacity: 0.10,
    nebulaBlur: 260,
    highlightElement: 'moon-dial',
    appScreen: 'sleep',
  },
  {
    id: 5,
    slug: 'patterns',
    step: 'Discover Patterns',
    headline: 'Discover\nPatterns',
    subtext: 'Beautiful charts reveal connections between habits and feelings.',
    purpose: 'Show intelligence / analytics',
    accentColor: NEBULA_COLORS.copper,
    nebulaColors: [NEBULA_COLORS.copper, NEBULA_COLORS.gold],
    nebulaOpacity: 0.11,
    nebulaBlur: 290,
    highlightElement: 'data-cluster',
    appScreen: 'insights',
  },
  {
    id: 6,
    slug: 'personalize',
    step: 'Make It Yours',
    headline: 'Make It\nYour Space',
    subtext: 'Customize the atmosphere for your personal reflection.',
    purpose: 'Show premium experience',
    accentColor: NEBULA_COLORS.rose,
    nebulaColors: [
      NEBULA_COLORS.gold,
      NEBULA_COLORS.emerald,
      NEBULA_COLORS.indigo,
      NEBULA_COLORS.rose,
    ],
    nebulaOpacity: 0.13,
    nebulaBlur: 340,
    highlightElement: 'color-spectrum',
    appScreen: 'settings',
  },
  {
    id: 7,
    slug: 'premium',
    step: 'Deeper Sky',
    headline: 'See What Your\nPatterns Teach You',
    subtext: 'Unlock weekly shifts, recurring themes, and more personal guidance.',
    purpose: 'Show premium/paywall value proposition',
    accentColor: NEBULA_COLORS.gold,
    nebulaColors: [NEBULA_COLORS.gold, NEBULA_COLORS.indigo],
    nebulaOpacity: 0.14,
    nebulaBlur: 320,
    highlightElement: 'diamond-eclipse',
    appScreen: 'premium',
  },
];

// ─── Tagline (optional first-screenshot bottom tagline) ────────────
export const TAGLINE = 'A beautiful space for reflection and emotional awareness.';

// ─── Color Theme Per Screenshot ────────────────────────────────────
export const SCREENSHOT_COLOR_FLOW = [
  'Gold',
  'Emerald',
  'Indigo',
  'Silver Blue',
  'Copper',
  'Multicolor Spectrum',
] as const;
