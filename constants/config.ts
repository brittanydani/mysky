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
      'Daily mood, energy & stress check-ins',
      'Sleep logging — quality & duration',
      'Journal with guided daily prompts',
      'Basic weekly averages (avg mood & sleep)',
      'Natal chart & Big Three',
      'Basic daily guidance',
      'One relationship chart',
      'Private & encrypted — always on-device',
    ],
    premium: [
      'Dream journal with sleep entries (encrypted)',
      'Symbolic dream reflections',
      'Sleep & mood trend analysis over time',
      'Behavioral insights & trend charts',
      'Healing & inner work (attachment, shadow work)',
      'Unlimited relationship charts',
      'Mood & journal pattern analysis',
      'Deep insights & tag intelligence',
      'Full natal story (10 chapters)',
      'Personalized guidance with action steps',
      'Chiron & Node depth mapping',
      'PDF chart export',
      'Encrypted backup & restore',
    ],
  },
};
