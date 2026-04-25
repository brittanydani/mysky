/**
 * MySky Insights V2
 *
 * Core type definitions for the archive-pattern insight engine.
 */

export type InsightDataSource =
  | 'dailyCheckIn'
  | 'journal'
  | 'dream'
  | 'sleep'
  | 'triggerLog'
  | 'glimmerLog'
  | 'bodyMap'
  | 'relationshipMirror'
  | 'natalChart'
  | 'reflectionBank';

export type InsightCategory =
  | 'emotionalWeather'
  | 'restCapacity'
  | 'bodySignals'
  | 'supportBelonging'
  | 'relationships'
  | 'boundariesSelfTrust'
  | 'valuesIntegrity'
  | 'cognitiveStyle'
  | 'dreamsSymbols'
  | 'glimmersRegulation'
  | 'creativityExpression'
  | 'identityGrowth'
  | 'familyHome'
  | 'scarcityAbundance'
  | 'natalChartReflection';

export type InsightSurface =
  | 'today'
  | 'insightsTab'
  | 'weeklyReport'
  | 'monthlyReport'
  | 'archiveMap';

export type InsightSlot =
  | 'todaySignal'
  | 'whatMySkyNoticed'
  | 'dailyAffirmation'
  | 'weeklyStory'
  | 'archivePattern'
  | 'bodySignal'
  | 'relationshipMirror'
  | 'dreamPattern'
  | 'monthlyTheme'
  | 'growthEdge'
  | 'whatHelped';

export type SignalSentiment = 'positive' | 'neutral' | 'negative' | 'mixed';

export type PatternConfidence = 'emerging' | 'moderate' | 'strong' | 'veryStrong';

export type PatternMovement =
  | 'new'
  | 'emerging'
  | 'repeating'
  | 'intensifying'
  | 'softening'
  | 'shifting'
  | 'quieting'
  | 'returning'
  | 'cross_source_match';

export type InsightTone =
  | 'soft'
  | 'clear'
  | 'deep'
  | 'grounding'
  | 'encouraging'
  | 'poetic'
  | 'direct';

export type SignalKey =
  // Daily emotional weather
  | 'low_energy'
  | 'high_energy'
  | 'low_mood'
  | 'mood_drop'
  | 'mood_improvement'
  | 'high_stress'
  | 'low_stress'
  | 'emotional_heaviness'
  | 'emotional_softening'
  | 'emotional_intensity'
  | 'mixed_emotions'
  | 'self_blame'
  | 'guilt'
  | 'shame'
  | 'longing'
  | 'sadness'
  | 'anger'
  | 'relief'
  | 'hope'

  // Rest + capacity
  | 'low_sleep'
  | 'poor_sleep_quality'
  | 'sleep_mood_link'
  | 'rest_resistance'
  | 'rest_guilt'
  | 'recovery_gap'
  | 'capacity_strain'
  | 'depletion'
  | 'overextension'
  | 'burnout_risk'
  | 'needs_pause'
  | 'restorative_moment'
  | 'low_capacity'

  // Responsibility + invisible labor
  | 'responsibility_weight'
  | 'invisible_labor'
  | 'mental_load'
  | 'caretaking_pressure'
  | 'always_on'
  | 'preparedness'
  | 'overfunctioning'
  | 'high_standards'
  | 'excellence_pressure'

  // Support + belonging
  | 'support_scarcity'
  | 'gratitude_and_grief'
  | 'small_circle_pressure'
  | 'fear_of_being_too_much'
  | 'receiving_care_difficulty'
  | 'mutuality_need'
  | 'belonging_ache'
  | 'loneliness'
  | 'wants_to_be_seen'
  | 'wants_to_be_caught'
  | 'envy_as_longing'
  | 'asks_for_support'
  | 'minimizes_need'
  | 'support_need'

  // Relationships
  | 'relationship_safety_testing'
  | 'repair_need'
  | 'rupture_sensitivity'
  | 'tone_sensitivity'
  | 'consistency_need'
  | 'emotional_availability_need'
  | 'kindness_safety_gap'
  | 'trust_builds_slowly'
  | 'closeness_uncertainty'
  | 'distance_for_safety'
  | 'selective_vulnerability'
  | 'loyalty_conflict'
  | 'truth_over_harmony'

  // Boundaries + self-trust
  | 'boundary_rebuilding'
  | 'boundary_guilt'
  | 'overexplaining'
  | 'self_trust_growth'
  | 'inner_authority'
  | 'peace_boundary'
  | 'says_no'
  | 'limits_tested'
  | 'autonomy_need'
  | 'choosing_self'
  | 'less_explaining'
  | 'permission_shift'

  // Cognitive style
  | 'deep_processing'
  | 'meaning_making'
  | 'need_for_exact_words'
  | 'pattern_recognition'
  | 'analysis_as_regulation'
  | 'clarity_before_release'
  | 'decision_uncertainty'
  | 'seeks_context'
  | 'intellectualizes_feeling'
  | 'integrates_insight'
  | 'asks_why'

  // Body signals
  | 'body_knows_first'
  | 'chest_pressure'
  | 'shoulder_burden'
  | 'jaw_restraint'
  | 'gut_signal'
  | 'head_pressure'
  | 'throat_tightness'
  | 'breath_change'
  | 'body_heaviness'
  | 'body_lightness'
  | 'tension_release'
  | 'somatic_safety'
  | 'sensory_sensitivity'
  | 'beauty_regulation'

  // Dreams + symbolic processing
  | 'dream_unfinished_processing'
  | 'dream_repeated_symbol'
  | 'dream_emotional_tone'
  | 'dream_after_stress'
  | 'dream_after_relationship_theme'
  | 'dream_searching'
  | 'dream_protection'
  | 'dream_loss'
  | 'dream_home'
  | 'dream_conflict'
  | 'dream_relief'

  // Glimmers + regulation
  | 'glimmer_softening'
  | 'quiet_safety'
  | 'nature_regulation'
  | 'beauty_glimmer'
  | 'connection_glimmer'
  | 'play_glimmer'
  | 'laughter_glimmer'
  | 'ordinary_sacred'
  | 'joy_tolerance'
  | 'calm_bracing'
  | 'calm_is_new'
  | 'numbness_vs_calm'

  // Values + integrity
  | 'justice_sensitivity'
  | 'fairness_need'
  | 'integrity_cost'
  | 'moral_weight'
  | 'values_conflict'
  | 'loyalty_vs_honesty'
  | 'non_negotiable'
  | 'purpose_signal'
  | 'legacy_signal'
  | 'faith_meaning'
  | 'spiritual_depth'
  | 'truth_telling'

  // Creativity + expression
  | 'creative_processing'
  | 'creative_block'
  | 'creative_aliveness'
  | 'expression_need'
  | 'vision_gap'
  | 'beauty_making'
  | 'wants_to_build'
  | 'creative_standards'
  | 'play_starved'
  | 'voice_emerging'

  // Identity + growth
  | 'identity_rewriting'
  | 'future_self_orientation'
  | 'old_story_loosening'
  | 'chapter_shift'
  | 'transformation_season'
  | 'self_definition'
  | 'growth_edge'
  | 'past_self_compassion'
  | 'self_forgiveness'
  | 'inner_critic_softening'
  | 'becoming_visible'

  // Family + home
  | 'family_pattern_awareness'
  | 'chosen_family'
  | 'home_as_safety'
  | 'ritual_regulation'
  | 'rooting_need'
  | 'family_loyalty_tension'
  | 'protective_care'
  | 'breaks_old_pattern'

  // Scarcity + abundance
  | 'scarcity_scanning'
  | 'abundance_healing'
  | 'fear_of_loss'
  | 'receiving_openness'
  | 'enoughness'
  | 'time_scarcity'
  | 'energy_scarcity'
  | 'love_scarcity'
  | 'support_abundance_shift'

  // Natal chart reflection
  | 'chart_emotional_depth_theme'
  | 'chart_communication_theme'
  | 'chart_relationship_theme'
  | 'chart_responsibility_theme'
  | 'chart_creativity_theme'
  | 'chart_identity_theme'
  | 'chart_home_family_theme'
  | 'chart_values_theme'
  | 'chart_theme_confirmed'
  | 'chart_theme_not_active';

export interface EvidenceAnchor {
  source: InsightDataSource;
  date: string;
  label?: string;
  phrase?: string;
  signal?: string;
  value?: string | number;
  strength?: number;
}

export interface UserSignal {
  key: SignalKey;
  source: InsightDataSource;
  date: string;
  strength: number; // 0–1
  sentiment?: SignalSentiment;
  evidence?: EvidenceAnchor;
}

export interface ArchivePattern {
  key: string;
  title: string;
  category: InsightCategory;
  description: string;
  requiredSignals: SignalKey[];
  supportingSignals: SignalKey[];
  conflictingSignals?: SignalKey[];
  shameLabel: string;
  clarityReframe: string;
  lookbackDays: 7 | 14 | 30 | 60 | 90 | 180 | 365;
  minEvidenceCount: number;
  minScore: number;
  cooldownDays?: number;
  tags?: string[];
}

export interface DailyAngle {
  key: string;
  patternKey: string;
  title: string;
  triggerSignals: SignalKey[];
  avoidIfSignals?: SignalKey[];
  sourcePriority?: InsightDataSource[];
  observation: string;
  pattern: string;
  reframe: string;
  question: string;
  tone: InsightTone;
  cooldownDays?: number;
}

export interface ArchivePatternScore {
  patternKey: string;
  title: string;
  category: InsightCategory;
  score: number;
  confidence: PatternConfidence;
  movement: PatternMovement;
  timeframeDays: number;
  sources: InsightDataSource[];
  evidence: EvidenceAnchor[];
  lastSeenAt: string;
}

export interface GeneratedInsight {
  id: string;
  slot: InsightSlot;
  surface: InsightSurface;
  title: string;
  body: string;
  reframe: string;
  reflectionPrompt?: string;
  patternKey: string;
  angleKey?: string;
  confidence: PatternConfidence;
  movement: PatternMovement;
  evidence: EvidenceAnchor[];
  createdAt: string;
}

export interface InsightHistoryItem {
  id: string;
  patternKey: string;
  angleKey?: string;
  slot: InsightSlot;
  surface: InsightSurface;
  title: string;
  shownAt: string;
  copyHash: string;
  evidenceHash?: string;
}

export interface DailyInsightContext {
  date: string;
  todaySignals: UserSignal[];
  recentSignals: UserSignal[];
  archivePatterns: ArchivePatternScore[];
  history: InsightHistoryItem[];
}

export interface BuildTodayInsightsArgs {
  date: string;
  rawInputs: InsightRawInputs;
  history?: InsightHistoryItem[];
  previousPatternScores?: ArchivePatternScore[];
}

export interface BuildTodayInsightsResult {
  signals: UserSignal[];
  patternScores: ArchivePatternScore[];
  insights: GeneratedInsight[];
}

export interface InsightRawInputs {
  dailyCheckIns?: any[];
  journals?: any[];
  dreams?: any[];
  sleepLogs?: any[];
  triggerLogs?: any[];
  glimmerLogs?: any[];
  bodyMaps?: any[];
  relationshipMirrors?: any[];
  reflectionAnswers?: any[];
  natalChartThemes?: any[];
}
