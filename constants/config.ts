// MySky App Configuration

import Constants from 'expo-constants';

// Single hosted page covering both Privacy Policy and Terms of Use (EULA)
export const LEGAL_URL = 'https://amber-divan-e75.notion.site/Privacy-Policy-for-MySky-30d62720fdb580e2aa3adb38632be487';

// Support contact — single source of truth for all in-app references
export const SUPPORT_EMAIL = 'brittanyapps@outlook.com';

// App Store product page — update with the live ID once submitted
export const APP_STORE_URL = 'https://apps.apple.com/app/mysky/id6758646585';

// Reviewer/demo content should only be seeded when explicitly enabled.
// Defaulting this off keeps normal app startup deterministic and avoids
// mutating local encrypted state during auth restoration.
export function isAutoDemoSeedEnabled(): boolean {
  return process.env.EXPO_PUBLIC_ENABLE_AUTO_DEMO_SEED === 'true';
}

const DREAM_REINTERPRET_DEFAULT_PER_DREAM_LIMIT = 1;
const DREAM_REINTERPRET_ALLOWLIST_PER_DREAM_LIMIT = 5;

function getDreamReinterpretAllowlist(): Set<string> {
  const raw = process.env.EXPO_PUBLIC_DREAM_REINTERPRET_ALLOWLIST ?? '';
  return new Set(
    raw
      .split(',')
      .map((value: string) => value.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function getDreamReinterpretPerDreamLimit(email?: string | null): number {
  const normalizedEmail = email?.trim().toLowerCase();
  if (normalizedEmail && getDreamReinterpretAllowlist().has(normalizedEmail)) {
    return DREAM_REINTERPRET_ALLOWLIST_PER_DREAM_LIMIT;
  }
  return DREAM_REINTERPRET_DEFAULT_PER_DREAM_LIMIT;
}

export const config = {
  appName: 'MySky',
  tagline: 'Track sleep, mood, dreams, and relationships to understand yourself over time.',
  // Reads the live version from app.json via expo-constants so this never drifts.
  version: Constants.expoConfig?.version ?? '1.0.0',
  
  // Premium pricing tiers (for display only - live prices from RevenueCat override these)
  premium: {
    tiers: [
      {
        id: 'monthly',
        name: 'Monthly',
        price: '$4.99',
        priceValue: 4.99,
        period: 'per month',
        description: 'Billed monthly',
        popular: false,
      },
      {
        id: 'yearly',
        name: 'Yearly',
        price: '$29.99',
        priceValue: 29.99,
        period: 'per year',
        description: 'Best plan for building patterns over time',
        popular: true,
      },
    ],
  },
};
