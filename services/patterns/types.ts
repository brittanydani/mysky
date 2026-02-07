/**
 * Pattern Tracking Types
 * 
 * The data model for personal pattern memory.
 * Each daily check-in stores user signals + astro context,
 * enabling the app to correlate mood/themes with transits over time.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Daily Check-In (user input)
// ─────────────────────────────────────────────────────────────────────────────

export type ThemeTag =
  | 'relationships'
  | 'confidence'
  | 'money'
  | 'family'
  | 'creativity'
  | 'health'
  | 'boundaries'
  | 'career'
  | 'anxiety'
  | 'joy'
  | 'grief'
  | 'clarity'
  | 'overwhelm'
  | 'loneliness'
  | 'gratitude';

export type EnergyLevel = 'low' | 'medium' | 'high';
export type StressLevel = 'low' | 'medium' | 'high';

export interface DailyCheckIn {
  id: string;
  date: string;               // YYYY-MM-DD
  chartId: string;             // reference to user's chart

  // User signals (30-60 seconds)
  moodScore: number;           // 1-10
  energyLevel: EnergyLevel;
  stressLevel: StressLevel;
  tags: ThemeTag[];            // pick 1-3
  note?: string;               // optional quick note
  wins?: string;               // optional: what went well
  challenges?: string;         // optional: what was hard

  // Auto-captured sky snapshot
  moonSign: string;
  moonHouse: number;
  sunHouse: number;
  transitEvents: TransitEvent[];
  lunarPhase: string;          // 'new' | 'waxing_crescent' | 'first_quarter' | 'waxing_gibbous' | 'full' | 'waning_gibbous' | 'last_quarter' | 'waning_crescent'
  retrogrades: string[];       // planet names currently retrograde

  createdAt: string;
  updatedAt: string;
}

export interface TransitEvent {
  transitPlanet: string;       // e.g., "Moon"
  natalPlanet: string;         // e.g., "Venus"
  aspect: string;              // e.g., "conjunction"
  orb: number;                 // tightness
  isApplying: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Pattern Analysis Results
// ─────────────────────────────────────────────────────────────────────────────

export interface PatternCard {
  id: string;
  type: PatternCardType;
  title: string;
  insight: string;
  detail?: string;
  strength: 'strong' | 'moderate' | 'emerging';
  isPremium: boolean;
  icon: string;
  color: string;
  dataPoints: number;         // how many check-ins support this
}

export type PatternCardType =
  | 'moon_house_mood'          // "You feel most at peace when Moon is in your 4th house"
  | 'transit_trigger'          // "Mars-Venus aspects correlate with relationship tension"
  | 'best_days'               // "Your best days tend to happen when..."
  | 'stress_pattern'          // "Anxiety spikes when..."
  | 'theme_frequency'         // "Your most common theme this month: boundaries"
  | 'energy_cycle'            // "Your energy peaks mid-week"
  | 'emotional_weather'       // "This transit explains why last week felt heavy"
  | 'growth_milestone'        // "You've tracked 30 days — here's what emerged"
  | 'relationship_weather'    // "Relationship themes intensify during..."
  | 'chiron_echo';            // "Your Chiron pattern: old wounds surface when..."

export interface PatternSummary {
  period: 'weekly' | 'monthly' | 'quarterly';
  topThemes: { tag: ThemeTag; count: number; trend: 'up' | 'down' | 'stable' }[];
  averageMood: number;
  moodTrend: 'improving' | 'declining' | 'stable';
  bestDays: { dayOfWeek: string; averageMood: number }[];
  triggers: PatternCard[];
  supports: PatternCard[];
  nextMonthWatchFors: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Dynamic Insight (emotionally intelligent daily messages)
// ─────────────────────────────────────────────────────────────────────────────

export interface DynamicInsight {
  whyThisMatters: string;      // "With today's Moon activating your 4th house..."
  whatItsActivating: string;   // "...this is stirring your need for safety"
  whatToDoWithIt: string;      // "If you feel unmotivated, that's not failure..."
  consciousPath?: string;      // Premium: conscious expression
  unconsciousPath?: string;    // Premium: "If you ignore this, here's how it may show up"
  shadowLens?: string;         // Premium: shadow work angle (gentle)
}

// ─────────────────────────────────────────────────────────────────────────────
// Astrology Pathway (growth tracking)
// ─────────────────────────────────────────────────────────────────────────────

export type PathwayId = 
  | 'emotional_awareness'
  | 'relationship_patterns'
  | 'purpose_direction'
  | 'healing_cycles'
  | 'self_trust';

export interface AstrologyPathway {
  id: PathwayId;
  title: string;
  description: string;
  icon: string;
  color: string;
  totalSteps: number;
  completedSteps: number;
  milestones: PathwayMilestone[];
}

export interface PathwayMilestone {
  id: string;
  title: string;
  description: string;
  isCompleted: boolean;
  completedAt?: string;
  type: 'insight' | 'reflection' | 'pattern' | 'journal';
}

// ─────────────────────────────────────────────────────────────────────────────
// Magic Touches (subtle personalization)
// ─────────────────────────────────────────────────────────────────────────────

export interface MagicTouch {
  type: 'anniversary' | 'moon_reminder' | 'retrograde_heads_up' | 'pattern_callback' | 'streak';
  message: string;
  icon: string;
  isActionable: boolean;
  action?: string;             // route to navigate to
}
