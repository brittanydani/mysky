// MySky - Colors.ts
// Kept for compatibility with Expo template patterns.
// Prefer using `theme.ts` for the app’s design system.

export type AppColorScheme = 'light' | 'dark';

const gold = '#C9A962';
const midnight = '#0D1421';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#FFFFFF',
    tint: gold,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: gold,
  },
  dark: {
    text: '#ECEDEE',
    background: midnight,
    tint: '#FFFFFF',
    icon: 'rgba(255, 255, 255, 0.65)',
    tabIconDefault: 'rgba(255, 255, 255, 0.65)',
    tabIconSelected: '#FFFFFF',
  },
} as const;
