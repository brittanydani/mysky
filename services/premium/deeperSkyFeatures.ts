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
    id: 'sleep-dream',
    name: 'Dream Interpretation',
    icon: 'moon-outline',
    description: 'Symbolic dream interpretation, dream symbol cluster map, and sleep trend analysis',
    freeVersion: 'Sleep logging — quality, duration, and dream narrative',
    premiumVersion: 'Symbolic dream interpretation drawing from your dream text, feelings, and check-in data, plus a recurring symbol cluster map and sleep quality trend analysis',
    isPremium: true,
    bullets: [
      'AI dream interpretation with a richer Gemini model',
      'Recurring symbol cluster map across all entries',
      'Sleep quality trends over time',
      'See what affects your rest most',
    ],
  },
  {
    id: 'deep-insights',
    name: 'Behavioral Patterns',
    icon: 'sparkles-outline',
    description: 'Sleep & mood trends, what restores vs drains you, and emotion shifts',
    freeVersion: 'Basic weekly averages: avg mood, avg sleep quality, and check-in count',
    premiumVersion: 'Full trend charts: sleep & mood patterns over time, what restores vs drains you from your journal, and emotion tone shifts',
    isPremium: true,
    bullets: [
      'Sleep & mood trend charts over time',
      'What restores vs drains you — from your writing',
      'Emotion tone shifts across your journal history',
    ],
  },
  {
    id: 'journal',
    name: 'Journal Patterns',
    icon: 'journal-outline',
    description: 'Behavioral trends, keyword lift, and writing insights from your entries',
    freeVersion: 'One daily prompt and a shadow quote at the top of each entry',
    premiumVersion: 'Behavioral trend analysis: keyword lift, emotion tone shifts, writing pattern insights, and transit-mood correlations',
    isPremium: true,
    bullets: [
      'Keyword lift — what words appear on your best vs hardest days',
      'Emotion tone shifts across your history',
      'Writing pattern insights over time',
    ],
  },
  {
    id: 'healing',
    name: 'Healing & Inner Work',
    icon: 'heart-half-outline',
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
    icon: 'people-outline',
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
    id: 'natal-story',
    name: 'Full Personal Story',
    icon: 'book-outline',
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
    icon: 'sunny-outline',
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
    id: 'chiron-nodes',
    name: 'Chiron & Node Depth',
    icon: 'compass-outline',
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
    id: 'pattern-depth',
    name: 'Pattern Depth',
    icon: 'analytics-outline',
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
  {
    id: 'pdf-export',
    name: 'PDF Chart Export',
    icon: 'document-text-outline',
    description: 'Export your personal birth chart and personal story as a shareable PDF keepsake',
    freeVersion: 'Not available',
    premiumVersion: 'Full PDF — cover page, Big Three, all planet placements, house cusps, aspects, and all 10 Personal Story chapters',
    isPremium: true,
    bullets: [
      'Planet placements, house cusps & aspects',
      'All 10 Personal Story chapters included',
      'Share or save to Files',
    ],
  },
  {
    id: 'encrypted-backup',
    name: 'Encrypted Backup & Restore',
    icon: 'shield-checkmark-outline',
    description: 'Full backup & restore with end-to-end encryption',
    freeVersion: 'Not available',
    premiumVersion: 'Encrypted backup & restore — protect and transfer your data with a personal passphrase',
    isPremium: true,
    bullets: [
      'End-to-end encrypted with your passphrase',
      'Backup & restore across devices',
      'Your data stays yours',
    ],
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
  tagline: 'See what your patterns are teaching you',
  headline: 'Deeper Sky',
  subheadline: 'Turn your history into weekly shifts, recurring themes, and more personal guidance',
  
  valueProps: [
    {
      emoji: '📊',
      title: 'Sleep & Mood Patterns',
      brief: 'Sleep quality, mood trends, and what restores vs drains you',
    },
    {
      emoji: '🌙',
      title: 'Symbolic Dream Reflections',
      brief: 'Personalized dream reflections drawn from your sleep, mood, and journal data — all on-device',
    },
    {
      emoji: '✍️',
      title: 'Journal Patterns',
      brief: 'Behavioral trends, keyword lift, and emotion tone shifts over time',
    },
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
      emoji: '🧭',
      title: 'Chiron & Node Depth',
      brief: 'Sensitivity mapping with body awareness cues',
    },
    {
      emoji: '🪐',
      title: 'Full Personal Story',
      brief: '10 emotional chapters — how you love, protect, and grow',
    },
    {
      emoji: '🌙',
      title: 'Personalized Guidance',
      brief: 'Key insights, action steps, and evening reflections',
    },
    {
      emoji: '✨',
      title: 'Deep Insights',
      brief: 'What restores vs drains you, emotion tone shifts, transit correlations',
    },
    {
      emoji: '📄',
      title: 'PDF Chart Export',
      brief: 'Export your personal birth chart and personal story as a shareable PDF',
    },
  ],
  
  socialProof: '"Finally, I can see what keeps changing and what keeps repeating." — User review',
  
  guarantee: 'Cancel anytime. No questions asked.',
  
  trustLine: 'Mood tracking, sleep logging, daily journaling, and basic weekly averages stay free. Core reflections stay private and on-device.',
};
