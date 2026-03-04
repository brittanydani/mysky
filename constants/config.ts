// MySky App Configuration

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
  
  // Premium features list — Evocative language for Deeper Sky
  premiumFeatures: {
    free: [
      'Daily mood, energy & stress check-ins',
      'Sleep logging — quality & duration',
      'Journaling with basic guided prompts',
      'Basic weekly averages & summaries',
      'Natal chart & Big Three framework',
      'Essential daily guidance',
      'One personal relationship profile',
      'Private & encrypted — on-device only',
    ],
    premium: [
      'Dream journal with encrypted sleep entries',
      'Symbolic & archetypal dream reflections',
      'Deep mood & behavioral trend mapping',
      'Advanced behavioral pattern analysis',
      'Healing framework (Attachment & Shadow)',
      'Unlimited relationship depth mapping',
      'Correlation mapping (Mood & Journaling)',
      'Insight tagging & behavioral intelligence',
      'Full Natal Story (All 10 Chapters)',
      'Personalized daily action steps',
      'Chiron & Lunar Node depth mapping',
      'High-resolution PDF chart exports',
      'Encrypted cloud-agnostic backup & restore',
    ],
  },
};
