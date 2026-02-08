// MySky App Configuration

export const config = {
  appName: 'MySky',
  tagline: 'Your story in the stars',
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
      'Shortened natal story (3 chapters)',
      'Basic daily guidance',
      'Full natal chart with major aspects',
      'One relationship chart',
      'Basic journal with mood tracking',
      'Local device storage',
    ],
    premium: [
      'Full natal story (10 chapters)',
      'Personalized daily guidance with action steps',
      'Healing & trauma insights',
      'Unlimited relationship charts',
      'Advanced journaling & pattern analysis',
      'Chiron & Node depth insights',
      'Energy chakra mapping',
      'Encrypted backup & restore',
    ],
  },
};
