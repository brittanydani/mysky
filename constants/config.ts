// MySky App Configuration

export const config = {
  appName: 'MySky',
  tagline: 'Your story in the stars',
  version: '1.0.0',
  
  // User's chart data (mocked for display)
  userChart: {
    sunSign: 'Cancer',
    moonSign: 'Pisces',
    risingSign: 'Scorpio',
    birthDate: 'July 5, 1992',
    birthTime: '3:42 AM',
    birthPlace: 'Portland, Oregon',
  },
  
  // Moon phase data
  currentMoonPhase: {
    name: 'Waning Crescent',
    illumination: 23,
    message: 'A time for release and reflection',
  },
  
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
      'Shortened natal story',
      'Basic daily guidance',
      'One saved chart',
      'Limited relationship summary',
      'Basic journal',
      'Local device storage',
    ],
    premium: [
      'Full natal story (10+ chapters)',
      'Personalized daily guidance',
      'Healing & trauma insights',
      'Unlimited relationship charts',
      'Advanced journaling & patterns',
      'Encrypted backup & restore across devices',
      'Secure backup',
      'Exclusive visual themes',
    ],
  },
};
