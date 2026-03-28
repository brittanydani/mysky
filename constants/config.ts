// MySky App Configuration

// Single hosted page covering both Privacy Policy and Terms of Use (EULA)
export const LEGAL_URL = 'https://amber-divan-e75.notion.site/Privacy-Policy-for-MySky-30d62720fdb580e2aa3adb38632be487';

export const config = {
  appName: 'MySky',
  tagline: 'Personal Growth, Mapped to You',
  version: '1.0.0',
  
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
        description: 'Save 50% vs monthly',
        popular: true,
      },
      {
        id: 'lifetime',
        name: 'Lifetime',
        price: '$49.99',
        priceValue: 49.99,
        period: 'one time',
        description: 'The complete journey',
        popular: false,
      },
    ],
  },
};
