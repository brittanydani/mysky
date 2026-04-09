// MySky App Configuration

import Constants from 'expo-constants';

// Single hosted page covering both Privacy Policy and Terms of Use (EULA)
export const LEGAL_URL = 'https://amber-divan-e75.notion.site/Privacy-Policy-for-MySky-30d62720fdb580e2aa3adb38632be487';

// Support contact — single source of truth for all in-app references
export const SUPPORT_EMAIL = 'brittanyapps@outlook.com';

const DREAM_REINTERPRET_DEFAULT_DAILY_LIMIT = 1;
const DREAM_REINTERPRET_EMAIL_LIMIT_OVERRIDES: Record<string, number> = {
  'brithornick92@gmail.com': 5,
};

export function getDreamReinterpretDailyLimit(email?: string | null): number {
  if (!email) {
    return DREAM_REINTERPRET_DEFAULT_DAILY_LIMIT;
  }

  return DREAM_REINTERPRET_EMAIL_LIMIT_OVERRIDES[email.trim().toLowerCase()]
    ?? DREAM_REINTERPRET_DEFAULT_DAILY_LIMIT;
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
      {
        id: 'lifetime',
        name: 'Lifetime',
        price: '$129.99',
        priceValue: 129.99,
        period: 'one time',
        description: 'One-time unlock for long-term archives',
        popular: false,
      },
    ],
  },
};
