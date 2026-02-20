// MySky App Configuration

export const config = {
  appName: 'MySky',
  tagline: 'Personal Growth, Mapped to You',
  version: '1.0.0',
  
  // Premium pricing tiers (for display only)
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
        description: 'Save 50%',
        popular: true,
      },
      {
        id: 'lifetime',
        name: 'Lifetime',
        price: '$49.99',
        priceValue: 49.99,
        period: 'one time',
        description: 'Best value',
        popular: false,
      },
    ],
  },
  
  // Premium features list
  premiumFeatures: {
    free: [
      'Natal chart with all major aspects',
      'Natal story (3 chapters)',
      'Basic daily guidance',
      'One relationship chart',
      'Journal with mood tracking',
      'Insights overview & weekly mood',
      'Energy snapshot',
      'Privacy controls & local storage',
    ],
    premium: [
      'Full natal story (10 chapters)',
      'Personalized guidance with action steps',
      'Healing & inner work insights',
      'Unlimited relationship charts',
      'Journal pattern analysis',
      'Deep insights & tag intelligence',
      'Chiron & Node depth mapping',
      'Full chakra mapping with check-ins',
      'PDF chart export',
      'Encrypted backup & restore',
      'Extended pattern analysis',
    ],
  },
};
