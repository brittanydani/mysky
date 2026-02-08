/**
 * Deeper Sky Premium Features
 * 
 * "Deeper Sky" is MySky's premium tier - designed to feel like
 * a gift of self-understanding, not a paywall.
 * 
 * Philosophy: Premium users get DEPTH, not just MORE.
 * - Longer, more nuanced interpretations
 * - Trauma-informed healing insights
 * - Unlimited connections with people they care about
 * - Daily guidance that feels personal
 * - Journal patterns that reveal their story over time
 */

export interface DeeperSkyFeature {
  id: string;
  name: string;
  icon: string; // Ionicons name
  description: string;
  freeVersion: string;
  premiumVersion: string;
  isPremium: boolean;
  bullets: string[]; // Key selling points
}

export const DEEPER_SKY_FEATURES: DeeperSkyFeature[] = [
  {
    id: 'healing',
    name: 'Healing & Inner Work',
    icon: 'heart-half',
    description: 'Attachment styles, fear patterns, and shadow work',
    freeVersion: 'One inner child insight and a daily shadow quote',
    premiumVersion: 'Attachment style themes, fear patterns, safety patterns, shadow work, and journaling prompts tied to your chart',
    isPremium: true,
    bullets: [
      'Attachment style insights from your Moon',
      'Fear patterns and protective mechanisms',
      'Healing journal prompts for your chart',
    ],
  },
  {
    id: 'relationships',
    name: 'Unlimited Relationships',
    icon: 'people',
    description: 'Partner, ex, child, friend — full emotional breakdowns',
    freeVersion: '1 relationship with limited insight',
    premiumVersion: 'Unlimited charts: partner, ex, child, friend — each with full emotional breakdown of how you connect',
    isPremium: true,
    bullets: [
      'Unlimited relationship comparisons',
      'Partner, ex, child, friend, parent charts',
      'Understand how you truly connect',
    ],
  },
  {
    id: 'journal',
    name: 'Journal Patterns',
    icon: 'journal',
    description: 'Mood trends, transit correlations, and writing insights',
    freeVersion: 'One daily prompt, weekly mood pattern, and a shadow quote at the top of each entry',
    premiumVersion: 'Mood trends, transit-mood correlations, and writing pattern analysis',
    isPremium: true,
    bullets: [
      'Mood trends over time',
      'Transit-mood correlations',
      'Writing pattern insights',
    ],
  },
  {
    id: 'chiron-nodes',
    name: 'Chiron & Node Depth',
    icon: 'compass',
    description: 'Sensitivity mapping with body awareness cues',
    freeVersion: 'Awareness cards showing your Node axis and Chiron sensitivity theme',
    premiumVersion: 'Chiron sensitivity mapping with body awareness, integration themes, and Node axis depth',
    isPremium: true,
    bullets: [
      'Chiron sensitivity: your tender spots',
      'Body awareness cues',
      'Integration themes for growth',
    ],
  },
  {
    id: 'natal-story',
    name: 'Full Natal Story',
    icon: 'book',
    description: '10 emotional chapters — how you love, protect, and grow',
    freeVersion: '3 chapters: Core Self, Emotional World, First Impression',
    premiumVersion: '10 deep chapters including How You Love, How You Fight, Your Inner Child, Shadow Work, and more',
    isPremium: true,
    bullets: [
      '10 emotional chapters of your story',
      'How You Love, How You Fight, Your Shadow',
      'Reflection questions and affirmations',
    ],
  },
  {
    id: 'daily-guidance',
    name: 'Personalized Guidance',
    icon: 'sunny',
    description: 'Key insights, action steps, and evening reflections',
    freeVersion: 'Daily guidance with love, energy, and growth themes',
    premiumVersion: 'Enhanced guidance with key insights, action suggestions, emotional weather, and personalized affirmations',
    isPremium: true,
    bullets: [
      'Key insights and action suggestions per category',
      'Emotional Weather card',
      'Personalized affirmation and evening reflection',
    ],
  },
  {
    id: 'pattern-depth',
    name: 'Pattern Depth',
    icon: 'analytics',
    description: 'Extended stellium narratives and chart pattern details',
    freeVersion: 'Stellium detection and basic pattern overview in your chart',
    premiumVersion: 'Extended narratives with element analysis, retrograde annotations, and conjunction cluster breakdowns',
    isPremium: true,
    bullets: [
      'Extended stellium narratives',
      'Element and modality analysis',
      'Conjunction cluster details',
    ],
  },
];

// Premium theme options
export interface PremiumTheme {
  id: string;
  name: string;
  description: string;
  colors: {
    background: string;
    backgroundSecondary: string;
    primary: string;
    accent: string;
  };
  isPremium: boolean;
}

export const PREMIUM_THEMES: PremiumTheme[] = [
  {
    id: 'midnight',
    name: 'Midnight Sky',
    description: 'The classic MySky experience',
    colors: {
      background: '#0D1421',
      backgroundSecondary: '#141E2E',
      primary: '#C9A962',
      accent: '#1A2740',
    },
    isPremium: false,
  },
  {
    id: 'dark-plum',
    name: 'Dark Plum',
    description: 'Deep, velvety purple tones',
    colors: {
      background: '#1A0F1E',
      backgroundSecondary: '#2A1A30',
      primary: '#D4A5D9',
      accent: '#3D2952',
    },
    isPremium: true,
  },
  {
    id: 'starlight',
    name: 'Starlight',
    description: 'Soft silver and deep navy',
    colors: {
      background: '#0A0E14',
      backgroundSecondary: '#121820',
      primary: '#E8E8F0',
      accent: '#2D3A5C',
    },
    isPremium: true,
  },
  {
    id: 'rose-gold',
    name: 'Rose Gold',
    description: 'Warm, romantic elegance',
    colors: {
      background: '#1A1215',
      backgroundSecondary: '#251A1D',
      primary: '#E8B4B8',
      accent: '#3D2940',
    },
    isPremium: true,
  },
];

// Feature gating helper
export class DeeperSkyGate {
  /**
   * Check if a specific feature is available for the user
   */
  static hasFeature(featureId: string, isPremium: boolean): boolean {
    if (isPremium) return true;
    
    const feature = DEEPER_SKY_FEATURES.find(f => f.id === featureId);
    return feature ? !feature.isPremium : true;
  }
  
  /**
   * Get the appropriate content based on premium status
   */
  static getFeatureContent(featureId: string, isPremium: boolean): string {
    const feature = DEEPER_SKY_FEATURES.find(f => f.id === featureId);
    if (!feature) return '';
    
    return isPremium ? feature.premiumVersion : feature.freeVersion;
  }
  
  /**
   * Get max relationship charts allowed
   */
  static getMaxRelationshipCharts(isPremium: boolean): number {
    return isPremium ? Infinity : 1;
  }

  /**
   * Check if journal patterns are available
   */
  static hasJournalPatterns(isPremium: boolean): boolean {
    return isPremium;
  }
  
  /**
   * Check if healing insights are available
   */
  static hasHealingInsights(isPremium: boolean): boolean {
    return isPremium;
  }
}

// Marketing copy for Deeper Sky — soft, trust-based, never manipulative
export const DEEPER_SKY_MARKETING = {
  tagline: 'Go deeper with your patterns',
  headline: 'Deeper Sky',
  subheadline: 'From awareness to integration — your chart, fully alive',
  
  valueProps: [
    {
      emoji: '🌿',
      title: 'Healing & Inner Work',
      brief: 'Attachment styles, fear patterns, and shadow work',
    },
    {
      emoji: '💞',
      title: 'Unlimited Relationships',
      brief: 'Partner, ex, child, friend — full emotional breakdowns',
    },
    {
      emoji: '📖',
      title: 'Journal Patterns',
      brief: 'Mood trends and transit-mood correlations over time',
    },
    {
      emoji: '🧭',
      title: 'Chiron & Node Depth',
      brief: 'Sensitivity mapping with body awareness cues',
    },
    {
      emoji: '🪐',
      title: 'Full Natal Story',
      brief: '10 emotional chapters — how you love, protect, and grow',
    },
    {
      emoji: '🌙',
      title: 'Personalized Guidance',
      brief: 'Key insights, action steps, and evening reflections',
    },
    {
      emoji: '✦',
      title: 'Pattern Depth',
      brief: 'Full stellium narratives and conjunction clusters',
    },
  ],
  
  socialProof: '"Finally, an astrology app that feels like therapy." — User review',
  
  guarantee: 'Cancel anytime. No questions asked.',
  
  trustLine: 'Your birth chart, daily weather, and journaling are always free.',
};
