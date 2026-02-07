// File: services/premium/index.ts
// Central export for all Deeper Sky premium features

// Core feature definitions and gating
export {
  DEEPER_SKY_FEATURES,
  PREMIUM_THEMES,
  DeeperSkyGate,
  type DeeperSkyFeature,
  type PremiumTheme,
} from './deeperSkyFeatures';

// Full Natal Story (10+ chapters)
export {
  FullNatalStoryGenerator,
  type NatalChapter,
  type FullNatalStory,
} from './fullNatalStory';

// Healing & Inner Work
export {
  HealingInsightsGenerator,
  type HealingInsights,
  type AttachmentInsight,
  type FearPattern,
  type SafetyPattern,
  type ReparentingGuide,
} from './healingInsights';

// Relationship Charts
export {
  PremiumRelationshipService,
  type RelationshipComparison,
  type ConnectionStrength,
  type GrowthArea,
  type CommunicationInsight,
} from './relationshipCharts';

// Enhanced Daily Guidance
export {
  PremiumDailyGuidanceGenerator,
  type PremiumDailyGuidance,
  type CategoryGuidance,
  type GuidanceCategory,
} from './premiumDailyGuidance';

// Advanced Journal
export {
  AdvancedJournalAnalyzer,
  MOOD_CONFIG,
  getMoodLabel,
  getMoodEmoji,
  type MoodEntry,
  type MoodLevel,
  type MoodCategory,
  type JournalEntryMeta,
  type TransitSnapshot,
  type PatternInsight,
  type JournalAnalytics,
} from './advancedJournal';
